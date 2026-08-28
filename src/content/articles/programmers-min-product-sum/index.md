---
title: 최솟값 만들기
description: 한쪽은 오름차순, 한쪽은 내림차순으로 정렬해 짝지으면 곱의 합이 최소가 됨을 교환 논증으로 증명한다
date: 2026-08-07
updated:
category: coding-test
technology: [cpp]
tags: [greedy, sort, level-1]
type: troubleshooting
status: archive
series:
projects:
related:
  - greedy-basics
  - sort-basics
aliases:
draft: false
---

## 한 줄 요약

A는 오름차순, B는 내림차순으로 정렬해서 같은 인덱스끼리 곱하면 곱의 합이 항상 최소가 된다.

## 왜 (배경/문제 상황)

[최솟값 만들기](https://school.programmers.co.kr/learn/courses/30/lessons/12941) — 배열 A, B에서 각각 하나씩 뽑아 곱한 값들의 합이 최소가 되도록 짝짓는 문제.

## 원인 분석 → 해결 방법

첫 시도부터 정확했다.

```cpp
int solution(vector<int> A, vector<int> B) {
    int answer = 0;
    int n = A.size();

    sort(A.begin(), A.end());   // 오름차순
    sort(B.rbegin(), B.rend()); // 내림차순

    for (int i = 0; i < n; i++) {
        answer += A[i] * B[i];
    }
    return answer;
}
```

`sort(B.rbegin(), B.rend())`는 `rbegin()`/`rend()`(역방향 iterator)를 정방향 정렬 함수에 넣은 것이라, 결과적으로 B가 내림차순으로 정렬된다.

**왜 이 방식이 항상 최소인가 (교환 논증, exchange argument)**

A에서 `a1 ≤ a2`, B에서 `b1 ≤ b2` 두 쌍이 있을 때, 짝짓는 방법은 두 가지다.

- 나란히: `a1×b1 + a2×b2`
- 엇갈리게: `a1×b2 + a2×b1`

두 값의 차이를 계산하면:

```text
(a1×b1 + a2×b2) - (a1×b2 + a2×b1)
= a1(b1-b2) + a2(b2-b1)
= (a2-a1)(b2-b1)
```

`a1 ≤ a2`, `b1 ≤ b2`이므로 `(a2-a1) ≥ 0`, `(b2-b1) ≥ 0` → 전체 값은 항상 0 이상. 즉 "나란히" 짝지은 합이 "엇갈리게" 짝지은 합보다 항상 크거나 같다. 그러므로 합을 최소로 만들려면 반대인 **엇갈리게(작은-큰)** 짝을 지어야 하고, 이를 전체 배열로 확장하면 "한쪽 오름차순, 한쪽 내림차순 정렬 후 같은 인덱스 곱"이 항상 최적이 된다.

## 예제

이 "임의의 두 쌍을 바꿔치기했을 때 더 나빠지는지 확인"하는 방식이 그리디 문제의 전형적인 증명법(교환 논증)이다. 반례를 못 만든다(=바꿔도 더 안 좋아진다) = 그리디 전략이 맞다는 뜻이다.

## 주의사항

- `sort`(정렬) 자체는 이 문제를 푸는 도구일 뿐이고, 핵심은 "왜 이 순서가 항상 최적인가"를 증명하는 그리디 판단이다. 문제 분류상 `greedy`가 메인, `sort`는 구현 수단으로 본다.

## 참고자료

- [그리디 개념과 문제 패턴](../greedy-basics/) — 그리디 판단법, 반례 검증 습관
- [정렬 개념과 문제 패턴](../sort-basics/) — rbegin/rend로 내림차순 정렬하는 법