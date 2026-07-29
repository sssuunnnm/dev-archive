---
title: vector 순회 (range-based for)
command: "for (auto& x : v) { ... }"
description: 인덱스 없이 vector의 각 원소를 순회한다. 일반 for문(인덱스 기반)과 헷갈릴 때 참고.
technology: [cpp]
tags: [vector, loop]
---

일반적인 인덱스 기반 for문과 비교하면 이렇다.

```cpp
// 익숙한 방식 (인덱스 기반)
for (int i = 0; i < v.size(); i++) {
    v[i] += 1;
}

// range-based for (C++11+)
for (auto& x : v) {
    x += 1;
}
```

`x`는 `v`의 각 원소에 대한 **참조**다. `auto&` 대신 `auto`로 쓰면 값이 복사되어 원본을 수정할 수 없다.

| 선언 | 의미 |
|---|---|
| `for (auto x : v)` | 값 복사, 읽기 전용 순회 (원소가 크면 복사 비용 발생) |
| `for (auto& x : v)` | 참조, 원소 수정 가능 |
| `for (const auto& x : v)` | 참조지만 수정 불가 (읽기만 할 때 가장 안전하고 복사 비용도 없음) |

인덱스 자체가 필요하면(예: `v[i-1]`과 비교) range-based for로는 안 되고 기존 인덱스 기반 for문을 써야 한다.