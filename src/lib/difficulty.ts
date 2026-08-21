// 코딩테스트 난이도 태그(level-1~3)를 텍스트 대신 점 강도(●●○)로 표시
const DIFFICULTY_TAG = /^level-([1-3])$/;
const MAX_LEVEL = 3;

function parseDifficultyTag(tag: string): number | null {
  const match = DIFFICULTY_TAG.exec(tag);
  return match ? Number(match[1]) : null;
}

// 태그 라벨을 화면에 표시할 문자열로 변환 (난이도 태그는 점, 나머지는 #tag 그대로)
export function formatTagLabel(tag: string): string {
  const level = parseDifficultyTag(tag);
  if (level === null) return `#${tag}`;
  return '●'.repeat(level) + '○'.repeat(MAX_LEVEL - level);
}
