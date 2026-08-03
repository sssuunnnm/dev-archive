---
title: GROUP BY에 없는 컬럼을 SELECT하면 생기는 문제 (ONLY_FULL_GROUP_BY)
command: SELECT col1, MAX(col2) FROM t GROUP BY col1
description: GROUP BY 기준에 없는 컬럼을 그대로 SELECT하면 설정에 따라 에러 또는 예측 불가한 값이 나옴
technology: [mysql]
tags: [group-by]
---

```sql
-- ONLY_FULL_GROUP_BY 모드가 켜져 있으면 에러
SELECT genre, song, MAX(play_count)
FROM songs
GROUP BY genre;
```

`song`은 `GROUP BY` 기준(`genre`)에도 없고 집계 함수로 감싸지도 않았다. 표준 SQL 기준으로는 어떤 `song` 값을 반환해야 할지 정의가 안 되므로 에러 대상이다.

```sql
-- 올바른 방법: 필요한 값도 집계 함수로 감싸거나, GROUP BY 기준에 포함시킨다
SELECT genre, MAX(play_count) AS max_play_count
FROM songs
GROUP BY genre;
```

MySQL은 기본적으로 `ONLY_FULL_GROUP_BY` 모드가 켜져 있어 이런 쿼리가 에러로 걸리지만, 환경에 따라 꺼져 있으면 에러 없이 실행되고 대신 그룹 내 임의의 한 행 값이 반환된다 (어떤 행인지 보장 안 됨). 이 차이 때문에 로컬에서는 되던 쿼리가 다른 환경에서 에러 나는 경우가 많다.
