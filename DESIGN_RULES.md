# 개인 개발 위키 설계 규칙 (Design Rules)

> 이 문서는 이 프로젝트의 **최상위 설계 규칙**이다.
> 코드를 작성하기 전에 이 문서를 먼저 따른다.
> AI에게 작업을 요청할 때 이 문서 전체를 프롬프트에 포함시켜 항상 동일한 기준으로 동작하게 한다.

---

## 0. 프로젝트 정의

- 이름: 개인 개발 위키 (Personal Developer Wiki / Knowledge Base)
- 목표: **"미래의 내가 가장 쉽게 다시 찾을 수 있는 개발 지식 저장소"**
- 성격: 블로그가 아니라 **문서 사이트(위키)에 가깝다.** 최신순 노출보다 주제별 탐색이 우선이다.
- 규모 목표: 글 500~2,000개가 되어도 구조를 갈아엎지 않는다.

### 0-1. 최상위 원칙 (절대 깨지 않는다)

1. **UI와 데이터를 분리한다.**
   UI(디자인, 프레임워크)는 언제든 교체 가능하다. 그러나 Markdown, Frontmatter, 이미지는 10년 유지되는 자산으로 취급한다.
2. **데이터는 사람이 읽기 쉬워야 한다.**
   Frontmatter만 봐도 5초 안에 "이 글이 뭔지" 파악 가능해야 한다.
3. **자동화 가능한 것은 전부 자동화한다.**
   읽는 시간, Related Posts, TOC, Sitemap, RSS, OG 이미지, Canonical URL은 사람이 직접 입력하지 않는다. (`updated`는 예외 — 발행 후 수정 시 직접 채운다, CONVENTIONS 2-2 참고)
4. **폴더는 저장을 위한 구조, 메타데이터는 탐색을 위한 구조다.**
   폴더 구조는 최대한 단순하게 유지하고, 사용자가 보는 분류(카테고리/기술/태그)는 Frontmatter로 생성한다.

---

## 1. 사이트 구조 (IA)

```text
Home
├── Articles
├── Projects
├── Reference
├── Snippets
├── Categories
├── Technology
├── Tags
├── Series
├── Archive
└── About
```

### 상단 메뉴 (심플하게 유지, 항목 추가 지양)
```text
Articles / Projects / Reference / Snippets / About
```

### Home 구성 (블로그 첫 화면이 아니라 대시보드 형태)
- 검색창 (최상단)
- Recent Posts (최근 글)
- Categories 바로가기
- Popular Tags
- Monthly Archive

---

## 2. 분류 체계 (Category → Technology → Tags)

3단계 분리 구조를 사용한다. **절대 섞지 않는다.**

| 레벨 | 역할 | 특징 |
|---|---|---|
| **Category** | 글의 "목적"이 무엇인가 | 고정 enum, 거의 늘어나지 않음 |
| **Technology** | 글에서 사용한 "도구/기술"이 무엇인가 | 배열, 자유롭게 늘어남 |
| **Tags** | 글의 "주제/개념"이 무엇인가 | 배열, 기술명 절대 금지 |

### 2-1. Category (고정, 이 목록 외 추가 지양)

```text
development       # 코드/구현 관련
infra             # 인프라, 배포, 서버, CI/CD
cs                # 전공지식 (OS, Network, DB, Algorithm)
ai                # LLM, ML, 데이터 분석
study             # 개발 습관, 환경설정, 생산성 등 잡학
certificates      # 자격증 후기/정리
projects          # 프로젝트 (별도 collection과 연동)
```

**Category 판별 규칙 (가장 중요):**
> **"이 글이 무엇을 하는 법을 설명하는가"** 를 기준으로 정한다. 사용한 도구가 아니라 **글의 목적**이 카테고리다.

예시:
- "Docker로 AI 모델 배포" → 목적이 AI 모델 배포 → **category: ai**, technology: [docker, fastapi, ollama]
- "Redis 캐싱 적용기" → 목적이 애플리케이션 개발 → **category: development**, technology: [spring, redis]
- "CI/CD 파이프라인 구축" → 목적이 인프라 자동화 → **category: infra**, technology: [docker, github-actions, nginx]

