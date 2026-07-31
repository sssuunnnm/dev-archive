---
title: 의상
description: 종류별 빈도수를 세고 (개수+1)을 곱해 조합 수를 구하는 문제를 정리한다
date: 2026-07-31
updated:
category: cs
technology: [cpp]
tags: [hash, level-2]
type: troubleshooting
status: archive
series:
projects:
related:
  - hash-basics
aliases:
draft: false
---

## 한 줄 요약

각 종류에서 "옷 하나를 고르거나 안 고르거나"는 (개수+1)가지, 종류별로 곱한 뒤 아무것도 안 입는 경우 1가지를 뺀다.

## 왜 (배경/문제 상황)

[의상](https://school.programmers.co.kr/learn/courses/30/lessons/42578) — 종류별로 최대 1개씩만 착용 가능할 때, 서로 다른 옷 조합으로 만들 수 있는 경우의 수를 구하는 문제.

## 원인 분석 → 해결 방법

첫 시도부터 로직이 정확했다.

```cpp
int solution(vector<vector<string>> clothes) {
    unordered_map<string, int> cnt;
    for (auto& c : clothes) {
        cnt[c[1]]++;
    }

    int answer = 1;
    for (auto& [type, num] : cnt) {
        answer *= (num + 1);
    }
    return answer - 1;
}
```

원래 코드는 `return --answer;`(전위 감소)를 썼는데, 결과값은 `answer - 1`과 동일하지만 `--answer`는 "answer 자체를 감소시킨다"는 부수효과가 있는 표현이라 읽는 사람이 한 번 더 생각하게 만든다. `return answer - 1;`이 의도를 더 명확히 드러낸다.

## 예제

옷이 3개인 종류가 있으면: "안 입음" 1가지 + "3개 중 하나 착용" 3가지 = 4가지(`= 3 + 1`). 종류가 여러 개면 각 종류의 경우의 수를 서로 곱한다 (종류별 선택은 독립적이므로). 마지막에 모든 종류에서 "안 입음"만 선택한 경우(아무것도 안 입음) 1가지를 빼준다.

## 주의사항

- `cnt[c[1]]`처럼 `unordered_map`의 `[]`로 카운팅하는 패턴은 [완주하지 못한 선수]와 동일한 빈도수 세기 패턴이다.
- `--answer`처럼 부수효과가 있는 표현은 동작은 맞아도 가독성을 해칠 수 있어, `answer - 1`처럼 명시적인 표현을 우선한다.

## 참고자료

- [해시 개념과 문제 패턴](../hash-basics/) — 빈도수 세기 패턴 원본