---
title: RDB와 NoSQL, 그리고 그 안에서도 갈리는 선택 기준
description: RDB와 NoSQL이 데이터 모델과 트레이드오프에서 어떻게 다른지, 여러 DB를 섞어 쓰는 폴리글랏 퍼시스턴스를 실제 프로젝트 스택으로 정리한다
date: 2026-08-24
updated:
category: cs
technology: [postgresql, mysql, mongodb, redis, chromadb]
tags: [rdbms, nosql, database-design]
type: study
status: evergreen
series:
projects:
related:
aliases:
draft: true
---

## 한 줄 요약

"관계형이냐 아니냐"보다 "일관성/스키마 유연성/조회 패턴 중 뭘 우선하냐"가 DB 선택의 실제 기준이다.

## 왜 (배경/문제 상황)

프로젝트 하나에 DB를 하나만 쓰는 경우는 드물다. PostgreSQL, MongoDB, Redis를 같이 쓰는 구성을 흔히 보게 되는데, "왜 하나로 통일하지 않고 여러 개를 섞어 쓰는가"는 리뷰나 면접에서 자주 나오는 질문이다. 이 글은 RDB와 NoSQL의 근본적인 차이, 그리고 같은 계열 안에서도(RDB 안의 PostgreSQL vs MySQL, NoSQL 안의 문서/키-값/벡터) 왜 갈리는지를 정리한다.

## 본문

### RDB vs NoSQL — 근본적인 차이

| 기준 | RDB | NoSQL |
|---|---|---|
| 데이터 모델 | 고정된 스키마, 테이블 + 관계 | 유연한 구조 (문서/키-값/그래프 등 종류에 따라 다름) |
| 트랜잭션 | ACID를 기본으로 강하게 보장 | 종류에 따라 다름 — 대체로 단일 문서/키 단위 원자성 위주 |
| 조인 | 여러 테이블을 join으로 자유롭게 결합 | 대체로 조인이 약하거나 없음 (데이터를 미리 함께 묶어 저장) |
| 확장 방식 | 수직 확장이 기본, 수평 확장(샤딩)은 별도 설계 필요 | 수평 확장을 염두에 두고 설계된 경우가 많음 |
| 스키마 변경 | 마이그레이션이 필요 | 대체로 유연하게 필드 추가/변경 가능 |

"정합성이 중요하고 관계가 복잡하면 RDB, 구조가 자주 바뀌거나 대량 쓰기·수평 확장이 중요하면 NoSQL"이 큰 틀이지만, 실제로는 같은 계열 안에서도 선택이 또 갈린다.

### RDB 안에서도 다르다 — PostgreSQL vs MySQL

- **PostgreSQL**: `JSONB`, 배열, 커스텀 타입처럼 확장된 타입 시스템을 지원해서 RDB이면서도 준정형 데이터를 다루기 편하다. 윈도우 함수, CTE 같은 복잡한 쿼리 기능이 강하다.
- **MySQL**: 단순한 CRUD 위주 워크로드에서 오래 검증된 성능과 레플리케이션 생태계를 갖고 있다. 스토리지 엔진(InnoDB)이 단순한 읽기/쓰기 패턴에 최적화되어 있다.
- **선택 기준**: 복잡한 쿼리·데이터 무결성·확장 타입이 중요하면 PostgreSQL, 단순한 트래픽 위주고 기존 생태계/운영 경험이 MySQL에 맞춰져 있으면 MySQL도 충분히 좋은 선택이다.

### NoSQL 안에서도 여러 종류다

- **문서형 (예: MongoDB)**: 레코드마다 구조가 조금씩 달라질 수 있는 도메인, 중첩된 구조를 그대로 저장하고 싶을 때.
- **키-값/인메모리 (예: Redis)**: 값 하나에 최대한 빠르게 접근해야 하거나, 캐시·세션·TTL이 필요한 데이터.
- **벡터 (예: ChromaDB)**: 텍스트/이미지를 임베딩으로 바꿔서 "의미적으로 비슷한 것"을 찾아야 할 때 (추천, RAG).

