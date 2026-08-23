---
title: 프롬프트 엔지니어링과 하네스 엔지니어링의 차이
description: LLM을 다루는 작업을 프롬프트/컨텍스트/툴/하네스 레이어로 나눠서, 문제가 실제로 어느 층에 있는지 구분하는 법을 정리한다
date: 2026-08-23
updated:
category: ai
technology: []
tags: [prompt-engineering, agent, llm]
type: study
status: evergreen
series:
projects:
related:
aliases:
draft: true
---

## 한 줄 요약

"모델에게 뭐라고 시킬지"가 프롬프트 엔지니어링이라면, "모델이 일하는 실행 환경 자체"를 설계하는 게 하네스 엔지니어링이다.

## 왜 (배경/문제 상황)

LLM을 다루는 작업이 커지면서 "프롬프트 엔지니어링", "컨텍스트 엔지니어링", "하네스 엔지니어링", "에이전트 엔지니어링" 같은 용어가 뒤섞여 쓰인다. 실제로는 각각 서로 다른 레이어의 문제를 다루는데, 이 구분이 없으면 "모델이 이상하게 행동한다"는 증상 하나를 두고 계속 프롬프트만 고치다가 정작 원인(도구 결과 처리, 컨텍스트 관리 방식)은 못 건드리는 일이 생긴다.

## 본문

### 레이어별로 나눠보기

| 레이어 | 다루는 문제 | 예시 |
|---|---|---|
| 프롬프트 엔지니어링 | 한 번의 요청 안에서 모델에게 무엇을 어떻게 지시할지 | system prompt 문구, few-shot 예시, 출력 포맷 지정 |
| 컨텍스트 엔지니어링 | 모델에게 어떤 정보를 어떤 순서·형태로 넣어줄지 | 검색 결과 배치 순서, 대화 요약 시점, 토큰 예산 배분 |
| 툴(함수) 엔지니어링 | 모델이 실제로 무엇을 "할 수 있게" 만들지 | 도구 스키마 설계, 에러 메시지 설계, 권한 경계 |
| 하네스 엔지니어링 | 모델을 감싸는 실행 루프·환경 전체를 설계 | 반복 루프 구조, 승인/거부 흐름, 실패 복구, 상태 관리 |
| 에이전트 엔지니어링 | 위 레이어를 조합해 자율적으로 목표를 수행하게 만들기 | 멀티스텝 계획, 서브에이전트 위임, 관찰-행동 루프 |

이 표에서 위로 갈수록 "모델 안에서" 해결되는 문제고, 아래로 갈수록 "모델 바깥의 시스템"이 해결해야 하는 문제다.

### 직접 살펴보기 — 요청 한 번이 처리되는 동안 각 레이어가 개입하는 순서

에이전트가 도구를 한 번 호출하는 요청 하나가 어떤 순서로 처리되는지, 각 단계에서 어느 레이어가 관여하는지를 순서대로 짚어본다.

