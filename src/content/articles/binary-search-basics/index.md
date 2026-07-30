---
title: 이분탐색 개념과 문제 패턴
description: 값을 찾는 이분탐색 말고, "정답 자체를 이분탐색"하는 파라메트릭 서치 패턴을 정리한다
date: 2026-07-31
updated:
category: cs
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

## 주의사항

- `lo + (hi - lo) / 2`로 mid를 계산하는 걸 습관화한다. `(lo + hi) / 2`는 값이 크면 오버플로우가 날 수 있다.
- 이분탐색 범위(`lo`, `hi`)의 초기값을 잘못 잡으면 답이 범위 밖에 있어서 못 찾는다. 최솟값/최댓값의 극단적인 경우를 먼저 계산해서 범위를 넉넉히 잡는다.
- 최솟값을 찾는 문제인지 최댓값을 찾는 문제인지에 따라 `isPossible(mid)`가 참일 때 `lo`를 옮길지 `hi`를 옮길지가 반대가 된다 — 헷갈리면 작은 예시로 직접 손으로 따라가본다.
- `isPossible` 함수 안에서 오버플로우가 나기 쉽다 (특히 곱셈/누적). `long long`을 기본으로 쓴다.

## 참고자료

- 프로그래머스 "입국심사", "징검다리" 유형 (파라메트릭 서치)
