---
title: 이분탐색 개념과 문제 패턴
description: 값을 찾는 이분탐색 말고, "정답 자체를 이분탐색"하는 파라메트릭 서치 패턴을 정리한다
date: 2026-07-31
updated:
category: coding-test
technology: [cpp]
tags: [binary-search, parametric-search, pattern-recognition]
type: study
status: evergreen
series:
projects:
related:
aliases:
draft: true
---

## 한 줄 요약

이분탐색 문제의 대부분은 배열에서 값을 찾는 게 아니라, "정답이 될 수 있는 값의 범위"를 이분탐색하는 형태(파라메트릭 서치)로 나온다.

## 왜 (배경/문제 상황)

이분탐색을 배울 때는 "정렬된 배열에서 특정 값 찾기"로 배우지만, 프로그래머스에서 킬러 문제로 나오는 이분탐색은 다른 모양이다. 배열이 아니라 "답이 될 수 있는 숫자의 범위"를 반으로 좁혀나가는 형태라서, 처음 보면 이분탐색인지도 알아채기 어렵다.

## 본문

### 문제 신호 → 패턴 매칭

| 문제에서 이런 게 보이면 | 패턴 |
|---|---|
| "정렬된 배열에서 특정 값의 위치" | 일반 이분탐색 |
| "최소/최대 얼마로 설정해야 조건을 만족하나" | 파라메트릭 서치 |
| "~ 이상/이하로 자르면 몇 개가 나오나" 같은 조건이 단조롭게 변함 | 파라메트릭 서치 |

**파라메트릭 서치를 알아채는 핵심 신호**: 정답 후보값을 하나 정했을 때 "그 값으로 가능한지 아닌지"를 판단하는 함수를 만들 수 있고, 그 가능 여부가 값이 커질수록(또는 작아질수록) 한 방향으로만 바뀐다(단조성)면 이분탐색 대상이다.

### 패턴 1. 일반 이분탐색 (정렬된 배열에서 값 찾기)

```cpp
sort(v.begin(), v.end());
auto it = lower_bound(v.begin(), v.end(), target); // target 이상이 처음 나오는 위치
bool found = (it != v.end() && *it == target);
```

### 패턴 2. 파라메트릭 서치 (정답 범위를 이분탐색)

"정답이 될 수 있는 값의 최솟값/최댓값"을 직접 이분탐색한다. 뼈대는 항상 비슷하다.

```cpp
bool isPossible(long long mid, /* 문제 조건 */) {
    // mid라는 값으로 조건을 만족시킬 수 있는지 확인
    // true/false만 반환
}

long long solve(long long lo, long long hi) {
    long long answer = -1;
    while (lo <= hi) {
        long long mid = lo + (hi - lo) / 2;
        if (isPossible(mid)) {
            answer = mid;   // mid로 가능하니 일단 기록
            lo = mid + 1;   // 더 큰 값도 가능한지 확인 (최댓값을 찾는 경우)
            // 최솟값을 찾는 경우라면 반대로 hi = mid - 1;
        } else {
            hi = mid - 1;
        }
    }
    return answer;
}
```

**핵심은 `isPossible` 함수를 설계하는 것**이다. 이분탐색 뼈대 자체는 거의 고정이고, 문제마다 바뀌는 건 "이 값이 가능한지"를 판단하는 로직뿐이다.

## 예제

"입국심사" 유형(프로그래머스): 심사관 n명이 각자 심사 시간이 다를 때, 모든 사람을 심사하는 데 걸리는 "최소 시간"을 구한다. 시간을 직접 하나씩 늘려보는 대신, "이 시간 안에 모든 사람을 심사할 수 있는가"를 이분탐색한다.

