---
title: 그룹별 상위 N개 뽑기 (Top-N per Group)
command: SELECT * FROM (SELECT *, ROW_NUMBER() OVER (PARTITION BY g ORDER BY v DESC) AS rn FROM t) x WHERE rn <= N
description: 장르/카테고리별로 상위 N개만 추출할 때 사용
technology: [mysql]
tags: [group-by, top-n]
---

"재생수가 가장 많은 장르의 곡 2개만 뽑기" 같은 유형이 이 패턴이다.

단순 `GROUP BY` + `LIMIT`로는 그룹별 상위 N개를 뽑을 수 없다 — `LIMIT`는 그룹별이 아니라 **전체 결과**에 적용되기 때문에, "몇 개 그룹의 첫 행씩"이 아니라 그냥 전체 결과를 N줄에서 자를 뿐이다.
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

이 예제에서 `ROW_NUMBER` + 바깥 `WHERE`로 우회한 이유는 그룹별 순위 자체가 `LIMIT`만으로는 표현 불가능하기 때문이다. 참고로 MySQL은 서브쿼리 자체에 `LIMIT`를 아예 못 쓰는 게 아니라, `FROM` 절의 파생 테이블(derived table) 등에서는 `LIMIT`를 쓸 수 있다. `LIMIT`가 막히는 대표적인 경우는 `IN`/`ALL`/`ANY`/`SOME` 연산자의 서브쿼리 안에 직접 쓸 때다 (관련 내용은 [서브쿼리 LIMIT 우회](../sql-subquery-limit/) 참고).