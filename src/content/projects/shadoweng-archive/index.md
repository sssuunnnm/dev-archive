---
title: ShadowEng (Archive)
summary: ShadowEng 기술 상세 아카이브 — 실제 코드 조사로 확인한 아키텍처·미완성 지점·문서 불일치 원본 기록
stack: [android, kotlin, mysql, aws]
status: done
startDate: 2026-02-01
endDate: 2026-03-30
draft: true
---

> [ShadowEng 프로젝트 소개](/projects/shadoweng) 페이지의 상세 기술 기록.
> 클라이언트(`shadoweng`)와 서버(`shadoweng-server`) 저장소를 직접 읽고 검증한 내용만 남긴다. 사이트엔 발행하지 않는다(draft: true 영구 유지).

## Architecture

- **Client**: Android 단일 Gradle 모듈(`:app`). `settings.gradle.kts`에 `include(":app")`만 존재 — 멀티모듈이 아니라 패키지(feature package) 분리 구조.
- **Feature 패키지 8개**: `auth, content, game, home, mypage, profile, stats, study`
  - 5-레이어(api/domain/mapper/presentation/repository)를 완전히 갖춘 곳: `study`, `game`, `home`, `mypage`
  - `content`는 `domain/`, `mapper/`가 없이 `api/presentation/repository/util`만 존재
  - `profile`은 `api/presentation`만, `stats`는 하위 디렉터리 없이 파일 몇 개, `auth`는 `domain/mapper` 대신 `data/`(TokenStorage)
- **상태 관리 패턴은 화면마다 다름**: VM 20개 중 `game/presentation/play/GamePlayViewModel.kt` 단 하나만 정식 MVI(Contract 패턴 — `GamePlayContract.kt`에 `GamePlayState`/`GamePlayIntent`/`GamePlayEffect`, `Channel<GamePlayEffect>`로 1회성 이벤트 처리). 나머지 19개는 `MutableStateFlow<XxxUiState>` + `sealed class XxxEvent` + 네비게이션은 `MutableSharedFlow` 방식.
- **Server**: Spring Boot(Kotlin), `HandlerInterceptor` 기반 자체 JWT 인증(Spring Security 아님) — `global/jwt/JwtInterceptor.kt` + `jjwt`. `/api/v1/app/auth/**`만 인터셉터 제외(`WebConfig.kt`).

## 클라이언트-서버 API 계약 불일치 (발음 평가)

가장 중요한 발견. 문서상으로는 "녹음 → 서버 전송 → AI 평가 → 시각화"가 매끄러운 파이프라인처럼 보이지만, 실제로는 이어지지 않는다.

- 클라이언트 `StudyApi.kt`: `@Multipart @POST("study-sessions/{sessionId}/evaluations")` — 오디오를 `@Part file: MultipartBody.Part`로 전송하도록 구현.
- 서버 `StudySessionController.kt`: `@PostMapping("/{sessionId}/evaluations") fun createEvaluation(@PathVariable sessionId: Long, @RequestBody request: CreateEvaluationRequest)` — **멀티파트 파일을 아예 받지 않고** JSON(`sentenceId`, `userTranscription: String?`)만 받는다. 오디오 파일이 서버에 도달할 방법이 없다.
- 응답 형태도 다르다. 클라이언트 `EvaluationResponse` DTO는 `details.wordLevelFeedback`, `boundaryToneFeedback`, `dynamicStressFeedback` 등 중첩 구조를 기대하는데, 서버 `EvaluationResponse.kt`/`EvaluationMapper.kt`는 점수 필드만 있는 flat 구조이고 `wordFeedback`/`details` 자체가 없다.
- 서버 `EvaluationService.kt`:
  ```kotlin
  // TODO: AI 분석 연동 시 실제 점수로 교체
  val evaluation = evaluationRepository.save(
      Evaluation(..., totalScore = BigDecimal("85.00"), wordAccuracy = BigDecimal("90.00"), ...)
  )
  ```
  업로드 내용과 무관하게 항상 같은 점수를 반환하는 하드코딩 스텁이다. 실제 음성 분석/ASR 로직은 서버 어디에도 없다.
- 결론: **Canvas 시각화(클라이언트 도메인 모델·렌더링 로직)는 완성돼 있지만, 그 입력이 되는 서버 쪽 평가는 스텁이라 이 스냅샷 기준으로는 end-to-end로 동작하지 않는다.**

## 게임/리그 기능 — 서버 도메인 자체가 없음

