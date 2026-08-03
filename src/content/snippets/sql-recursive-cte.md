---
title: 재귀 쿼리로 없는 데이터 채우기 (WITH RECURSIVE)
command: WITH RECURSIVE seq AS (SELECT 0 AS n UNION ALL SELECT n + 1 FROM seq WHERE n < 23) SELECT * FROM seq
description: 0~23시처럼 원본 테이블에 존재하지 않는 값까지 포함해서 조회할 때 사용
technology: [mysql]
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

MySQL 8.0부터 `WITH RECURSIVE`를 지원한다. 종료 조건(`WHERE hour < 23`)을 빼먹으면 브라우저/앱이 멈추는 무한 루프가 아니라, MySQL의 `cte_max_recursion_depth` 설정(기본값 1000)에 걸려서 **재귀 깊이 초과 에러**로 중단된다. 그래도 의도한 결과가 안 나오는 건 마찬가지니 종료 조건은 항상 명시적으로 넣는다.