---
title: 자동차 대여중 / 대여 가능 여부 구분하기
description: WITH로 조건을 미리 추려두고 CASE WHEN으로 전체 목록에 상태를 라벨링하는 흐름을 정리한다
date: 2026-08-05
updated:
category: cs
technology: [mysql]
tags: [case, cte, level-3]
type: troubleshooting
status: archive
series:
projects:
related:
aliases:
draft: false
---

## 한 줄 요약

`JOIN`으로 조건에 맞는 행만 남기면 조건에 안 맞는 행이 통째로 사라진다. "전체 목록 + 상태 라벨"이 필요하면 `JOIN` 대신 `CASE WHEN` + 서브쿼리 조합을 써야 한다.

## 왜 (배경/문제 상황)

[자동차 대여 기록에서 대여중 / 대여 가능 여부 구분하기](https://school.programmers.co.kr/learn/courses/30/lessons/157340) — 특정 날짜에 대여 중인 자동차는 `'대여중'`, 아닌 자동차는 `'대여 가능'`으로 표시해서 **모든 자동차**를 출력하는 문제. 반납일이 기준일과 같아도 `'대여중'`으로 처리해야 한다.

## 원인 분석 → 해결 방법

### 1차 시도와 문제점

```sql
WITH TEST AS (
    SELECT HISTORY_ID, CAR_ID
    FROM CAR_RENTAL_COMPANY_RENTAL_HISTORY
    WHERE START_DATE <= '2022-10-16' AND END_DATE >= '2022-10-16'
)

SELECT H.CAR_ID
FROM CAR_RENTAL_COMPANY_RENTAL_HISTORY H JOIN TEST T
ON H.HISTORY_ID = T.HISTORY_ID
```

**막혔던 부분**: `TEST`(대여중인 기록만 걸러낸 CTE)를 원본 테이블과 `JOIN`했더니, 대여중이 아닌 자동차가 결과에서 통째로 사라졌다.

**원인**: `JOIN`은 양쪽 조건이 일치하는 행만 남긴다. `TEST`에 있는 `HISTORY_ID`와 일치하는 행만 남으니, 애초에 `TEST`에 없는(대여중이 아닌) 자동차는 결과에 나올 수 없다. 이 문제는 "조건에 맞는 것만 걸러내기"가 아니라 "**전체를 보여주되 조건에 따라 값만 다르게 표시하기**"라서, 필터링 도구인 `JOIN`이 아니라 라벨링 도구인 `CASE WHEN`이 필요하다.

### CASE WHEN으로 전환

`CASE WHEN`은 행을 걸러내지 않고, 조건에 따라 다른 값을 컬럼에 채워 넣는다. `TEST`는 필터링용 조인 대상이 아니라, `IN` 서브쿼리로 "대여중인 CAR_ID 목록"을 확인하는 용도로 바꿔 쓴다.

```sql
WITH TEST AS (
    SELECT DISTINCT CAR_ID
    FROM CAR_RENTAL_COMPANY_RENTAL_HISTORY
    WHERE START_DATE <= '2022-10-16' AND END_DATE >= '2022-10-16'
)

SELECT
    DISTINCT H.CAR_ID,
    CASE WHEN H.CAR_ID IN (SELECT CAR_ID FROM TEST) THEN '대여중' ELSE '대여 가능' END AS AVAILABILITY
FROM CAR_RENTAL_COMPANY_RENTAL_HISTORY H
ORDER BY H.CAR_ID DESC;
```

### WITH가 여기서 하는 역할

`WITH`(CTE)는 이 쿼리에서 "그날 대여중인 CAR_ID 목록"이라는 서브쿼리에 이름을 붙여 미리 선언해둔 것뿐이다. `CASE WHEN` 안의 `IN (SELECT CAR_ID FROM TEST)`처럼 여러 번 재사용하거나, 본 쿼리에서 조건을 한눈에 읽히게 하고 싶을 때 유용하다. `TEST` 없이 `CASE WHEN` 안에 서브쿼리를 직접 써도 결과는 같지만, 조건이 복잡해질수록 `WITH`로 분리하는 편이 읽기 쉽다.

### DISTINCT가 필요한 이유

`CAR_RENTAL_COMPANY_RENTAL_HISTORY`는 자동차 한 대가 여러 번 대여된 기록을 모두 담고 있어서, `CAR_ID` 기준으로 중복 행이 많다. `DISTINCT` 없이 그대로 출력하면 같은 자동차가 여러 번 나온다.

## 예제

```sql
WITH TEST AS (
    SELECT DISTINCT CAR_ID
    FROM CAR_RENTAL_COMPANY_RENTAL_HISTORY
    WHERE START_DATE <= '2022-10-16' AND END_DATE >= '2022-10-16'
)

SELECT
    DISTINCT H.CAR_ID,
    CASE WHEN H.CAR_ID IN (SELECT CAR_ID FROM TEST) THEN '대여중' ELSE '대여 가능' END AS AVAILABILITY
FROM CAR_RENTAL_COMPANY_RENTAL_HISTORY H
ORDER BY H.CAR_ID DESC;
```

## 주의사항

- "조건에 맞는 것만 걸러내기"는 `JOIN`/`WHERE`, "전체를 보여주되 값만 다르게 표시하기"는 `CASE WHEN` — 목적에 따라 도구가 다르다.
- `JOIN`으로 조건부 라벨링을 시도하면 조건에 안 맞는 행이 사라진다는 점을 항상 의심한다.
- 원본 테이블에 그룹당 여러 행이 있는 상태에서 그룹 단위로 한 줄씩만 출력해야 하면 `DISTINCT`(또는 `GROUP BY`) 여부를 먼저 확인한다.