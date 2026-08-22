---
title: NGRAS (Archive)
summary: NGRAS 기술 상세 아카이브 — 실제 코드로 확인한 SSE·토큰 갱신·리렌더 버그, 백엔드 실제 스택 원본 기록
stack: [react, typescript, python, fastapi, sse, websocket, redis, postgresql, kubernetes]
status: done
startDate: 2026-04-06
endDate: 2026-05-21
draft: true
---

> [NGRAS 프로젝트 소개](/projects/ngras) 페이지의 상세 기술 기록.
> `ngras-fe`, `ngras-be` 저장소를 직접 읽고 검증한 내용만 남긴다. 사이트엔 발행하지 않는다(draft: true 영구 유지).
>
> **중요한 전제**: 두 저장소 모두 git log상 커밋이 1개(스쿼시/익스포트)뿐이라 개발 과정을 git history로 추적할 수 없다. 또한 이 프로젝트는 보안망 내부에서 사내 시스템과 연계해 개발됐다고 들었는데, 실제로 이 저장소들에는 없는 코드(예: 별도 Spring Boot 서비스)가 사내망에만 존재할 가능성이 있다. 그래서 "이 저장소엔 없다"를 "실제로 안 만들었다"로 단정하지 않고, 확인 가능한 것과 확인 불가능한 것을 구분해서 기록한다.

## Architecture

- **FE**: `/home/user/ngras-fe` — React 19.2.4 + TypeScript, Vite 8, TanStack Router(react-router 아님), Tailwind 4. (`package.json` 확인)
- **BE**: `/home/user/ngras-be` — **이 저장소 안에서는 순수 Python뿐**. `find . -iname "pom.xml" -o -iname "build.gradle*" -o -iname "*.java"` 결과 0건. `src/ngras_backend`(FastAPI API), `src/ngras_agent`(LangGraph 기반 AI 에이전트), `src/ngras_core`(계측기 도메인·실행 로직, `pyvisa`/`rsinstrument`로 R&S FSW 계측기 실제 제어)로 3분할.
- 실시간 채널 3종 동시 운용: WebSocket(`/ws/tasks/{id}`, `/ws/queue`), SSE(`/sse/tasks/{id}`), noVNC(계측기 화면 PiP).
- AI 플랜 생성 흐름: FE → BE REST → Celery task(`generate_test_plan`) → `NgrasAgentController.chat_plan_graph`(LangGraph, Redis 체크포인터) → LLM 호출 → Redis Pub/Sub(`task:{task_id}`) → BE `api/sse.py`가 구독해 SSE로 FE에 전달. 테스트 실행도 동일 패턴(`execute_test` → `stream_test_report_graph`).

## LLM은 OpenAI/Anthropic이 아니라 삼성 사내 Gauss

`src/ngras_agent/clients/llm_client.py` 상단 docstring: "Samsung Gauss API client with credential-aware rate limiting." `openai`/`anthropic` 패키지는 의존성·import 어디에도 없다. 보안망 내부에서 외부 AI를 못 쓴다던 정황과 일치한다.

`GaussClient`는 스텁이 아니라 상당히 실제적인 구현이다 — 다중 API 크레덴셜별 분당 요청수 제한, 쿨다운, 재시도, 대기열까지 자체 스케줄러로 구현했고, 스트리밍 SSE 파싱(`_iter_sse_chunks`)도 직접 만들었다. `agents/plan_agent.py`, `agents/report_agent.py`, `tools/ocr_engine.py`에서 실제로 이 클라이언트를 사용한다.

## SSE 구현 (문서 서술과 일치, 코드로 확인됨)

파일: `src/lib/sse.ts` (FE)

