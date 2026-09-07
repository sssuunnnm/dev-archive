---
title: 전화번호 목록
description: 접두어 관계를 해시로 판별하는 문제, substr 인덱스 실수와 vector/unordered_set 순회 성능을 정리한다
date: 2026-07-31
updated:
category: coding-test
technology: [cpp]
tags: [hash, string, level-1]
type: troubleshooting
status: archive
series:
projects:
related:
  - hash-basics
  - string-split-cpp
aliases:
draft: false
---

## 한 줄 요약

각 번호의 모든 접두어가 다른 번호와 겹치는지, 해시(set)로 평균 O(1) 존재 확인하며 검사한다.

## 왜 (배경/문제 상황)

[전화번호 목록](https://school.programmers.co.kr/learn/courses/30/lessons/42577) — 전화번호 목록에서 어떤 번호도 다른 번호의 접두어가 되지 않는지 확인하는 문제. 해시로도, 정렬로도 풀 수 있는데 이번엔 해시로 풀었다.

## 원인 분석 → 해결 방법

**시도 1: `substr` 호출 대상 누락**

```cpp
if(phone.count(substr(0, i))) return false; // substr이 누구의 멤버함수인지 안 밝힘
```

`substr()`은 특정 string 객체의 멤버함수라 대상을 명시해야 한다. `num.substr(0, i)`로 고쳐야 컴파일된다.

**시도 2: 인덱스 계산이 한 칸씩 밀림**

`substr(0, len)`은 **길이 `len`짜리** 접두어를 자른다. 루프 변수 `i`가 0부터 시작하는데 `substr(0, i)`를 쓰면, `i=0`일 때 빈 문자열을 자르고 정작 필요한 마지막 길이(`num.size()-1`)는 루프 조건(`i < num.size()-1`)에 걸려 도달을 못 한다. `substr(0, i+1)`로 고쳐서 길이를 정확히 맞춰야 한다.

**최종 코드**

```cpp
bool solution(vector<string> phone_book) {
    unordered_set<string> phone(phone_book.begin(), phone_book.end());

    for (string& num : phone_book) {
        for (int i = 0; i < num.size() - 1; i++) {
            if (phone.count(num.substr(0, i + 1))) return false;
        }
    }
    return true;
}
```

## 예제

**왜 한쪽 방향만 확인해도 충분한가**: `A`가 `B`의 접두어인 상황이 있다면, `B`를 검사할 때 `B`의 접두어들 중에 `A`가 반드시 걸린다. 그래서 모든 번호에 대해 "내 접두어들이 set에 있는지"만 확인하면 양방향 관계가 자동으로 잡힌다.

## 주의사항

- 순회는 `unordered_set`이 아니라 원본 `phone_book`(vector)으로 한다 — set은 원소가 메모리에 흩어져 있어 순회가 상대적으로 느리고, vector는 연속 메모리라 빠르다. 존재확인용 set, 순회용 vector 조합이 유리하다.
- `unordered_set<string> phone(phone_book.begin(), phone_book.end())`는 깊은 복사다. `string`은 내부 버퍼를 자체 소유하는 타입이라, 복사되면 그 버퍼까지 통째로 복사된다.

## 참고자료

- [해시 개념과 문제 패턴](../hash-basics/) — 존재 여부 체크 패턴 원본