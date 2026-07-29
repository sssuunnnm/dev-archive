---
title: OneStep (Archive)
summary: OneStep 기술 상세 아카이브 — 아키텍처, 이벤트 구조, 트러블슈팅 원본 기록
stack: [android, kotlin, spring-boot, redis, postgresql, mongodb, chromadb, mapbox, websocket, kafka, python, fastapi, langchain, openai, gemini, aws, kubernetes]
status: done
startDate: 2026-01-06
endDate: 2026-02-09
draft: true
---

> [OneStep 프로젝트 소개](/projects/onestep) 페이지의 상세 기술 기록.
> 조사·발견 과정을 그대로 남긴 아카이브 문서라, 계속 갱신한다. 사이트엔 발행하지 않는다(draft: true 영구 유지).

## Architecture

- **Client**: Android (Kotlin, Compose) — GPS 기반 위치 추적, Mapbox 지도 렌더링
- **Server (BE)**: Spring Boot
  - REST — 인증(카카오/게스트, Spring Security + JWT), 챌린지·루틴, 산책 세션(start/session/complete), 펫/경험치, 편지, 캘린더
  - WebSocket(STOMP) + Redis Pub/Sub — "모닥불 고민방" 실시간 랜덤 매칭 채팅 (입장/퇴장/메시지/타이머)
  - Kafka Producer — 매일 23:00 스케줄러가 `user.routine.generate` 토픽으로 일일 추천 요청 발행
  - Spring AI(Gemini, google-genai) — 편지 등 익명 소통의 부정 표현 필터링, 고민방 대화 요약에 활용
- **Server (AI)**: FastAPI (Python) — ML 기반 챌린지 추천 + AI 챗봇 서버
  - **추천 알고리즘** (상호작용 데이터 양에 따라 자동 선택)
    - Rule-based Hybrid (CBF + 행동가중치) — 항상 동작, cold-start 유저 기본값
    - LightFM (Hybrid CF) — 1,000+ 상호작용 시 활성화
    - ALS (협업 필터링) — 5,000+ 상호작용 시 활성화
    - 2-Stage(ALS+LightGBM) 앙상블 — 10,000+ 상호작용 시 활성화
    - 500개 상호작용마다 자동 재학습(배치 트리거)
  - **AI 챗봇**: OpenAI GPT-4o-mini(GMS API, SSAFY 제공) + LangChain Function Calling
    - 도구 1) `breakdown_goal` — 큰 목표를 실천 가능한 마이크로 단계로 분해
    - 도구 2) `recommend_challenge` — ChromaDB 기반 RAG 의미 검색으로 챌린지 추천, 간접 표현·감정 상태도 인식
  - Kafka Consumer — 배치로 추천 생성 후 MongoDB 저장, 500개마다 모델 자동 학습
- **Infra**: AWS, Kubernetes, Docker(멀티스테이지)

## Data Flow

- 일일 추천: Spring → Kafka(`user.routine.generate`) → FastAPI(추천 생성) → MongoDB 저장 → Spring이 조회해 PostgreSQL에 반영
- AI 챗봇: Android → FastAPI(JWT 인증) → OpenAI/ChromaDB → FastAPI → Android
- 모닥불 고민방: Android(STOMP) → Spring(WebSocketServiceImpl) → Redis Pub/Sub → (다중 pod) → STOMP 구독자 전체
  - 입장 시 `RoomServiceImpl.returnRoomKey()`가 정원(4인) 안 찬 기존 방 중 랜덤 선택, 없으면 랜덤 `Trouble`로 새 방 생성
- 보상/경험치: 챌린지·산책·편지 완료 → `ChallengeCompletedEvent` 발행 → `@TransactionalEventListener(BEFORE_COMMIT)`가 구독 → `total_exp` 갱신 → `PetLevelCalculator`로 레벨 계산·파생
  - Kafka는 즉시 보상엔 안 쓰이고 일일 추천 배치 전용

## DB 구조

- **PostgreSQL** — 사용자, 챌린지, 산책 기록, 편지, 설문 응답 등 영구 데이터 (Spring 쪽, Flyway로 마이그레이션 관리)
- **MongoDB** — FastAPI 쪽 데이터 저장소
  - `challenges` — 챌린지 마스터 200개
  - `daily_routine_snapshots` — 일일 추천 결과, TTL 7일
  - `user_profiles` — 챗봇용 프로필, TTL 30일
  - `user_interactions` — ML 학습용 상호작용 로그, TTL 90일
  - `chat_sessions` / `chat_messages` — 챗봇 대화, TTL 7일
- **ChromaDB** — 챌린지 200개 임베딩, 챗봇 RAG용 벡터 검색 (서버 모드)
- **Redis** — "모닥불 고민방" 방 세션(참여자·메시지·만료시각) 저장 + STOMP Pub/Sub 브로커 릴레이 (다중 pod 간 메시지 전파용)
  - 산책/경험치/편지 등 다른 도메인엔 사용 안 됨 — `RedisConfig`(Lettuce, String/Object 템플릿 2종), `RoomSessionManager`, `RedisMessageSubscriber`, `WebSocketServiceImpl` 코드로 확인 완료
  - 캐싱(반복 조회 데이터)이나 분산 락 용도로는 안 쓰임 — 이 프로젝트엔 그런 요구가 없었음

