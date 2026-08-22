// projects.highlights[].icon에 쓸 수 있는 @lucide/astro 아이콘 이름을 한 곳에서 관리한다.
// content.config.ts의 z.enum과 pages/projects/[...id].astro의 렌더링이 이 목록을 함께 참조하므로,
// 새 아이콘이 필요하면 여기에만 추가하면 콘텐츠 스키마와 렌더러가 항상 같은 집합을 본다.
export const highlightIconNames = [
  'Sprout', 'PawPrint', 'Shield', 'Tv', 'Highlighter', 'Trophy', 'Satellite', 'RefreshCw', 'KeyRound',
] as const;

export type HighlightIconName = (typeof highlightIconNames)[number];
