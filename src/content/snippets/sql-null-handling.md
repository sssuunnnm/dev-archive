---
title: NULL 값 처리 (IFNULL, COALESCE)
command: IFNULL(column, 0)
description: NULL을 기본값으로 치환하거나 조건에서 제외할 때 사용
technology: [mysql]
tags: [null-handling]
---

```sql
-- NULL이면 0으로 치환
SELECT IFNULL(score, 0) AS score FROM users;

-- 여러 컬럼 중 처음으로 NULL이 아닌 값 반환 (MySQL 외 DB에서도 표준으로 동작)
SELECT COALESCE(nickname, name, 'Unknown') AS display_name FROM users;

-- NULL 행 자체를 제외
SELECT * FROM users WHERE phone IS NOT NULL;
```

`IFNULL`은 MySQL에서 쓸 수 있는 함수지만 MySQL만의 전용은 아니다 (SQLite의 `ifnull()` 등 일부 다른 DB에도 있음) — 다만 표준 SQL은 아니라서 DB마다 지원 여부가 갈린다. `COALESCE`는 표준 SQL 표현식이라 대부분의 DB에서 동일하게 지원되지만, NULL이 아닌 첫 값을 반환한다는 동작 자체는 같아도 타입 변환(형 변환) 규칙까지 DB마다 완전히 같다고 단정하면 안 된다. `= NULL`로는 절대 비교되지 않으니 항상 `IS NULL` / `IS NOT NULL`을 써야 한다.