같은 "NoSQL"이라도 해결하는 문제가 완전히 다르기 때문에, "RDB만 아니면 다 같은 NoSQL"로 뭉뚱그리면 선택을 잘못하기 쉽다.

### 직접 살펴보기 — 질문에 답하면 DB 종류를 추천해준다

실제로 DB를 고를 때 스스로에게 물어볼 만한 질문들을 순서대로 따라가 본다.

<div class="dbdemo">
<style>
.dbdemo {
  --ink: #1c1917; --sub: #6b7280; --line: #e5e7eb; --card: #fafafa; --card2: #f4f4f5;
  --accent: #466b8f;
  font-family: 'Pretendard', system-ui, sans-serif; font-size: 14px; line-height: 1.6; color: var(--ink);
  border: 1px solid var(--line); border-radius: 16px; padding: 20px; background: var(--card); margin: 24px 0;
}
.dark .dbdemo { --ink: #e5e7eb; --sub: #9ca3af; --line: #374151; --card: #18181b; --card2: #27272a; --accent: #8fadc7; }
.dbdemo .trail { font-size: 11px; color: var(--sub); margin-bottom: 10px; min-height: 16px; }
.dbdemo .qbox { border: 1px solid var(--line); border-radius: 10px; padding: 16px; background: var(--card2); }
.dbdemo .qtext { font-weight: 700; margin-bottom: 12px; }
.dbdemo .opts { display: flex; gap: 10px; flex-wrap: wrap; }
.dbdemo .optbtn { background: var(--ink); color: var(--card); border: 0; border-radius: 8px; padding: 9px 16px; font-family: inherit; font-weight: 700; font-size: 13px; cursor: pointer; }
.dbdemo .result { text-align: center; }
.dbdemo .result .name { font-size: 18px; font-weight: 800; color: var(--accent); margin-bottom: 6px; }
.dbdemo .result .reason { color: var(--sub); margin-bottom: 14px; }
.dbdemo .resetbtn { background: transparent; color: var(--ink); border: 1px solid var(--line); border-radius: 8px; padding: 8px 14px; font-family: inherit; font-weight: 700; font-size: 12.5px; cursor: pointer; }
</style>

<div class="trail" id="dbd_trail"></div>
<div class="qbox" id="dbd_box" aria-live="polite"></div>
</div>

<script>
(function () {
  const root = document.currentScript.previousElementSibling;
  if (!root || !root.classList.contains('dbdemo')) return;
  const trailEl = root.querySelector('#dbd_trail');
  const boxEl = root.querySelector('#dbd_box');

  const TREE = {
    q1: {
      q: '구조화된 스키마(테이블/컬럼)가 고정되어 있어야 하나요?',
      opts: [
        { label: '예', next: 'q2a' },
        { label: '아니오', next: 'q2b' },
      ],
    },
    q2a: {
      q: '복잡한 조인, 윈도우 함수, JSONB 같은 확장 타입이 필요한가요?',
      opts: [
        { label: '예', result: { name: 'PostgreSQL', reason: '복잡한 쿼리와 JSONB·배열 같은 확장 타입을 지원하는 RDB' } },
        { label: '아니오', result: { name: 'MySQL', reason: '단순한 CRUD 위주 워크로드에 최적화된 생태계와 레플리케이션' } },
      ],
    },
    q2b: {
      q: '값 하나에 최대한 빠르게 접근(캐시, 세션, TTL)하면 충분한가요?',
      opts: [
        { label: '예', result: { name: 'Redis', reason: '인메모리 키-값 저장소라 낮은 레이턴시와 TTL을 기본 지원' } },
        { label: '아니오', next: 'q3b' },
      ],
    },
    q3b: {
      q: '의미적으로 비슷한 것을 찾아야 하나요? (추천, RAG 등)',
      opts: [
        { label: '예', result: { name: '벡터 DB (예: ChromaDB)', reason: '임베딩 간 유사도 검색에 특화된 저장소' } },
        { label: '아니오', result: { name: 'MongoDB', reason: '레코드마다 구조가 조금씩 달라도 되는 문서형 저장소' } },
      ],
    },
  };

  let path = []; // { question, answer }
  let cur = 'q1';

  function renderTrail() {
    trailEl.textContent = path.length ? path.map((p) => `${p.answer}`).join(' → ') + ' →' : '';
  }

  function renderQuestion() {
    const node = TREE[cur];
    boxEl.innerHTML = `
      <div class="qtext">${node.q}</div>
      <div class="opts">${node.opts.map((o, i) => `<button class="optbtn" data-i="${i}">${o.label}</button>`).join('')}</div>
    `;
    boxEl.querySelectorAll('.optbtn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const opt = node.opts[Number(btn.dataset.i)];
        path.push({ question: node.q, answer: opt.label });
        renderTrail();
        if (opt.result) {
          renderResult(opt.result);
        } else {
          cur = opt.next;
          renderQuestion();
        }
      });
    });
  }

  function renderResult(result) {
    boxEl.innerHTML = `
      <div class="result">
        <div class="name">${result.name}</div>
        <div class="reason">${result.reason}</div>
        <button class="resetbtn" id="dbd_reset">처음부터 다시</button>
      </div>
    `;
    boxEl.querySelector('#dbd_reset').addEventListener('click', () => {
      path = []; cur = 'q1';
      renderTrail(); renderQuestion();
    });
  }

  renderTrail();
  renderQuestion();
})();
</script>

