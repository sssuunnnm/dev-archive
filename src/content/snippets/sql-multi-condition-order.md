---
title: 다중 조건 정렬 (동점 처리)
command: ORDER BY col1 DESC, col2 ASC
description: 1차 정렬 기준이 같을 때 2차 기준으로 순서를 확정
technology: [sql]
tags: [order-by]
---

```sql
-- 재생수 내림차순, 동점이면 곡 이름 오름차순
SELECT song, play_count
FROM songs
ORDER BY play_count DESC, song ASC;
```

`ORDER BY`에 컬럼을 콤마로 나열하면 앞 조건이 같을 때만 다음 조건이 적용된다. 정렬 기준을 하나만 쓰면 동점 그룹 내부 순서가 DB 구현에 따라 매번 달라질 수 있어, 문제에서 결과 순서를 명확히 요구하면 항상 2차 기준을 같이 지정한다.

`NULL`은 `ASC` 기준 가장 먼저, `DESC` 기준 가장 나중에 온다 (MySQL 기준).
