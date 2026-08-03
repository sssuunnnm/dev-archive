---
title: 그룹별 상위 N개 뽑기 (Top-N per Group)
command: SELECT * FROM (SELECT *, ROW_NUMBER() OVER (PARTITION BY g ORDER BY v DESC) AS rn FROM t) x WHERE rn <= N
description: 장르/카테고리별로 상위 N개만 추출할 때 사용
technology: [sql]
tags: [group-by, top-n]
---

"재생수가 가장 많은 장르의 곡 2개만 뽑기" 같은 유형이 이 패턴이다.

단순 `GROUP BY` + `LIMIT`는 그룹당 1건만 뽑을 때는 되지만, 그룹당 N건은 안 된다.
`ROW_NUMBER()`로 그룹 내부 순위를 매긴 뒤, 서브쿼리로 감싸서 `WHERE rn <= N`으로 필터링해야 한다.

```sql
SELECT genre, song, play_count
FROM (
  SELECT
    genre,
    song,
    play_count,
    ROW_NUMBER() OVER (PARTITION BY genre ORDER BY play_count DESC) AS rn
  FROM songs
) ranked
WHERE rn <= 2;
```

MySQL은 서브쿼리 안에 `LIMIT`를 직접 못 쓰기 때문에, 반드시 `ROW_NUMBER` + 바깥 `WHERE`로 우회한다.