애매하면 항상 이 규칙으로 되돌아가서 판단한다.

### 2-2. Technology (배열, 자유 확장)

- 항상 배열(`string[]`)로 관리한다. 단수 취급 금지.
- 새로운 기술(Bun, Zig, Claude Code 등)이 나와도 이 필드에만 추가하면 된다. 카테고리는 건드리지 않는다.
- 표기는 소문자-케밥케이스로 통일: `spring`, `github-actions`, `next-js`

```yaml
technology:
  - spring
  - redis
  - mysql
```

### 2-3. Tags (배열, 주제/개념 전용)

- **기술명 절대 금지.** 기술명은 Technology 필드로 보낸다.
- 주제, 개념, 문제 유형만 태그로 사용한다.

```yaml
tags:
  - jwt
  - oauth
  - authentication
  - caching
  - performance
  - monitoring
```

잘못된 예: `tags: [spring, docker]` → **오류.** Technology로 이동해야 함.

---

## 3. Content Type (글 유형)

Articles의 `type` 필드는 아래 5종으로 고정한다 (Reference/Snippet/Project는 `type` 필드 자체가 없다 — 5장 스키마 참고).

| type | 설명 | 예시 |
|---|---|---|
| `study` | 개념 정리 | Docker Compose란 |
| `tutorial` | 설치/구축/환경설정 | Ubuntu에 Docker 설치하기 |
| `troubleshooting` | 에러 해결 기록 | Spring Boot Bean 에러 해결 |
| `review` | 회고, 후기 | SQLD 합격 후기 |
| `tips` | 생산성, 단축키, 꿀팁 | IntelliJ 단축키 모음 |

Article의 5가지 type과 별개로, "계속 갱신하는 참고 문서"(예: Linux 명령어 치트시트) 성격의 글은 애초에 Articles가 아니라 **별도 Collection인 Reference**로 분리 관리한다 (4장 참고). Reference 자체는 `type` 필드를 갖지 않는다 — Collection이 다르다는 것 자체가 이미 "참고 문서"라는 분류다.

---

## 4. Collection (콘텐츠 저장소 분리)

Articles, Projects, Reference, Snippets는 **성격이 다르므로 별도 Collection으로 분리**한다.

```text
content/
├── articles/       # 일반 글 (study, tutorial, troubleshooting, review, tips) — category 하위 폴더 없이 평평하게 저장
│   ├── spring-security/
│   ├── docker-compose/
│   └── redis-cache/
├── projects/       # 프로젝트 허브 페이지
├── references/     # 계속 갱신되는 참고 문서 (cheat sheet 등)
├── snippets/       # 짧은 코드/명령어 조각
└── pages/          # About 등 고정 페이지
```

> **폴더는 category 기준으로 나누지 않는다.** "폴더는 저장, 메타데이터는 탐색" 원칙에 따라 저장 위치는 완전히 평평하게(flat) 유지하고, 분류는 오직 `category` 필드로만 처리한다. 이렇게 하면 글의 category를 development → infra로 바꿔도 파일을 이동할 필요가 없다.

### 4-1. 이미지 위치 규칙

이미지는 `assets/` 같은 전역 폴더에 모으지 않는다. **글과 같은 폴더에 둔다.**

```text
content/articles/docker-compose/
├── index.md
└── image/
    ├── 1.png
    └── 2.png
```

→ 글을 삭제하면 이미지도 함께 삭제되어 유지보수가 쉬워진다.

### 4-2. 프로젝트 연결 (Articles ↔ Projects)

Article의 `projects` 필드(5-1 참고)로 프로젝트와 글을 양방향 연결한다.

```yaml
# articles/jwt-apply/index.md
projects:
  - syncmaster-ai
```

- **프로젝트 페이지에서**: `projects`에 해당 프로젝트 slug를 가진 모든 Article을 자동으로 모아 "관련 글" 목록으로 노출 (JWT 적용, Redis 구축, Docker 배포 등)
- **글 페이지에서**: 역방향으로 "이 글은 SyncMaster AI 프로젝트에서 작성되었습니다" 배너를 자동 노출
- 별도 수동 관리 없이 `projects` 필드 하나만으로 양방향 연결이 이루어진다.

