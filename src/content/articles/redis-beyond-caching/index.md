---
title: Redis의 캐시 외 다른 역할 정리
description: Redis가 캐시 말고도 세션 스토어, Pub/Sub, 레이트 리미터, 드물게는 주 데이터베이스로도 쓰이는 이유를 정리한다
date: 2026-08-29
updated:
category: infra
technology: [redis]
tags: [session-store, rate-limiting]
type: study
status: evergreen
series:
projects:
related: [redis-basics]
aliases:
draft: true
---

## 한 줄 요약

Redis가 빠른 이유(인메모리 저장 + 원자적 연산을 지원하는 단순 자료구조)는 캐시뿐 아니라 세션, 실시간 메시징, 요청 제한, 드물게는 주 데이터베이스까지 재사용되는 근거가 된다.

## 왜 (배경/문제 상황)

[Redis 자료구조와 캐싱 전략](../redis-basics/)에서는 캐시 용도만 다뤘는데, Redis는 캐시로만 쓰이는 게 아니다. 실제로 어떤 역할들을 더 하는지, 그리고 각각이 왜 Redis랑 잘 맞는지를 정리한다.

## 본문

### 세션 스토어

로그인 세션을 단일 서버 메모리에 두면 서버를 여러 대로 늘렸을 때(로드밸런싱) 세션 공유가 안 되고, DB에 두면 매 요청마다 DB를 거쳐야 해서 느리다. Redis에 세션을 두면 여러 API 서버가 세션을 공유할 수 있고, TTL로 자동 만료도 자연스럽게 처리된다.

```bash
SET session:abc123 '{"userId": 42}' EX 3600
```

다만 [캐싱 전략 글](../redis-basics/)에서 짚었듯 `volatile-lru` 같은 eviction 정책이 걸려 있으면 TTL이 있는 세션 키도 메모리 압박 상황에서 지워질 수 있다. 세션이 캐시 데이터와 같은 인스턴스에서 지워지면 안 되는 경우, 세션 전용 Redis(또는 DB 번호)를 캐시와 분리하는 게 안전하다.

### Pub/Sub — 실시간 메시징

`PUBLISH`/`SUBSCRIBE` 명령으로 채널 기반 메시지 브로드캐스트를 할 수 있다.

```bash
SUBSCRIBE notifications
PUBLISH notifications "새 메시지 도착"
```

Pub/Sub은 메시지를 저장하지 않는다 — 구독 시점 이후의 메시지만 받고, 구독 전에 발행된 메시지나 구독자가 끊겨 있던 동안의 메시지는 그냥 사라진다. 로그로 남겨서 나중에도 다시 읽을 수 있는 Kafka와는 성격이 다르다. "지금 연결된 클라이언트에게 실시간으로만 알리면 충분한" 경우(실시간 채팅 알림, 온라인 상태 브로드캐스트)에 적합하고, 메시지가 반드시 전달되어야 하는 경우엔 맞지 않는다.

### 레이트 리미터

`INCR`과 `EXPIRE`를 조합하면 "N초에 M번" 같은 요청 제한을 간단히 구현할 수 있다.

```python
key = f"rate:{user_id}"
count = redis.incr(key)
if count == 1:
    redis.expire(key, 60)  # 첫 요청일 때만 60초 윈도우 시작
if count > 100:
    raise TooManyRequests()
```

`INCR`은 원자적(atomic) 연산이라, 동시에 여러 요청이 몰려도 카운트가 꼬이지 않는다 — 이게 Redis가 레이트 리미터로 자주 쓰이는 핵심 이유다.

### 직접 살펴보기 — 고정 윈도우 레이트 리미터

1초당 5회로 제한된 상황에서 "요청 보내기"를 눌러 카운터가 어떻게 증가하고, 한도를 넘으면 어떻게 막히는지 확인한다.

