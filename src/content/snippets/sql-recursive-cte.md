---
title: 재귀 쿼리로 없는 데이터 채우기 (WITH RECURSIVE)
command: WITH RECURSIVE seq AS (SELECT 0 AS n UNION ALL SELECT n + 1 FROM seq WHERE n < 23) SELECT * FROM seq
description: 0~23시처럼 원본 테이블에 존재하지 않는 값까지 포함해서 조회할 때 사용
technology: [sql]
tags: [recursive, cte]
---

"없는 시간대(주문이 0건인 시간)도 포함해서 출력" 같은 문제가 이 패턴이다.

원본 테이블만 조회하면 데이터가 없는 시간대는 아예 결과에 안 나온다.
`WITH RECURSIVE`로 0~23 시퀀스 테이블을 직접 만든 뒤, 원본 테이블과 `LEFT JOIN`해야 빠진 값도 0으로 채워진다.

```sql
WITH RECURSIVE hours AS (
  SELECT 0 AS hour
  UNION ALL
  SELECT hour + 1 FROM hours WHERE hour < 23
)
SELECT
  h.hour,
  COUNT(o.id) AS order_count
FROM hours h
LEFT JOIN orders o ON HOUR(o.created_at) = h.hour
GROUP BY h.hour
ORDER BY h.hour;
```

MySQL 8.0부터 `WITH RECURSIVE`를 지원한다. 종료 조건(`WHERE hour < 23`)을 빼먹으면 무한 루프에 걸리니 주의.
