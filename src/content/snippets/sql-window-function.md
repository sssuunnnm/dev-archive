---
title: 윈도우 함수로 그룹별 순위 매기기
command: RANK() OVER (PARTITION BY col ORDER BY val DESC)
description: GROUP BY 없이 원본 행을 유지한 채 그룹별 순위/누적값 계산
technology: [sql]
tags: [window-function]
---

`ROW_NUMBER`, `RANK`, `DENSE_RANK`는 동점 처리 방식이 다르다.

- `ROW_NUMBER()`: 동점이어도 무조건 1, 2, 3 순차 부여
- `RANK()`: 동점은 같은 순위, 다음 순위는 건너뜀 (1, 1, 3)
- `DENSE_RANK()`: 동점은 같은 순위, 다음 순위는 안 건너뜀 (1, 1, 2)

```sql
SELECT
  genre,
  song,
  play_count,
  RANK() OVER (PARTITION BY genre ORDER BY play_count DESC) AS rnk
FROM songs;
```

PARTITION BY 기준으로 그룹이 나뉘고, 그룹 안에서만 순위가 다시 매겨진다.