<div class="ratedemo">
<style>
.ratedemo {
  --ink: #1c1917; --sub: #6b7280; --line: #e5e7eb; --card: #fafafa; --card2: #f4f4f5;
  --accent: #466b8f; --bad: #b91c1c;
  font-family: 'Pretendard', system-ui, sans-serif; font-size: 14px; line-height: 1.6; color: var(--ink);
  border: 1px solid var(--line); border-radius: 16px; padding: 20px; background: var(--card); margin: 24px 0;
}
.dark .ratedemo { --ink: #e5e7eb; --sub: #9ca3af; --line: #374151; --card: #18181b; --card2: #27272a; --accent: #8fadc7; --bad: #f87171; }
.ratedemo .status { display: flex; gap: 16px; align-items: center; margin-bottom: 12px; }
.ratedemo .count { font-family: 'Fira Code', monospace; font-weight: 800; font-size: 22px; color: var(--accent); }
.ratedemo .count.over { color: var(--bad); }
.ratedemo .limit { font-size: 12px; color: var(--sub); }
.ratedemo .controls { display: flex; gap: 10px; margin-bottom: 12px; }
.ratedemo .btn { background: var(--ink); color: var(--card); border: 0; border-radius: 8px; padding: 9px 16px; font-family: inherit; font-weight: 700; font-size: 13px; cursor: pointer; }
.ratedemo .btn.secondary { background: transparent; color: var(--ink); border: 1px solid var(--line); }
.ratedemo .log { max-height: 130px; overflow-y: auto; font-family: 'Fira Code', monospace; font-size: 12px; border: 1px solid var(--line); border-radius: 8px; padding: 8px 10px; background: var(--card2); }
.ratedemo .log div.pass { color: var(--accent); }
.ratedemo .log div.block { color: var(--bad); font-weight: 700; }
.ratedemo .log div.reset { color: var(--sub); font-style: italic; }
</style>

<div class="status">
  <div><span class="count" id="rd_count" aria-live="polite">0</span> <span class="limit">/ 5 (1초 윈도우)</span></div>
</div>
<div class="controls">
  <button class="btn" id="rd_send">요청 보내기</button>
  <button class="btn secondary" id="rd_reset">윈도우 리셋 (EXPIRE 발동 시뮬레이션)</button>
</div>
<div class="log" id="rd_log"></div>
</div>

<script>
(function () {
  const root = document.currentScript.previousElementSibling;
  if (!root || !root.classList.contains('ratedemo')) return;
  const countEl = root.querySelector('#rd_count');
  const sendBtn = root.querySelector('#rd_send');
  const resetBtn = root.querySelector('#rd_reset');
  const logEl = root.querySelector('#rd_log');
  const LIMIT = 5;
  let count = 0;

  function log(text, cls) {
    const line = document.createElement('div');
    line.className = cls;
    line.textContent = text;
    logEl.prepend(line);
  }
  function updateCount() {
    countEl.textContent = String(count);
    countEl.classList.toggle('over', count > LIMIT);
  }
  sendBtn.addEventListener('click', () => {
    count++;
    updateCount();
    if (count === 1) log('INCR → 1, EXPIRE 1s 설정 (윈도우 시작)', 'pass');
    else if (count <= LIMIT) log(`INCR → ${count}, 통과`, 'pass');
    else log(`INCR → ${count}, 한도(${LIMIT}) 초과 → 429 Too Many Requests`, 'block');
  });
  resetBtn.addEventListener('click', () => {
    count = 0;
    updateCount();
    log('1초 경과, 키 만료(EXPIRE) → 카운터 리셋', 'reset');
  });
})();
</script>

### 리더보드 / 실시간 순위

Sorted Set(ZSET)으로 점수 기반 순위를 항상 정렬된 상태로 유지할 수 있다 — [Redis 기초 글](../redis-basics/)에서 다룬 자료구조를 그대로 재활용하는 사례다.

### 드물게는 주 데이터베이스로

Redis는 RDB(스냅샷)나 AOF(append-only log)로 디스크에 영속화할 수 있어서, 완전한 휘발성 캐시가 아니라 디스크 백업이 있는 데이터베이스처럼 쓸 수도 있다. 다만 관계형 쿼리(JOIN), 복잡한 트랜잭션, 강한 일관성이 필요한 데이터에는 맞지 않는다 — "단순한 키-값/집계 위주 데이터가 메모리에 다 올라갈 만큼 작다"는 조건에서만 고려해볼 만하다.

### 왜 이렇게 다양하게 재사용되나

공통 이유는 두 가지다. 메모리 기반이라 빠르고, `INCR`/`EXPIRE`/`ZADD` 같은 연산 자체가 원자적으로 지원돼서 애플리케이션이 직접 락이나 동시성 제어를 구현할 필요가 없어진다.

## 예제

위 데모와 같은 고정 윈도우(fixed window) 레이트 리미터의 흐름을 텍스트로 정리하면 이렇다.

```text
1번째 요청 (t=0.1s): INCR → 1, EXPIRE 1s 설정 → 통과
2~5번째 요청 (t=0.2~0.9s): INCR → 2~5 → 통과
6번째 요청 (t=0.95s): INCR → 6 → 한도 초과, 429 반환
7번째 요청 (t=1.1s): 키가 만료되어 다시 INCR → 1 → 통과 (새 윈도우 시작)
```

## 주의사항

- 고정 윈도우 방식은 윈도우 경계에서 순간적으로 두 배 가까운 트래픽이 통과할 수 있는 허점이 있다 (예: 0.9초에 5개, 1.1초에 5개가 통과하면 0.2초 사이에 10개가 지나간다). 더 정교하게 제한하려면 슬라이딩 윈도우나 토큰 버킷 알고리즘을 고려한다.
- Pub/Sub은 메시지를 저장하지 않기 때문에, 구독자 연결이 잠깐이라도 끊기면 그 사이 메시지는 영영 유실된다. 반드시 전달돼야 하는 메시지에는 Pub/Sub 대신 Kafka 같은 로그 기반 시스템이나 Redis Streams(별도 자료구조)를 고려한다.
- Redis를 주 데이터베이스로 쓰기로 했다면, 영속화 설정(RDB 스냅샷 주기, AOF 사용 여부)과 백업 전략을 반드시 함께 설계해야 한다 — 기본 설정만으로는 데이터 유실 위험이 있다.

## 참고자료

- redis.io (Redis 공식 문서)
- [Redis 자료구조와 캐싱 전략](../redis-basics/)