- `fetch` + `response.body.getReader()` + `TextDecoder`로 직접 스트림을 읽는다. `EventSource`는 전혀 사용하지 않는다.
- 청크/라인 경계 파싱: `buffer += decoder.decode(value, {stream:true})` 후 `\n\n` 기준으로 이벤트 분리, 남은 조각은 buffer에 유지 — SSE 명세대로 이벤트 경계를 처리한다.
- 토큰 주입: `readStoredAccessToken()`이 Zustand `persist` 스토어가 localStorage에 쓴 `'auth-storage'` 키를 직접 파싱해 `accessToken`을 꺼내고 `Authorization: Bearer ...` 헤더를 붙인다. 실제로 `useAuthStore`(`src/features/auth/store.ts`, `persist({name:'auth-storage'})`)가 쓰는 키와 정확히 일치.
- **EventSource가 실제로 불가능했는가**: 백엔드 `GET /sse/tasks/{task_id}`(`src/ngras_backend/api/sse.py`)의 인증 의존성이 `HTTPAuthorizationCredentials = Depends(HTTPBearer())`로 Authorization 헤더의 Bearer 토큰을 필수로 요구한다. 브라우저 네이티브 `EventSource`는 커스텀 헤더를 못 실으므로, 이 우회는 실제로 필요했다 — **공개 문서 서술이 정확함.**
- WebSocket 토큰은 다른 방식: WS는 헤더 자체가 불가능해서 `POST /auth/ws-token`으로 단기 토큰을 발급받아 쿼리스트링(`?token=`)에 실어 보낸다(`src/api/wsClient.ts`, BE `auth/ws_token.py`). SSE(헤더 우회)와 WS(쿼리파라미터 우회)가 같은 문제를 서로 다른 방식으로 풀었다.
- 코드 주석이 스스로 문서-코드 불일치를 기록해둔 부분도 있다(`sse.ts` 상단): 명세(§13-2)는 `field_update`/`progress`/`completed`/`error` 4종만 정의하는데 실제 백엔드는 `connected`/`warning`도 추가로 보낸다고 적혀 있다.

## 동시 401 → 토큰 갱신 단일화 — 이 저장소에서는 확인되지 않음

`src/api/client.ts`(24~54행)의 axios 인터셉터는 `_retry` 플래그로 **같은 요청의 무한 재시도만** 막는다. 여러 요청이 동시에 401을 받았을 때 refresh 호출을 하나로 묶는 메커니즘(공유 Promise, `isRefreshing` 플래그, 구독자 큐 등)은 저장소 전체에서 검색되지 않았다(`grep -r "isRefreshing|refreshPromise|subscribeTokenRefresh|failedQueue"` 결과 없음).

다만 이 저장소는 보안망 내부 프로젝트라 일부 코드가 사내망에만 있고 여기엔 없을 가능성을 배제할 수 없어서, "실제로 이런 로직이 없다"고 단정하지는 않는다. 시리즈 글을 쓸 때는 실제 기억을 기준으로 판단하되, 이 코드 스냅샷만으로는 뒷받침되지 않는다는 점을 알고 있어야 한다. 내부 자체 평가서(`SELF_REVIEW.md`)도 이 흐름을 "Axios 인터셉터로 401 → 토큰 자동 refresh → 원요청 재시도"로만 서술하고 dedup은 언급하지 않는다.

## React 19 리렌더링 버그 — 코드·문서 3곳에서 확인됨

이 프로젝트에서 가장 확실하게 검증된 기술 스토리. 추측이 아니라 코드 주석과 저장소 내부 문서에서 동일한 인과관계가 반복 확인된다.

**핵심 근거 — `src/features/aiAgent/store.ts` 426~430행:**
```ts
// await 이후에 testQueue 스토어 업데이트: aiAgent 스토어의 isStreaming 업데이트와
// 동일 동기 블록에서 두 스토어가 동시 업데이트되면 React 19 useSyncExternalStore
// 동시 렌더링 충돌이 발생하므로 첫 번째 await 이후로 이동한다.
useTestQueueStore.getState().clearPresetWarnings(testId);
set({ currentTaskId: task_id });
```

같은 패턴이 최소 2곳 더 있다:
- `src/features/testQueue/pages/TestQueuePage.tsx`(88~91행): 두 스토어를 동시에 구독하던 컴포넌트를, `TestContent`에서 `isStreaming`을 단일 구독 후 prop으로 내려주는 방식으로 바꿔 다중 구독 자체를 없앴다.
- `src/features/aiAgent/components/ChatPanel.tsx`(34~43행): 셀렉터가 객체를 반환하면 매 렌더마다 새 참조가 생겨 `useSyncExternalStore` 무한 루프가 나므로, 프리미티브 값 두 개로 분리했다. (원인은 다르지만 같은 계열 증상.)

저장소 자체 문서에도 명시돼 있다:
- `CLAUDE.md` "## React 19 다중 스토어 동시 업데이트 주의" 섹션 — 발생 조건과 해결 패턴을 구체적으로 문서화.
- `SELF_REVIEW.md`(자소서/회고용 자체 평가서, 작성일 2026-05-19 명시) — "React 19의 useSyncExternalStore 기반 동시 렌더링과 Zustand 다중 스토어 조합에서 발생하는 tearing 무한 루프 패턴을 식별하고, '두 번째 스토어 업데이트를 첫 await 이후로 분리' 및 '단일 구독점 패턴' 두 가지 해결 규칙을 추출해 4개의 실제 버그를 수정했다"고 기술.

