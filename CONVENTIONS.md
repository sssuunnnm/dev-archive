# 작성 컨벤션 (Conventions)

> `DESIGN_RULES.md`가 "구조"를 다룬다면, 이 문서는 **글을 쓸 때마다 실제로 지켜야 할 세부 규칙**을 다룬다.
> AI에게 글 작성/파일 생성을 요청할 때 `DESIGN_RULES.md`와 함께 이 문서도 프롬프트에 포함시킨다.

---

## 1. 파일/폴더 네이밍

- 폴더명이 곧 `slug`(Astro의 `id`)다. 폴더명, 파일명 표기를 **동일하게** 맞춘다.
- 표기법: 소문자 + 하이픈(kebab-case) 고정. 언더스코어(`_`), 카멜케이스 금지.
- 한글 폴더/파일명 금지 (영문 slug만 사용).

```text
✅ content/articles/spring-security-jwt/index.md
❌ content/articles/Spring_Security_JWT/index.md
❌ content/articles/스프링시큐리티/index.md
```

### 1-1. slug(폴더명) 작성 규칙

> 이 프로젝트의 `generateId`(`content.config.ts`)는 폴더 경로만으로 id를 만들고 frontmatter의 `slug` 값은 참조하지 않는다 (Astro 자체가 `slug`를 막는 건 아니고, 이 프로젝트가 "폴더명 = slug"를 강제하기 위해 그렇게 만든 것). 그래서 frontmatter에 `slug`를 넣지 않고, **폴더명 자체가 slug(id) 역할**을 한다.

- 제목을 그대로 번역하지 말고 **핵심 키워드만** 남긴다.
- 너무 길게 쓰지 않는다 (3~5단어 이내 권장).

```text
title: Spring Security와 JWT로 인증 구현하기

content/articles/spring-security-jwt/   ✅   (폴더명 = slug)
content/articles/spring-security-and-jwt-authentication-implementation/   ❌ (너무 김)
```

### 1-2. 이미지 파일명

- `번호-의미` 형식 고정: `01-overview.png`, `02-flow.png`, `03-result.png`
- 숫자는 본문 내 등장 순서, 뒤의 이름은 이미지가 무엇인지 나타낸다.
- 숫자만 있는 파일명(`1.png`, `2.png`)은 금지 — 1년 뒤 봐도 무슨 이미지인지 알 수 없다.

---

## 2. Frontmatter 작성 규칙

### 2-1. 필드 작성 순서 (고정)

가독성을 위해 아래 순서를 항상 지킨다.

```yaml
title:
description:
date:
updated:
category:
technology:
tags:
type:
status:
series:
projects:
related:
aliases:
draft:
```

### 2-2. 값 표기 규칙

| 필드 | 규칙 |
|---|---|
| `category`, `technology`, `tags`, `type` | 전부 소문자 kebab-case (`github-actions`, `spring-boot`) |
| `date`, `updated` | `YYYY-MM-DD` 형식 고정 |
| `draft` | 값 생략 금지, 항상 `true`/`false` 명시 |
| `tags` | 최소 1개, 최대 5개 권장 (너무 많으면 검색 의미 없어짐) |
| `technology` | 실제 본문에서 다룬 것만 (스쳐 지나간 언급 제외) |

> **Technology는 미리 정의한 Technology Dictionary(용어 사전)에 등록된 값만 사용한다.** 새 기술을 처음 쓸 때는 먼저 Dictionary에 표기법을 등록한 뒤 사용한다. 이렇게 하면 `next-js` / `nextjs` / `next` / `Next.js` 같은 표기 혼란이 원천 차단된다.

> **`draft: true` → `false`로 발행 전환할 때 `date`를 실제 발행일로 갱신한다.** `date`는 "초안을 쓰기 시작한 날"이 아니라 "발행일"의 의미로 쓴다 (Home Recent Posts, RSS, 카테고리/시리즈 정렬이 전부 이 필드 기준이라, 초안 작성일로 두면 실제 공개 순서와 어긋난다). 발행 이후 내용을 고치면 그때 `updated`를 채운다.

### 2-3. description 작성 규칙

- 1문장, 50~120자 내외.
- 제목을 반복하지 않는다. "무엇을 다루는 글인지"를 요약한다.

```yaml
title: Docker Compose란
description: Docker Compose가 하는 일과 기본 문법을 실습 예제로 정리한다.   ✅
description: Docker Compose에 대한 글입니다.   ❌ (내용 없음)
```

---

## 3. 본문(Markdown) 작성 스타일

### 3-1. 제목(heading) 규칙

- `h1`(`#`)은 사용하지 않는다 (title이 이미 h1 역할). 본문은 `##`부터 시작.
- 목차(TOC) 자동 생성을 고려해 heading depth는 `##` → `###`까지만 사용 (`####` 지양).

