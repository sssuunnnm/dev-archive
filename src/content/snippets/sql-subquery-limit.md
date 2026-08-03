---
title: 서브쿼리 안에서 LIMIT 우회하기
command: WHERE id = (SELECT id FROM (SELECT id FROM t ORDER BY x LIMIT 1) AS tmp)
description: MySQL은 IN/=/ANY 서브쿼리 안에 LIMIT를 직접 못 씀 — derived table로 한 번 더 감싸서 우회
technology: [mysql]
tags: [subquery]
---

프로그래머스(MySQL) 환경에서 자주 걸리는 에러다. `IN`, `=`, `ANY` 서브쿼리 안에서는 `LIMIT`를 바로 못 쓴다.

```sql
-- 에러: This version of MySQL doesn't yet support 'LIMIT & IN/ALL/ANY/SOME subquery'
SELECT * FROM products
WHERE id = (SELECT id FROM products ORDER BY price DESC LIMIT 1);
```

```sql
-- 우회: 서브쿼리 결과를 한 번 더 derived table(파생 테이블)로 감싼다
SELECT * FROM products
WHERE id = (
  SELECT id FROM (
    SELECT id FROM products ORDER BY price DESC LIMIT 1
  ) AS tmp
);
```

FROM 절 안의 서브쿼리(derived table)는 반드시 별칭(`AS tmp`)이 있어야 한다. 별칭을 빼먹으면 별도의 에러가 난다.