- 클라이언트 `feature/game/api/GameApi.kt`는 `game/today`, `game/levels/{level}/rounds/{round}`, `.../evaluate`, `game/leaderboard`, `game/profile` 5개 엔드포인트를 호출한다.
- 서버 `domain/` 하위엔 `auth, bookmark, report, study, user, video` 6개뿐 — `game`/`league` 관련 컨트롤러·서비스가 전무하다.
- 즉 게임 화면·MVI 아키텍처·Canvas 연동까지 클라이언트는 완성했지만, 서버가 이를 전혀 뒷받침하지 못하는 상태. 서버는 스터디(섀도잉) 기능 위주의 초기 단계이고, 게임화는 클라이언트가 서버보다 먼저 설계·구현이 진행된 것으로 보인다.

## 유튜브 콘텐츠 등록 파이프라인도 스텁

- `domain/video/service/VideoService.kt`: 유튜브 URL에서 videoId만 정규식으로 추출하고, 제목/채널명은 `"Mock Title"`/`"Mock Channel"`로 하드코딩(`// TODO: 유튜브 API 연동 시 교체`), `duration = 0` 고정. 실제 YouTube Data API 연동 없음.
- `domain/study/service/StudySessionService.kt`의 `createSession()`: 사용자가 선택한 영상/구간과 무관하게 `"Mock sentence one/two/three for testing."` 고정 문장 3개를 항상 생성. 자막 추출/문장 분절 파이프라인 미구현.
- `global/config/DataInitializer.kt`: 서버 기동 시 릭 애슬리 뮤직비디오(`dQw4w9WgXcQ`)로 시드 데이터 생성.

## 미디어 재생 — 유튜브와 ExoPlayer는 서로 다른 용도

- 유튜브 "영상" 재생은 ExoPlayer가 아니다. `core/ui/component/YoutubePlayerView.kt`가 서드파티 `com.pierfrancescosoffritti.androidyoutubeplayer:core:12.1.0`(WebView 기반 YouTube IFrame Player 래퍼)를 사용한다. 실제 섀도잉 학습 화면(`StudyLearningScreen.kt`)이 이걸 쓴다.
- `androidx.media3:media3-exoplayer:1.3.1`은 `GamePlayScreen.kt` 단 한 곳에서만 사용되며, 유튜브 영상이 아니라 게임 라운드의 참조 음성 파일(`referenceAudioUrl`) 재생용이다.
- 발행된 공개 문서가 "ExoPlayer 기반 유튜브 영상·음성 재생"이라고 뭉뚱그렸던 게 가장 명확한 오류였고, `shadoweng/index.md`에서 이미 정정했다.

## Canvas 기반 발음 오류 시각화 (문서 서술과 일치, 구현 확인됨)

- `core/ui/component/AnnotatedSentenceView.kt`: Compose `Canvas` + `TextLayoutResult.getBoundingBox(index)`로 글자 단위 좌표를 구해 `Path().cubicTo(...)`로 화살표(`ARROW_UP/DOWN`)·곡선(`CURVE_LONG/SHORT`)을 그린다. 하이라이트/볼드/밑줄은 `SpanStyle`로 별도 처리(Canvas 아님).
- 매핑: `feature/study/mapper/EvaluationAnnotationMapper.kt` — `dragged → CURVE_LONG`, `rushed → CURVE_SHORT`, `missed → HIGHLIGHT`, `good → 표시 없음`.
- 결함: `sentence.indexOf(word)`가 **문장 내 첫 번째 일치 위치만** 찾는다. 같은 단어가 문장에 두 번 이상 나오면 잘못된 위치에 주석이 그려질 수 있다.

## DB / 인프라

- **DB 설정 자체 모순**: `build.gradle.kts`는 `mysql-connector-j`만 활성이고 `h2database`는 주석 처리돼 있는데, `application.yml`은 여전히 `jdbc:h2:file:./data/shadoweng`를 가리킨다. 클래스패스에 H2 드라이버가 없는 상태로 H2 설정을 쓰는 모순 — 별도 profile이 있었을 가능성은 있으나 이 스냅샷엔 `application.yml` 1개뿐이라 확인 불가.
- Redis/Kafka는 두 저장소 어디에도 없다(`grep -rl "redis\|kafka"` 결과 0건).
- **Docker/Jenkins/GitHub Actions 설정 파일이 저장소에 없다.** 인프라를 레포 밖에서 수동 구성했을 가능성이 있어 "안 썼다"고 단정하지는 않지만, 이 레포만으로는 CI/CD 파이프라인을 검증할 수 없다.
- AWS 배포는 간접 확인됨: Android `build.gradle.kts`의 `BASE_URL = "http://52.78.202.199:8080/api/v1/app/"`(EC2로 추정), `network_security_config.xml`이 이 IP만 cleartext(HTTP) 허용 — **TLS 없이 평문 HTTP로 배포**된 것으로 보인다.
- 인증 API 불일치: `AuthApi.kt`는 `auth/login/dev`, `auth/logout`, `auth/refresh`를 호출하지만, 서버 `AuthController.kt`엔 `POST /auth/login/guest`만 존재한다. 클라이언트가 서버보다 앞서 나가 있거나 서버 코드 일부가 이 스냅샷에서 누락됐을 가능성.