### 3-2. 글 템플릿 (권장 템플릿)

아래는 **권장 템플릿**이며 강제 규칙은 아니다. `study`, `tutorial`, `tips` 타입에는 그대로 적용하되, `reference`, `troubleshooting`, `review`는 글 성격에 맞게 순서를 조정하거나 일부 섹션을 생략해도 된다.

```md
## 한 줄 요약

## 왜 (배경/문제 상황)

## 본문

## 예제

## 주의사항

## 참고자료
```

- `troubleshooting`: "본문" 대신 "원인 분석 → 해결 방법" 구조 권장.
- `reference`: 템플릿을 따르지 않고 표/목록 위주로 자유 작성.
- `review`: "왜" 대신 "계기", "본문" 대신 "과정/느낀 점" 등으로 자유롭게 대체 가능.

### 3-3. Don't (절대 하지 말 것)

- 제목에 "정리", "공부", "메모" 같은 표현을 남발하지 않는다.
- `technology`에 `tags`를 넣지 않는다 (기술명은 tags 금지).
- `tags`에 `technology`를 넣지 않는다.
- 발행 후에는 폴더명(=slug)을 변경하지 않는다 (URL이 깨진다 — 바꿔야 하면 `aliases`로 이전 경로를 남긴다).
- 본문에 `TODO`를 남긴 채 발행하지 않는다.
- **`**볼드**` 텍스트 중간에 줄바꿈을 넣지 않는다.** 여는 `**`와 닫는 `**`가 다른 줄에 걸쳐 있으면 마크다운 파싱이 깨져 별표가 그대로 텍스트로 노출될 수 있다. 볼드로 감쌀 문장은 반드시 한 줄로 이어 쓴다.

### 3-4. 코드블럭

