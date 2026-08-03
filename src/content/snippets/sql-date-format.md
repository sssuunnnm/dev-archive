---
title: 날짜/시간 포맷과 차이 계산
command: DATE_FORMAT(date_col, '%Y-%m-%d'), TIMESTAMPDIFF(HOUR, a, b)
description: 날짜 출력 형식 변경과 두 시각 사이의 차이 계산
technology: [sql]
tags: [date-time]
---

```sql
-- 출력 형식 변경
SELECT DATE_FORMAT(created_at, '%Y-%m-%d') AS date_only FROM orders;

-- 두 시각의 차이 (단위 지정 가능: HOUR, MINUTE, DAY 등)
SELECT TIMESTAMPDIFF(HOUR, start_at, end_at) AS duration_hours FROM sessions;

-- 특정 시/월/요일만 추출
SELECT HOUR(created_at), MONTH(created_at), DAYOFWEEK(created_at) FROM orders;
```

`DATEDIFF`는 날짜(일) 단위 차이만 계산하고, 시/분 단위까지 필요하면 `TIMESTAMPDIFF`를 써야 한다.
