---
title: React 19 tearing — 두 스토어를 같은 틱에 건드리면 생기는 일
description: Zustand 다중 스토어를 같은 동기 블록에서 업데이트했을 때 React 19가 무한 재렌더로 반응한 이유와, await 경계로 분리해 고친 이유를 정리한다.
date: 2026-08-22
updated: 2026-08-22
category: development
technology: [react, typescript, zustand]
tags: [rendering, state-management]
type: study
status: evergreen
series:
  name: ngras-deep-dive
  order: 2
projects:
  - ngras
draft: false
---

> **이 글의 코드는 실제 프로덕션 코드를 그대로 옮긴 게 아니다.** NGRAS는 보안망 내부에서 개발한 사내 프로젝트라 실제 소스를 그대로 공개할 수 없어서, 사용한 기술과 구현 방식에 대한 기억을 바탕으로 AI가 다시 작성한 예시 코드로 대체했다. 구조와 흐름은 실제와 같지만, 변수명·엔드포인트·세부 구현은 그대로 옮긴 것이 아니다.

## 한 줄 요약

Zustand 스토어 두 개를 같은 동기 블록에서 연달아 업데이트했더니 화면이 `Maximum update depth exceeded`로 멈췄다. 원인은 React 19의 `useSyncExternalStore`가 여러 스토어를 동시에 구독하는 컴포넌트에서 스냅샷 불일치를 감지하고 계속 재렌더로 복구를 시도한 것으로 보이고, 두 번째 스토어 업데이트를 첫 `await` 이후로 옮기는 것과 한 컴포넌트가 여러 스토어를 동시에 구독하지 않게 하는 것, 두 가지 코드 변경 이후 증상이 재현되지 않았다.

## 왜 (배경/문제 상황)

NGRAS는 Zustand 스토어 11개를 기능별로 나눠 쓴다. AI 에이전트 채팅 패널(`aiAgent` 스토어)에서 작업을 새로 시작하면, 이전 작업의 경고를 지우는 `testQueue` 스토어 업데이트와 현재 작업 ID(`currentTaskId`)를 갱신하는 `aiAgent` 스토어 업데이트가 한 함수 안에서 연달아 일어났다. 코드만 보면 평범한 순차 실행인데, 화면에서는 `Maximum update depth exceeded` 에러와 함께 렌더가 멈추는 증상이 나타났다. 두 스토어를 모두 구독하는 컴포넌트가 있을 때만 재현됐고, 그 컴포넌트 하나만 떼어놓고 보면 이상한 점이 없었다 — 원인이 "무엇을 구독하는가"와 "언제 업데이트하는가"의 조합에 있었기 때문이다.

## 본문

### 1. 실제로 확인된 지점 세 곳

같은 계열의 증상이 코드베이스 세 곳에서 발견됐다. 원인은 조금씩 다르지만 전부 "여러 Zustand 스토어를 한 컴포넌트가 같은 렌더 사이클에서 동시에 건드린다"는 조건으로 수렴한다.

**① `aiAgent` 스토어 — 두 스토어를 같은 동기 블록에서 업데이트**

```ts
// aiAgent/store.ts
// await 이후에 testQueue 스토어 업데이트: aiAgent 스토어의 isStreaming 업데이트와
// 동일 동기 블록에서 두 스토어가 동시 업데이트되면 React 19 useSyncExternalStore
// 동시 렌더링 충돌이 발생하므로 첫 번째 await 이후로 이동한다.
useTestQueueStore.getState().clearPresetWarnings(testId)
set({ currentTaskId: task_id })
```

**② `TestQueuePage` — 한 컴포넌트가 스토어 두 개를 동시에 구독**

두 스토어를 동시에 구독하던 컴포넌트를, 자식 컴포넌트(`TestContent`)에서 `isStreaming` 하나만 구독한 뒤 prop으로 내려주는 방식으로 바꿔 다중 구독 자체를 없앴다.

**③ `ChatPanel` — 객체를 반환하는 셀렉터**

