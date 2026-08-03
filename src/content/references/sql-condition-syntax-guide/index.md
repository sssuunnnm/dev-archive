---
title: SQL 문제 조건 → 문법 매칭 가이드
technology: [mysql]
tags: [cheatsheet, programmers]
updated: 2026-08-03
aliases:
---

프로그래머스 SQL 문제에서 조건문에 자주 나오는 표현을 보고, 어떤 문법을 써야 할지 빠르게 찾는 표. 각 항목의 자세한 예시는 해당 스니펫 참고.

## GROUP BY / HAVING / WHERE

| 신호 | 판단 | 관련 스니펫 |
|---|---|---|
| "~별로", "~당" (장르별, 부서당) | 그룹 단위 집계 필요 → `GROUP BY` | sql-having-vs-where |
| "그룹 조건으로 필터" (평균 이상인 부서 등, 집계값 기준) | 집계 후 필터 → `HAVING` | sql-having-vs-where |
| "개별 행 조건으로 필터" (2020년 이후 등) | 집계 전 필터 → `WHERE` | sql-having-vs-where |
| GROUP BY 결과에 다른 컬럼도 같이 뽑고 싶을 때 에러남 | `ONLY_FULL_GROUP_BY` 제약 — 집계 함수로 감싸거나 GROUP BY에 포함 | sql-group-by-strict-mode |

## 윈도우 함수 (순위 / 그룹별 상위 N개)

| 신호 | 판단 | 관련 스니펫 |
|---|---|---|
| "~별로 상위 N개만" | 그룹 내 순위 제한 → `ROW_NUMBER() OVER (PARTITION BY ...)` + 서브쿼리 | sql-group-top-n |
| "가장 많은/적은 ~" (그룹 내 1건) | 그룹 내 극값 → `MAX()`/`MIN()` 또는 `RANK() = 1` | sql-window-function |
| "순위", "몇 번째로 ~한" | 전체/그룹 순위 필요 → `RANK()`, `DENSE_RANK()`, `ROW_NUMBER()` (동점 처리 방식이 다름) | sql-window-function |

## NULL 처리

| 신호 | 판단 | 관련 스니펫 |
|---|---|---|
| "누락된 값은 0/기본값으로" | NULL 치환 → `IFNULL`, `COALESCE` | sql-null-handling |
| "NULL인 행 제외/포함" | `= NULL`은 항상 거짓 → `IS NULL` / `IS NOT NULL` 사용 | sql-null-handling |

## CASE / 피벗

| 신호 | 판단 | 관련 스니펫 |
|---|---|---|
| "요일별/카테고리별 열로 나눠서" | 행 → 열 변환 → `CASE WHEN` + `SUM`/`COUNT` | sql-case-pivot |

## 비트 연산

| 신호 | 판단 | 관련 스니펫 |
|---|---|---|
| "특정 비트/플래그 상태 확인" | 이진 상태값 필터 → 비트 연산자 (`&`, `\|`) — 단일 비트면 `= N`/`= 0`, 다중 비트 마스크면 `= N`(전부 켜짐) vs `> 0`(하나라도 켜짐) 구분 | sql-bit-operation |

## JOIN

| 신호 | 판단 | 관련 스니펫 |
|---|---|---|
| "상위/하위 부모-자식", "같은 테이블 내 비교" | 자기 자신 조인 → `Self Join` | sql-self-join |

## 서브쿼리

| 신호 | 판단 | 관련 스니펫 |
|---|---|---|
| "가장 비싼 상품과 같은 카테고리인 것" (조건에 서브쿼리 + LIMIT) | `IN`/`ALL`/`ANY`/`SOME` 서브쿼리엔 LIMIT 직접 못 씀 → derived table로 감싸기 (`=` 스칼라 서브쿼리는 이 제약과 무관) | sql-subquery-limit |
| "없는 데이터도 포함", "0건인 ~도 출력" | 원본에 없는 값 채우기 → `WITH RECURSIVE` + `LEFT JOIN` | sql-recursive-cte |

## 정렬

| 신호 | 판단 | 관련 스니펫 |
|---|---|---|
| "동점이면 ~순으로" | 다중 정렬 기준 → `ORDER BY col1, col2` (동점을 유일하게 결정하려면 고유 키를 마지막 기준으로 추가) | sql-multi-condition-order |

## 날짜/시간

| 신호 | 판단 | 관련 스니펫 |
|---|---|---|
| "날짜만/시간만 추출", "기간 계산" | 날짜 포맷/차이 → `DATE_FORMAT`, `TIMESTAMPDIFF` | sql-date-format |

## 문자열 함수

| 신호 | 판단 | 관련 스니펫 |
|---|---|---|
| "앞 N글자만", "전화번호 형식 변경" | 문자열 가공 → `SUBSTRING`, `CONCAT`, `REPLACE` (`CONCAT`은 인자 중 하나라도 NULL이면 결과 전체가 NULL) | sql-string-function |

## 판단 순서 (막힐 때)

1. 결과가 그룹 단위로 묶여야 하는가 → `GROUP BY` 필요 여부부터 확인
2. 그룹 안에서 순서/개수 제한이 있는가 → 윈도우 함수 검토
3. 원본에 없는 값(빈 시간대 등)도 나와야 하는가 → 재귀 쿼리/시퀀스 테이블 검토
4. 조건 안에 또 다른 SELECT가 필요한가 → 서브쿼리 제약(LIMIT 등) 먼저 체크