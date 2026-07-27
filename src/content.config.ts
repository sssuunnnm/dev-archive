import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';

// 공통: Technology Dictionary (CONVENTIONS.md 2-2 원칙 반영)
// 새 기술 추가 시 반드시 여기 먼저 등록 후 사용
const technologyEnum = z.enum([
  'java', 'spring', 'spring-boot',
  'python', 'javascript', 'typescript',
  'react', 'next-js', 'vue', 'astro',
  'docker', 'kubernetes', 'nginx', 'github-actions', 'jenkins',
  'aws', 'linux', 'git',
  'mysql', 'redis', 'mongodb',
  // 새 기술 추가 시 이 목록에 먼저 등록할 것
]);

// 참고: slug 필드는 Astro가 예약어로 사용해서 스키마에 넣을 수 없음.
// 대신 폴더명을 곧 slug로 쓰는 우리 컨벤션 덕분에, Astro가 자동 생성하는
// post.id(=폴더명)를 그대로 slug처럼 사용하면 됨.

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
    date: z.coerce.date(),
    updated: z.coerce.date().optional(),

    category: z.enum([
      'development', 'infra', 'cs', 'ai', 'study', 'certificates',
    ]),
    technology: z.array(technologyEnum),
    tags: z.array(z.string()),
    type: z.enum([
      'study', 'tutorial', 'troubleshooting', 'review', 'tips',
    ]),
    status: z.enum(['evergreen', 'archive']),

    series: z.object({
      name: z.string(),
      order: z.number(),
    }).optional(),

    projects: z.array(z.string()).optional(),   // 연관 프로젝트 id(slug)
    related: z.array(z.string()).optional(),    // 수동 지정 관련 글 id(slug)
    aliases: z.array(z.string()).optional(),     // 과거 URL 목록

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
    stack: z.array(technologyEnum),
    github: z.string().url().optional(),
    status: z.enum(['in-progress', 'done', 'archived']),
    startDate: z.coerce.date(),
    endDate: z.coerce.date().optional(),
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
    technology: z.array(technologyEnum).optional(),  // 개념 문서는 생략 가능
    tags: z.array(z.string()),
    updated: z.coerce.date(),
    aliases: z.array(z.string()).optional(),
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