**유의할 점**: "4개 버그 수정"이라는 수치는 코드에서 3곳까지만 직접 확인했고 git history가 없어 정확한 수정 시점·건수는 검증 불가. 또한 "tearing"이라는 용어는 React 팀이 정의하는 엄밀한 의미(concurrent 렌더링 중 스토어 값 일관성이 깨지는 현상)와, 여기서 실제 관찰된 증상(`Maximum update depth exceeded`, 무한 재렌더)이 정확히 같은 현상인지는 외부적으로 재검증하지 않았다. 즉 **"이 코드베이스 저자가 이렇게 진단하고 이렇게 고쳤다"까지는 확실하지만, 그 진단이 React 내부 동작의 엄밀한 설명인지는 별개 문제**다. 시리즈 글에서는 "우리가 tearing으로 진단하고 이 방법으로 해결했다"는 톤을 유지하고, React 내부 동작을 단정적으로 설명하지 않는 편이 안전하다.

## 상태 관리

- Zustand 스토어 11개: 공용(`useAppStore`, `useConnectionStore`, `useModalStore`, `useTabStore`) + 피처별(`aiAgent`, `auth`, `home`, `instrument`, `preset`, `report`, `testQueue`).
- TanStack Query는 서버 상태(관리자 CRUD, 인증, 프리셋, 리포트)에 국한. 실시간성이 중요한 테스트큐/AI에이전트/계측기 상태는 Zustand + WS/SSE 조합으로 처리 — 역할 분담이 코드로 확인됨.
- 다만 프리셋 초안 편집(`usePresetDraft.ts`)은 여전히 `setTimeout` 목업이다(주석: "TODO: replace setTimeout simulation with real EventSource"). aiAgent 챗 패널(`attachSseToAssistantMsg`)은 실제 SSE를 쓰는데, 기능마다 실구현/목업이 섞여 있다.

## 백엔드 실제 스택

- 의존성(`pyproject.toml`): FastAPI, SQLAlchemy 2.0 + asyncpg(→ PostgreSQL), Redis, Celery[redis](비동기 워커), MinIO(오브젝트 스토리지), LangGraph + langchain-core, pyvisa/pyvisa-py/rsinstrument(계측기 VISA 제어, 실물 하드웨어 연동 실재), docling/torch/torchvision/pdfplumber(규정 문서 PDF 파싱·OCR), weasyprint(PDF 리포트 생성), pyjwt/bcrypt.
- DB 스키마 관리에 Alembic 같은 정식 마이그레이션 프레임워크가 없다. `db/migrations/`엔 PostgreSQL NOTIFY 트리거 SQL 1개뿐이고, 실제 스키마는 `scripts/db_init.py`가 `docs/prototype_erd.sql`(파일명 자체가 "prototype")을 실행해 만든다.
- Pub/Sub은 Redis뿐 아니라 PostgreSQL LISTEN/NOTIFY도 병용한다(`pubsub/pg_listener.py`, 계측기 상태 변경 알림용) — 이벤트 종류에 따라 다른 백엔드를 쓰는 이원화 구조.
- **Spring Boot/Java는 이 저장소엔 없다.** 이력서의 "FastAPI, Spring Boot" 병기 중 Spring Boot 부분은 이 두 저장소로는 확인되지 않는다. 별도 서비스가 사내망에 있다면 이 저장소 밖의 일이다.

## Kubernetes 배포 (Hub 페이지 포함) — 코드로 확인됨

- FE: `k8s/`에 Helm 차트(`Chart.yaml` name: `ngras-frontend`).
- **Hub 페이지가 완전히 별도 배포**: `nwhub-fe/`가 독립된 Helm 차트(`nwhub-frontend`) + 자체 Dockerfile/nginx.conf/`.github/workflows/cicd.yml`을 갖춘다. 소스는 공유하지만 별도 이름·별도 K8s 릴리스·별도 CI/CD로 배포된다 — "Kubernetes 기반 Hub 페이지 배포" 서술이 정확히 맞다.
- `nwhub-fe`의 CI/CD는 `develop`→개발/`main`→운영, self-hosted 러너에서 Docker 빌드 후 배포하고 사내 CA 인증서를 빌드 시 주입한다. Dockerfile엔 사내 프록시 IP, 사내 CA, `npm config set strict-ssl false`가 하드코딩돼 있다 — 보안망 제약 환경의 직접적 증거.
- BE는 `api-deployment.yaml`과 `worker-deployment.yaml`이 분리돼 있어 FastAPI API 서버와 Celery 워커가 별도 K8s Deployment로 스케일링된다.

## 워크플로우 단계 명칭 — 공개 문서는 의역

