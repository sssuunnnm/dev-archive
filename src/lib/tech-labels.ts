// technologyEnum 키를 사람이 읽는 라벨로, 일부는 skillicons.dev 슬러그로 변환.
// 새 기술을 content.config.ts의 technologyEnum에 추가하면 여기도 같이 업데이트한다.

const labels: Record<string, string> = {
  java: 'Java',
  spring: 'Spring',
  'spring-boot': 'Spring Boot',
  python: 'Python',
  javascript: 'JavaScript',
  typescript: 'TypeScript',
  cpp: 'C++',
  react: 'React',
  'next-js': 'Next.js',
  vue: 'Vue',
  astro: 'Astro',
  docker: 'Docker',
  kubernetes: 'Kubernetes',
  nginx: 'Nginx',
  'github-actions': 'GitHub Actions',
  jenkins: 'Jenkins',
  aws: 'AWS',
  linux: 'Linux',
  git: 'Git',
  mysql: 'MySQL',
  redis: 'Redis',
  mongodb: 'MongoDB',
  postgresql: 'PostgreSQL',
  chromadb: 'ChromaDB',
  android: 'Android',
  kotlin: 'Kotlin',
  mapbox: 'Mapbox',
  fcm: 'FCM',
  kafka: 'Kafka',
  websocket: 'WebSocket',
  sse: 'SSE',
  fastapi: 'FastAPI',
  langchain: 'LangChain',
  openai: 'OpenAI',
  gemini: 'Gemini',
  zustand: 'Zustand',
};

export function getTechLabel(key: string): string {
  return labels[key] ?? key;
}

// skillicons.dev에 실제로 존재하는 슬러그만 골라 매핑 (없는 기술은 로고 카드에서 제외).
const iconSlugs: Record<string, string> = {
  java: 'java',
  spring: 'spring',
  'spring-boot': 'spring',
  python: 'python',
  javascript: 'js',
  typescript: 'ts',
  cpp: 'cpp',
  react: 'react',
  'next-js': 'nextjs',
  vue: 'vue',
  astro: 'astro',
  docker: 'docker',
  kubernetes: 'kubernetes',
  nginx: 'nginx',
  'github-actions': 'githubactions',
  jenkins: 'jenkins',
  aws: 'aws',
  linux: 'linux',
  git: 'git',
  mysql: 'mysql',
  redis: 'redis',
  mongodb: 'mongodb',
  postgresql: 'postgres',
  android: 'androidstudio',
  kotlin: 'kotlin',
  kafka: 'kafka',
};

export function getTechIconSlug(key: string): string | null {
  return iconSlugs[key] ?? null;
}
