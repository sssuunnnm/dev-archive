---
title: Redis 자료구조와 캐싱 전략
description: Redis의 주요 자료구조와 쓰임새, 그리고 캐시로 쓸 때 정합성과 성능을 함께 잡는 전략을 정리한다
date: 2026-08-26
updated:
category: infra
technology: [redis]
tags: [caching, in-memory]
type: study
status: evergreen
series:
projects:
related:
aliases:
draft: true
---

## 한 줄 요약

Redis는 메모리에 데이터를 두고 다양한 자료구조로 접근 패턴에 맞는 성능을 내는 저장소이고, 캐시로 쓸 때는 자료구조 선택보다 "언제 채우고 언제 지울지"가 더 중요하다.

## 왜 (배경/문제 상황)

DB 조회가 느려서 앞단에 캐시를 두는 경우가 흔한데, Redis를 그냥 단순 key-value 저장소로만 쓰면 자료구조가 제공하는 이점을 놓친다. 또 "캐시에 값이 있으면 쓰고 없으면 DB에서 가져온다"는 기본 아이디어는 간단해 보여도, 언제 캐시를 채우고 언제 무효화할지를 명확히 하지 않으면 정합성이 깨지거나 특정 순간에 DB로 요청이 몰리는 문제가 생긴다.

## 본문

### 자주 쓰는 자료구조

| 자료구조 | 용도 | 대표 명령어 |
|---|---|---|
| String | 단순 값 캐시, 카운터 | `SET`, `GET`, `INCR` |
| List | 최근 N개 항목, 간단한 큐 | `LPUSH`, `RPOP`, `LRANGE` |
| Hash | 객체 하나를 필드별로 저장 | `HSET`, `HGET`, `HGETALL` |
| Set | 중복 없는 멤버십 체크 | `SADD`, `SISMEMBER` |
| Sorted Set (ZSET) | 점수 기반 정렬, 랭킹 | `ZADD`, `ZRANGE`, `ZINCRBY` |

```bash
SET user:1:name "sun"          # String — 단순 값
INCR page:home:views           # String — 조회수 카운터
HSET user:1 name sun age 20    # Hash — 유저 객체를 필드별로
SADD post:1:likes user:1       # Set — 좋아요 누른 유저 집합 (중복 자동 제거)
ZADD ranking 120 user:1        # Sorted Set — 점수(120)로 랭킹에 등록
ZRANGE ranking 0 9 REV         # Sorted Set — 상위 10명 조회
```

객체 하나를 통째로 JSON 문자열로 String에 넣을 수도 있지만, 필드 일부만 자주 갱신한다면 Hash로 나눠두는 게 그 필드만 따로 읽고 쓸 수 있어 유리하다. 랭킹처럼 "정렬된 상태를 유지해야 하는" 데이터는 애플리케이션에서 매번 정렬하는 대신 Sorted Set에 맡기는 게 자연스럽다.

### TTL과 만료 정책

캐시로 쓸 때는 거의 항상 만료 시간(TTL)을 같이 설정한다.

```bash
SET session:abc123 "user:1" EX 3600   # 3600초(1시간) 뒤 자동 삭제
TTL session:abc123                    # 남은 만료 시간 확인
```

메모리가 가득 찼을 때 무엇을 먼저 지울지는 `maxmemory-policy` 설정으로 정한다. 대표적으로 `allkeys-lru`(전체 키 중 최근 안 쓴 것부터), `volatile-lru`(TTL 걸린 키 중에서만 LRU), `noeviction`(더 안 지우고 쓰기 실패) 등이 있다. 캐시 용도로만 쓰는 Redis라면 `allkeys-lru` 계열을, 세션처럼 잃으면 안 되는 데이터가 섞여 있다면 `volatile-lru`를 주로 쓴다.

### 캐싱 전략 패턴

- **Cache-Aside (Lazy Loading)**: 애플리케이션이 캐시를 먼저 찾고, 없으면(miss) DB에서 읽어와 캐시에 채운 뒤 응답한다. 가장 흔하게 쓰는 패턴이다.
- **Write-Through**: 데이터를 쓸 때 DB와 캐시를 동시에 갱신한다. 캐시가 항상 최신 상태를 유지하지만, 쓰기 경로가 느려진다.
- **Write-Behind (Write-Back)**: 캐시에 먼저 쓰고, DB 반영은 비동기로 나중에 한다. 쓰기는 빠르지만 캐시가 유실되면 DB에 반영 안 된 데이터가 사라질 위험이 있다.

셋 중 정합성 요구가 크게 까다롭지 않은 일반적인 조회 캐시라면 Cache-Aside로 시작하는 경우가 많다.

### 직접 살펴보기 — 캐시 히트 vs 캐시 미스 흐름 비교

같은 요청이 캐시에 있을 때(Hit)와 없을 때(Miss) 어떤 경로를 타는지 비교한다.

