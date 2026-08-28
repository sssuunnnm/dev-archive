---
title: 동적계획법(DP) 개념과 문제 패턴
description: DP인지 아닌지 알아채는 법, 점화식을 세우는 순서, 1차원/2차원 테이블 패턴을 정리한다
date: 2026-07-31
updated:
category: coding-test
technology: [cpp]
tags: [dynamic-programming, pattern-recognition]
type: study
status: evergreen
series:
projects:
related:
  - brute-force-basics
  - greedy-basics
aliases:
draft: true
---

## 한 줄 요약

DP는 "같은 부분 문제를 여러 번 계산하게 되는 완전탐색"을 발견했을 때, 그 결과를 저장해두고 재사용하는 것뿐이다.

## 왜 (배경/문제 상황)

DP는 처음 배울 때 점화식부터 외우려고 해서 어렵게 느껴진다. 실제로는 순서가 반대다 — 먼저 완전탐색(재귀)으로 풀이를 떠올린 다음, "어? 같은 입력으로 여러 번 호출되네?"를 발견하면 그 결과를 캐싱하는 게 DP다. 점화식은 그 다음에 자연스럽게 따라온다.

## 본문

### DP인지 판단하는 법

아래 두 조건이 모두 있으면 DP를 의심한다.

1. **최적 부분 구조**: 큰 문제의 답이 작은 부분 문제들의 답으로 표현된다.
2. **겹치는 부분 문제**: 완전탐색(재귀)으로 풀면 같은 입력으로 함수가 여러 번 호출된다.

2번이 특히 중요한 신호다. 재귀로 짜봤는데 "어, 이 계산 아까 한 것 같은데"라는 느낌이 들면 DP로 바꿀 타이밍이다.

### 문제 신호 → DP 접근 매칭

| 문제에서 이런 게 보이면 | 접근 |
|---|---|
| "n번째 값이 이전 몇 개 값으로 결정됨" (피보나치류) | 1차원 DP |
| "경로의 수를 구해라" (격자 이동 등) | 2차원 DP |
| "최댓값이 되도록 선택해라" + 그리디가 안 통함 | DP (선택/비선택 2가지 경우를 각각 저장) |
| "두 문자열/배열을 비교해서 공통된 것을 찾아라" | 2차원 DP (LCS류) |

### DP를 세우는 순서 (점화식 먼저 외우지 않기)

1. 완전탐색(재귀)으로 일단 풀이를 짠다.
2. 재귀 함수의 인자가 "상태"를 나타낸다는 걸 확인한다 (예: `f(i)` = i번째까지 봤을 때의 답).
3. 같은 상태로 여러 번 호출되는지 확인한다.
4. 상태를 배열(`dp[i]`)에 저장해두고, 이미 계산했으면 저장된 값을 바로 반환한다 (메모이제이션).

```cpp
// 1~3단계: 완전탐색 재귀
int fib(int n) {
    if (n <= 1) return n;
    return fib(n - 1) + fib(n - 2);
}

// 4단계: 메모이제이션 추가
vector<int> memo(100, -1);
int fibMemo(int n) {
    if (n <= 1) return n;
    if (memo[n] != -1) return memo[n]; // 이미 계산했으면 바로 반환
    return memo[n] = fibMemo(n - 1) + fibMemo(n - 2);
}
```

### 패턴 1. 1차원 DP (이전 몇 개 값으로 현재가 결정됨)

```cpp
// "계단 오르기": 한 칸 또는 두 칸씩 뛸 수 있을 때 n칸까지 가는 방법의 수
vector<int> dp(n + 1);
dp[0] = 1;
dp[1] = 1;
for (int i = 2; i <= n; i++) {
    dp[i] = dp[i - 1] + dp[i - 2];
}
```

### 패턴 2. 2차원 DP (두 축의 상태가 필요할 때)

```cpp
// 격자에서 좌상단 -> 우하단으로 가는 경로의 수
vector<vector<int>> dp(n, vector<int>(m, 0));
dp[0][0] = 1;
for (int i = 0; i < n; i++) {
    for (int j = 0; j < m; j++) {
        if (i > 0) dp[i][j] += dp[i-1][j];
        if (j > 0) dp[i][j] += dp[i][j-1];
    }
}
```

### 패턴 3. 선택/비선택 DP (배낭 문제류)

