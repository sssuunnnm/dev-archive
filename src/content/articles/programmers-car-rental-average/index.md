---
title: 자동차 평균 대여 기간 구하기
description: 날짜 뺄셈과 AVG/SUM 중첩 실수를 통해 DATEDIFF 보정과 HAVING의 역할을 정리한다
date: 2026-08-03
updated:
category: cs
technology: [mysql]
tags: [group-by, level-2]
type: troubleshooting
status: archive
series:
projects:
related:
aliases:
draft: false
---

## 한 줄 요약

자동차별 평균 대여 일수를 구하는 문제에서, 날짜 뺄셈 방식과 집계 함수 중첩 오류를 정정하며 `DATEDIFF` + 보정, `HAVING`의 역할을 정리한다.

## 왜 (배경/문제 상황)

[자동차 평균 대여 기간 구하기](https://school.programmers.co.kr/learn/courses/30/lessons/157342) — `CAR_RENTAL_COMPANY_RENTAL_HISTORY` 테이블에서 자동차별 평균 대여 기간을 구하고, 7일 이상인 자동차만 출력하는 문제. 언뜻 `AVG` 한 번이면 끝날 것 같지만, 실제로는 날짜 계산과 집계 함수 사용법에서 여러 개념이 동시에 걸린다.

## 원인 분석 → 해결 방법

### 1. 날짜를 `-`로 빼면 안 된다

**막혔던 부분**: `END_DATE - START_DATE`로 날짜 차이를 구하려고 했다.

**해결**: MySQL은 `DATE` 타입끼리 `-` 연산을 하면 날짜를 `YYYYMMDD` 형태 숫자로 취급해서 빼버린다. 같은 달 안에서는 우연히 맞는 값이 나올 수 있지만, 월이나 연도가 걸치는 순간 완전히 틀린 값이 나온다. 두 날짜의 실제 일수 차이가 필요하면 `DATEDIFF(END_DATE, START_DATE)`를 써야 한다.

### 2. 대여 일수는 +1 보정이 필요하다

**막혔던 부분**: `DATEDIFF`로 나온 값을 그대로 "대여 일수"로 썼다.

**해결**: `DATEDIFF`는 두 날짜의 차이만 계산하기 때문에, 시작일과 종료일을 둘 다 포함하는 실제 대여 일수보다 하루 적게 나온다. 예를 들어 4월 1일부터 4월 5일까지 빌렸다면 실제로는 5일(1, 2, 3, 4, 5일)을 빌린 것이지만 `DATEDIFF`는 4를 반환한다. 시작일도 대여 일수에 포함시키려면 `DATEDIFF(END_DATE, START_DATE) + 1`로 보정해야 한다.

### 3. 집계 함수는 중첩해서 쓸 수 없다

**막혔던 부분**: `AVG(SUM(...))` 형태로 평균과 합계를 같이 쓰려고 했다.

**해결**: SQL에서 같은 `SELECT` 레벨에서는 집계 함수를 중첩해서 쓸 수 없다 (`AVG(SUM(...))`처럼 한 SELECT 안에서 바로 겹쳐 쓰는 건 불가). "그룹별 평균"이 필요하면 그룹 안의 개별 값을 그대로 `AVG()`에 넣으면 되고, `GROUP BY`가 이미 그룹별로 나눠서 계산해주기 때문에 `SUM`으로 따로 합계를 낼 필요가 없다. (참고로 집계 단계를 서브쿼리나 CTE로 분리하면 "집계의 집계"도 가능하다 — 예를 들어 먼저 그룹별 `SUM`을 서브쿼리로 구한 다음, 바깥 쿼리에서 그 결과에 `AVG`를 적용하는 건 된다. 안 되는 건 어디까지나 같은 SELECT 레벨에서의 직접 중첩이다.)

```sql
-- 틀린 방식: 집계 함수 중첩, GROUP BY 없음
SELECT CAR_ID, AVG(SUM(DATEDIFF(END_DATE, START_DATE)))
FROM CAR_RENTAL_COMPANY_RENTAL_HISTORY;

-- 올바른 방식
SELECT
  CAR_ID,
  ROUND(AVG(DATEDIFF(END_DATE, START_DATE) + 1), 1) AS AVERAGE_DURATION
FROM CAR_RENTAL_COMPANY_RENTAL_HISTORY
GROUP BY CAR_ID;
```

### 4. 집계 결과를 필터링할 땐 HAVING

**막혔던 부분**: 평균 대여 기간이 7일 이상인 자동차만 남기는 조건을 어디에 넣을지 헷갈렸다.

**해결**: `WHERE`는 `GROUP BY`로 묶이기 전 개별 행을 걸러내고, `HAVING`은 집계된 이후의 그룹 결과를 걸러낸다. "평균이 7일 이상"이라는 조건은 `AVG` 집계값을 대상으로 하므로 반드시 `HAVING`을 써야 한다.

## 예제

```sql
SELECT
  CAR_ID,
  ROUND(AVG(DATEDIFF(END_DATE, START_DATE) + 1), 1) AS AVERAGE_DURATION
FROM CAR_RENTAL_COMPANY_RENTAL_HISTORY
GROUP BY CAR_ID
HAVING AVERAGE_DURATION >= 7
ORDER BY AVERAGE_DURATION DESC, CAR_ID DESC;
```

## 주의사항

- 날짜 차이가 필요하면 `-` 연산이 아니라 `DATEDIFF`를 쓴다.
- 시작일과 종료일을 모두 포함하는 기간 계산에는 `DATEDIFF(...) + 1` 보정이 필요한지 항상 확인한다.
- 같은 `SELECT` 레벨에서는 집계 함수를 중첩해서 쓸 수 없다. 그룹별 평균은 `AVG()` 하나로 충분하며, `GROUP BY`가 그룹 분리를 담당한다. (서브쿼리/CTE로 집계 단계를 분리하면 "집계의 집계"는 가능하다.)
- 집계값 기준 필터링은 `WHERE`가 아니라 `HAVING`이다.