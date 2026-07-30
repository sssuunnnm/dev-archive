---
title: 해시 개념과 문제 패턴
description: 해시가 뭔지, 어떤 문제에서 해시를 써야 하는지, 자주 나오는 패턴 세 가지를 정리한다
date: 2026-07-31
updated:
category: cs
technology: [cpp]
tags: [hash, map, pattern-recognition]
type: study
status: evergreen
series:
projects:
related:
  - map-unordered-map-basics
aliases:
draft: true
---

## 한 줄 요약

"뭔가를 세거나, 있는지 없는지 빠르게 확인해야 하면" 해시부터 떠올린다.

## 왜 (배경/문제 상황)

해시 문제는 알고리즘 자체는 어렵지 않은데, "이 문제가 해시 문제구나"를 알아채는 게 관건이다. 완전탐색으로 풀어도 답은 맞지만 시간초과가 나는 경우가 많아서, 신호를 빨리 캐치하는 연습이 중요하다.

## 본문

### 해시가 필요한 이유

배열에서 특정 값이 있는지 확인하려면 순차 탐색은 O(n)이 걸린다. 확인을 n번 반복하면 전체는 O(n²). 해시(map/unordered_map)를 쓰면 확인 자체가 평균 O(1)이라 전체가 O(n)으로 줄어든다.

즉 "존재 확인"이나 "개수 세기"를 반복해야 하는 문제에서, 배열 대신 해시를 쓰면 시간복잡도가 한 단계 내려간다.

### 문제 신호 → 패턴 매칭

| 문제에서 이런 게 보이면 | 패턴 |
|---|---|
| "각 원소가 몇 번 나오는지", "가장 많이 등장한 것" | 빈도수 세기 |
| "두 배열을 비교해서 빠진 것/다른 것 찾기" | 차집합 비교 |
| "이미 나온 적 있는지", "중복 확인" | 존재 여부 체크 |

### 패턴 1. 빈도수 세기

가장 흔한 패턴. 배열을 한 번 돌면서 각 값의 등장 횟수를 센다.

```cpp
unordered_map<string, int> cnt;
for (string& s : arr) {
    cnt[s]++;
}

// 가장 많이 등장한 것 찾기
string maxKey;
int maxCnt = 0;
for (auto& [key, value] : cnt) {
    if (value > maxCnt) {
        maxCnt = value;
        maxKey = key;
    }
}
```

### 패턴 2. 두 배열 비교 (차집합)

예: "참가자 명단 - 완주자 명단 = 완주 못한 사람" 같은 유형.

```cpp
string findMissing(vector<string>& participant, vector<string>& completion) {
    unordered_map<string, int> cnt;
    for (string& p : participant) cnt[p]++;
    for (string& c : completion) cnt[c]--;

    for (auto& [key, value] : cnt) {
        if (value > 0) return key; // 완주 안 한 사람
    }
    return "";
}
```

참가자는 `+1`, 완주자는 `-1`로 처리하면, 남은 값이 양수인 key가 곧 답이다. 이름이 같은 사람이 여러 명 있어도(동명이인) 이 방식이면 문제없이 처리된다.

### 패턴 3. 존재 여부만 빠르게 체크

예: "이전에 나온 문자열 조합인지 확인" 같은 유형.

```cpp
unordered_set<string> seen;
for (string& s : list) {
    if (seen.count(s)) {
        // 이미 나온 적 있음
    }
    seen.insert(s);
}
```

값 자체는 필요 없고 "봤는지 안 봤는지"만 필요하면 `unordered_map`보다 `unordered_set`이 더 적합하다.

## 예제

"위장" 유형(프로그래머스): 각 사람이 입은 의상 종류별 개수를 해시로 센 다음, "각 종류에서 하나를 선택하거나 안 입거나"의 경우의 수를 종류별로 `(개수+1)`씩 곱해서 구한다. 여기서도 핵심은 "종류별 개수 세기"이므로 패턴 1과 동일하다.

```cpp
unordered_map<string, int> cnt;
for (auto& c : clothes) {
    cnt[c[1]]++; // c[1] = 옷의 종류
}

long long answer = 1;
for (auto& [type, count] : cnt) {
    answer *= (count + 1);
}
answer -= 1; // 아무것도 안 입는 경우 제외
```

## 주의사항

- `cnt[key]`로 존재 여부를 확인하면, 없던 key가 값 0으로 새로 생성돼버린다. 존재만 확인하려면 `count()`나 `find()`를 쓴다 (스니펫 [map/unordered_map 기본 사용법] 참고).
- key가 문자열일 때 `unordered_map`이 `map`보다 항상 빠른 건 아니다. 다만 코테 범위에서는 체감 차이가 거의 없어서 기본값으로 `unordered_map`을 써도 된다.
- 빈도수를 `-1`로 빼는 패턴(패턴 2)에서 값이 음수가 될 수도 있다는 걸 잊고 조건문에서 `!= 0`이 아니라 `> 0`으로만 체크하면 의도한 답이 안 나올 수 있다 — 문제 조건에 따라 정확히 뭘 찾는지 확인한다.

## 참고자료

- [map/unordered_map 기본 사용법](../../snippets/map-unordered-map-basics/) — API 사용법 스니펫