<div class="pvhdemo">
<style>
.pvhdemo {
  --ink: #1c1917; --sub: #6b7280; --line: #e5e7eb; --card: #fafafa; --card2: #f4f4f5;
  --accent: #466b8f;
  font-family: 'Pretendard', system-ui, sans-serif; font-size: 14px; line-height: 1.6; color: var(--ink);
  border: 1px solid var(--line); border-radius: 16px; padding: 20px; background: var(--card); margin: 24px 0;
}
.dark .pvhdemo { --ink: #e5e7eb; --sub: #9ca3af; --line: #374151; --card: #18181b; --card2: #27272a; --accent: #8fadc7; }
.pvhdemo .steps { display: flex; flex-direction: column; gap: 6px; margin-bottom: 14px; }
.pvhdemo .step {
  display: flex; gap: 10px; align-items: baseline; padding: 8px 10px; border-radius: 8px;
  border: 1px solid var(--line); background: var(--card2); opacity: .45; transition: all .2s;
}
.pvhdemo .step.active { opacity: 1; border-color: var(--accent); background: color-mix(in srgb, var(--accent) 14%, var(--card2)); }
.pvhdemo .step .idx { font-family: 'Fira Code', monospace; font-weight: 700; color: var(--accent); flex: none; width: 18px; }
.pvhdemo .step .txt { flex: 1; }
.pvhdemo .step .layer { font-size: 11px; color: var(--sub); flex: none; }
.pvhdemo .step.active .layer { color: var(--accent); font-weight: 700; }
.pvhdemo .controls { display: flex; gap: 10px; align-items: center; }
.pvhdemo .btn { background: var(--ink); color: var(--card); border: 0; border-radius: 8px; padding: 9px 16px; font-family: inherit; font-weight: 700; font-size: 13px; cursor: pointer; }
.pvhdemo .btn:disabled { opacity: .5; cursor: not-allowed; }
</style>

<div class="steps" id="pvh_steps"></div>
<div class="controls">
  <button class="btn" id="pvh_next">다음 단계 →</button>
  <button class="btn" id="pvh_reset">처음부터</button>
</div>
</div>

<script>
(function () {
  const root = document.currentScript.previousElementSibling;
  if (!root || !root.classList.contains('pvhdemo')) return;
  const stepsEl = root.querySelector('#pvh_steps');
  const nextBtn = root.querySelector('#pvh_next');
  const resetBtn = root.querySelector('#pvh_reset');

  const STEPS = [
    { txt: '사용자 메시지 도착', layer: '' },
    { txt: '이전 대화 요약 + 검색 결과를 컨텍스트에 배치', layer: '컨텍스트 엔지니어링' },
    { txt: '시스템 지시문 + few-shot으로 요청 구성', layer: '프롬프트 엔지니어링' },
    { txt: '모델이 응답 — 어떤 도구를 어떤 인자로 부를지 결정', layer: '툴 엔지니어링(스키마가 선택지를 정함)' },
    { txt: '도구 실행 — 성공/실패, 재시도 여부, 승인 필요 여부 판단', layer: '하네스 엔지니어링' },
    { txt: '도구 결과를 다시 컨텍스트에 반영', layer: '컨텍스트 + 하네스 엔지니어링' },
    { txt: '다음 행동 결정 — 반복할지 종료할지', layer: '에이전트 엔지니어링(전체 레이어 조합)' },
  ];

  let cur = -1;
  function render() {
    stepsEl.innerHTML = STEPS.map((s, i) => `
      <div class="step ${i === cur ? 'active' : ''}">
        <span class="idx">${i + 1}</span>
        <span class="txt">${s.txt}</span>
        <span class="layer">${s.layer}</span>
      </div>
    `).join('');
    nextBtn.disabled = cur >= STEPS.length - 1;
  }
  nextBtn.addEventListener('click', () => { if (cur < STEPS.length - 1) { cur++; render(); } });
  resetBtn.addEventListener('click', () => { cur = -1; render(); });
  render();
})();
</script>

### 프롬프트 엔지니어링: 한 번의 대화 안에서 승부

모델을 호출하는 코드나 실행 환경은 그대로 두고, 텍스트로 넣는 지시문만 바꿔서 결과를 개선하는 작업이다.

- 역할/제약 조건을 system prompt에 명시
- 원하는 출력 형식을 예시로 보여주는 few-shot
- "단계별로 생각해" 같은 추론 유도 문구

프롬프트 엔지니어링의 특징은 **재현이 쉽고 반복 실험 비용이 낮다**는 것이다. 문구 하나 바꿔서 바로 다시 호출해보면 되기 때문에 가장 먼저 손대게 되는 층이지만, 동시에 "정말 프롬프트 문제가 맞는지" 확인하지 않고 여기서만 계속 맴돌기도 쉽다.

### 하네스 엔지니어링: 모델 바깥의 시스템을 설계

하네스(harness)는 모델을 감싸서 실제로 일을 시키는 실행 루프다. 모델이 한 번 답을 내고 끝나는 게 아니라, 도구를 호출하고 결과를 다시 모델에게 넘기고 다음 행동을 결정하는 과정 전체를 관리한다.

하네스가 다루는 것들:

- **관찰-행동 루프**: 도구 호출 결과를 어떤 형태로 다시 모델에게 넣어줄지 (원본 그대로 vs 요약해서)
- **실패 처리**: 도구 호출이 실패했을 때 재시도할지, 사람에게 물어볼지, 다른 방법을 시도할지
- **권한 경계**: 어떤 행동은 바로 실행하고, 어떤 행동은 승인을 받아야 하는지
- **상태/컨텍스트 관리**: 대화가 길어질 때 무엇을 요약하고 무엇을 그대로 남길지
- **병렬/백그라운드 실행**: 오래 걸리는 작업을 어떻게 별도로 돌리고 결과를 언제 다시 합류시킬지

프롬프트가 아무리 정교해도, 하네스가 도구 실행 실패를 모델에게 애매하게 전달하거나 컨텍스트를 잘못된 시점에 잘라버리면 모델은 잘못된 판단을 내린다. 이런 경우 증상은 "모델이 헛소리한다"로 보이지만, 원인은 프롬프트가 아니라 하네스에 있다.

### 왜 구분이 중요한가

문제가 생겼을 때 층을 나눠서 물어보면 진단이 빨라진다.

- 모델이 존재하지 않는 도구를 호출한다 → 툴 스키마/설명 문제 (툴 엔지니어링)
- 모델이 방금 준 정보를 무시한다 → 컨텍스트에 그 정보가 실제로 들어갔는지, 어느 위치에 있는지 확인 (컨텍스트 엔지니어링)
- 모델이 같은 실수를 반복한다 → 실패 결과가 다음 턴에 제대로 전달되는지 확인 (하네스 엔지니어링)
- 모델이 형식은 맞는데 내용이 부실하다 → 지시문 자체를 점검 (프롬프트 엔지니어링)

## 예제

CLI 기반 코딩 에이전트(예: 터미널에서 파일을 읽고 수정하고 명령을 실행하는 도구)를 생각해보면 레이어가 뚜렷이 갈린다.

- **프롬프트 층**: "코드를 수정할 때는 기존 스타일을 따르라" 같은 지시문
- **툴 층**: 파일 읽기/쓰기, 명령 실행 도구의 입출력 스키마
- **하네스 층**: 명령 실행 결과(stdout/stderr)를 얼마나 잘라서 모델에게 보여줄지, 위험한 명령(`rm -rf` 등) 실행 전에 사용자 승인을 요구할지, 백그라운드로 돌린 빌드가 끝났을 때 어떻게 알려줄지

같은 모델을 쓰더라도 하네스 설계가 다르면 실제 작업 성공률이 크게 달라진다 — 이게 "모델 성능"과 "에이전트 성능"이 종종 별개로 논의되는 이유다.

## 주의사항

- 이 용어들은 아직 업계에서 완전히 표준화되지 않아서, 사람이나 팀마다 레이어 경계를 조금씩 다르게 나누기도 한다. 여기 표는 문제를 진단하기 위한 실용적인 구분이지 절대적인 분류가 아니다.
- "프롬프트만 계속 고치는데 안 되는" 상황일수록, 실제로는 하네스나 컨텍스트 층의 문제일 가능성을 먼저 의심해볼 가치가 있다.

## 참고자료

외부 출처 없이, 에이전트 하네스를 직접 다뤄보면서 관찰한 레이어 구분을 정리한 글이다.
