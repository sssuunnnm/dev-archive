---
title: 문자열 함수 모음 (SUBSTRING, CONCAT, REPLACE)
command: SUBSTRING(str, 1, 2)
description: 문자열 자르기, 합치기, 치환
technology: [sql]
tags: [string]
---

```sql
-- 앞 2글자만 추출 (인덱스는 1부터 시작)
SELECT SUBSTRING(name, 1, 2) FROM users;

-- 문자열 합치기
SELECT CONCAT(last_name, ' ', first_name) AS full_name FROM users;

-- 특정 문자 치환
SELECT REPLACE(phone, '-', '') AS phone_only_digit FROM users;

-- 왼쪽부터 N글자 / 오른쪽부터 N글자
SELECT LEFT(code, 3), RIGHT(code, 3) FROM products;
```

MySQL의 `SUBSTRING` 인덱스는 1부터 시작한다 (0이 아님). 음수를 넣으면 뒤에서부터 센다 (`SUBSTRING(str, -3)` = 뒤 3글자).
