---
title: WebSocket과 SSE를 같이 쓴 이유 — 같은 인증 문제를 다르게 우회하기
description: WebSocket과 SSE의 차이를 정리하고, NGRAS가 왜 둘을 용도별로 나눠 썼는지, 인증 헤더 문제를 각각 다르게 우회한 이유를 정리한다.
date: 2026-08-22
updated: 2026-08-22
category: development
technology: [react, typescript, websocket, sse]
tags: [realtime, browser-api]
type: study
status: evergreen
series:
  name: ngras-deep-dive
  order: 1
projects:
  - ngras
draft: false
---

> **이 글의 코드는 실제 프로덕션 코드를 그대로 옮긴 게 아니다.** NGRAS는 보안망 내부에서 개발한 사내 프로젝트라 실제 소스를 그대로 공개할 수 없어서, 사용한 기술과 구현 방식에 대한 기억을 바탕으로 AI가 다시 작성한 예시 코드로 대체했다. 구조와 흐름은 실제와 같지만, 변수명·엔드포인트·세부 구현은 그대로 옮긴 것이 아니다.

## 한 줄 요약

WebSocket과 SSE의 근본적인 차이를 정리하고, NGRAS가 이 둘을 용도에 따라 나눠 쓴 이유, 그리고 인증 헤더를 못 붙이는 같은 문제를 각각 다른 방식으로 우회한 이유를 정리한다.

## 왜 (배경/문제 상황)

"실시간이면 다 WebSocket 아니야?"라고 생각하기 쉽지만, NGRAS는 WebSocket과 SSE를 용도별로 나눠 썼다. 하드웨어 인증 시험 자동화 콘솔이라는 특성상 계측기·AI 서버·프론트엔드·여러 사용자가 뒤섞여 통신해야 했고, 이 다방향성 때문에 WebSocket을 기본 실시간 채널로 골랐다. 반면 AI가 생성하는 시험 계획·리포트처럼 "서버가 쏴주기만 하면 끝"인 데이터는 SSE로 처리했다. 그리고 두 채널 다 JWT 인증이 필요했는데, 브라우저 표준 API 두 개가 똑같이 "커스텀 헤더를 못 붙인다"는 문제를 갖고 있어서 서로 다른 방식으로 우회해야 했다.

## 본문

### 1. WebSocket과 SSE, 근본적인 차이

| | WebSocket | SSE(Server-Sent Events) |
|---|---|---|
| 방향 | 양방향(full-duplex) | 서버 → 클라이언트 단방향 |
| 데이터 형식 | 텍스트·바이너리 모두 | 텍스트(UTF-8)만 |
| 연결 방식 | HTTP Upgrade로 별도 프로토콜(`ws://`)로 전환 | 일반 HTTP 연결 위에서 그대로 동작 |
| 자동 재연결 | 없음(직접 구현 필요) | 브라우저 `EventSource`가 기본 제공 |
| 브라우저 API | `WebSocket` | `EventSource` |

WebSocket은 클라이언트도 서버에 언제든 메시지를 보낼 수 있는 양방향 채널이고, SSE는 애초에 "서버가 계속 보내주기만 하는" 단방향 스트리밍을 위해 설계된 프로토콜이다. 이 차이 때문에 SSE는 HTTP 위에서 그대로 동작하고 재연결까지 브라우저가 알아서 처리해주지만, 대신 클라이언트 → 서버 방향으로는 이 채널로 아무것도 보낼 수 없다.

### 2. NGRAS가 실제로 나눠 쓴 방식

- **WebSocket**: `/ws/tasks/{task_id}`(개별 작업 진행률), `/ws/queue`(전체 대기열 현황). 계측기 제어·AI 서버·여러 사용자가 얽힌 시스템 전반의 기본 실시간 채널로 WebSocket을 먼저 깔았다.
- **SSE**: `/sse/tasks/{task_id}`. AI가 생성하는 시험 계획·리포트를 토큰 단위로 스트리밍하는 데 썼다. 이 데이터는 서버 → 클라이언트로만 흐르고, 중간에 클라이언트가 뭔가를 보내야 할 일이 없다.

하드웨어 인증 테스트 시스템은 계측기 제어, AI 에이전트, 프론트엔드, 여러 사용자가 동시에 얽혀 있어서 "언제 어느 쪽에서 먼저 메시지를 보내야 할지" 예측하기 어려운 지점이 많았다. 그래서 시스템 전반의 기본 실시간 인프라는 양방향이 가능한 WebSocket으로 깔아두고, 그중 확실히 단방향 스트리밍만 필요한 AI 생성 결과 쪽에만 SSE를 별도로 추가했다.

### 3. 같은 문제, 다른 우회: 인증 헤더

WebSocket과 SSE 둘 다 JWT 인증이 필요했는데, 브라우저가 제공하는 표준 API 두 개가 공교롭게도 똑같은 제약을 갖고 있었다 — **커스텀 헤더를 붙일 방법이 없다.**

**SSE 쪽 우회**: `EventSource`는 헤더를 설정하는 옵션 자체가 없다. 대신 `fetch`는 요청 헤더를 완전히 통제할 수 있는 저수준 API이므로, `EventSource`를 쓰지 않고 `fetch` + `ReadableStream`으로 SSE 스트림을 직접 파싱했다.

