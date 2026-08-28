---
title: Kafka 기본 개념 - 토픽, 파티션, 컨슈머 그룹
description: Kafka가 메시지를 어떻게 저장하고 여러 소비자가 나눠 읽게 하는지, 토픽/파티션/컨슈머 그룹 설계가 왜 그런 모양인지 정리한다
date: 2026-08-28
updated:
category: infra
technology: [kafka]
tags: [messaging, event-driven]
type: study
status: evergreen
series:
projects:
related:
aliases:
draft: true
---

## 한 줄 요약

Kafka는 메시지를 "토픽"이라는 로그에 순서대로 쌓아두고, 여러 소비자가 각자의 속도로 읽어가게 해주는 분산 이벤트 스트리밍 플랫폼이다.

## 왜 (배경/문제 상황)

서비스가 커지면 한 서비스에서 일어난 이벤트를 여러 다른 서비스가 각자 비동기로 알아야 하는 경우가 흔해진다 — 주문이 생성되면 재고 차감, 알림 발송, 로그 적재가 동시에 필요한 식이다. 단순 메시지 큐는 메시지 하나를 누가 가져가면 사라지는 구조라, 같은 이벤트를 여러 소비자가 각자 처리하게 만들기 어렵고 장애 시 재처리도 까다롭다. Kafka는 메시지를 소비해도 바로 지우지 않는 "로그" 구조로 이 문제를 해결한다.

## 본문

### 핵심 개념 한눈에

| 개념 | 설명 |
|---|---|
| Topic | 메시지를 종류별로 구분하는 채널 (예: `order-created`) |
| Partition | 토픽을 나눈 물리적 로그 단위. 병렬 처리와 순서 보장의 단위 |
| Producer | 토픽에 메시지를 쓰는 주체 |
| Consumer | 토픽에서 메시지를 읽는 주체 |
| Consumer Group | 여러 컨슈머가 파티션을 나눠 가지며 협업 소비하는 단위 |
| Offset | 파티션 안에서 각 메시지의 위치(순번) |
| Broker | Kafka 서버 인스턴스. 여러 개가 모여 클러스터를 이룸 |

### 토픽과 파티션

토픽은 "메시지 종류"를 구분하는 논리적 단위이고, 파티션은 그 토픽을 물리적으로 쪼갠 로그다.

```text
Topic: order-created
├── Partition 0: [msg1, msg4, msg7, ...]
├── Partition 1: [msg2, msg5, msg8, ...]
└── Partition 2: [msg3, msg6, msg9, ...]
```

같은 파티션 안에서는 메시지 순서가 보장되지만, 파티션이 여러 개면 파티션 간 순서는 보장되지 않는다. 메시지를 어느 파티션에 보낼지는 보통 key의 해시로 정하는데, 같은 key는 항상 같은 파티션으로 가기 때문에 "그 key에 대해서는" 순서가 보장된다 (예: 같은 주문 ID의 이벤트들은 항상 같은 파티션에 순서대로 쌓인다).

파티션 수를 늘리면 병렬로 처리할 수 있는 컨슈머 수도 늘어나지만, 한번 늘린 파티션 수는 줄이기 어렵고 key 기반 순서 보장 범위도 달라지므로 신중히 정해야 한다.

### 컨슈머 그룹 — 왜 이렇게 설계됐나

컨슈머 그룹은 "같은 그룹 안의 컨슈머들이 파티션을 나눠 갖는다"는 규칙 하나로 두 가지 문제를 동시에 푼다.

- **병렬 처리**: 파티션이 3개, 컨슈머가 3개면 각자 파티션 하나씩 맡아 동시에 처리한다.
- **다중 소비자**: 그룹을 다르게 두면, 같은 토픽을 완전히 독립적으로 여러 그룹이 각자 처음부터 끝까지 읽을 수 있다 (예: "재고 차감" 그룹과 "알림 발송" 그룹이 같은 `order-created` 토픽을 각자 소비).

### 직접 살펴보기 — 컨슈머 수에 따라 파티션이 어떻게 배분되나

파티션 3개짜리 토픽에 같은 그룹의 컨슈머 수를 바꿔가며, 파티션이 어떻게 나뉘는지 비교한다.