### 실제 프로젝트에서 왜 섞어 쓰는가

폴리글랏 퍼시스턴스(polyglot persistence)에서 각 DB가 보통 맡는 역할은 이런 식이다.

- **정형 데이터, 관계가 명확한 도메인 데이터** (사용자, 주문, 이력 등) → PostgreSQL/MySQL 같은 RDB
- **자주 바뀌거나 중첩 구조를 그대로 저장하고 싶은 데이터** (로그, 유연한 속성을 가진 레코드) → MongoDB 같은 문서형
- **세션, 토큰, 순위판처럼 빠른 접근과 TTL이 필요한 데이터** → Redis
- **추천이나 AI 대화처럼 의미 기반 검색이 필요한 데이터** → 벡터 DB

이런 조합은 "DB를 하나로 통일하지 못해서"가 아니라, 데이터마다 요구하는 특성이 달라서 각각 잘 맞는 저장소에 나눠 담은 결과에 가깝다.

## 예제

한 서비스 안에서 데이터 종류별로 DB를 고른다면 대략 이렇게 매핑된다.

```text
사용자 프로필, 결제 이력       → PostgreSQL (스키마 고정, 트랜잭션 중요)
로그인 세션, API 응답 캐시     → Redis (빠른 접근, TTL)
자유 형식의 설문/속성 데이터    → MongoDB (구조가 자주 바뀜)
"비슷한 콘텐츠 추천"용 임베딩   → 벡터 DB (유사도 검색)
```

## 주의사항

- DB 종류를 늘릴 때마다 운영·백업·모니터링 대상이 하나씩 늘어난다. "이 데이터 특성에 딱 맞는 DB가 있다"는 것과 "그래서 반드시 그 DB를 추가해야 한다"는 것은 별개의 판단이다 — 늘어나는 운영 비용을 상회하는 이점이 있는지 먼저 따져야 한다.
- CAP 이론은 "이거 아니면 저거"의 이분법이 아니라 트레이드오프의 스펙트럼이다. 같은 PostgreSQL도 복제 구성(동기/비동기)에 따라 일관성 수준이 달라진다.
- 여기 소개한 매핑은 일반적인 경향이지, 절대적인 규칙은 아니다. 실제로는 팀의 운영 경험, 기존 인프라, 트래픽 패턴에 따라 같은 요구사항에도 다른 DB를 고르는 게 정상이다.

## 참고자료

- 외부 출처 없이, RDB/NoSQL 선택 기준을 직접 정리한 글이다.
