---
title: REST API 설계 원칙 정리
description: REST API를 설계할 때 지켜야 할 원칙과 자주 하는 실수를 정리한다.
date: 2026-07-27
category: development
technology: []
tags:
  - rest-api
  - api-design
type: study
status: evergreen
draft: false
---

## 한 줄 요약

REST API 설계는 "자원(Resource)을 URI로 표현하고, HTTP 메서드로 행위를 표현하는 것"이 핵심 원칙이다.

## 왜 공부했는가

API를 만들 때마다 URI 이름을 어떻게 지을지, 상태 코드를 뭘 써야 할지 매번 다시 찾아보는 경우가 많았다. 팀원마다 스타일이 다르면 협업할 때도 혼란스럽다. 한 번 정리해두고 이후 API를 설계할 때 기준으로 삼기 위해 정리한다.

## 본문

### 1. URI는 자원(명사)을 나타낸다 (권장 관례)

REST 명세가 절대적으로 강제하는 규칙은 아니지만, 널리 쓰이는 관례상 URI에는 동사를 쓰지 않고 행위는 HTTP 메서드로 표현하는 것이 일반적으로 권장된다.

```text
❌ GET /getUsers
❌ POST /createUser
✅ GET /users
✅ POST /users
```

### 2. HTTP 메서드로 행위를 표현한다

| 메서드 | 의미 | 예시 |
| --- | --- | --- |
| GET | 조회 | `GET /users/1` |
| POST | 생성 | `POST /users` |
| PUT | 전체 수정(덮어쓰기) | `PUT /users/1` |
| PATCH | 부분 수정 | `PATCH /users/1` |
| DELETE | 삭제 | `DELETE /users/1` |

`PUT`과 `PATCH`는 자주 헷갈린다. `PUT`은 리소스 전체를 새 값으로 교체하고, `PATCH`는 일부 필드만 변경한다.

### 3. 계층 관계는 URI 경로로 표현한다 (권장 관례)

```bash
GET /users/1/orders          # 특정 유저의 주문 목록
GET /users/1/orders/10       # 특정 유저의 특정 주문
```

계층이 너무 깊어지면(일반적으로 3단계 이상) 오히려 가독성이 떨어진다는 것이 경험적으로 널리 통용되는 가이드다. 그럴 때는 별도 리소스로 분리하는 것을 고려한다.

### 4. 복수형 명사를 사용한다 (권장 관례)

```text
❌ /user
✅ /users
```

단일 리소스를 조회할 때도(`/users/1`) 컬렉션 이름은 복수형을 유지하는 것이 일관성 있다.

### 5. 상태 코드를 정확히 사용한다

| 코드 | 의미 |
| --- | --- |
| 200 | 성공 (조회, 수정) |
| 201 | 생성 성공 |
| 204 | 성공했지만 응답 본문 없음 (삭제 등) |
| 400 | 잘못된 요청 (클라이언트 요청 자체가 잘못됨) |
| 401 | 인증되지 않음 |
| 403 | 인증은 됐지만 권한 없음 |
| 404 | 리소스 없음 |
| 500 | 서버 내부 오류 |

모든 에러를 200으로 응답하고 본문에 에러 메시지만 담는 방식은 REST 원칙에 어긋난다.

### 6. 필터링, 정렬, 페이지네이션은 쿼리 파라미터로

```http
GET /users?status=active&sort=createdAt&page=2&size=20
```

URI 경로가 아니라 쿼리 파라미터로 처리해야 리소스 계층 구조가 깨지지 않는다.

## 예제

사용자와 사용자의 게시글을 다루는 API 설계 예시:

```bash
GET    /users              # 사용자 목록 조회
POST   /users              # 사용자 생성
GET    /users/{id}         # 특정 사용자 조회
PATCH  /users/{id}         # 특정 사용자 일부 수정
DELETE /users/{id}         # 특정 사용자 삭제

GET    /users/{id}/posts   # 특정 사용자의 게시글 목록
POST   /users/{id}/posts   # 특정 사용자의 게시글 생성
```

## 주의사항

- URI에 확장자(`.json`, `.xml`)를 붙이지 않는다. 응답 형식은 `Accept` 헤더로 협상한다.
- 소문자와 하이픈(kebab-case)을 사용한다. 카멜케이스나 언더스코어는 지양한다.
- 버전 관리가 필요하면 `/v1/users`처럼 경로 앞단에 버전을 명시한다.
- 진짜 "REST다움"보다 팀 내 일관성이 더 중요하다. 원칙을 알고 있되, 상황에 따라 실용적으로 타협하는 것도 필요하다.

## 참고자료

- Roy Fielding의 REST 논문 (REST 개념의 원전)
- MDN HTTP 메서드 문서