```ts
// ❌ 셀렉터가 매 렌더마다 새 객체를 반환 → 참조가 계속 바뀜
const { isStreaming, currentTaskId } = useAiAgentStore((s) => ({
  isStreaming: s.isStreaming,
  currentTaskId: s.currentTaskId,
}))

// ✅ 프리미티브 값 두 개로 분리 — 각각 원시 타입이라 실제로 값이 같으면 참조 비교도 통과
const isStreaming = useAiAgentStore((s) => s.isStreaming)
const currentTaskId = useAiAgentStore((s) => s.currentTaskId)
```

③은 겉으로는 "무한 루프"라는 같은 증상이지만 원인은 다르다 — 객체 리터럴 셀렉터가 매번 새 참조를 반환해서 `useSyncExternalStore`가 "값이 바뀌었다"고 오판하는 문제다. ①·②와 묶어서 다루는 이유는, 셋 다 "React 19에서 여러 외부 스토어를 한 컴포넌트가 동시에 구독할 때 스냅샷 일관성이 깨진다"는 같은 상위 원인 계열에 속하기 때문이다.

### 2. 왜 하필 두 스토어를 "같이" 건드릴 때만 터지는가

React 18부터 도입된 `useSyncExternalStore`는 Zustand 같은 외부 스토어를 구독할 때 쓰는 훅이다. 이 훅은 렌더 중간에 구독 중인 스토어의 스냅샷이 바뀌면 — 특히 여러 외부 스토어를 동시에 구독하는 컴포넌트에서 두 스냅샷 사이에 불일치가 생기면 — 일관성을 맞추기 위해 재렌더를 시도한다. 문제는 그 재렌더 시도 자체가 다시 같은 조건을 만들어내면서, "재렌더 → 불일치 감지 → 재렌더"가 반복되는 루프에 빠질 수 있다는 점이다. `useTestQueueStore`와 `useAiAgentStore`를 같은 동기 블록에서 연달아 업데이트하면 이 컴포넌트가 두 스토어를 동시에 구독하는 순간마다 이 조건이 재현됐다.

> **이 글에서 "tearing"이라는 표현을 쓰는 방식에 대한 안내.** NGRAS 코드베이스는 이 증상을 자체적으로 "tearing"으로 진단하고 문서화했다. 다만 React가 정의하는 엄밀한 의미의 tearing(concurrent 렌더링 중 스토어 값의 일관성이 깨지는 현상)과, 여기서 실제로 관찰된 `Maximum update depth exceeded` 무한 재렌더가 정확히 같은 현상인지는 외부적으로 재검증되지 않았다. 이 글은 "이 코드베이스가 이렇게 진단하고 이렇게 고쳤다"까지만 다루고, React 내부 동작을 단정적으로 설명하지는 않는다.

### 3. 해결 패턴 두 가지

**패턴 A — 두 번째 스토어 업데이트를 첫 `await` 이후로 옮기기.** 두 스토어 업데이트를 완전히 동기적인 블록(같은 함수 호출 안에서 `await` 없이 연달아 실행)에 두지 않고, 그 앞에 실제 비동기 작업(API 호출 등)을 하나 두어 그 이후로 두 업데이트를 옮긴다. NGRAS 코드베이스는 이 변경 이후 증상이 재현되지 않았다고 문서화했다. 다만 `await` 하나를 거쳤다고 해서 그 뒤에 연달아 실행되는 두 줄이 서로 다른 렌더 사이클로 자동으로 분리되는 건 아니다 — 같은 `await` 뒤에서 동기적으로 실행되는 코드는 여전히 같은 마이크로태스크 안에서 처리되고, React의 자동 배칭 대상이 될 수 있다. 즉 이 패턴이 실제로 왜 증상을 없앴는지의 정확한 메커니즘은 이 글에서 독립적으로 검증하지 않았고, "이렇게 바꿨더니 재현되지 않았다"는 NGRAS 코드베이스의 경험적 관찰로만 받아들이는 게 안전하다.

**패턴 B — 단일 구독점.** 한 컴포넌트가 여러 스토어를 동시에 구독하지 않도록, 구독을 가장 필요한 지점 하나로 모으고 나머지는 prop으로 내려준다. 애초에 "여러 스토어를 동시에 구독하는 컴포넌트"가 없으면 스냅샷 불일치가 발생할 자리 자체가 없어진다.