```cpp
// dp[i][w] = i번째 물건까지 고려했을 때, 무게 w 이하로 담을 수 있는 최대 가치
vector<vector<int>> dp(n + 1, vector<int>(capacity + 1, 0));
for (int i = 1; i <= n; i++) {
    for (int w = 0; w <= capacity; w++) {
        dp[i][w] = dp[i-1][w]; // 이 물건을 선택 안 함
        if (w >= weight[i-1]) {
            dp[i][w] = max(dp[i][w], dp[i-1][w - weight[i-1]] + value[i-1]); // 선택함
        }
    }
}
```

완전탐색 패턴(백트래킹)의 "선택/비선택 재귀"와 구조가 똑같다는 걸 눈여겨본다 — 완전탐색이 DP로 넘어가는 가장 흔한 다리가 이 형태다.

## 예제

"정수 삼각형" 유형(프로그래머스): 위에서 아래로 내려가며 각 위치까지 도달하는 최댓값을 저장한다. `dp[i][j]`(i번째 줄, j번째 칸까지의 최댓값)는 바로 위 두 칸(`dp[i-1][j-1]`, `dp[i-1][j]`) 중 큰 값에 현재 값을 더한 것이다.

```cpp
vector<vector<int>> dp = triangle; // 초기값을 삼각형 그대로 복사
for (int i = 1; i < triangle.size(); i++) {
    for (int j = 0; j <= i; j++) {
        int left = (j > 0) ? dp[i-1][j-1] : -1e9;
        int up = (j < i) ? dp[i-1][j] : -1e9;
        dp[i][j] += max(left, up);
    }
}
```

### 직접 눌러보기 — dp 테이블이 채워지는 과정

아래 삼각형으로 `dp[i][j] = max(left, up) + value`가 위에서 아래로 한 칸씩 어떻게 채워지는지 재생한다. 강조된 칸이 지금 계산 중인 칸, 그 위에 연결된 칸이 `left`/`up`이다.