<div class="kafkademo">
<style>
.kafkademo {
  --ink: #1c1917; --sub: #6b7280; --line: #e5e7eb; --card: #fafafa; --card2: #f4f4f5;
  --accent: #466b8f; --idle: #b45309;
  font-family: 'Pretendard', system-ui, sans-serif; font-size: 14px; line-height: 1.6; color: var(--ink);
  border: 1px solid var(--line); border-radius: 16px; padding: 20px; background: var(--card); margin: 24px 0;
}
.dark .kafkademo { --ink: #e5e7eb; --sub: #9ca3af; --line: #374151; --card: #18181b; --card2: #27272a; --accent: #8fadc7; --idle: #d99a4e; }
.kafkademo .toggle { display: flex; gap: 8px; margin-bottom: 16px; }
.kafkademo .togbtn {
  flex: 1; background: var(--card2); color: var(--ink); border: 1px solid var(--line); border-radius: 8px;
  padding: 9px 10px; font-family: inherit; font-weight: 700; font-size: 12.5px; cursor: pointer;
}
.kafkademo .togbtn[aria-pressed="true"] { background: var(--accent); color: var(--card); border-color: var(--accent); }
.kafkademo .row { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; flex-wrap: wrap; }
.kafkademo .rowlabel { width: 76px; flex: none; font-size: 11px; color: var(--sub); }
.kafkademo .box { border-radius: 6px; padding: 6px 10px; font-size: 12px; font-family: 'Fira Code', monospace; border: 1px solid var(--line); background: var(--card2); }
.kafkademo .box.assigned { border-color: var(--accent); color: var(--accent); font-weight: 700; }
.kafkademo .box.idle { border-color: var(--idle); color: var(--idle); font-weight: 700; }
.kafkademo .note { margin-top: 10px; font-size: 12.5px; color: var(--sub); }
.kafkademo .note b { color: var(--ink); }
</style>

<div class="toggle">
  <button class="togbtn" id="kd_1" aria-pressed="true">컨슈머 1개</button>
  <button class="togbtn" id="kd_2" aria-pressed="false">컨슈머 2개</button>
  <button class="togbtn" id="kd_3" aria-pressed="false">컨슈머 3개</button>
  <button class="togbtn" id="kd_4" aria-pressed="false">컨슈머 4개</button>
</div>
<div id="kd_view" aria-live="polite"></div>
</div>

<script>
(function () {
  const root = document.currentScript.previousElementSibling;
  if (!root || !root.classList.contains('kafkademo')) return;
  const btns = { 1: root.querySelector('#kd_1'), 2: root.querySelector('#kd_2'), 3: root.querySelector('#kd_3'), 4: root.querySelector('#kd_4') };
  const viewEl = root.querySelector('#kd_view');
  const PARTITIONS = ['P0', 'P1', 'P2'];

  function render(n) {
    // 파티션을 컨슈머에 순서대로 라운드로빈 배분 (컨슈머가 파티션보다 많으면 남는 컨슈머는 idle)
    const assign = PARTITIONS.map((p, i) => `C${(i % n) + 1}`);
    const consumers = Array.from({ length: n }, (_, i) => `C${i + 1}`);

    const partRow = PARTITIONS.map((p, i) => `<span class="box assigned">${p} → ${assign[i]}</span>`).join('');
    const consRow = consumers.map((c) => {
      const has = assign.includes(c);
      return `<span class="box ${has ? 'assigned' : 'idle'}">${c}${has ? '' : ' (idle)'}</span>`;
    }).join('');

    const idleCount = consumers.length - new Set(assign).size;
    const note = idleCount > 0
      ? `컨슈머(${n}개)가 파티션(3개)보다 많아서, <b>${idleCount}개는 할당받을 파티션이 없어 그냥 논다</b>.`
      : n === PARTITIONS.length
        ? '컨슈머 수와 파티션 수가 같아서, 컨슈머마다 파티션 하나씩 정확히 맡는다.'
        : '파티션 수보다 컨슈머가 적어서, 일부 컨슈머가 파티션 2개 이상을 맡는다.';

    viewEl.innerHTML = `
      <div class="row"><span class="rowlabel">파티션</span>${partRow}</div>
      <div class="row"><span class="rowlabel">컨슈머</span>${consRow}</div>
      <div class="note">${note}</div>
    `;
  }
  function select(n) {
    Object.entries(btns).forEach(([k, b]) => b.setAttribute('aria-pressed', String(Number(k) === n)));
    render(n);
  }
  Object.entries(btns).forEach(([k, b]) => b.addEventListener('click', () => select(Number(k))));
  select(1);
})();
</script>

컨슈머 수가 파티션 수보다 많아지면 남는 컨슈머는 놀게 된다 — 그래서 파티션 수가 "이 토픽을 최대 몇 개까지 병렬로 처리할 수 있는가"의 상한이 된다.

### 오프셋과 재처리

Kafka는 메시지를 소비해도 큐처럼 바로 지우지 않고, 설정된 보존 기간(retention) 동안 로그에 남겨둔다. 컨슈머는 "내가 어디까지 읽었는지"를 오프셋으로 따로 기록(commit)하기 때문에, 오프셋을 되돌리면 이미 처리한 메시지도 다시 읽을 수 있다 — 장애로 처리에 실패했을 때 재처리가 가능한 이유다.

## 예제

주문 이벤트를 서로 다른 그룹의 컨슈머 두 개가 각자 소비하는 흐름을 pseudo-code로 보면 이렇다.

```python
# Producer: 주문이 생성되면 이벤트 발행 (key로 파티션 결정)
producer.send('order-created', key=order.user_id, value=order.to_json())

# Consumer A (재고 서비스, group='inventory-service')
for message in consumer.poll('order-created', group='inventory-service'):
    reduce_stock(message.value)
    consumer.commit(message.offset)

# Consumer B (알림 서비스, group='notification-service') — 완전히 별도로 같은 토픽을 처음부터 소비
for message in consumer.poll('order-created', group='notification-service'):
    send_notification(message.value)
    consumer.commit(message.offset)
```

## 주의사항

- 파티션 수는 나중에 늘릴 수는 있지만 줄이기는 사실상 어렵다(다시 만들어야 함). 처음부터 예상 트래픽과 컨슈머 확장 계획을 고려해서 정하는 편이 좋다.
- 파티션 키를 잘못 고르면(예: 특정 key에 트래픽이 몰림) 특정 파티션에만 부하가 쏠리는 핫 파티션 문제가 생길 수 있다.
- 오프셋을 언제 commit하느냐(메시지 처리 전/후)에 따라 "최소 한 번 처리(at-least-once)"와 "최대 한 번 처리(at-most-once)"가 갈린다. 처리 후 commit하면 중복 처리 가능성은 남아도 메시지 유실은 막을 수 있다.

## 참고자료

- kafka.apache.org (Apache Kafka 공식 문서)