두 패턴 모두 "스토어 자체를 하나로 합친다" 같은 구조적인 해법 대신, 기능별로 스토어를 나눠 쓰는 기존 설계는 유지한 채로 "언제 업데이트하는가"와 "누가 동시에 구독하는가"만 조정한 것이다. 스토어를 다시 합치는 리팩터링은 영향 범위가 컸고, 이 두 패턴만으로 재현된 증상을 전부 잡을 수 있었기 때문이다.

### 4. 직접 눌러보기 — Before / After 시뮬레이터

아래 데모는 위 ①번 사례(`aiAgent` 스토어가 `testQueue` 스토어를 같은 동기 블록에서 건드리는 상황)를 그대로 재현한 것이다. Before를 눌러 실행하면 재렌더 카운터가 폭주하다 멈추고, After로 바꿔서 실행하면 같은 두 스토어 업데이트가 각각 한 번의 렌더로 끝난다.

> **이 데모는 실제 React/Zustand를 실행하지 않는다.** DOM 요소와 타이머, `Math.random()`으로 "폭주하는 느낌"을 흉내 낸 개념적 시뮬레이터다. `Maximum update depth exceeded` 에러나 리렌더 횟수는 실제로 발생하는 게 아니라 스토리를 재생하기 위해 연출된 값이다.

