---
title: 윈도우 함수(Window Function)와 PARTITION BY
description: PARTITION BY 동작 원리와 ROW_NUMBER/RANK/DENSE_RANK 차이, WHERE에서 못 쓰는 이유를 정리한다
date: 2026-08-03
updated:
category: cs
technology: [mysql]
tags: [window-function, level-2]
type: study
status: evergreen
series:
projects:
related:
aliases:
draft: false
---

## 한 줄 요약

`GROUP BY`는 행을 그룹 단위로 합쳐버리지만, 윈도우 함수는 원본 행을 그대로 유지한 채 그룹별 계산 결과를 열로 추가한다.

## 왜 (배경/문제 상황)

"그룹별 순위", "그룹별 상위 N개" 같은 유형은 `GROUP BY`만으로 풀리지 않는다. `GROUP BY`는 그룹당 한 행으로 결과를 합쳐버려서, 원본 행(각 곡, 각 사원 등)을 유지한 채 그룹 내 순위나 누적값을 매기려면 윈도우 함수가 필요하다.

## 본문

### OVER() 절 구조

```sql
함수() OVER (PARTITION BY 그룹기준 ORDER BY 정렬기준)
```

- `PARTITION BY`: 어떤 기준으로 그룹을 나눌지 지정. `GROUP BY`와 달리 행을 합치지 않고 그룹만 나눈다.
- `ORDER BY`: 파티션 내부에서 어떤 순서로 순위/누적을 계산할지 지정.
- `PARTITION BY`를 생략하면 테이블 전체를 하나의 파티션으로 취급한다.

### 순위 함수 세 가지

| 함수 | 동점 처리 | 다음 순위 |
|---|---|---|
| `ROW_NUMBER()` | 동점이어도 무조건 다름 | 항상 순차 증가 (1,2,3) |
| `RANK()` | 동점은 같은 순위 | 동점 개수만큼 건너뜀 (1,1,3) |
| `DENSE_RANK()` | 동점은 같은 순위 | 안 건너뜀 (1,1,2) |

### 집계 윈도우 함수

`SUM()`, `AVG()`, `COUNT()`도 `OVER()`와 함께 쓰면 누적 계산이 가능하다.

```sql
SELECT
  order_date,
  amount,
  SUM(amount) OVER (ORDER BY order_date) AS running_total
FROM orders;
```

## 예제

```sql
SELECT
  genre,
  song,
  play_count,
  RANK() OVER (PARTITION BY genre ORDER BY play_count DESC) AS rnk
FROM songs;
```

장르별로 파티션이 나뉘고, 각 파티션 안에서 재생수 기준 순위가 매겨진다. `GROUP BY`와 달리 곡 하나하나가 결과에 그대로 남는다.

## 주의사항

- `OVER()` 없이 `RANK()`, `ROW_NUMBER()`를 단독으로 쓰면 에러가 난다.
- **`WHERE` 절에서 윈도우 함수 결과를 바로 조건으로 못 쓴다.** SQL 실행 순서상 `WHERE`가 윈도우 함수 계산보다 먼저 처리되기 때문이다. 윈도우 함수로 매긴 순위를 조건으로 걸러야 하면, 서브쿼리로 한 번 감싼 뒤 바깥에서 `WHERE`로 필터링해야 한다.

```sql
-- 에러: WHERE에서 윈도우 함수 결과를 바로 못 씀
SELECT genre, song, RANK() OVER (PARTITION BY genre ORDER BY play_count DESC) AS rnk
FROM songs
WHERE rnk = 1;

-- 올바른 방법: 서브쿼리로 감싼 뒤 바깥에서 필터링
SELECT genre, song, rnk
FROM (
  SELECT genre, song, RANK() OVER (PARTITION BY genre ORDER BY play_count DESC) AS rnk
  FROM songs
) ranked
WHERE rnk = 1;
```s