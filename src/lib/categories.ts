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