## Kafka / Redis 사용 이유

- **Kafka**: 일일 추천은 "모든 유저를 매일 즉석 생성"하면 응답 지연 + 서버 부하가 크므로, 스케줄러(23:00)가 Kafka로 배치 요청을 던지고 FastAPI가 비동기로 처리 → 결과를 미리 저장해두고 접속 시 즉시 반환하는 사전 생성(pre-generation) 캐싱 전략의 핵심 인프라
- **Redis**: 방 세션처럼 TTL이 자연스러운 휘발성 상태 + 여러 서버 인스턴스(k8s 다중 pod) 간 STOMP 메시지 전파가 필요한 지점에만 사용. Redis 용도를 "캐싱/세션·상태저장/Pub-Sub/분산락" 4가지로 나눠보면, 이 프로젝트는 세션·상태저장 + Pub/Sub 두 가지만 사용

## AI 추천 시스템

- Cold-start 유저는 Rule-based Hybrid(콘텐츠 기반 + 행동 가중치)로 시작
- 상호작용이 쌓이면 LightFM → ALS → 2-Stage(ALS+LightGBM) 순으로 더 정교한 모델로 자동 전환
- 최종 점수 공식: `(1-α)×CBF점수 + α×행동가중치`, `α = min(완료챌린지수/50, 0.7)`
- 챗봇의 챌린지 추천은 별도로 ChromaDB 벡터 검색(RAG) 기반 — 추천 알고리즘 4종과는 다른 경로

## GPS Walk Tracker (산책 구현)

- `FusedLocationProviderClient`로 위치 수신, `Location.distanceTo()`로 거리 계산
- GPS 노이즈 대응: 정확도/거리/도착판정 기준 **임계값 가드** 방식 채택 (칼만 필터 등 스무딩 계열과는 목적이 다름 — 이상치 제거 vs 궤적 스무딩)
- 타겟(고립·은둔 청년) 특성상 이동 반경이 좁아(수십m 단위) GPS 오차 비중이 상대적으로 커짐 → 정밀 궤적보다 이상치 제거가 우선순위
- Mapbox 채택 이유: 앱의 레트로·픽셀 디자인 톤에 맞춰 지도를 커스텀 스타일링해야 했음 (구글/카카오맵은 스타일 커스텀 자유도가 낮음). POI 검색 정확도는 우선순위가 아니었음(백엔드가 장소명·좌표를 미리 계산해 제공하는 구조라 지도 SDK의 POI 검색 자체를 쓸 일이 없었음)
- 상세 트레이드오프(칼만 필터 vs 가드, 좁은 반경 도메인 논리)는 시리즈 4~6편에서 다룸

## Event System

- 보상 지급은 도메인 이벤트(`ChallengeCompletedEvent`) + `@TransactionalEventListener(BEFORE_COMMIT)` 패턴으로 통일
  - 챌린지 완료, 산책(`fromRouteSession`, 40exp), 편지(`fromLetter`, 15exp) 각각 동일한 이벤트로 발행 → 리스너 하나가 공통 처리
  - 원래 트랜잭션 커밋 직전에 실행되어 원자성 확보 (챌린지 완료 + exp 지급이 함께 성공/실패)
- 장점: 도메인 간 결합도 낮춤 (편지 서비스가 exp 로직을 몰라도 됨)
- 한계: 아래 "한계 및 개선점" 참고

## 캐싱 전략

- 개인화 추천은 "소비한 날 다음 데이터를 미리 생성해 저장 → 접속 시 즉시 반환"하는 사전 생성(pre-generation) 패턴
- 모든 유저를 매일 재생성하지 않고, 소비 시점 기준으로만 갱신 → 서버 자원 절약
- Redis 캐싱(반복 조회 완화)은 이 프로젝트에서 실제로 쓰이지 않음 — 대부분 도메인이 1:1 요청/응답이라 캐시 필요성이 낮았음

## 구현하면서 생긴 문제 / 왜 이렇게 설계했는가