코드상 `TestStepper.tsx`의 실제 라벨은 "1.정보 수집 2.실험 계획서 3.프리셋 4.테스트 5.보고서 6.완료"(6단계)로, 공개 문서의 "설정→파라미터→프로파일→작업 실행→리포트 생성"(5단계 요약)과 정확히 일치하지는 않는다. 개념적으로는 같은 흐름이라 의역으로 봐도 되지만, 정확한 단계명이 필요하면 코드 쪽을 따라야 한다.

## 한계 / TODO (SELF_REVIEW.md + 코드 근거)

- **테스트 인프라 전무**: `package.json`에 테스트 러너가 없다. `SELF_REVIEW.md`도 "테스트 인프라 부재"를 자체 지적.
- **코드 스플리팅 0건**: 초기 JS 1,067KB(gzip 307KB) 단일 청크.
- **`/ws/queue` 전체 브로드캐스트 + 클라이언트 필터링**: 모든 유저에게 타인의 task_id·이름·상태가 노출되는 구조를 자체 인지하고 있다(`SELF_REVIEW.md`, BE `api/ws.py`에서도 확인).
- **WS 프로토콜 선택에 대한 자기비판**: "`/ws/tasks/{task_id}`가 전부 서버→클라 단방향인데 WS의 장점(양방향/바이너리)은 못 쓰면서 단점(수동 재연결 등)만 진다. SSE가 더 적합했을 것"이라고 자체 평가돼 있다.
- **런타임 페이로드 검증 부재**: WS/SSE 페이로드가 TS 타입으로만 보호되고, "TASK_STARTED 직후 TASK_COMPLETED, 보고서 미생성" 같은 이슈가 원인 미확정 상태로 발생 중이라고 문서화돼 있다.
- **TypeScript 빌드 에러 30건 이상**: `tsc -b` 컴파일 에러 다수, CI가 `npm run build`를 게이트하는지는 불확실.
- 죽은 코드/미완 스텁: `src/ngras_agent/tools/backend_client.py`의 `execute_tests()`(로컬 스텁 모드, 어디서도 import되지 않는 미사용 코드), `useAgentStream.ts`의 `mockStreamResponse`(호출되지 않는 죽은 코드), `ReportDownloadToast.tsx`("실제 파일 다운로드로 교체 필요" TODO).
- SELF_REVIEW.md에 있는 "세션 50분 경고 → 60분 강제 로그아웃" 서술은 코드 전체 검색에서 근거를 찾지 못했다 — 이 내부 문서 자체도 무비판적으로 인용하면 안 되는 서술이 섞여 있다는 뜻.

## 회고

- `SELF_REVIEW.md`는 이력서·포트폴리오 문구의 원본 소스로 보인다("앵글 C — React 19 함정을 발견하고 패턴으로 정리한 개발자" 등). 즉 이번에 검증한 문구 상당수가 이 문서에서 유래했을 가능성이 높다. 다만 이 문서 자체에도 코드로 뒷받침되지 않는 서술(세션 타이머)이 섞여 있어, **자체 회고 문서라도 코드로 다시 검증해야 한다**는 게 이번 조사의 가장 큰 교훈이다.
- 삼성 사내 LLM(Gauss)을 위한 다중 크레덴셜 스케줄러, PostgreSQL NOTIFY + Redis Pub/Sub 이원화, SSE/WS가 인증 우회를 서로 다른 방식으로 푼 점 등은 "겉으로 보이는 기능"보다 인프라 제약(보안망, 사내 LLM only) 자체가 설계에 직접 영향을 준 사례로, 시리즈 글감으로 좋다.

## 시리즈 계획 (ngras-deep-dive, 가칭)

article 작성될 때마다 아래 체크만 갱신. 괄호는 이 아카이브에서 참고할 섹션.

- [x] 1. EventSource 대신 fetch+ReadableStream으로 SSE 직접 파싱하기 — *(SSE 구현)* — `ngras-deep-dive-1`에 함께 담음
- [ ] 2. React 19 useSyncExternalStore와 tearing — 두 스토어를 같은 틱에 건드리면 생기는 일 — *(React 19 리렌더링 버그)*
- [ ] 3. 사내 LLM(Gauss)을 위한 다중 크레덴셜 스케줄러 설계 — *(LLM은 OpenAI/Anthropic이 아니라 삼성 사내 Gauss)*
- [x] 4. WebSocket과 SSE, 같은 인증 문제를 다르게 우회하기 — *(SSE 구현의 WS 비교 부분)* — `ngras-deep-dive-1`에 함께 담음
- [ ] 5. 자체 회고 문서도 코드로 재검증해야 하는 이유 — *(회고)*

> 각 article의 `projects` 필드는 `ngras`(포트폴리오 엔트리)에만 연결한다. 이 아카이브(`ngras-archive`)는 연결 대상이 아니다 (DESIGN_RULES 4-3).
