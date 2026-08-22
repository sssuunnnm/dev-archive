import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';
import { categoryKeys } from './lib/categories';

// 공통: Technology Dictionary (CONVENTIONS.md 2-2 원칙 반영)
// 새 기술 추가 시 반드시 여기 먼저 등록 후 사용
const technologyEnum = z.enum([
  'java', 'spring', 'spring-boot',
  'python', 'javascript', 'typescript', 'cpp',
  'react', 'next-js', 'vue', 'astro',
  'docker', 'kubernetes', 'nginx', 'github-actions', 'jenkins',
  'aws', 'linux', 'git',
  'mysql', 'redis', 'mongodb', 'postgresql', 'chromadb',
  'android', 'kotlin', 'mapbox', 'fcm',
  'kafka', 'websocket', 'sse', 'fastapi', 'langchain', 'openai', 'gemini',
  // 새 기술 추가 시 이 목록에 먼저 등록할 것
]);

// 참고: slug 필드는 Astro가 예약어로 사용해서 스키마에 넣을 수 없음.
// 대신 폴더명을 곧 slug로 쓰는 우리 컨벤션 덕분에, Astro가 자동 생성하는
// post.id(=폴더명)를 그대로 slug처럼 사용하면 됨.

// 날짜 전용(YYYY-MM-DD) 값만 허용한다 (CONVENTIONS.md 2-2).
// frontmatter의 date-only YAML 스칼라는 파서가 이미 UTC 자정(Date)으로 변환해서 넘겨주므로,
// 여기서 문자열 형식을 다시 검사할 수는 없다 — 대신 "시:분:초가 전부 0인 UTC 자정인지"로 검증한다.
// 시간/오프셋이 포함된 값(예: 2026-08-21T00:30:00+09:00)은 자정이 아니게 되므로 여기서 걸러진다.
const dateOnly = z.coerce.date().refine(
  (d) => d.getUTCHours() === 0 && d.getUTCMinutes() === 0 && d.getUTCSeconds() === 0 && d.getUTCMilliseconds() === 0,
  { message: '날짜는 시간/타임존 없이 YYYY-MM-DD 형식으로만 작성한다' },
);

// Articles
const articles = defineCollection({
  loader: glob({
    pattern: '**/*.md',
    base: './src/content/articles',
    // folder/index.md → 폴더명 자체를 id(slug)로 고정
    generateId: ({ entry }) => entry.replace(/\/index\.md$/, '').replace(/\.md$/, ''),
  }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: dateOnly,
    updated: dateOnly.nullish(),

    category: z.enum(categoryKeys),
    technology: z.array(technologyEnum),
    tags: z.array(z.string()),
    type: z.enum([
      'study', 'tutorial', 'troubleshooting', 'review', 'tips',
    ]),
    status: z.enum(['evergreen', 'archive']),

    series: z.object({
      name: z.string(),
      order: z.number(),
    }).nullish(),

    projects: z.array(z.string()).nullish(),   // 연관 프로젝트 id(slug)
    related: z.array(z.string()).nullish(),    // 수동 지정 관련 글 id(slug)
    aliases: z.array(z.string()).nullish(),     // 과거 URL 목록

    draft: z.boolean().default(false),
  }),
});

// Projects
const projects = defineCollection({
  loader: glob({
    pattern: '**/*.md',
    base: './src/content/projects',
    generateId: ({ entry }) => entry.replace(/\/index\.md$/, '').replace(/\.md$/, ''),
  }),
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    // "이런 제품" 칩 목록 — 핵심 기능을 짧은 명사구로 나열 (예: "마이크로 루틴 챌린지")
    features: z.array(z.string()).max(8).nullish(),
    // 차별점 카드 (최대 3장) — 이 프로젝트만의 판단/설계를 짧게 어필
    highlights: z.array(z.object({
      icon: z.string(),        // @lucide/astro 아이콘 이름 (PascalCase, 예: Sprout) — src/pages/projects/[...id].astro의 highlightIcons에 등록된 것만 사용
      title: z.string(),
      description: z.string(),
      tag: z.string(),         // 카드 하단 요약 태그 (예: "실패 부담 zero")
    })).max(3).nullish(),
    stack: z.array(technologyEnum),
    github: z.string().url().nullish(),
    status: z.enum(['in-progress', 'done', 'archived']),
    startDate: dateOnly,
    endDate: dateOnly.nullish(),
    draft: z.boolean().default(false),
  }),
});

// Reference (계속 갱신되는 문서)
const references = defineCollection({
  loader: glob({
    pattern: '**/*.md',
    base: './src/content/references',
    generateId: ({ entry }) => entry.replace(/\/index\.md$/, '').replace(/\.md$/, ''),
  }),
  schema: z.object({
    title: z.string(),
    technology: z.array(technologyEnum).nullish(),  // 개념 문서는 생략 가능
    tags: z.array(z.string()),
    updated: dateOnly,
    aliases: z.array(z.string()).nullish(),
  }),
});

// Snippets (짧은 코드/명령어 조각)
const snippets = defineCollection({
  loader: glob({
    pattern: '**/*.md',
    base: './src/content/snippets',
    generateId: ({ entry }) => entry.replace(/\/index\.md$/, '').replace(/\.md$/, ''),
  }),
  schema: z.object({
    title: z.string(),
    command: z.string(),
    description: z.string(),
    technology: z.array(technologyEnum),
    tags: z.array(z.string()),
  }),
});

export const collections = {
  articles,
  projects,
  references,
  snippets,
};