- **DB 표기 조사**: 기획 문서(ERD)는 dbdiagram.io/DBML로 작성돼 DB 종류를 특정할 수 없었고, 팀 피치 자료엔 MySQL로 적혀 있었지만 실제 `build.gradle`엔 `org.postgresql:postgresql` + `flyway-database-postgresql`만 존재 → **PostgreSQL로 최종 확정**. 문서·자료 간 표기가 어긋날 수 있다는 걸 코드로 직접 검증해야 했던 사례
- **AI provider 조사**: 기획상 "AI 서버 = Python/FastAPI/LangChain"이라 Gemini도 그쪽인 줄 알았으나, 실제로는 FastAPI 챗봇은 **OpenAI GPT-4o-mini**, Gemini는 오히려 **Spring Boot 쪽**(`GoogleGenAiChatModel`, 커스텀 Spring AI 설정)에서 편지 필터링·고민방 요약에 쓰임 — AI 모델 두 개가 역할별로 분리된 구조였음
- **Redis 사용처 조사**: `RedisConfig` → `RedisMessageSubscriber` → `RoomSessionManager`/`WebSocketServiceImpl` 순으로 추적해서 "모닥불 고민방 전용"이라는 걸 코드로 확정. 설정 파일(연결 정보)만으로는 사용처를 알 수 없고, 실제 호출부를 찾아야 확정할 수 있었던 사례
- **기획-구현 불일치 발견**: 고민방 대화 시간이 기획 문서엔 "5분"이었는데 실제 코드는 `durationTime = 1`(1분)로 하드코딩 — 규모 축소 또는 테스트용 값이 그대로 남았을 가능성

## 한계 및 개선점

- **경험치 동시성 미방어**: 기획 단계엔 "1일 100 exp 제한"을 설계했지만, 실제 `ChallengeCompletedEventListener`에는 일일 상한 체크도, 동시성 방어(낙관적 락 `@Version`, 비관적 락, Redis `INCR`+TTL 등)도 없음. `user.updateTotalExp()`가 단순 필드 증가라 동시에 여러 챌린지를 완료하면 이론상 Lost Update 가능성이 있음
  - **다시 만든다면**: Redis 원자적 카운터(`INCR` + 자정 만료 TTL)로 일일 누적량을 체크하거나, `Exp_Log` 테이블에 (user_id, date) 유니크 제약을 걸어 방지했을 것
- **배터리 최적화, FCM 알림, 오프라인 대응**: 프로젝트 기간(6주) 상 미구현 — 실서비스라면 Doze Mode 대응, FCM 트리거 설계, 로컬 캐시 후 재전송(retry queue) 패턴이 필요
- **STOMP 다중 채널 렌더링 학습 부족**: 모닥불 고민방(웹소켓)은 본인이 구현한 파트가 아니라서, `/topic`/`/user/queue` 다중 구독과 메시지 타입별(ENTER/EXIT/TEXT/TIMER) 렌더링 방식은 추가 학습이 필요함

## 코드 구조 메모

- 도메인별 패키지 하위에 `event`/`listener` 폴더를 분리하는 컨벤션 (`letter`, `challenge`, `room` 도메인에서 공통 관찰)
- Redis 관련 코드는 `global/redis/{config,subscribe}`, WebSocket은 `global/websocket/{service,dto,event}`로 global 패키지에 위치 — 여러 도메인이 공유하는 인프라성 코드는 도메인 패키지가 아니라 global에 모으는 구조

## 회고

- Redis/DB/AI provider 등 "설정만 봐서는 알 수 없는" 것들을 실제 코드 호출부까지 추적해서 확정하는 과정 자체가 좋은 학습이었음 — 연결 설정(config)과 실제 사용처(usage)는 다른 정보라는 걸 반복해서 확인함
- 기획 문서와 실제 구현이 항상 일치하지 않는다는 것(DB, AI 서버 구조, 고민방 시간)을 코드로 검증하며 체감함

## 시리즈 계획 (onestep-deep-dive)

article 작성될 때마다 아래 체크만 갱신. 괄호는 이 아카이브에서 참고할 섹션.

- [ ] 1. 실시간 위치 받기 (FusedLocationProviderClient) — *(GPS Walk Tracker)*
- [ ] 2. 좌표로 거리·속도 계산하기 — *(GPS Walk Tracker)*
- [ ] 3. Mapbox로 걸은 경로 그리기 — *(GPS Walk Tracker)*
- [ ] 4. GPS는 왜 튀는가, 좁은 반경 도메인의 함정 — *(GPS Walk Tracker)*
- [ ] 5. 임계값 가드 vs 칼만 필터 — *(GPS Walk Tracker)*
- [ ] 6. 시뮬레이션으로 필터링 전략 정량 비교하기 — *(GPS Walk Tracker)*
- [ ] 7. Mapbox 커스텀 스타일로 디자인 톤 맞추기 — *(GPS Walk Tracker)*
- [ ] 8. Redis는 실제로 어디에 쓰였을까 (코드로 추적하기) — *(DB 구조, Kafka/Redis 사용 이유)*
- [ ] 9. Spring 이벤트로 보상 지급하기 — *(Event System)*
- [ ] 10. 경험치 동시성, 왜 안전하지 않은가 (+ 직접 방어 구현) — *(한계 및 개선점)*
- [ ] 11. 기획 문서와 실제 코드는 왜 어긋나는가 — *(구현하면서 생긴 문제)*

> 각 article의 `projects` 필드는 `onestep`(포트폴리오 엔트리)에만 연결한다. 이 아카이브(`onestep-archive`)는 연결 대상이 아니다 (DESIGN_RULES 4-3).