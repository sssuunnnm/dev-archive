---
title: 비트 연산으로 플래그 조건 다루기
command: column & 1 = 1
description: 이진 상태값(플래그)을 비트 연산자로 필터링
technology: [mysql]
tags: [bit-operation]
---

여러 상태를 하나의 정수 컬럼에 비트로 저장해둔 경우, `AND(&)` / `OR(|)` / `XOR(^)` / `Shift(<<, >>)` 연산으로 특정 비트만 확인한다.

```sql
-- 1번째 비트(값 1)가 켜져 있는 행만 조회
SELECT * FROM devices WHERE status & 1 = 1;

-- 2번째 비트(값 2)가 꺼져 있는 행만 조회
SELECT * FROM devices WHERE status & 2 = 0;
```

`status & N`은 해당 비트가 켜져 있으면 N, 꺼져 있으면 0을 반환한다. 그래서 `= N`으로 비교해야 정확하다 (`> 0`으로 비교하면 다른 비트와 섞여 오탐 가능).