<div class="rtdemo">
<style>
.rtdemo {
  --ink: #1c1917; --sub: #6b7280; --line: #e5e7eb; --card: #fafafa; --card2: #f4f4f5;
  --bad: #dc2626; --bad-soft: #fef2f2; --good: #16a34a; --good-soft: #f0fdf4;
  --code-bg: #0f1633; --code-ink: #c8d0f0;
  font-family: 'Pretendard', system-ui, sans-serif;
  font-size: 14px; line-height: 1.6; color: var(--ink);
  border: 1px solid var(--line); border-radius: 16px; padding: 20px;
  background: var(--card); margin: 24px 0;
}
.dark .rtdemo {
  --ink: #e5e7eb; --sub: #9ca3af; --line: #374151; --card: #18181b; --card2: #27272a;
  --bad-soft: rgba(220,38,38,0.12); --good-soft: rgba(22,163,74,0.14);
}
.rtdemo .toggle { display: inline-flex; background: var(--card2); border-radius: 10px; padding: 4px; gap: 4px; margin-bottom: 14px; }
.rtdemo .toggle button {
  border: none; background: transparent; padding: 8px 16px; border-radius: 7px;
  font-family: inherit; font-size: 13px; font-weight: 700; cursor: pointer; color: var(--sub);
}
.rtdemo .toggle button.on[data-mode="before"] { background: var(--card); color: var(--bad); box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
.rtdemo .toggle button.on[data-mode="after"] { background: var(--card); color: var(--good); box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
.rtdemo .codebox {
  font-family: 'Fira Code', ui-monospace, Menlo, Consolas, monospace;
  font-size: 12.5px; background: var(--code-bg); color: var(--code-ink);
  white-space: pre-wrap;
  border-radius: 10px; padding: 14px; line-height: 1.7; overflow-x: auto; margin-bottom: 14px;
}
.rtdemo .codebox .cmt { color: #7e88bd; }
.rtdemo .codebox .hl-bad { background: rgba(220,38,38,0.15); display: block; border-left: 3px solid var(--bad); padding-left: 8px; margin: 0 -8px 0 -11px; }
.rtdemo .codebox .hl-good { background: rgba(22,163,74,0.15); display: block; border-left: 3px solid var(--good); padding-left: 8px; margin: 0 -8px 0 -11px; }
.rtdemo .stores { display: flex; gap: 12px; margin-bottom: 14px; flex-wrap: wrap; }
.rtdemo .store { flex: 1; min-width: 180px; border: 2px solid var(--line); border-radius: 10px; padding: 12px; background: var(--card); transition: all .12s; }
.rtdemo .store.flash { border-color: var(--ink); background: var(--card2); }
.rtdemo .store h4 { font-size: 12.5px; font-family: inherit; font-weight: 700; margin: 0; }
.rtdemo .store .field { margin-top: 8px; font-size: 12px; color: var(--sub); }
.rtdemo .store .field b { color: var(--ink); }
.rtdemo .component-box { border: 2px solid var(--line); border-radius: 10px; padding: 12px; margin-bottom: 14px; }
.rtdemo .component-box.tearing { border-color: var(--bad); animation: rtdemo-shake .3s infinite; }
@keyframes rtdemo-shake { 0%,100% { transform: translateX(0); } 25% { transform: translateX(-3px); } 75% { transform: translateX(3px); } }
.rtdemo .component-box h4 { font-size: 12.5px; font-family: inherit; font-weight: 700; margin: 0 0 8px; }
.rtdemo .meter { display: flex; align-items: center; gap: 12px; }
.rtdemo .render-num { font-family: 'Fira Code', monospace; font-size: 26px; font-weight: 800; min-width: 60px; }
.rtdemo .render-num.ok { color: var(--good); }
.rtdemo .render-num.danger { color: var(--bad); }
.rtdemo .bar { flex: 1; height: 10px; background: var(--card2); border-radius: 999px; overflow: hidden; }
.rtdemo .bar i { display: block; height: 100%; width: 0; background: var(--good); border-radius: 999px; transition: width .12s linear; }
.rtdemo .bar i.danger { background: var(--bad); }
.rtdemo .timeline { display: flex; flex-direction: column; gap: 6px; margin-bottom: 14px; }
.rtdemo .tl-step { display: flex; gap: 8px; font-size: 12.5px; opacity: .35; color: var(--sub); }
.rtdemo .tl-step.show { opacity: 1; color: var(--ink); }
.rtdemo .tl-step .n { font-family: 'Fira Code', monospace; font-size: 10.5px; font-weight: 700; background: var(--card2); color: var(--sub); min-width: 20px; height: 20px; border-radius: 5px; display: grid; place-items: center; flex-shrink: 0; }
.rtdemo .tl-step.show.bad .n { background: var(--bad); color: #fff; }
.rtdemo .tl-step.show.good .n { background: var(--good); color: #fff; }
.rtdemo .verdict { padding: 12px 14px; border-radius: 10px; font-size: 13px; font-weight: 600; display: none; }
.rtdemo .verdict.crash { display: block; background: var(--bad-soft); color: var(--bad); }
.rtdemo .verdict.success { display: block; background: var(--good-soft); color: var(--good); }
.rtdemo .run-btn { background: var(--ink); color: var(--card); border: 0; border-radius: 8px; padding: 9px 16px; font-family: inherit; font-weight: 700; font-size: 13px; cursor: pointer; }
.rtdemo .run-btn:disabled { opacity: .5; cursor: not-allowed; }
</style>

<div class="toggle" id="rtdemo_toggle">
  <button data-mode="before" class="on">❌ Before (버그)</button>
  <button data-mode="after">✅ After (해결)</button>
</div>

<div class="codebox" id="rtdemo_code"></div>

<div class="stores">
  <div class="store" id="rtdemo_storeA"><h4>📦 useTestQueueStore</h4><div class="field">clearPresetWarnings() → <b id="rtdemo_saVal">warnings: [2]</b></div></div>
  <div class="store" id="rtdemo_storeB"><h4>📦 useAiAgentStore</h4><div class="field">set(&#123; isStreaming &#125;) → <b id="rtdemo_sbVal">isStreaming: false</b></div></div>
</div>

<div class="component-box" id="rtdemo_comp">
  <h4>⬡ &lt;ChatPanel/&gt; — 두 스토어를 모두 구독</h4>
  <div class="meter">
    <span class="render-num ok" id="rtdemo_num">0</span>
    <div class="bar"><i id="rtdemo_fill"></i></div>
  </div>
</div>

<div class="timeline" id="rtdemo_timeline"></div>
<div class="verdict" id="rtdemo_verdict"></div>
<button class="run-btn" id="rtdemo_run">▶ 실행</button>
</div>

<script>
(function () {
  const root = document.currentScript.previousElementSibling;
  if (!root || !root.classList.contains('rtdemo')) return;
  let mode = 'before';
  const CODE = {
    before: `<span class="cmt">// ❌ 두 스토어를 같은 동기 블록에서 연속 업데이트</span>
<span>function requestDraft(testId) {</span>
<span class="hl-bad">  useTestQueueStore.getState().clearPresetWarnings(testId)</span>
<span class="hl-bad">  set({ isStreaming: true })</span>
<span class="cmt">  // ↑ ChatPanel이 두 스토어를 모두 구독 → 스냅샷 불일치 → 재렌더 폭주</span>
<span>}</span>`,
    after: `<span class="cmt">// ✅ 첫 await 이후로 두 업데이트를 옮김 (NGRAS가 채택한 경험적 수정)</span>
<span>async function requestDraft(testId) {</span>
<span>  const res = await requestDraftApi(testId)</span>
<span class="hl-good">  useTestQueueStore.getState().clearPresetWarnings(testId)</span>
<span class="hl-good">  set({ currentTaskId: res.taskId })</span>
<span class="cmt">  // ↑ 이 변경 이후 증상이 재현되지 않았다 (정확한 메커니즘은 미검증)</span>
<span>}</span>`,
  };
  function renderCode() { root.querySelector('#rtdemo_code').innerHTML = CODE[mode]; }
  renderCode();

  root.querySelectorAll('#rtdemo_toggle button').forEach((b) => {
    b.addEventListener('click', () => {
      mode = b.dataset.mode;
      root.querySelectorAll('#rtdemo_toggle button').forEach((x) => x.classList.toggle('on', x === b));
      renderCode();
      reset();
    });
  });

  const numEl = root.querySelector('#rtdemo_num');
  const fillEl = root.querySelector('#rtdemo_fill');
  const compEl = root.querySelector('#rtdemo_comp');
  const storeA = root.querySelector('#rtdemo_storeA');
  const storeB = root.querySelector('#rtdemo_storeB');
  const saVal = root.querySelector('#rtdemo_saVal');
  const sbVal = root.querySelector('#rtdemo_sbVal');
  const verdict = root.querySelector('#rtdemo_verdict');
  const timeline = root.querySelector('#rtdemo_timeline');
  const runBtn = root.querySelector('#rtdemo_run');
  let timers = [], running = false;
  function wait(ms) { return new Promise((r) => { timers.push(setTimeout(r, ms)); }); }
  function clearTimers() { timers.forEach(clearTimeout); timers = []; }
  function setNum(n, danger) {
    numEl.textContent = n;
    numEl.className = 'render-num ' + (danger ? 'danger' : 'ok');
    fillEl.className = danger ? 'danger' : '';
    fillEl.style.width = Math.min(100, (n / (danger ? 50 : 2)) * 100) + '%';
  }
  function tl(steps) {
    timeline.innerHTML = steps.map((s) => `<div class="tl-step ${s.cls || ''}"><span class="n">${s.n}</span><span>${s.t}</span></div>`).join('');
  }
  function reset() {
    clearTimers(); running = false;
    setNum(0, false);
    compEl.classList.remove('tearing');
    storeA.classList.remove('flash'); storeB.classList.remove('flash');
    saVal.textContent = 'warnings: [2]'; sbVal.textContent = 'isStreaming: false';
    verdict.className = 'verdict'; verdict.innerHTML = '';
    timeline.innerHTML = '';
    runBtn.disabled = false;
  }
  async function runBefore() {
    tl([
      { n: 1, t: 'requestDraft() 호출 — 동기 블록 진입' },
      { n: 2, t: 'testQueue 스토어 업데이트 → ChatPanel 리렌더 예약' },
      { n: 3, t: 'aiAgent 스토어 업데이트 → 같은 틱에 또 리렌더 예약' },
      { n: 4, t: '두 스토어 스냅샷 불일치 감지', cls: 'bad' },
      { n: 5, t: '일관성 복구 위해 재렌더 → 다시 불일치 → 반복', cls: 'bad' },
    ]);
    const steps = timeline.children;
    steps[0].classList.add('show'); await wait(450);
    storeA.classList.add('flash'); saVal.textContent = 'warnings: []'; steps[1].classList.add('show'); await wait(400);
    storeB.classList.add('flash'); sbVal.textContent = 'isStreaming: true'; steps[2].classList.add('show'); await wait(400);
    steps[3].classList.add('show'); compEl.classList.add('tearing'); await wait(350);
    steps[4].classList.add('show');
    let n = 0;
    await new Promise((res) => {
      const iv = setInterval(() => {
        n += Math.ceil(Math.random() * 4);
        setNum(n, true);
        storeA.classList.toggle('flash'); storeB.classList.toggle('flash');
        if (n >= 50) { clearInterval(iv); res(); }
      }, 55);
      timers.push(iv);
    });
    compEl.classList.remove('tearing');
    verdict.className = 'verdict crash';
    verdict.innerHTML = '💥 <b>Uncaught Error: Maximum update depth exceeded</b> — React가 무한 재렌더를 차단하고 트리를 unmount.';
  }
  async function runAfter() {
    tl([
      { n: 1, t: 'await requestDraftApi() — 비동기 작업을 먼저 기다림' },
      { n: 2, t: 'testQueue 스토어 업데이트 → 리렌더 1회', cls: 'good' },
      { n: 3, t: 'aiAgent 스토어 업데이트 → 리렌더 1회', cls: 'good' },
      { n: 4, t: '증상 재현 안 됨 (정확한 메커니즘은 미검증)', cls: 'good' },
    ]);
    const steps = timeline.children;
    steps[0].classList.add('show'); await wait(500);
    storeA.classList.add('flash'); saVal.textContent = 'warnings: []'; setNum(1, false); steps[1].classList.add('show'); await wait(600);
    storeA.classList.remove('flash'); storeB.classList.add('flash'); sbVal.textContent = 'isStreaming: true'; setNum(2, false); steps[2].classList.add('show'); await wait(600);
    storeB.classList.remove('flash'); steps[3].classList.add('show'); await wait(250);
    verdict.className = 'verdict success';
    verdict.innerHTML = '✅ <b>안정</b> — 총 2회 리렌더로 종료. NGRAS 코드베이스가 이 변경 이후 증상이 재현되지 않았다고 문서화한 결과를 재현한 연출이다 (원인 메커니즘은 미검증).';
  }
  runBtn.addEventListener('click', async () => {
    if (running) return;
    reset(); running = true; runBtn.disabled = true;
    if (mode === 'before') await runBefore(); else await runAfter();
    running = false; runBtn.disabled = false;
  });
  reset();
})();
</script>

## 예제

두 패턴을 한 파일에 적용하면 이렇다.

```ts
// 패턴 A: await 경계로 분리
async function requestDraft(testId: string) {
  const res = await requestDraftApi(testId) // 비동기 경계 — 스케줄러에 양보
  useTestQueueStore.getState().clearPresetWarnings(testId)
  set({ currentTaskId: res.taskId })
}

// 패턴 B: 단일 구독점 — 부모는 스토어를 구독하지 않고 자식 하나만 구독
function ChatPanel() {
  return <TestContent />
}
function TestContent() {
  const currentTaskId = useAiAgentStore((s) => s.currentTaskId) // 이 컴포넌트만 구독
  const isStreaming = useAiAgentStore((s) => s.isStreaming)      // 이 컴포넌트만 구독
  // ...
}
```

## 주의사항

- 이 글에서 다루는 "4개 버그 수정"이라는 수치는 코드에서 세 곳까지만 직접 확인됐다. 정확한 수정 시점·건수는 별도로 검증하지 않았다.
- "tearing"이라는 용어는 이 코드베이스가 자체적으로 진단하며 쓴 표현이다. React가 정의하는 엄밀한 의미와 정확히 같은 현상인지는 재검증하지 않았으니, "이렇게 진단하고 이렇게 고쳤다"는 사실 이상으로 일반화하지 않는 게 안전하다.
- 같은 문제를 "스토어를 하나로 합친다"로 풀 수도 있지만, 기능별로 스토어를 나눠 쓰는 설계 자체를 바꾸는 건 영향 범위가 훨씬 크다. 업데이트 시점과 구독 지점만 조정하는 게 더 국소적인 해결이었다.
- 같은 증상(무한 재렌더)이라도 원인은 다를 수 있다 — ①·②는 "같은 틱에 여러 스토어 업데이트", ③은 "셀렉터가 매번 새 객체를 반환"이다. 스택 트레이스만 보고 같은 처방을 쓰기 전에 실제 원인부터 구분해야 한다.

## 참고자료

- [React 공식 문서 — useSyncExternalStore](https://react.dev/reference/react/useSyncExternalStore)
- [Zustand 공식 저장소](https://github.com/pmndrs/zustand)
