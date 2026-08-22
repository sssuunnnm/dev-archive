---
title: 스택/큐 개념과 문제 패턴
description: 스택과 큐를 언제 골라 써야 하는지, 괄호 매칭/시뮬레이션 문제에서 반복되는 패턴을 정리한다
date: 2026-07-31
updated:
category: cs
technology: [cpp]
tags: [stack, queue, pattern-recognition]
type: study
status: evergreen
series:
projects:
related:
aliases:
draft: true
---

## 한 줄 요약

"방금 넣은 걸 먼저 꺼내야 하면" 스택, "먼저 넣은 걸 먼저 꺼내야 하면" 큐다.

## 왜 (배경/문제 상황)

스택/큐 자체는 API가 단순해서 어렵지 않은데, "이 문제가 스택 문제인지"를 알아채는 게 관건이다. 특히 괄호 매칭류, 시뮬레이션류가 반복되는 유형이라 신호만 잡으면 빠르게 풀린다.

## 본문

### 문제 신호 → 자료구조 매칭

| 문제에서 이런 게 보이면 | 자료구조 |
|---|---|
| "짝을 맞춰야 한다" (괄호, 태그 등) | 스택 |
| "가장 최근 것과 비교/제거" | 스택 |
| "순서대로 처리해야 한다" (대기열, 시뮬레이션) | 큐 |
| "일정 시간/순서마다 앞에서부터 하나씩 처리" | 큐 |

### 패턴 1. 괄호/짝 맞추기 (스택)

여는 것을 넣고, 닫는 게 나오면 스택 맨 위와 짝이 맞는지 확인한다.

```cpp
bool isValid(string s) {
    stack<char> st;
    for (char c : s) {
        if (c == '(') {
            st.push(c);
        } else if (c == ')') {
            if (st.empty()) return false; // 닫을 게 없는데 닫으려 함
            st.pop();
        }
    }
    return st.empty(); // 다 짝지어졌으면 비어있어야 함
}
```

여는 괄호가 여러 종류면(`(`, `{`, `[`), 닫는 괄호가 나올 때 스택 맨 위 문자와 정확히 짝이 맞는지까지 확인해야 한다.

### 패턴 2. 뒤에서 조건에 안 맞는 걸 계속 제거 (스택)

예: "숫자를 몇 개 지워서 가장 큰/작은 수를 만들어라" 유형.

```cpp
string solution(string number, int k) {
    stack<char> st;
    for (char c : number) {
        // 지울 기회(k)가 남아있고, 지금 넣을 숫자가 스택 맨 위보다 크면 스택 맨 위를 지운다
        while (!st.empty() && k > 0 && st.top() < c) {
            st.pop();
            k--;
        }
        st.push(c);
    }
    // k가 남았으면 뒤에서부터 마저 지운다
    string result(st.begin(), st.end());
    result.resize(result.size() - k);
    return result;
}
```

"지금 원소가 이전 원소보다 크면 이전 걸 지운다"는 조건이 나오면 스택 패턴을 의심한다.

### 직접 눌러보기 — 숫자를 지워서 가장 큰 수 만들기

`number="4177252841"`, `k=4`로 위 코드를 한 글자씩 재생한다. 스택 맨 위보다 지금 글자가 크고 지울 기회(`k`)가 남아있으면 스택 맨 위를 계속 지운다.

