---
title: 폰켓몬
description: unordered_set으로 중복 없는 종류 수를 세고, 상한선 비교로 답을 구하는 문제를 정리한다
date: 2026-07-31
updated:
category: cs
technology: [cpp]
tags: [hash, level-1]
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

N마리 중 N/2마리를 가져갈 때, 고를 수 있는 최대 종류 수는 "가져갈 수 있는 마리 수"와 "전체 종류 수" 중 작은 값이다.

## 왜 (배경/문제 상황)

[폰켓몬](https://school.programmers.co.kr/learn/courses/30/lessons/1845) — N마리의 포켓몬 중 N/2마리를 가져갈 때, 가질 수 있는 포켓몬의 최대 종류 수를 구하는 문제.

## 원인 분석 → 해결 방법

**막혔던 부분**: `nums.count(i)`로 vector에서 존재 확인을 하려다 컴파일 에러. `count()`는 `set`/`map` 계열에만 있는 함수라 `vector<int>`에는 없다.

**해결**: 애초에 존재 확인 자체가 불필요했다. `unordered_set::insert()`는 이미 있는 값을 넣으려 하면 그냥 무시하기 때문에, 중복 체크 없이 그냥 다 넣기만 하면 된다.

```cpp
int solution(vector<int> nums) {
    unordered_set<int> poc(nums.begin(), nums.end()); // 중복 자동 제거

    return min(nums.size() / 2, poc.size());
}
```

## 예제

**왜 `min(종류 수, N/2)`가 답인지**: 두 상한선 중 더 낮은 쪽이 실제 한계가 된다.

- 종류 수 ≤ N/2: 각 종류에서 한 마리씩만 골라도 종류 수만큼 채워지고, 마리 수 조건(N/2 이하)도 만족 → 종류 수 전부 달성 가능.
- 종류 수 > N/2: 어차피 N/2마리만 고를 수 있으니, 서로 다른 종류로만 N/2마리를 채우면 됨 → N/2종류 달성 가능.

두 경우 다 상한선만큼 정확히 달성 가능하므로 `min(종류 수, N/2)`가 항상 답이다. "최댓값을 구하라"는 문제에서 상한을 잡고 그 상한이 실제로 달성 가능한지 확인하는 사고방식은 그리디/최적화 문제에서 자주 쓰인다.

## 주의사항

- `unordered_set(nums.begin(), nums.end())`는 각 원소를 복사해서 넣는다. `int`는 값 자체가 복사되므로 원본 `nums`를 나중에 바꿔도 `poc`엔 영향 없다.
- `size()`는 `size_t`(부호 없는 정수)라서 `int`로 반환할 때 암묵적 축소 변환이 일어난다. 코테 범위(`size_t` 값이 `int` 최댓값을 넘지 않는 경우)에서는 문제되지 않지만, `static_cast<int>`를 붙이면 이 변환이 의도된 것임을 명시해 컴파일러 경고를 줄일 수 있다 (다만 이것도 범위 자체를 검사해주진 않는다 — 값이 `int` 범위를 넘는 경우엔 별도로 검사해야 한다).

## 참고자료

- [해시 개념과 문제 패턴](../hash-basics/) — 존재 여부 체크 패턴 원본