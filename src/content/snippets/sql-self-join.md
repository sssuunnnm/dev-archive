---
title: 같은 테이블끼리 조인하기 (Self Join)
command: SELECT a.*, b.* FROM t a JOIN t b ON a.parent_id = b.id
description: 계층 구조나 짝 관계처럼 같은 테이블 내부 행끼리 비교할 때 사용
technology: [sql]
tags: [join, self-join]
---

같은 테이블을 서로 다른 별칭(alias)으로 두 번 참조해서 조인한다.

```sql
-- 자기 자신을 참조하는 계층 구조 (상위 카테고리 이름 함께 조회)
SELECT
  child.name AS category,
  parent.name AS parent_category
FROM categories child
LEFT JOIN categories parent ON child.parent_id = parent.id;
```

```sql
-- 같은 테이블에서 조건이 다른 두 행을 짝짓기 (예: 같은 그룹 내 가격 비교)
SELECT a.name, b.name
FROM products a
JOIN products b ON a.category = b.category AND a.price > b.price;
```

별칭을 반드시 다르게 줘야 하며 (`a`, `b`), `LEFT JOIN`을 쓰면 짝이 없는 경우(최상위 카테고리 등)도 NULL로 포함된다.
