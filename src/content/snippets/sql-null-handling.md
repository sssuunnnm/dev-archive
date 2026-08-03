---
title: NULL 값 처리 (IFNULL, COALESCE)
command: IFNULL(column, 0)
description: NULL을 기본값으로 치환하거나 조건에서 제외할 때 사용
technology: [mysql]
tags: [null]
---

```sql
-- NULL이면 0으로 치환
SELECT IFNULL(score, 0) AS score FROM users;

-- 여러 컬럼 중 처음으로 NULL이 아닌 값 반환 (MySQL 외 DB에서도 표준으로 동작)
SELECT COALESCE(nickname, name, 'Unknown') AS display_name FROM users;

-- NULL 행 자체를 제외
SELECT * FROM users WHERE phone IS NOT NULL;
```

`IFNULL`은 MySQL 전용 함수이고, `COALESCE`는 표준 SQL이라 다른 DB에서도 동일하게 동작한다. `= NULL`로는 절대 비교되지 않으니 항상 `IS NULL` / `IS NOT NULL`을 써야 한다.