- 항상 언어를 명시한다 (```` ```bash ````, ```` ```yaml ```` 등 — ```` ``` ```` 단독 사용 금지).
- 커맨드 라인 예시는 주석(`#`)으로 무엇을 하는 명령인지 짧게 설명.
- **코드블럭 안에 이모지(✅❌ 등)를 넣지 않는다.** 실제 언어 문법(Shiki 하이라이팅)이 줄 맨 앞 토큰을 기준으로 색을 입히는데, 이모지가 맨 앞에 오면 같은 종류의 줄인데도 색이 서로 달라지는 등 하이라이팅이 깨진다. 강조하고 싶으면 이모지는 코드블럭 밖 문장으로 뺀다.
- `#` 주석이 자동으로 흐리게(muted) 표시되길 원하면, 실제로 `#`을 주석으로 인식하는 언어(`bash`, `yaml` 등)를 쓴다. `http`, `text`는 주석 인식이 안 돼 전체가 한 색으로 뭉쳐 보인다.

### 3-4-1. 이미지 캡션

- 이미지 바로 다음 줄에 짧은 설명을 넣고 싶으면, **이미지 바로 다음 문단에 `**볼드**` 텍스트만** 작성한다 (이모지·이탤릭 없이). 사이트 스타일이 이미지 바로 다음 문단을 자동으로 캡션(작은 글씨, 회색, 가운데 정렬)으로 처리한다.

```md
![대체 텍스트](./image/01-example.png)

**캡션 텍스트**
```

- 인용구(`>`)는 캡션 용도로 쓰지 않는다 (인용구 기본 스타일과 겹쳐 불필요하게 장식이 많아진다).

### 3-4-2. 인용구(blockquote)

- 강조하고 싶은 문구만 볼드로 넣는다. `라벨: "내용"` 형태(콜론 + 따옴표 조합)로 쓰지 않는다 — 사이트 스타일이 인용구 기본 이탤릭/장식 따옴표를 제거해뒀기 때문에, 텍스트에 직접 따옴표를 넣으면 다시 지저분해진다.

```md
✅ > **고립·은둔 청년 행동 회복 페이스메이커**
❌ > 팀 소개 문구: "고립·은둔 청년 행동 회복 페이스메이커"
```

### 3-5. 링크

- 내부 글 링크는 절대 URL이 아니라 상대 경로 또는 slug 기반으로 작성 (URL 개편 시 깨지지 않도록).

### 3-6. 문체

- 문어체(`~한다`, `~이다`) 통일. 대화체(`~해요`, `~합니다`) 혼용 금지.
- 존댓말/반말 섞지 않는다.

---

## 4. Git 커밋 컨벤션

```text
<type>: <설명>

예)
feat: Spring Security JWT 글 추가
fix: Docker Compose 글 오타 수정
refactor: articles 폴더 구조 평탄화
chore: astro 의존성 업데이트
docs: 설계 규칙 문서 수정
```

| type | 용도 |
|---|---|
| `feat` | 새 글, 새 기능/페이지 추가 |
| `fix` | 오타, 잘못된 정보, 버그 수정 |
| `refactor` | 구조 변경 (내용 변경 없음) |
| `docs` | 설계/컨벤션 문서 수정 |
| `chore` | 의존성, 설정 변경 |
| `style` | 마크다운/코드 포맷팅만 변경 |

- 커밋 메시지는 한글로 작성 (개인 프로젝트이므로 통일성만 중요).
- 글 하나 = 커밋 하나 원칙 (여러 글을 한 커밋에 몰아넣지 않는다).

---

## 5. 브랜치 / PR 워크플로우

- **Setup 작업** (프로젝트 초기 세팅, 의존성 설치, 배포 설정 등): 여러 단계를 몰아서 브랜치 하나 → PR 하나로 처리한다.
- **콘텐츠 작업** (글 작성, 기능 추가, 컴포넌트 작업 등): 작업 단위로 브랜치를 분리해서 매번 PR을 올린다.

### 5-1. 브랜치명 규칙

커밋 컨벤션의 `type`과 동일한 접두어를 사용한다.

```text
<type>/<설명>

예)
setup/init                    # 초기 세팅
feat/spring-security-jwt      # 새 글 작성
feat/related-posts            # 새 기능 추가
fix/docker-compose-typo       # 오타 수정
refactor/flatten-articles     # 구조 변경
```

### 5-2. 진행 순서

```bash
git checkout -b feat/spring-security-jwt   # 작업 단위별 브랜치 생성
git add .
git commit -m "feat: Spring Security JWT 글 추가"
git push -u origin feat/spring-security-jwt
```

1. **로컬에서 변경 확인** (다른 세션/기기에서 작업했거나, PR 브랜치를 로컬에서 직접 띄워볼 때)
   ```bash
   git fetch origin <브랜치명>
   git checkout <브랜치명>
   npm install   # package.json 변경 없었으면 생략 가능
   npm run dev
   ```
2. GitHub에서 PR 생성 — **PR 제목도 변경 내용을 구체적으로 드러내도록 작성** (예: "feat: Spring Security JWT 글 추가", 커밋 메시지와 동일한 수준의 구체성)
3. CodeRabbit 자동 리뷰 확인
4. 리뷰 반영 후 `main`에 Merge
5. Merge 완료 후 브랜치 정리

```bash
git checkout main
git pull
git branch -d feat/spring-security-jwt              # 로컬 브랜치 삭제
git push origin --delete feat/spring-security-jwt   # 원격 브랜치 삭제 (GitHub에서 버튼으로 지웠다면 생략)
```

### 5-4. CodeRabbit 리뷰 반영 방법

- 리뷰 코멘트가 단순 수정(오탈자, 짧은 코드 교정) 수준이면 **로컬 브랜치 전환 없이 GitHub 웹에서 바로 처리**한다.
  - 코멘트의 "Commit suggestion" 버튼 클릭 → 커밋 메시지 입력 → 현재 PR 브랜치에 바로 커밋
  - 또는 CodeRabbit의 **Autofix**(베타) 기능으로 자동 수정 요청 가능 — 처리에 몇 분 소요될 수 있음
- 수정이 크거나 여러 파일에 걸치면 로컬에서 브랜치 전환 후 직접 수정(5-2 절차)한다.
- GitHub에서 바로 커밋한 경우, 로컬 작업을 이어가려면 **merge 전에** `git pull origin <브랜치명>`으로 로컬을 동기화한다.

### 5-5. 예외

- 오탈자 등 아주 사소한 수정은 브랜치 없이 `main`에 바로 커밋해도 무방하다 (팀 작업이 아닌 개인 프로젝트이므로 유연하게 판단).

---

## 6. 시리즈(Series) 작성 규칙

- 시리즈 이름은 `slug`와 같은 규칙(kebab-case)으로 짓는다: `docker-basic`, `spring-security-series`
- 시리즈 내 `order`는 1부터 시작, 중간에 글을 끼워 넣어야 하면 뒤 순서를 전부 밀어서 정수로 유지한다 (1.5 같은 값 금지).
- 시리즈 글 제목은 "시리즈명 + 챕터 제목" 형태 권장: `Docker 입문 (1) - 설치와 기본 개념`

---

## 7. 리뷰 체크리스트 (발행 전 최종 확인)

- [ ] 폴더명(=slug)이 CONVENTIONS 1-1 규칙(kebab-case, 3~5단어)을 따르는가
- [ ] `description`이 제목을 반복하지 않고 내용 요약인가
- [ ] `tags`에 기술명이 섞이지 않았는가 (DESIGN_RULES 2-3 위반 여부)
- [ ] 코드블럭에 언어가 명시되어 있는가
- [ ] `h1`(`#`)을 본문에서 쓰지 않았는가
- [ ] `draft` 값을 명시했는가 (`true`/`false`)
- [ ] 커밋 메시지가 `type: 설명` 형식인가