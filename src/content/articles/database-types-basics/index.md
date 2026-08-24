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
draft: false
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

- **PostgreSQL**: `JSONB`, 배열, 커스텀 타입처럼 PostgreSQL에만 있는 확장된 타입 시스템을 지원해서 RDB이면서도 준정형 데이터를 다루기 편하다.
- **MySQL**: 단순한 CRUD 위주 워크로드에서 오래 검증된 성능과 레플리케이션 생태계를 갖고 있다. 스토리지 엔진(InnoDB)이 단순한 읽기/쓰기 패턴에 최적화되어 있다. 윈도우 함수와 CTE는 MySQL 8.0부터 지원하므로, 이 둘만으로는 PostgreSQL과 MySQL을 가르는 기준이 되지 않는다 (8.0 미만 버전을 운영 중이라면 예외).
- **선택 기준**: `JSONB`·배열·커스텀 타입 같은 PostgreSQL 고유 확장이 필요하거나 데이터 무결성이 특히 중요하면 PostgreSQL, 단순한 트래픽 위주고 기존 생태계/운영 경험이 MySQL(8.0 이상)에 맞춰져 있으면 MySQL도 충분히 좋은 선택이다.

### NoSQL 안에서도 여러 종류다

- **문서형 (예: MongoDB)**: 레코드마다 구조가 조금씩 달라질 수 있는 도메인, 중첩된 구조를 그대로 저장하고 싶을 때.
- **키-값/인메모리 (예: Redis)**: 값 하나에 최대한 빠르게 접근해야 하거나, 캐시·세션·TTL이 필요한 데이터.
- **벡터 (예: ChromaDB)**: 텍스트/이미지를 임베딩으로 바꿔서 "의미적으로 비슷한 것"을 찾아야 할 때 (추천, RAG).

같은 "NoSQL"이라도 해결하는 문제가 완전히 다르기 때문에, "RDB만 아니면 다 같은 NoSQL"로 뭉뚱그리면 선택을 잘못하기 쉽다.

### 다섯 가지 DB를 한 표로 비교

앞에서 다룬 PostgreSQL, MySQL, MongoDB, Redis, ChromaDB를 데이터 모델·대표 사용처·최근 경향으로 나란히 놓으면 이렇다.

| DB | 데이터 모델 | 대표 사용처 | 최근 경향 |
|---|---|---|---|
| PostgreSQL | 관계형(테이블) + JSONB로 반정형도 수용 | 정형 데이터, 트랜잭션이 중요한 도메인 | `pgvector` 같은 확장으로 벡터 검색까지 흡수하면서 "일단 Postgres부터" 고려하는 흐름이 강해지는 중 |
| MySQL | 관계형(테이블) | 단순 CRUD, 읽기 위주 웹 서비스 | 여전히 널리 쓰이지만, 신규 프로젝트에서는 PostgreSQL을 먼저 검토하는 팀이 늘어나는 추세 |
| MongoDB | 문서(JSON/BSON) | 스키마가 자주 바뀌는 데이터, 빠른 프로토타이핑 | 한때 "NoSQL 대세"로 불렸지만, RDB의 JSONB 지원이 늘면서 상대적으로 선택 이유가 좁아지는 편 |
| Redis | 키-값 + 다양한 자료구조(string/list/set/hash/sorted set) | 캐시, 세션, 실시간 랭킹, 큐 | RDB/NoSQL 논쟁과 무관하게 캐시 레이어로는 거의 기본값처럼 쓰임 |
| ChromaDB (벡터 DB) | 벡터 임베딩 + 메타데이터 | 추천, RAG, 시맨틱 검색 | LLM 애플리케이션이 늘면서 수요가 급증했지만, `pgvector` 같은 RDB 확장과도 경쟁하는 구도 |

### 쿼리 방식도 다 다르다

같은 "값을 하나 조회한다"는 동작도 DB마다 완전히 다른 문법/API를 쓴다. RDB 두 개(PostgreSQL/MySQL)만 SQL을 공유하고, 나머지는 저마다 다른 체계다.

```sql
-- PostgreSQL / MySQL: SQL
SELECT * FROM users WHERE id = 1;
```

```javascript
// MongoDB: 문서 쿼리 API
db.users.findOne({ _id: 1 });
```