<div class="cachedemo">
<style>
.cachedemo {
  --ink: #1c1917; --sub: #6b7280; --line: #e5e7eb; --card: #fafafa; --card2: #f4f4f5;
  --accent: #466b8f; --bad: #b45309;
  font-family: 'Pretendard', system-ui, sans-serif; font-size: 14px; line-height: 1.6; color: var(--ink);
  border: 1px solid var(--line); border-radius: 16px; padding: 20px; background: var(--card); margin: 24px 0;
}
.dark .cachedemo { --ink: #e5e7eb; --sub: #9ca3af; --line: #374151; --card: #18181b; --card2: #27272a; --accent: #8fadc7; --bad: #d99a4e; }
.cachedemo .toggle { display: flex; gap: 8px; margin-bottom: 16px; }
.cachedemo .togbtn {
  flex: 1; background: var(--card2); color: var(--ink); border: 1px solid var(--line); border-radius: 8px;
  padding: 9px 12px; font-family: inherit; font-weight: 700; font-size: 13px; cursor: pointer;
}
.cachedemo .togbtn[aria-pressed="true"] { background: var(--accent); color: var(--card); border-color: var(--accent); }
.cachedemo .flow { display: flex; align-items: center; flex-wrap: wrap; gap: 6px; }
.cachedemo .step { border-radius: 6px; padding: 8px 10px; font-size: 12.5px; border: 1px solid var(--line); background: var(--card2); }
.cachedemo .step.extra { border-color: var(--bad); color: var(--bad); font-weight: 700; }
.cachedemo .arrow { color: var(--sub); font-size: 13px; }
.cachedemo .summary { margin-top: 12px; font-size: 12.5px; color: var(--sub); }
.cachedemo .summary b { color: var(--ink); }
</style>

<div class="toggle">
  <button class="togbtn" id="cache_hit" aria-pressed="true">캐시 히트</button>
  <button class="togbtn" id="cache_miss" aria-pressed="false">캐시 미스</button>
</div>
<div id="cache_flow" aria-live="polite"></div>
</div>

<script>
(function () {
  const root = document.currentScript.previousElementSibling;
  if (!root || !root.classList.contains('cachedemo')) return;
  const hitBtn = root.querySelector('#cache_hit');
  const missBtn = root.querySelector('#cache_miss');
  const flowEl = root.querySelector('#cache_flow');

  function renderHit() {
    flowEl.innerHTML = `
      <div class="flow">
        <div class="step">요청 도착</div><span class="arrow">→</span>
        <div class="step">Redis 조회</div><span class="arrow">→</span>
        <div class="step">있음 (Hit)</div><span class="arrow">→</span>
        <div class="step">바로 응답</div>
      </div>
      <div class="summary">DB까지 안 가고 <b>Redis 조회 한 번</b>으로 끝난다.</div>
    `;
  }
  function renderMiss() {
    flowEl.innerHTML = `
      <div class="flow">
        <div class="step">요청 도착</div><span class="arrow">→</span>
        <div class="step">Redis 조회</div><span class="arrow">→</span>
        <div class="step">없음 (Miss)</div><span class="arrow">→</span>
        <div class="step extra">DB 조회</div><span class="arrow">→</span>
        <div class="step extra">Redis에 저장(TTL)</div><span class="arrow">→</span>
        <div class="step">응답</div>
      </div>
      <div class="summary">주황색 두 단계가 <b>Miss일 때만</b> 추가로 발생하는 경로다 — DB 왕복만큼 느려진다.</div>
    `;
  }
  function select(which) {
    hitBtn.setAttribute('aria-pressed', String(which === 'hit'));
    missBtn.setAttribute('aria-pressed', String(which === 'miss'));
    which === 'hit' ? renderHit() : renderMiss();
  }
  hitBtn.addEventListener('click', () => select('hit'));
  missBtn.addEventListener('click', () => select('miss'));
  select('hit');
})();
</script>

### 캐시 스탬피드(Cache Stampede) 문제

인기 있는 키 하나가 만료되는 순간, 그 키를 찾던 요청들이 동시에 전부 캐시 미스를 겪고 한꺼번에 DB로 몰리는 현상이다. 트래픽이 많은 키일수록 이 순간의 DB 부하가 급격히 튄다. 완화하는 방법으로는:

- **락(Mutex) 방식**: 한 요청만 DB 조회 + 캐시 갱신을 하고, 나머지는 기다리거나 캐시가 채워질 때까지 잠깐 대기한다.
- **TTL에 지터(jitter) 추가**: 같은 시점에 만료되는 키가 몰리지 않도록, TTL에 약간의 랜덤 값을 더해 만료 시점을 분산시킨다.
- **확률적 조기 갱신**: 만료 시점이 가까워질수록 갱신을 미리 시도할 확률을 높여서, 정확히 만료되는 순간에 몰리는 걸 줄인다.

## 예제

Cache-Aside 패턴을 의사 코드로 보면 이렇다.

```javascript
async function getUser(userId) {
  const cacheKey = `user:${userId}`;
  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached); // Hit — 바로 반환

  const user = await db.query('SELECT * FROM users WHERE id = ?', [userId]); // Miss — DB 조회
  await redis.set(cacheKey, JSON.stringify(user), 'EX', 3600); // 캐시에 채우기 (TTL 1시간)
  return user;
}
```

## 주의사항

- 데이터를 갱신할 때 "캐시를 먼저 지울지, DB를 먼저 갱신할지" 순서에 따라 짧은 순간 오래된 값이 다시 캐시에 채워질 수 있다. 일반적으로는 DB를 먼저 갱신하고 그다음 캐시를 무효화하는 순서를 권장하지만, 이 방식도 두 작업 사이에 다른 요청이 끼어들면 완벽하게 안전하지는 않다 — 정합성이 특히 중요한 데이터는 별도의 락이나 버전 관리를 고려해야 한다.
- 모든 데이터를 캐시하는 게 능사는 아니다. DB에서 다시 만들어낼 수 없는 데이터(캐시가 유일한 원본인 경우)를 캐시에만 두면, 장애 시 데이터가 사라진다. 캐시는 "다시 계산/조회 가능한" 데이터에만 쓴다.
- Redis 인스턴스 하나에만 의존하면 그 자체가 단일 장애점이 된다. 가용성이 중요하면 Redis Sentinel(장애 감지·자동 페일오버)이나 Redis Cluster(샤딩) 구성을 고려한다.

## 참고자료

- Redis 공식 문서(redis.io)