```cpp
bool isPossible(long long time, vector<int>& times, int n) {
    long long count = 0;
    for (int t : times) {
        count += time / t; // 이 심사관이 이 시간 동안 처리 가능한 인원
    }
    return count >= n; // n명 이상 처리 가능하면 이 시간으로 충분
}

long long solution(int n, vector<int> times) {
    long long lo = 1;
    long long hi = (long long)*max_element(times.begin(), times.end()) * n;
    long long answer = hi;

    while (lo <= hi) {
        long long mid = lo + (hi - lo) / 2;
        if (isPossible(mid, times, n)) {
            answer = mid;
            hi = mid - 1; // 더 작은 시간도 가능한지 확인 (최솟값을 찾는 문제)
        } else {
            lo = mid + 1;
        }
    }
    return answer;
}
```

"시간을 1부터 하나씩 늘려가며 확인"하면 시간초과가 나지만, 이분탐색으로 후보 시간을 반씩 좁히면 O(log(범위))로 확 줄어든다.

### 직접 눌러보기 — lo/hi가 좁혀지는 과정

`n=6`, `times=[7,10]`일 때 실제로 `lo`/`hi`/`mid`가 어떻게 움직여 답 `28`에 도달하는지 재생해본다.

<div class="psdemo">
<style>
.psdemo {
  --ink: #1c1917; --sub: #6b7280; --line: #e5e7eb; --card: #fafafa; --card2: #f4f4f5;
  --accent: #466b8f; --good: #16a34a; --bad: #dc2626;
  font-family: 'Pretendard', system-ui, sans-serif; font-size: 14px; line-height: 1.6; color: var(--ink);
  border: 1px solid var(--line); border-radius: 16px; padding: 20px; background: var(--card); margin: 24px 0;
}
.dark .psdemo { --ink: #e5e7eb; --sub: #9ca3af; --line: #374151; --card: #18181b; --card2: #27272a; --accent: #8fadc7; }
.psdemo .vals { display: flex; gap: 16px; flex-wrap: wrap; margin-bottom: 10px; font-size: 13px; color: var(--sub); }
.psdemo .vals b { color: var(--ink); font-family: 'Fira Code', monospace; }
.psdemo .track { position: relative; height: 34px; background: var(--card2); border-radius: 8px; margin-bottom: 6px; }
.psdemo .range { position: absolute; top: 0; bottom: 0; background: var(--accent); opacity: .25; border-radius: 8px; }
.psdemo .mid-mark { position: absolute; top: -6px; bottom: -6px; width: 2px; background: var(--ink); }
.psdemo .mid-label { position: absolute; top: -26px; transform: translateX(-50%); font-size: 11px; font-weight: 700; font-family: 'Fira Code', monospace; }
.psdemo .axis { display: flex; justify-content: space-between; font-size: 10.5px; color: var(--sub); margin-bottom: 14px; }
.psdemo .controls { display: flex; gap: 10px; margin-bottom: 12px; }
.psdemo .btn { background: var(--ink); color: var(--card); border: 0; border-radius: 8px; padding: 9px 16px; font-family: inherit; font-weight: 700; font-size: 13px; cursor: pointer; }
.psdemo .btn:disabled { opacity: .5; cursor: not-allowed; }
.psdemo .log {
  font-family: 'Fira Code', ui-monospace, Menlo, Consolas, monospace; font-size: 12px;
  background: #0f1633; color: #9fb0e8; border-radius: 10px; padding: 12px 14px; line-height: 1.8; min-height: 40px; white-space: pre-wrap;
}
.psdemo .log .ok { color: #7ee0a0; }
.psdemo .log .no { color: #ff8a8a; }
</style>

<div class="vals">
  <span>lo = <b id="ps_lo">1</b></span>
  <span>hi = <b id="ps_hi">60</b></span>
  <span>mid = <b id="ps_mid">-</b></span>
  <span>answer = <b id="ps_ans">-</b></span>
</div>
<div class="track" id="ps_track">
  <div class="range" id="ps_range"></div>
  <div class="mid-mark" id="ps_midmark" style="display:none"><span class="mid-label" id="ps_midlabel"></span></div>
</div>
<div class="axis"><span>1</span><span>60</span></div>
<div class="controls">
  <button class="btn" id="ps_play">▶ 처음부터 재생</button>
</div>
<div class="log" id="ps_log">// 재생하면 isPossible(mid) 판정 과정이 여기 표시됩니다</div>
</div>

<script>
(function () {
  const root = document.currentScript.previousElementSibling;
  if (!root || !root.classList.contains('psdemo')) return;
  const TIMES = [7, 10], N = 6, MAXV = 60;
  function isPossible(mid) { return TIMES.reduce((s, t) => s + Math.floor(mid / t), 0) >= N; }

  const elLo = root.querySelector('#ps_lo'), elHi = root.querySelector('#ps_hi');
  const elMid = root.querySelector('#ps_mid'), elAns = root.querySelector('#ps_ans');
  const elRange = root.querySelector('#ps_range'), elMark = root.querySelector('#ps_midmark'), elMarkLabel = root.querySelector('#ps_midlabel');
  const elLog = root.querySelector('#ps_log');
  const playBtn = root.querySelector('#ps_play');
  const pct = (v) => ((v - 1) / (MAXV - 1)) * 100;

  function render(lo, hi, mid) {
    elLo.textContent = lo; elHi.textContent = hi;
    elRange.style.left = pct(lo) + '%'; elRange.style.width = Math.max(0, pct(hi) - pct(lo)) + '%';
    if (mid != null) {
      elMid.textContent = mid; elMark.style.display = 'block';
      elMark.style.left = pct(mid) + '%'; elMarkLabel.textContent = mid;
    } else { elMid.textContent = '-'; elMark.style.display = 'none'; }
  }
  function wait(ms) { return new Promise((r) => setTimeout(r, ms)); }

  let runId = 0;
  async function play() {
    const my = ++runId;
    playBtn.disabled = true;
    elLog.innerHTML = ''; elAns.textContent = '-';
    let lo = 1, hi = MAXV, answer = -1;
    render(lo, hi, null);
    await wait(500);
    while (lo <= hi) {
      if (my !== runId) return;
      const mid = lo + Math.floor((hi - lo) / 2);
      render(lo, hi, mid);
      const ok = isPossible(mid);
      const count = TIMES.reduce((s, t) => s + Math.floor(mid / t), 0);
      elLog.innerHTML += `mid=${mid} → count=${count} ${ok ? '&gt;= 6' : '&lt; 6'} → <span class="${ok ? 'ok' : 'no'}">${ok ? 'isPossible=true' : 'isPossible=false'}</span>\n`;
      elLog.scrollTop = elLog.scrollHeight;
      await wait(900);
      if (my !== runId) return;
      if (ok) { answer = mid; elAns.textContent = answer; hi = mid - 1; }
      else { lo = mid + 1; }
      await wait(300);
    }
    render(lo, hi, null);
    elLog.innerHTML += `<span class="ok">lo(${lo}) &gt; hi(${hi}) → 종료, answer = ${answer}</span>`;
    playBtn.disabled = false;
  }
  playBtn.addEventListener('click', play);
  render(1, MAXV, null);
})();
</script>

## 주의사항

- `lo + (hi - lo) / 2`로 mid를 계산하는 걸 습관화한다. `(lo + hi) / 2`는 값이 크면 오버플로우가 날 수 있다.
- 이분탐색 범위(`lo`, `hi`)의 초기값을 잘못 잡으면 답이 범위 밖에 있어서 못 찾는다. 최솟값/최댓값의 극단적인 경우를 먼저 계산해서 범위를 넉넉히 잡는다.
- 최솟값을 찾는 문제인지 최댓값을 찾는 문제인지에 따라 `isPossible(mid)`가 참일 때 `lo`를 옮길지 `hi`를 옮길지가 반대가 된다 — 헷갈리면 작은 예시로 직접 손으로 따라가본다.
- `isPossible` 함수 안에서 오버플로우가 나기 쉽다 (특히 곱셈/누적). `long long`을 기본으로 쓴다.

## 참고자료

- 프로그래머스 "입국심사", "징검다리" 유형 (파라메트릭 서치)
