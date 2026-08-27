<div align="center">

# 📚 dev-archive

**몇 년 뒤에도 다시 찾아볼 수 있는 개발 지식 저장소**

[![Astro](https://img.shields.io/badge/Astro-BC52EE?style=flat-square&logo=astro&logoColor=white)](https://astro.build)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![GitHub Pages](https://img.shields.io/badge/GitHub_Pages-222222?style=flat-square&logo=github&logoColor=white)](https://pages.github.com)
[![Deploy](https://github.com/sssuunnnm/dev-archive/actions/workflows/deploy.yml/badge.svg)](https://github.com/sssuunnnm/dev-archive/actions/workflows/deploy.yml)
[![Last Commit](https://img.shields.io/github/last-commit/sssuunnnm/dev-archive?style=flat-square&color=466B8F)](https://github.com/sssuunnnm/dev-archive/commits/main)

[![Live Demo](https://img.shields.io/badge/Live_Demo-466B8F?style=for-the-badge&logo=googlechrome&logoColor=white)](https://sssuunnnm.github.io/dev-archive/)

</div>

---

- [미리보기](#-미리보기)
- [소개](#-소개)
- [주요 기능](#-주요-기능)
- [기술 스택](#-기술-스택)
- [폴더 구조](#folder-structure)
- [SEO / 방문자 분석 설정](#seo-analytics-setup)

---

## 🖼 미리보기

<div align="center">
<img src=".github/assets/preview.png" alt="dev-archive 홈 화면 미리보기" width="480" />
</div>

---

## 🧭 소개

공부하거나 삽질한 내용을 정리해두는 개인 블로그입니다. 다만 "오늘 뭐 썼지" 하고 최신순으로 훑어보는 타임라인보다는, 나중에 비슷한 문제를 또 만났을 때 검색 한 번으로 바로 찾아 쓸 수 있는 위키에 가깝게 만들고 싶었습니다.

그래서 글을 쓸 때마다 신경 쓰는 질문은 하나입니다. **"1년 뒤의 내가 이 글을 다시 찾을 수 있을까?"**

이 질문에 답하려고 폴더 구조는 최대한 단순하게(flat) 유지하고, 분류는 아래 3가지 메타데이터로만 관리합니다.

| 메타데이터 | 의미 |
| :---: | :--- |
| `category` | 이 글의 목적 (development, infra, cs, ai, study, certificates) |
| `technology` | 사용한 기술 (spring, docker, redis 등) |
| `tags` | 다루는 주제/개념 (jwt, caching, ci-cd 등) |

순서가 딱히 없는 콘텐츠(코딩테스트 문제 등)는 `series` 대신 `tags: [주제, level-N]` 조합으로 묶어두면, 관련 글 추천이 알아서 비슷한 글들을 이어줍니다.

---

## ✨ 주요 기능

**콘텐츠는 성격에 따라 4가지로 나눠서 관리합니다.** 일반 글(Articles), 프로젝트 회고(Projects), 계속 업데이트되는 참고 문서(References), 30초 안에 찾아 쓰는 명령어/코드 조각(Snippets)입니다. 다뤄야 할 기술 디테일이 많은 프로젝트는 비공개 원본(`{slug}-archive`)과 공개용 정리본(`{slug}`)으로 나눠서, 자세히 보고 싶은 사람과 요약만 필요한 사람 모두를 챙깁니다.

**카테고리나 태그를 누르면 빌드 타임에 미리 만들어진 진짜 정적 페이지로 이동합니다.** 그 안에서는 `category`·`technology`·`tags`가 얼마나 겹치는지 점수를 매겨 관련 글을 자동으로 보여주고, 프로젝트 문서에 `projects` 필드 하나만 적어두면 프로젝트 페이지와 관련 글이 서로 양방향으로 연결됩니다.

**찾고 싶은 내용을 바로 찾을 수 있도록** [Pagefind](https://pagefind.app) 기반 전문 검색을 붙였고, 다크모드는 시스템 설정을 따라가면서 수동으로도 바꿀 수 있습니다. Sitemap·RSS·OG/Twitter Card 메타태그는 자동으로 생성되며, Google Search Console과 [GoatCounter](https://goatcounter.com) 방문자 분석도 원할 때만 연결하면 됩니다.

쓰다 만 초안은 `draft: true`만 붙이면 로컬(`npm run dev`)에서만 보이고, 배포에는 올라가지 않습니다.

---

## 🛠 기술 스택

<div align="center">
<img src="https://skillicons.dev/icons?i=astro,tailwind,github,githubactions" alt="tech stack icons" />
</div>

| 분류 | 사용 기술 |
| --- | --- |
| 프레임워크 | [Astro](https://astro.build) |
| 스타일링 | [Tailwind CSS](https://tailwindcss.com) (+ Typography 플러그인), [Pretendard](https://github.com/orioncactus/pretendard) |
| 아이콘 | [Lucide](https://lucide.dev) (`@lucide/astro`) |
| 검색 | [Pagefind](https://pagefind.app) |
| 배포 | [GitHub Pages](https://pages.github.com) + [GitHub Actions](https://github.com/features/actions) |
| 코드 리뷰 | [CodeRabbit](https://coderabbit.ai) |

---

<details>
<summary><h2 id="folder-structure" style="display: inline;">📂 폴더 구조</h2></summary>

```
src/
├── content/
│   ├── articles/       # 일반 글 (study, tutorial, troubleshooting, review, tips)
│   ├── projects/       # 프로젝트 허브 페이지
│   ├── references/     # 계속 갱신되는 참고 문서
│   └── snippets/       # 짧은 코드/명령어 조각
├── content.config.ts   # Content Collections 스키마 (Technology Dictionary 포함)
├── lib/                # 카테고리 목록, 관련 글 추천, draft 노출 여부 등 공용 모듈
├── layouts/            # BaseLayout, ArticleLayout
├── components/         # Breadcrumb, MiniCalendar, Search 등 재사용 컴포넌트
└── pages/              # 실제 라우팅되는 페이지

templates/               # 새 글/프로젝트/레퍼런스/스니펫 작성 시 복사해서 쓰는 frontmatter 템플릿
```

> [!IMPORTANT]
> 글 폴더는 `category`별로 나누지 않고 **평평하게(flat)** 유지합니다. 분류는 오직 frontmatter 메타데이터로만 처리합니다.

</details>

---

<details>
<summary><h2 id="seo-analytics-setup" style="display: inline;">📈 SEO / 방문자 분석 설정</h2></summary>

Google Search Console(검색 유입 분석)과 GoatCounter(방문자 분석) 연동을 지원합니다. 둘 다 선택 사항이며, 값을 설정하지 않으면 관련 스크립트/메타태그는 렌더링되지 않습니다.

가입 방법과 값 확인 방법은 `.env.example` 주석을 참고해 값을 채운 뒤, 로컬 테스트용으로 `.env`에 복사하세요. 배포에 반영하려면 GitHub repo → **Settings → Secrets and variables → Actions → Variables** 탭에 동일한 이름(`PUBLIC_GOOGLE_SITE_VERIFICATION`, `PUBLIC_GOATCOUNTER_CODE`)으로 등록하면 다음 배포부터 자동 반영됩니다.

</details>