### 4-3. Archive vs Portfolio 프로젝트 패턴

프로젝트 하나의 기술적 디테일(아키텍처, DB 스키마, 알고리즘 선택 이유, 한계점 등)이 매우 방대할 경우, Project 엔트리를 **두 개로 분리**한다.

| 엔트리 | id 예시 | draft | 역할 |
| --- | --- | --- | --- |
| Archive | `{slug}-archive` | `true` | 시리즈 글을 쓸 때 참고하는 원본 자료. 디테일·한계점·불일치 등을 가감 없이 기록. 사이트엔 발행 안 됨 |
| Portfolio | `{slug}` | `false` | 실제 공개되는 프로젝트 허브 페이지. 스택/아키텍처는 간략화하고 **본인이 한 일** 중심으로 재구성 |

- 시리즈 글(Article)의 `projects` 필드는 **Portfolio 엔트리(`{slug}`)에만 연결**한다. Archive는 연결 대상이 아니다.
- Archive는 `draft: true`로 영구히 둬도 무방하다 (draft가 "곧 공개할 임시 상태"를 의미할 필요는 없다 — 5-1 참고).
- 모든 프로젝트에 이 패턴이 필요한 건 아니다. 디테일이 방대해서 "블로그 형식엔 안 맞는다" 싶을 때만 적용한다.

---

## 5. Frontmatter 스키마 (Collection별로 다르게)

### 5-1. Articles

```yaml
title: string                # 필수
# slug 없음 — 폴더명이 곧 id(slug) 역할 (5-1-1 참고)
description: string          # 필수 (SEO 겸용)
date: date                   # 작성일
updated: date                # 마지막 수정일, 수동으로 채움 (자동화 안 함 — CONVENTIONS 2-2 참고)
category: enum               # 2-1 참고, 단일값
technology: string[]         # 2-2 참고, 배열
tags: string[]                # 2-3 참고, 배열, 기술명 금지
type: enum                   # study | tutorial | troubleshooting | review | tips
status: enum                 # evergreen | archive (6장 참고)
series:                      # 선택
  name: string                  # 시리즈 slug (예: docker-basic)
  order: number                  # 시리즈 내 순서
projects: string[]           # 선택, 연관된 프로젝트 slug (4-2 참고)
related: string[]            # 선택, 수동 지정 관련 글 slug (자동 추천 보완용)
aliases: string[]            # 선택, 과거 URL 경로 목록 (8-1 참고)
draft: boolean                # true면 빌드에서 제외 (dev 서버에서는 미리보기 가능, 11장 참고)
```

#### 5-1-1. slug(id) 규칙

> **참고**: Astro의 기본 glob loader는 frontmatter의 `slug` 필드로 자동 생성 id를 덮어쓸 수 있게 지원한다 — 즉 Astro 자체가 `slug`를 막는 건 아니다. 다만 **이 프로젝트의 `generateId`는 폴더 경로(`entry`)만으로 id를 만들고 frontmatter의 `slug` 값은 아예 참조하지 않는다** (`content.config.ts` 참고). 그래서 이 레포에서는 frontmatter에 `slug`를 넣어도 무시되고, 폴더명이 곧 id로 고정된다 — 이건 Astro의 제약이 아니라 우리 프로젝트가 "폴더명 = slug"를 강제하기 위해 의도적으로 정한 규칙이다.

- 폴더명(=파일 경로)이 곧 slug(`id`) 역할을 한다. 제목을 나중에 바꿔도 폴더명을 유지하면 URL은 그대로 유지된다.
  - 예: `content/articles/spring-security/` 폴더 안 글의 `title`을 `Spring Security란` → `Spring Security + JWT 정리`로 수정해도 URL(`/development/spring-security`)은 그대로 유지
