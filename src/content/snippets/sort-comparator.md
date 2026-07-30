---
title: sort 커스텀 comparator
command: sort(v.begin(), v.end(), cmp)
description: 기본 오름차순 말고 원하는 기준으로 정렬하는 법
technology: [cpp]
tags: [sort, lambda]
---

## 내림차순

```cpp
sort(v.begin(), v.end(), greater<int>());
```

## 람다로 커스텀 조건

```cpp
// 절댓값 기준 오름차순
sort(v.begin(), v.end(), [](int a, int b) {
    return abs(a) < abs(b);
});
```

## pair/vector 다중 조건 정렬

```cpp
// 1번째 값 오름차순, 같으면 2번째 값 내림차순
vector<pair<int,int>> v;
sort(v.begin(), v.end(), [](const pair<int,int>& a, const pair<int,int>& b) {
    if (a.first != b.first) return a.first < b.first;
    return a.second > b.second;
});
```

## 문자열 길이 기준 정렬 (길이 같으면 사전순)

```cpp
sort(v.begin(), v.end(), [](const string& a, const string& b) {
    if (a.length() != b.length()) return a.length() < b.length();
    return a < b;
});
```

## 주의사항

comparator는 반드시 "엄격한 약순서(strict weak ordering)"를 지켜야 한다. 즉 `cmp(a, a)`는 항상 `false`여야 하고, `<=` 같은 비엄격 비교를 넣으면 정렬 중 정의되지 않은 동작(런타임 에러 포함)이 날 수 있다.

`abs(a)`처럼 `int`에 `abs()`를 쓸 때, `a`가 `INT_MIN`이면 결과가 정의되지 않은 동작(UB)이 된다. 코테 입력 범위에서 실제로 마주칠 일은 드물지만, 절댓값 비교가 안전해야 하는 상황이면 `long long`으로 승격해서 계산한다.