<div class="dpdemo">
<style>
.dpdemo {
  --ink: #1c1917; --sub: #6b7280; --line: #e5e7eb; --card: #fafafa; --card2: #f4f4f5;
  --accent: #466b8f; --good: #16a34a;
  font-family: 'Pretendard', system-ui, sans-serif; font-size: 14px; line-height: 1.6; color: var(--ink);
  border: 1px solid var(--line); border-radius: 16px; padding: 20px; background: var(--card); margin: 24px 0;
}
.dark .dpdemo { --ink: #e5e7eb; --sub: #9ca3af; --line: #374151; --card: #18181b; --card2: #27272a; --accent: #8fadc7; }
.dpdemo .tri-row { display: flex; justify-content: center; gap: 8px; margin-bottom: 8px; }
.dpdemo .cell {
  width: 56px; height: 44px; display: flex; flex-direction: column; align-items: center; justify-content: center;
  border-radius: 8px; background: var(--card2); border: 2px solid var(--line); transition: all .2s;
}
.dpdemo .cell .v { font-family: 'Fira Code', monospace; font-size: 10px; color: var(--sub); }
.dpdemo .cell .dp { font-family: 'Fira Code', monospace; font-size: 15px; font-weight: 700; }
.dpdemo .cell.cur { border-color: var(--accent); background: color-mix(in srgb, var(--accent) 18%, var(--card2)); }
.dpdemo .cell.parent { border-color: var(--good); }
.dpdemo .cell.best { border-color: var(--good); background: color-mix(in srgb, var(--good) 18%, var(--card2)); }
.dpdemo .narr { min-height: 22px; font-size: 12.5px; color: var(--sub); margin: 10px 0 12px; text-align: center; }
.dpdemo .narr b { color: var(--ink); font-family: 'Fira Code', monospace; }
.dpdemo .controls { display: flex; gap: 10px; justify-content: center; }
.dpdemo .btn { background: var(--ink); color: var(--card); border: 0; border-radius: 8px; padding: 9px 16px; font-family: inherit; font-weight: 700; font-size: 13px; cursor: pointer; }
.dpdemo .btn:disabled { opacity: .5; cursor: not-allowed; }
</style>

<div id="dp_tri"></div>
<div class="narr" id="dp_narr">재생 버튼을 누르면 위에서 아래로 한 칸씩 채웁니다.</div>
<div class="controls"><button class="btn" id="dp_play">▶ 처음부터 재생</button></div>
</div>

<script>
(function () {
  const root = document.currentScript.previousElementSibling;
  if (!root || !root.classList.contains('dpdemo')) return;
  const TRIANGLE = [[7], [3, 8], [8, 1, 0], [2, 7, 4, 4]];
  const triEl = root.querySelector('#dp_tri');
  const narrEl = root.querySelector('#dp_narr');
  const playBtn = root.querySelector('#dp_play');
  const NEG = null;

  function render(dp, curI, curJ, parents, bestJ) {
    triEl.innerHTML = TRIANGLE.map((row, i) => `
      <div class="tri-row">${row.map((v, j) => {
        const isCur = i === curI && j === curJ;
        const isParent = parents && i === curI - 1 && (j === parents[0] || j === parents[1]);
        const isBest = bestJ != null && i === TRIANGLE.length - 1 && j === bestJ;
        const dpVal = dp[i] && dp[i][j] != null ? dp[i][j] : '';
        return `<div class="cell ${isCur ? 'cur' : ''} ${isParent ? 'parent' : ''} ${isBest ? 'best' : ''}">
          <span class="v">val ${v}</span><span class="dp">${dpVal}</span>
        </div>`;
      }).join('')}</div>
    `).join('');
  }
  function wait(ms) { return new Promise((r) => setTimeout(r, ms)); }

  let runId = 0;
  async function play() {
    const my = ++runId;
    playBtn.disabled = true;
    const dp = TRIANGLE.map((row) => row.map(() => null));
    dp[0][0] = TRIANGLE[0][0];
    render(dp, 0, 0, null, null);
    narrEl.innerHTML = `dp[0][0] = ${dp[0][0]} (맨 위 칸은 그대로 시작값)`;
    await wait(900);
    for (let i = 1; i < TRIANGLE.length; i++) {
      for (let j = 0; j <= i; j++) {
        if (my !== runId) return;
        const leftJ = j > 0 ? j - 1 : null;
        const upJ = j < i ? j : null;
        render(dp, i, j, [leftJ, upJ], null);
        const leftV = leftJ != null ? dp[i - 1][leftJ] : NEG;
        const upV = upJ != null ? dp[i - 1][upJ] : NEG;
        const parts = [];
        if (leftV != null) parts.push(`left=dp[${i - 1}][${leftJ}]=${leftV}`);
        if (upV != null) parts.push(`up=dp[${i - 1}][${upJ}]=${upV}`);
        narrEl.innerHTML = `${parts.join(', ')} 중 큰 값 + val(${TRIANGLE[i][j]})`;
        await wait(750);
        if (my !== runId) return;
        const best = Math.max(leftV ?? -Infinity, upV ?? -Infinity);
        dp[i][j] = TRIANGLE[i][j] + best;
        render(dp, i, j, [leftJ, upJ], null);
        narrEl.innerHTML = `dp[${i}][${j}] = ${TRIANGLE[i][j]} + ${best} = <b>${dp[i][j]}</b>`;
        await wait(600);
      }
    }
    const lastRow = dp[dp.length - 1];
    const maxVal = Math.max(...lastRow);
    const bestJ = lastRow.indexOf(maxVal);
    render(dp, -1, -1, null, bestJ);
    narrEl.innerHTML = `마지막 줄에서 가장 큰 값 <b>${maxVal}</b>이 정답.`;
    playBtn.disabled = false;
  }
  playBtn.addEventListener('click', play);
  render(TRIANGLE.map((row) => row.map(() => null)), -1, -1, null, null);
})();
</script>

## 주의사항

- DP 배열의 인덱스 경계(맨 왼쪽/맨 오른쪽 칸처럼 한쪽 값이 없는 경우)를 놓치면 범위 밖 접근이나 잘못된 최댓값이 나온다. 위 예제처럼 없는 방향은 아주 작은 값(`-1e9`)으로 막아두는 방식이 안전하다.
- 메모이제이션 배열 초기값을 "아직 계산 안 함"을 나타낼 수 있는 값(-1 등)으로 정확히 잡아야 한다. 0으로 초기화하면 실제 계산값 0과 구분이 안 될 수 있다.
- DP인지 그리디인지 헷갈리면, 그리디 기준으로 반례를 만들어본다 (그리디 article 참고). 반례가 나오면 DP로 넘어가야 한다는 뜻이다.
- 2차원 DP는 메모리를 많이 쓸 수 있다. 현재 줄이 바로 이전 줄에만 의존한다면 배열을 2줄짜리로 줄여서(rolling array) 메모리를 아낄 수 있다.

## 참고자료

- 프로그래머스 "정수 삼각형", "등굣길", "타일 채우기" 유형
- [완전탐색 개념과 문제 패턴](../brute-force-basics/) — 선택/비선택 재귀 구조 참고
- [그리디 개념과 문제 패턴](../greedy-basics/) — DP와 그리디를 가르는 조건 참고