<div class="sqdemo">
<style>
.sqdemo {
  --ink: #1c1917; --sub: #6b7280; --line: #e5e7eb; --card: #fafafa; --card2: #f4f4f5;
  --accent: #466b8f; --bad: #dc2626;
  font-family: 'Pretendard', system-ui, sans-serif; font-size: 14px; line-height: 1.6; color: var(--ink);
  border: 1px solid var(--line); border-radius: 16px; padding: 20px; background: var(--card); margin: 24px 0;
}
.dark .sqdemo { --ink: #e5e7eb; --sub: #9ca3af; --line: #374151; --card: #18181b; --card2: #27272a; --accent: #8fadc7; }
.sqdemo .row { display: flex; gap: 6px; margin-bottom: 10px; align-items: center; }
.sqdemo .row > div { display: flex; gap: 6px; flex-wrap: wrap; flex: 1; min-width: 0; }
.sqdemo .lbl { font-size: 11px; color: var(--sub); width: 62px; flex: none; }
.sqdemo .cell {
  min-width: 30px; text-align: center; padding: 8px 4px; border-radius: 6px; background: var(--card2);
  border: 2px solid var(--line); font-family: 'Fira Code', monospace; font-weight: 700; font-size: 14px; transition: all .15s;
}
.sqdemo .cell.cur { border-color: var(--accent); background: color-mix(in srgb, var(--accent) 18%, var(--card2)); }
.sqdemo .cell.popping { border-color: var(--bad); background: color-mix(in srgb, var(--bad) 15%, var(--card2)); }
.sqdemo .narr { min-height: 22px; font-size: 12.5px; color: var(--sub); margin: 8px 0 12px; }
.sqdemo .narr b { color: var(--ink); font-family: 'Fira Code', monospace; }
.sqdemo .controls { display: flex; gap: 10px; align-items: center; margin-bottom: 4px; }
.sqdemo .btn { background: var(--ink); color: var(--card); border: 0; border-radius: 8px; padding: 9px 16px; font-family: inherit; font-weight: 700; font-size: 13px; cursor: pointer; }
.sqdemo .btn:disabled { opacity: .5; cursor: not-allowed; }
.sqdemo .kleft { font-size: 12px; color: var(--sub); }
.sqdemo .kleft b { color: var(--ink); font-family: 'Fira Code', monospace; }
</style>

<div class="row"><span class="lbl">number</span><div id="sq_number"></div></div>
<div class="row"><span class="lbl">stack</span><div id="sq_stack"></div></div>
<div class="narr" id="sq_narr">재생 버튼을 누르면 한 글자씩 처리합니다.</div>
<div class="controls">
  <button class="btn" id="sq_play">▶ 처음부터 재생</button>
  <span class="kleft">남은 k = <b id="sq_k">4</b></span>
</div>
</div>

<script>
(function () {
  const root = document.currentScript.previousElementSibling;
  if (!root || !root.classList.contains('sqdemo')) return;
  const NUMBER = '4177252841';
  const K0 = 4;
  const numberEl = root.querySelector('#sq_number');
  const stackEl = root.querySelector('#sq_stack');
  const narrEl = root.querySelector('#sq_narr');
  const kEl = root.querySelector('#sq_k');
  const playBtn = root.querySelector('#sq_play');

  function renderNumber(curIdx) {
    numberEl.innerHTML = [...NUMBER].map((c, i) => `<div class="cell ${i === curIdx ? 'cur' : ''}">${c}</div>`).join('');
  }
  function renderStack(stack, poppingTop) {
    stackEl.innerHTML = stack.map((c, i) => `<div class="cell ${poppingTop && i === stack.length - 1 ? 'popping' : ''}">${c}</div>`).join('') || '<span style="color:var(--sub);font-size:12px">(비어있음)</span>';
  }
  function wait(ms) { return new Promise((r) => setTimeout(r, ms)); }

  let runId = 0;
  async function play() {
    const my = ++runId;
    playBtn.disabled = true;
    let stack = [], k = K0;
    kEl.textContent = k;
    renderNumber(-1); renderStack(stack, false);
    await wait(400);
    for (let i = 0; i < NUMBER.length; i++) {
      if (my !== runId) return;
      const c = NUMBER[i];
      renderNumber(i);
      narrEl.innerHTML = `'<b>${c}</b>' 처리 중`;
      await wait(500);
      while (stack.length && k > 0 && stack[stack.length - 1] < c) {
        if (my !== runId) return;
        renderStack(stack, true);
        narrEl.innerHTML = `스택 맨 위 '<b>${stack[stack.length - 1]}</b>' &lt; '<b>${c}</b>' → 지운다 (k: ${k}→${k - 1})`;
        await wait(650);
        stack.pop(); k--; kEl.textContent = k;
        renderStack(stack, false);
        await wait(250);
      }
      stack.push(c);
      renderStack(stack, false);
      await wait(300);
    }
    narrEl.innerHTML = `모든 글자 처리 완료. 남은 k=${k}${k > 0 ? ` → 뒤에서 ${k}개를 마저 지운다` : ''}`;
    if (k > 0) { await wait(700); stack = stack.slice(0, stack.length - k); renderStack(stack, false); k = 0; kEl.textContent = 0; }
    narrEl.innerHTML += ` → 결과: <b>${stack.join('')}</b>`;
    playBtn.disabled = false;
  }
  playBtn.addEventListener('click', play);
  renderNumber(-1); renderStack([], false);
})();
</script>

### 패턴 3. 순서대로 처리하는 시뮬레이션 (큐)

예: "인쇄 대기열", "카드 뽑기" 같은 유형. 맨 앞을 꺼내서 조건 확인 후 다시 넣거나 처리한다.

```cpp
queue<int> q;
for (int x : arr) q.push(x);

while (!q.empty()) {
    int cur = q.front(); q.pop();
    if (/* 조건 */) {
        // 처리
    } else {
        q.push(cur); // 다시 뒤로 보냄
    }
}
```

## 예제

"기능개발" 유형(프로그래머스): 작업 진도를 큐에 순서대로 넣고, 앞에서부터 완료 여부를 확인하면서 같이 배포되는 묶음을 센다. "앞에서부터 순서대로, 먼저 온 게 먼저 처리된다"는 신호가 곧 큐 패턴이다.

```cpp
queue<int> q;
for (int p : progresses) q.push(p);

vector<int> answer;
while (!q.empty()) {
    int count = 0;
    int firstDay = /* 첫 작업이 완료되는 날 계산 */;
    while (!q.empty() && /* 현재 작업이 firstDay 안에 끝남 */) {
        q.pop();
        count++;
    }
    answer.push_back(count);
}
```

## 주의사항

- 스택이 비어있는 상태에서 `top()`이나 `pop()`을 호출하면 정의되지 않은 동작(런타임 에러)이 난다. 항상 `empty()` 체크를 먼저 한다.
- 큐에서 `front()`로 값을 본 다음 `pop()`을 깜빡하면 무한루프에 빠지기 쉽다.
- "스택으로 풀 수 있는 문제인데 재귀로 풀면 스택 오버플로우가 날 수도 있다"는 것도 알아두면 좋다 — 재귀 깊이가 깊어질 문제(예: 원소 수가 많은 괄호 문자열)는 스택 자료구조로 직접 푸는 게 안전하다.

## 참고자료

- 프로그래머스 "괄호 회전하기", "가장 큰 수" 유형 (스택)
- 프로그래머스 "기능개발", "프로세스" 유형 (큐)
