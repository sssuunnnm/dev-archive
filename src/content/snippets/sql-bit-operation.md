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

`status & N`은 `status`와 `N`을 비트 단위로 AND한 결과다. `N`이 비트 하나짜리 값(1, 2, 4...)이면 `= N`(켜짐) 또는 `= 0`(꺼짐)으로 비교하면 된다. `N`이 여러 비트를 합친 마스크(예: `0b0110`)라면 의미가 갈린다: `status & N = N`은 "N에 포함된 비트가 전부 켜져 있는가"이고, `status & N > 0`은 "N에 포함된 비트 중 하나라도 켜져 있는가"다. 어떤 조건이 필요한지에 따라 골라 써야 한다.