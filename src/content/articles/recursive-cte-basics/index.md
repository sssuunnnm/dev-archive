---
title: 재귀 쿼리(Recursive CTE)로 없는 데이터 채우기
description: WITH RECURSIVE의 초기값-재귀-종료조건 구조와 없는 데이터를 채우는 패턴을 정리한다
date: 2026-08-03
updated:
category: cs
technology: [mysql]
tags: [recursive, cte, level-3]
type: study
status: evergreen
series:
projects:
related:
aliases:
draft: false
---

## 한 줄 요약

`WITH RECURSIVE`는 초기값에서 시작해 종료조건에 도달할 때까지 자기 자신을 반복 참조하며 행을 늘려가는 쿼리다.

## 왜 (배경/문제 상황)

"없는 시간대도 포함해서 출력", "존재하지 않는 값까지 채워서 조회" 같은 문제는 원본 테이블만 조회해서는 풀리지 않는다. 데이터가 없는 값은 애초에 테이블에 없으니 결과에도 나오지 않기 때문이다. 이럴 때 원하는 범위(0~23시 등)를 직접 만들어내는 도구가 재귀 쿼리다.

## 본문

### 기본 구조

```sql
WITH RECURSIVE cte_name AS (
  -- 1. Anchor member: 시작값
  SELECT 초기값

  UNION ALL

  -- 2. Recursive member: 자기 자신(cte_name)을 참조해 다음 값을 생성
  SELECT 다음값 FROM cte_name WHERE 종료조건
)
SELECT * FROM cte_name;
```

- Anchor member: 재귀가 시작되는 첫 번째 행(들)을 만드는 부분.
- Recursive member: `cte_name` 자기 자신을 `FROM`에 참조해서 다음 값을 만드는 부분. 여기가 없으면 재귀가 아니라 그냥 일반 쿼리다.
- `UNION ALL`로 두 부분을 연결한다. 재귀 특성상 같은 값이 중복될 일이 없으므로 `UNION`(중복 제거)보다 `UNION ALL`이 일반적이다.
- 종료조건이 `WHERE`에 없으면 무한 루프에 걸릴 것 같지만, MySQL은 기본적으로 재귀 깊이 제한(`cte_max_recursion_depth`, 기본값 1000)이 있어 실제로는 재귀 깊이 초과 에러로 멈춘다. 그래도 의도한 결과가 안 나오는 건 마찬가지이므로 종료조건은 항상 명시한다.

### 없는 데이터 채우기 패턴

시퀀스를 직접 만든 뒤, 원본 테이블과 `LEFT JOIN`하면 원본에 없는 값도 빠짐없이 결과에 포함된다.

```sql
WITH RECURSIVE hours AS (
  SELECT 0 AS hour
  UNION ALL
  SELECT hour + 1 FROM hours WHERE hour < 23
)
SELECT
  h.hour,
  COUNT(o.id) AS order_count
FROM hours h
LEFT JOIN orders o ON HOUR(o.created_at) = h.hour
GROUP BY h.hour
ORDER BY h.hour;
```

`hours` CTE가 0~23까지 24개 행을 먼저 만들어두기 때문에, 주문이 0건인 시간도 `LEFT JOIN`을 통해 `order_count = 0`으로 결과에 남는다.

## 예제

```sql
-- 1부터 5까지 숫자 생성
WITH RECURSIVE numbers AS (
  SELECT 1 AS n
  UNION ALL
  SELECT n + 1 FROM numbers WHERE n < 5
)
SELECT * FROM numbers;
```

Anchor member(`SELECT 1`)가 첫 행을 만들고, Recursive member(`SELECT n + 1 ... WHERE n < 5`)가 4번 더 실행되며 2, 3, 4, 5를 차례로 만든다. `n = 5`에서 `WHERE n < 5` 조건을 만족하지 못해 재귀가 멈춘다.

## 주의사항

- Recursive member에서 `cte_name`을 참조하지 않으면 재귀가 아니라 그냥 두 결과를 합친 것뿐이다.
- 종료조건을 빼먹으면 재귀 깊이 초과 에러로 멈춘다. 항상 `WHERE`로 멈추는 조건을 명시한다.
- MySQL 8.0 이상에서만 `WITH RECURSIVE`를 지원한다.
- 재귀 깊이가 깊어질수록 성능이 나빠질 수 있으니, 채워야 할 범위가 뻔한 경우(0~23시 등)라면 재귀보다 고정 테이블을 만들어두는 방법도 고려할 수 있다.