## 한계 및 개선점 (코드에서 직접 확인)

- `EvaluationService.kt:28` — 점수 하드코딩(`// TODO: AI 분석 연동 시 실제 점수로 교체`)
- `VideoService.kt:23,27` — 제목/채널명 목업
- `StudySessionService.kt:42-44` — 학습 문장이 실제 영상과 무관한 고정값
- `ContentLoadingViewModel.kt:37` — 단계별 진행 애니메이션(`finishSteps()`)이 죽은 코드로 남고 실제로는 `delay(400)`만 호출
- `ContentLoadingViewModel.kt:42` — 에러 UiState 미구현
- `TokenStorage.kt:20-23` — `getOrCreateDeviceId()`가 `"test-device-004"`로 하드코딩된 채 그대로 반환, 실제 UUID 로직은 주석 처리(`// TODO: 개발 완료 후 아래 한 줄 제거`) — release 빌드 타입에도 별도 처리 없이 그대로 들어감
- `home/api/dto/HomeDto.kt`, `home/domain/model/UserProfile.kt` — 출석(streak) API 스펙 미확정, 관련 필드 자체가 없음
- `mypage/mapper/MyPageMapper.kt` — 세션 제목/총 문장 수가 `""`, `100`으로 고정(`// TODO: API 필드 추가 후 연결`)
- 클라이언트가 평문 HTTP로 통신 — 오디오 파일(개인 음성 데이터) 포함 모든 트래픽이 TLS 없이 전송됨

## 회고

- 서버 스냅샷의 상태(DB 설정 모순, 게임 도메인 부재, 평가 로직 스텁)를 보면 **이 프로젝트는 클라이언트가 기획한 기능을 서버가 다 따라가지 못한 채 데모/발표 시점을 맞은 것**으로 보인다. 실제로 발표에서 어떻게 시연했는지(하드코딩된 점수로 시연했을 가능성)는 코드만으로는 알 수 없다.
- 클라이언트 코드 품질(Canvas 시각화, MVI 부분 도입, feature 패키지 구조)은 서버보다 확실히 앞서 있다 — PL 겸 프론트엔드 전담이었다는 역할 설명과 일치한다.
- 리포지토리가 각각 1커밋(스쿼시/익스포트된 스냅샷)이라 실제 개발 과정(언제 MVI를 도입했는지, DB를 언제 MySQL로 바꾸려 했는지)은 git history로 추적 불가능했다. 나중에 시리즈 글을 쓸 때는 "당시 기억"에 의존해야 하는 부분과 "이 스냅샷에서 코드로 확인 가능한 부분"을 구분해서 써야 한다.

## 코드 구조 메모

- feature 패키지 8개 중 5-레이어(api/domain/mapper/presentation/repository)를 완전히 갖춘 건 study/game/home/mypage뿐. content/profile/stats/auth는 각각 다른 축약 구조 — "일관된 레이어드 아키텍처"라고 뭉뚱그리면 부정확하다.
- `GamePlayContract.kt`/`GamePlayViewModel.kt`에 "✅ 추가", "✅ 수정: 일반 변수로 변경 + init에서 복원" 같은 한글 코멘트가 남아 있어, `hasAutoPlayed`를 처음엔 State로만 관리하다 프로세스 재생성 대응을 위해 SavedStateHandle 백업으로 리팩터링한 히스토리가 코드 자체에 남아있다.

## 시리즈 계획 (shadoweng-deep-dive, 가칭)

article 작성될 때마다 아래 체크만 갱신. 괄호는 이 아카이브에서 참고할 섹션.

- [ ] 1. Canvas로 발음 오류를 문장 위에 그리기 (`getBoundingBox` 활용) — *(Canvas 기반 발음 오류 시각화)*
- [ ] 2. 화면 하나에만 MVI를 쓴 이유 — 아키텍처를 섞어도 되는가 — *(Architecture, 기술 선택 이유)*
- [ ] 3. API 계약이 어긋나면 무슨 일이 생기는가 (클라이언트-서버 불일치 실전 사례) — *(클라이언트-서버 API 계약 불일치)*
- [ ] 4. 비전공자 팀원과 함께 일정 안에 앱을 완성하기 (PL 회고) — *(회고)*

> 각 article의 `projects` 필드는 `shadoweng`(포트폴리오 엔트리)에만 연결한다. 이 아카이브(`shadoweng-archive`)는 연결 대상이 아니다 (DESIGN_RULES 4-3).
