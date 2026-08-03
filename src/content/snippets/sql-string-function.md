---
title: 문자열 함수 모음 (SUBSTRING, CONCAT, REPLACE)
command: SUBSTRING(str, 1, 2)
description: 문자열 자르기, 합치기, 치환
technology: [mysql]
tags: [string]
---

```sql
-- 앞 2글자만 추출 (인덱스는 1부터 시작)
SELECT SUBSTRING(name, 1, 2) FROM users;

-- 문자열 합치기 (인자 중 하나라도 NULL이면 결과 전체가 NULL이 됨 — NULL 무시하고 합치려면 CONCAT_WS(' ', last_name, first_name) 사용)
SELECT CONCAT(last_name, ' ', first_name) AS full_name FROM users;

-- 하이픈 제거 (숫자만 남기는 게 아니라 '-' 문자만 제거됨. 공백/괄호/+ 등은 그대로 남음)
SELECT REPLACE(phone, '-', '') AS phone_without_hyphen FROM users;

-- 왼쪽부터 N글자 / 오른쪽부터 N글자
SELECT LEFT(code, 3), RIGHT(code, 3) FROM products;
```

MySQL의 `SUBSTRING` 인덱스는 1부터 시작한다 (0이 아님). 음수를 넣으면 뒤에서부터 센다 (`SUBSTRING(str, -3)` = 뒤 3글자). 숫자만 정말로 남기고 싶다면(공백/괄호/`+` 등도 제거) MySQL 8.0의 `REGEXP_REPLACE(phone, '[^0-9]', '')`를 쓴다.