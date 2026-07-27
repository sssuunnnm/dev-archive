// category enum과 표시용 라벨을 한 곳에서 관리 (DESIGN_RULES 2-1 참고)
// 여기에만 추가/수정하면 Home, Articles 목록, Category 페이지에 전부 반영됨

export const categories = [
  { key: 'development', label: '💻 Development' },
  { key: 'infra', label: '☁️ Infra' },
  { key: 'cs', label: '📖 CS' },
  { key: 'ai', label: '🤖 AI' },
  { key: 'study', label: '📔 Study' },
  { key: 'certificates', label: '🏆 Certificates' },
] as const;

export type CategoryKey = (typeof categories)[number]['key'];