- 폴더명 자체가 URL 경로가 되므로, 폴더명은 CONVENTIONS.md의 slug 작성 규칙(kebab-case, 3~5단어 이내)을 그대로 따른다.
- frontmatter에 `slug` 필드를 별도로 추가하지 않는다 (넣어도 `generateId`가 무시하므로 혼란만 생김).

#### 5-1-2. related (수동 연관 글)

- 자동 Related Posts(11장, category/technology/tags 겹침 기반)와 별개로, 명시적으로 연결하고 싶은 글이 있으면 `related`에 slug로 직접 지정한다.
- 화면 노출 시 자동 추천 목록과 병합하되, `related`에 지정된 항목을 우선 노출한다.

```yaml
related:
  - spring-cache
  - redis-cache
```

### 5-2. Projects

```yaml
title: string
# slug 없음 — 폴더명이 곧 id(slug)
summary: string
stack: string[]               # 사용 기술 스택
github: string                # 저장소 URL
status: enum                  # in-progress | done | archived
startDate: date
endDate: date                 # 진행중이면 생략
draft: boolean                 # true면 빌드에서 제외 (dev 서버에서는 미리보기 가능, 11장 참고)
```

### 5-3. Reference

```yaml
title: string
# slug 없음 — 폴더명이 곧 id(slug)
technology: string[]          # 선택 (optional) — 기술이 아닌 개념성 문서(HTTP Status Code 등)는 생략 가능
tags: string[]
updated: date                 # 계속 갱신되므로 updated가 date보다 중요
aliases: string[]             # 선택, 과거 URL 경로 목록
```

### 5-4. Snippets

```yaml
title: string
command: string               # 실제 명령어/코드 한 줄
description: string
technology: string[]
tags: string[]
```

> Snippets는 Articles와 스키마를 절대 공유하지 않는다. 훨씬 가볍게 유지한다.

---

## 6. Status: Evergreen vs Archive

모든 Article은 `status` 필드로 성격을 구분한다.

- **evergreen**: 시간이 지나도 계속 업데이트하는 글 (예: Git, Docker, Linux, Spring Core, HTTP 개념)
- **archive**: 특정 시점의 기록으로 더 이상 갱신하지 않는 글 (예: SQLD 후기, 프로젝트 회고)

이 구분으로 나중에 "이 글을 업데이트해야 하나?"를 빠르게 판단한다.

---

## 7. Series (연재 글)

```yaml
series:
  name: docker-basic     # slug, series 목록/설명/썸네일과 연동 가능
  order: 3               # 이 시리즈 내에서의 순서
```

- `series.name` 기준으로 같은 시리즈 글을 모아 이전 글/다음 글 네비게이션을 자동 생성한다.
- 향후 시리즈 자체의 제목/설명/썸네일 페이지로 확장 가능하도록 `name`을 slug 형태로 관리한다.

### 7-1. Series를 쓰지 않는 경우

글 사이에 **순차적 진행 순서가 실제로 없다면** `series`를 억지로 붙이지 않는다. 예를 들어 코딩테스트 문제 풀이처럼 문제마다 순서 관계가 없는 경우, `series` 대신 **태그 두 축(주제 + 레벨)**으로 묶는다.

```yaml
category: cs
tags: [hash, level-1]   # 주제 태그 + 레벨 태그를 함께 붙인다
```

- 주제별로 모아보고 싶으면 `/tags/hash`, 레벨별로 모아보고 싶으면 `/tags/level-1`로 각각 탐색 가능
- Related Posts 자동 추천(11장)이 태그 겹침을 이미 반영하므로, 같은 주제·같은 레벨 글끼리 자연스럽게 서로 연결된다
- 새 페이지나 필드를 추가하지 않고 기존 Tags 구조를 재사용하는 것이 핵심 — "순서"가 없는 콘텐츠에 억지로 순서 개념(이전글/다음글)을 만들지 않는다
- 문제 풀이가 20~30개 이상 쌓여 레벨×주제로 한눈에 훑어보고 싶어지면, 그때 별도 인덱스 페이지(`/problems` 등)를 검토한다 (v2 성격, 지금은 만들지 않는다)

---

## 8. URL 규칙

