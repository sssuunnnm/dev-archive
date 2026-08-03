---
title: CASE WHEN으로 행을 열로 피벗하기
command: SUM(CASE WHEN col = 'A' THEN 1 ELSE 0 END) AS a_count
description: GROUP BY 결과를 카테고리별 열로 펼쳐서 출력할 때 사용
technology: [mysql]
tags: [case, pivot]
---

요일별/카테고리별 개수를 각각의 열로 뽑아야 할 때, `CASE WHEN` + `SUM`/`COUNT` 조합으로 피벗한다.

```sql
SELECT
  product,
  SUM(CASE WHEN DAYOFWEEK(order_date) = 1 THEN 1 ELSE 0 END) AS sun,
  SUM(CASE WHEN DAYOFWEEK(order_date) = 7 THEN 1 ELSE 0 END) AS sat
FROM orders
GROUP BY product;
```

`CASE WHEN`이 조건에 맞으면 1, 아니면 0을 반환하고 `SUM`으로 합산하는 방식이 핵심이다. `COUNT(CASE WHEN ... THEN 1 END)`처럼 `ELSE` 없이 `COUNT`를 쓰는 방식도 동일하게 동작한다 (NULL은 카운트 안 되므로).
