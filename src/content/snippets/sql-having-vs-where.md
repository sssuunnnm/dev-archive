---
title: WHERE와 HAVING의 차이
command: SELECT col, COUNT(*) FROM t GROUP BY col HAVING COUNT(*) > 1
description: WHERE는 집계 전 행 필터, HAVING은 집계 후 그룹 필터
technology: [mysql]
tags: [having, group-by]
---

```sql
-- WHERE: GROUP BY 하기 전, 개별 행을 먼저 걸러낸다
SELECT genre, COUNT(*) AS cnt
FROM songs
WHERE released_year >= 2020
GROUP BY genre;

-- HAVING: GROUP BY로 묶인 이후, 집계 결과를 기준으로 걸러낸다
SELECT genre, COUNT(*) AS cnt
FROM songs
GROUP BY genre
HAVING COUNT(*) >= 5;
```

`COUNT(*)`, `SUM()` 같은 집계 함수는 `WHERE`에 쓸 수 없다 (아직 그룹이 만들어지기 전이라 집계값이 없음). 집계 결과로 필터링하려면 반드시 `HAVING`을 써야 한다.