```ts
const response = await fetch(`/sse/tasks/${taskId}`, {
  headers: { Authorization: `Bearer ${accessToken}` },
})
const reader = response.body!.getReader()
const decoder = new TextDecoder()
let buffer = ''

while (true) {
  const { done, value } = await reader.read()
  if (done) break
  buffer += decoder.decode(value, { stream: true })

  // SSE 이벤트는 빈 줄로 구분되는데, 줄바꿈이 \n\n·\r\n\r\n·\r\r 세 가지로 올 수 있어 정규화부터 한다
  const events = buffer.split(/\r\n\r\n|\n\n|\r\r/)
  buffer = events.pop() ?? '' // 아직 안 끝난 조각은 다음 루프까지 보관
  for (const raw of events) {
    handleSseEvent(raw)
  }
}
```

**WebSocket 쪽 우회**: `WebSocket` 생성자는 `new WebSocket(url, protocols)` 형태로, 애초에 헤더를 받는 파라미터 자체가 없다. 두 번째 인자(`protocols`)는 서브프로토콜 협상용이라 인증 토큰을 실을 용도가 아니다. 쿠키 기반 세션이나 연결 후 첫 메시지로 인증 정보를 보내는 방식도 대안이 될 수 있지만, 이 프로젝트는 JWT를 헤더로 검증하는 기존 인증 방식을 그대로 재사용하고 싶었기 때문에 다른 우회를 택했다 — 먼저 `POST /auth/ws-token`으로 단기 유효 토큰을 발급받고, 그 토큰을 쿼리스트링에 담아 WebSocket을 연다.

```ts
const { token } = await postAuthWsToken() // 단기 토큰 발급
const socket = new WebSocket(`wss://api.example.com/ws/tasks/${taskId}?token=${token}`)
```

같은 "커스텀 헤더 불가"라는 제약인데도 우회 방식이 다른 이유는 간단하다. SSE는 `fetch`라는 대체 저수준 API가 있어서 헤더를 그대로 살릴 수 있지만, WebSocket 연결 자체를 대체할 저수준 API는 브라우저에 없다. 그래서 SSE는 "헤더를 어떻게든 붙이는" 방향으로, WebSocket은 "헤더 대신 다른 방법으로 신원을 증명하는" 방향으로 풀 수밖에 없었다.

### 4. "여기는 SSE가 더 맞았을 것" — 자체적으로 인지한 아쉬움

`/ws/tasks/{task_id}`를 다시 들여다보면, 이 채널은 실제로 서버 → 클라이언트로만 이벤트가 흐른다. 클라이언트가 이 채널로 뭔가를 보내는 일은 없다. 그런데도 WebSocket을 썼기 때문에, WebSocket의 핵심 장점(양방향)은 하나도 못 쓰면서 단점(연결이 끊기면 재연결을 직접 구현해야 하는 것 등)만 그대로 진다. SSE였다면 애초에 단방향 스트리밍용으로 설계된 프로토콜이라 재연결까지 브라우저가 알아서 처리해줬을 것이다.

시스템 전체를 놓고 보면 "계측기·AI·여러 사용자가 얽힌 다방향 통신이 많으니 기본 채널을 WebSocket으로 통일하자"는 판단 자체는 합리적이었다. 다만 그 판단을 채널 하나하나에 그대로 적용하다 보니, `/ws/tasks/{task_id}`처럼 실제로는 단방향인 채널까지 WebSocket으로 남았다. "시스템 전체의 기본값"과 "개별 채널에 맞는 최선"이 항상 같지는 않다는 걸 보여주는 사례에 가깝다.

## 예제

두 채널을 한 화면에서 같이 쓰는 경우를 정리하면 이렇다.

```ts
// 작업 진행률 — WebSocket (양방향 인프라를 그대로 사용)
const progressSocket = new WebSocket(`wss://api.example.com/ws/tasks/${taskId}?token=${wsToken}`)
progressSocket.onmessage = (event) => updateProgress(JSON.parse(event.data))

// AI 리포트 스트리밍 — SSE (단방향 전용, fetch로 헤더 인증)
streamReport(taskId, accessToken, (chunk) => appendReportText(chunk))
```

같은 화면 안에서도 "이 데이터가 양방향이 필요한가, 아니면 서버가 쏴주기만 하면 끝인가"를 기준으로 채널을 나눠 쓸 수 있다.

## 주의사항

- SSE는 텍스트만 보낼 수 있다. 바이너리 데이터가 필요하면 Base64 인코딩을 거치거나 WebSocket을 써야 한다.
- `fetch` + `ReadableStream`으로 SSE를 직접 파싱하면, `EventSource`가 기본 제공하는 자동 재연결·`Last-Event-ID` 기반 재개를 직접 구현해야 한다.
- WebSocket을 쿼리스트링 토큰으로 인증할 때는 토큰 수명을 짧게 두는 게 중요하다. URL은 서버 로그·프록시 로그 등에 그대로 남을 수 있어서, 일반 Authorization 헤더보다 노출 경로가 넓다.
- 어떤 채널이 정말 양방향이 필요한지는 "지금 이 데이터가 실제로 양쪽에서 오가는가"로 판단해야 한다. "실시간이니까 WebSocket"이라는 기본값을 채널마다 다시 검토하지 않으면, 이 글의 3번 사례처럼 단방향 데이터에 양방향 인프라를 계속 끌고 가게 된다.
