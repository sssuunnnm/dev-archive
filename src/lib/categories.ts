// category enum과 표시용 라벨을 한 곳에서 관리 (DESIGN_RULES 2-1 참고)
// 여기에만 추가/수정하면 Home, Articles 목록, Category 페이지, content.config.ts 스키마까지 전부 반영됨

// z.enum이 요구하는 튜플 타입 유지를 위해 키 배열을 별도로 둔다
export const categoryKeys = [
  'development',
  'infra',
  'cs',
  'ai',
  'study',
  'certificates',
] as const;

export type CategoryKey = (typeof categoryKeys)[number];

const labels: Record<CategoryKey, string> = {
  development: 'Development',
  infra: 'Infra',
  cs: 'CS',
  ai: 'AI',
  study: 'Study',
  certificates: 'Certificates',
};

export const categories = categoryKeys.map((key) => ({ key, label: labels[key] }));

// 카테고리 키를 사용자에게 보여줄 라벨로 변환 (내부 키 노출 방지)
export function getCategoryLabel(key: string): string {
  return labels[key as CategoryKey] ?? key;
}

// Tailwind가 정적으로 클래스를 스캔하므로 템플릿 문자열(`text-cat-${key}`) 대신
// 카테고리별 완전한 클래스 문자열을 그대로 나열한다 (global.css의 --color-cat-* 토큰과 짝)
const textColorClasses: Record<CategoryKey, string> = {
  development: 'text-cat-development dark:text-cat-development-dark',
  infra: 'text-cat-infra dark:text-cat-infra-dark',
  cs: 'text-cat-cs dark:text-cat-cs-dark',
  ai: 'text-cat-ai dark:text-cat-ai-dark',
  study: 'text-cat-study dark:text-cat-study-dark',
  certificates: 'text-cat-certificates dark:text-cat-certificates-dark',
};

const pillClasses: Record<CategoryKey, string> = {
  development: 'bg-cat-development/10 text-cat-development dark:bg-cat-development-dark/10 dark:text-cat-development-dark',
  infra: 'bg-cat-infra/10 text-cat-infra dark:bg-cat-infra-dark/10 dark:text-cat-infra-dark',
  cs: 'bg-cat-cs/10 text-cat-cs dark:bg-cat-cs-dark/10 dark:text-cat-cs-dark',
  ai: 'bg-cat-ai/10 text-cat-ai dark:bg-cat-ai-dark/10 dark:text-cat-ai-dark',
  study: 'bg-cat-study/10 text-cat-study dark:bg-cat-study-dark/10 dark:text-cat-study-dark',
  certificates: 'bg-cat-certificates/10 text-cat-certificates dark:bg-cat-certificates-dark/10 dark:text-cat-certificates-dark',
};

// 카테고리별 텍스트 컬러 클래스 (breadcrumb, 목록 메타 등)
export function getCategoryColorClass(key: string): string {
  return textColorClasses[key as CategoryKey] ?? '';
}

// 카테고리별 배경 tint + 텍스트 컬러 클래스 (pill/뱃지용)
export function getCategoryPillClass(key: string): string {
  return pillClasses[key as CategoryKey] ?? '';
}