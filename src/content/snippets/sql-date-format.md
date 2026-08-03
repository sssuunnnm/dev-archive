---
title: 날짜/시간 포맷과 차이 계산
command: DATE_FORMAT(date_col, '%Y-%m-%d'), TIMESTAMPDIFF(HOUR, a, b)
description: 날짜 출력 형식 변경과 두 시각 사이의 차이 계산
technology: [mysql]
tags: [date-time]
---

```sql
-- 출력 형식 변경
SELECT DATE_FORMAT(created_at, '%Y-%m-%d') AS date_only FROM orders;

-- 두 시각의 차이 (단위 지정 가능: HOUR, MINUTE, DAY 등)
SELECT TIMESTAMPDIFF(HOUR, start_at, end_at) AS duration_hours FROM sessions;

-- 날짜(일)만의 차이
SELECT DATEDIFF(end_date, start_date) AS day_diff FROM rentals;

-- 특정 시/월/요일만 추출
SELECT HOUR(created_at), MONTH(created_at), DAYOFWEEK(created_at) FROM orders;
```

`DATEDIFF`는 날짜(일) 단위 차이만 계산하고, 시/분 단위까지 필요하면 `TIMESTAMPDIFF`를 써야 한다.

**주의 1**: 날짜를 `-` 연산자로 직접 빼면 안 된다. MySQL은 `DATE` 타입끼리 `-`를 하면 날짜를 `YYYYMMDD` 형태 숫자로 취급해서 빼버린다. 같은 달 안에서는 우연히 맞는 값이 나올 수 있지만, 월이나 연도가 걸치면 값이 완전히 틀어진다. 날짜 차이는 항상 `DATEDIFF`(또는 `TIMESTAMPDIFF`)로 계산한다.

**주의 2**: 시작일·종료일을 모두 포함하는 기간(대여 일수 등)을 구할 때는 `DATEDIFF(end_date, start_date) + 1`로 보정한다. `DATEDIFF`는 두 날짜의 차이만 계산해서, 예를 들어 4/1~4/5까지 대여했다면 실제 대여 일수는 5일이지만 `DATEDIFF`는 4를 반환한다.