**절대 `/post/123` 같은 ID 기반 URL을 쓰지 않는다.** 사람이 읽을 수 있는 경로를 사용한다.

```text
/development/spring-security
/infra/docker-compose
/projects/ngras
/reference/git-command
/snippets/docker-exec
```

URL 구조 원칙: `/{category}/{slug}` (Articles) / `/projects/{slug}` / `/reference/{slug}` / `/snippets/{slug}`

### 8-1. aliases (URL 변경 대응)

글의 `category`가 바뀌거나 slug 구조를 개편해 URL이 바뀌는 경우, 과거 URL을 `aliases`에 남겨 리다이렉트 처리한다.

```yaml
aliases:
  - /spring-security
  - /development/spring-security
```

- 지금 당장 리다이렉트 로직을 구현하지 않아도 스키마에는 미리 포함해 둔다 (나중에 URL 개편 시 대응 가능하도록).

---

## 9. SEO (처음부터 적용, 나중에 추가 아님)

모든 글에 아래 항목을 **필수로** 채운다.

- `title`
- `description`
- Canonical URL (자동 생성)
- OG 이미지 (자동 생성 또는 기본 템플릿)
- Sitemap, RSS (자동 생성)

---

## 10. 검색

- 클라이언트 사이드 풀텍스트 검색 라이브러리로 **Pagefind**를 사용한다.
- 검색 대상 범위: `title`, 본문, `tags`, `technology`, `category` 전부 포함.
- 예: "jwt" 검색 시 제목에 JWT가 없어도 tags/technology에 jwt가 있으면 결과에 노출되어야 한다.

---

## 11. 자동화 대상 (사람이 직접 입력하지 않는 것)

- 읽는 시간 (readingTime)
- Related Posts (category/technology/tags 겹침 기반 로직)
- 목차(TOC)
- Sitemap / RSS
- OG 이미지
- Canonical URL

### 11-1. draft 동작 방식

`draft: true`인 Article/Project는:
- `npm run dev`: 목록·상세·시리즈 네비게이션·RSS 전부에 정상 노출 (작성 중 미리보기 목적)
- `npm run build`/실제 배포: 완전히 제외 — 페이지 자체가 생성되지 않아 URL 직접 접속도 404

Public GitHub 레포 특성상 `draft: true`여도 `.md` 원본 파일은 레포에서 누구나 볼 수 있다. 진짜 비공개가 필요한 내용은 이 레포에 커밋하지 않는다 (0-1 원칙 참고).

---

## 12. v2 이후로 미루는 기능 (지금 설계에 포함하지 않음)

댓글, 좋아요, 조회수, 다국어, 북마크, PWA, AI 검색, AI 요약, Mermaid 다이어그램, 수식(KaTeX), PlantUML, PDF 내보내기, 다크/라이트 테마 세부 커스터마이징

> 위 기능들은 구조에 영향을 주지 않는 선에서 나중에 추가한다. 초기 설계 단계에서 고려하지 않는다.

---

## 13. 진행 순서 (이 순서를 지킨다, 코드 먼저 짜지 않는다)

1. 전체 아키텍처 문서 (본 문서)
2. Content Collection 스키마 (`config.ts`)
3. URL 규칙 적용
4. Frontmatter 규칙 적용
5. 디자인 시스템 (색상, 폰트, 간격, 컴포넌트)
6. 페이지 구조 (Home, Articles, Projects 등)
7. 컴포넌트 설계
8. Astro 프로젝트 생성 및 실제 구현

---

## 14. 체크리스트 (새 글 작성 시)

- [ ] `category`는 1개만, "글의 목적" 기준으로 선택했는가
- [ ] `technology`는 배열이고 실제 사용한 기술만 넣었는가
- [ ] `tags`에 기술명이 섞이지 않았는가
- [ ] `type`이 6종 중 하나로 지정되었는가
- [ ] `status`(evergreen/archive)를 정했는가
- [ ] `title`, `description`을 채웠는가
- [ ] 이미지가 글 폴더 내부(`image/`)에 있는가
- [ ] URL이 `/category/slug` 형태인가