```bash
# Redis: 커맨드 기반
GET user:1
```

```python
# ChromaDB: 유사도 검색 API
collection.query(query_embeddings=[...], n_results=5)
```

그만큼 팀에 새 DB를 하나 들이는 건 "쿼리 문법을 하나 더 배우는" 비용도 같이 따라온다.

### 실무 경향 — 왜 다들 일단 PostgreSQL부터 고려하는가

정답이 정해진 문제는 아니지만, 최근 몇 년 사이 관찰되는 경향은 있다.

- PostgreSQL이 `JSONB`(반정형 데이터), `pgvector`(벡터 유사도 검색) 같은 확장을 통해 원래 MongoDB나 벡터 DB가 담당하던 영역까지 상당 부분 커버하게 됐다.
- 그 결과 "일단 하나의 DB로 시작해서, 정말 필요할 때만 전용 DB를 추가한다"는 접근이 늘었다 — 운영해야 할 DB 종류가 적을수록 백업/모니터링/장애 대응 부담이 줄기 때문이다.
- 그렇다고 전용 DB가 필요 없어진 건 아니다. 트래픽이 아주 크거나 레이턴시·기능 요구가 극단적이면(예: 초저지연 캐시, 대규모 벡터 검색) 여전히 Redis나 전용 벡터 DB가 유리하다.
- 즉 "PostgreSQL이 정답"이 아니라, "확장성 덕분에 기본 후보로 먼저 고려되는 빈도가 높아졌다"는 경향에 가깝다. 실제 선택은 팀의 운영 경험, 트래픽 패턴, 이미 갖춰진 인프라에 따라 달라진다.

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
      q: 'JSONB, 배열, 커스텀 타입 같은 PostgreSQL 고유 확장 타입이 필요한가요?',
      opts: [
        { label: '예', result: { name: 'PostgreSQL', reason: 'JSONB·배열 같은 PostgreSQL 고유 확장 타입을 지원하는 RDB (참고: 윈도우 함수·CTE는 MySQL 8.0부터도 지원)' } },
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

  function renderQuestion(focusFirst) {
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
          renderQuestion(true);
        }
      });
    });
    // 사용자 조작(답변 선택/재시작)으로 다시 그렸을 때만 포커스를 옮긴다 — 최초 렌더링에서는 자동 포커스하지 않는다
    if (focusFirst) {
      const first = boxEl.querySelector('.optbtn');
      if (first) first.focus();
    }
  }

  function renderResult(result) {
    boxEl.innerHTML = `
      <div class="result">
        <div class="name">${result.name}</div>
        <div class="reason">${result.reason}</div>
        <button class="resetbtn" id="dbd_reset">처음부터 다시</button>
      </div>
    `;
    const resetBtn = boxEl.querySelector('#dbd_reset');
    resetBtn.addEventListener('click', () => {
      path = []; cur = 'q1';
      renderTrail(); renderQuestion(true);
    });
    // 결과 화면은 항상 사용자 클릭 이후에만 그려지므로 다음 조작 지점(재시작 버튼)으로 포커스를 옮긴다
    resetBtn.focus();
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
- CAP 이론은 "이거 아니면 저거"의 이분법이 아니라, 네트워크 분단 상황에서 일관성과 가용성 중 무엇을 포기할지에 대한 트레이드오프다. 이건 복제 구성과는 별개의 개념이다 — 예를 들어 PostgreSQL의 동기 복제는 커밋 대기 시간과 내구성에 영향을 주고, 비동기 복제는 지연과 장애 조치(failover) 시 데이터 손실 위험을 만든다. 실제 읽기 일관성은 `synchronous_commit`/`remote_apply` 같은 설정, 읽기 트래픽을 어디로 라우팅하는지, 장애 조치 정책까지 종합적으로 따져야 정해진다.
- 여기 소개한 매핑은 일반적인 경향이지, 절대적인 규칙은 아니다. 실제로는 팀의 운영 경험, 기존 인프라, 트래픽 패턴에 따라 같은 요구사항에도 다른 DB를 고르는 게 정상이다.

## 참고자료

- 외부 출처 없이, RDB/NoSQL 선택 기준을 직접 정리한 글이다.
