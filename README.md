<div align="center">

# 📚 dev-archive

**몇 년 뒤에도 다시 찾아볼 수 있는 개발 지식 저장소**

[![Astro](https://img.shields.io/badge/Astro-BC52EE?style=flat-square&logo=astro&logoColor=white)](https://astro.build)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![GitHub Pages](https://img.shields.io/badge/GitHub_Pages-222222?style=flat-square&logo=github&logoColor=white)](https://pages.github.com)

</div>

---

## 🧭 소개

블로그처럼 최신 글이 위에 쌓이는 구조보다, 필요한 내용을 **카테고리 · 기술 · 태그**로 바로 찾아볼 수 있는 위키에 가까운 형태를 목표로 합니다.

> 글을 많이 쓰는 것보다, 다시 찾기 쉬운 구조를 만드는 데 집중한다.

폴더 구조는 최대한 단순하게 유지하고, 분류는 아래 3가지 메타데이터로만 관리합니다.

| 메타데이터 | 의미 |
| :---: | :--- |
| `category` | 이 글의 **목적** (development, infra, cs, ai, study, certificates) |
| `technology` | 사용한 **기술** (spring, docker, redis 등) |
| `tags` | 다루는 **주제/개념** (jwt, caching, ci-cd 등) |

---

## 🛠 기술 스택

| 분류 | 사용 기술 |
| --- | --- |
| 프레임워크 | [Astro](https://astro.build) |
| 스타일링 | [Tailwind CSS](https://tailwindcss.com) |
| 배포 | [GitHub Pages](https://pages.github.com) + [GitHub Actions](https://github.com/features/actions) |
| 코드 리뷰 | [CodeRabbit](https://coderabbit.ai) |

---

## 📂 폴더 구조

```
src/
├── content/
│   ├── articles/       # 일반 글 (study, tutorial, troubleshooting, review, tips)
│   ├── projects/       # 프로젝트 허브 페이지
│   ├── references/     # 계속 갱신되는 참고 문서
│   └── snippets/       # 짧은 코드/명령어 조각
├── content.config.ts   # Content Collections 스키마
├── lib/                # 카테고리 목록, 관련 글 추천 로직 등 공용 모듈
├── layouts/            # BaseLayout, ArticleLayout
├── components/         # Breadcrumb 등 재사용 컴포넌트
└── pages/              # 실제 라우팅되는 페이지
```

> 글 폴더는 `category`별로 나누지 않고 **평평하게(flat)** 유지합니다. 분류는 오직 frontmatter 메타데이터로만 처리합니다.
