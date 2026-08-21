// 프로그래머스 레벨 태그(level-1~3)를 "Lv.N" 라벨로 표시 (일반 난이도가 아니라
// 프로그래머스 자체 레벨이라 점 강도 표기는 의미가 헷갈려서 텍스트로 표기)
const LEVEL_TAG = /^level-([1-3])$/;

function parseLevelTag(tag: string): number | null {
  const match = LEVEL_TAG.exec(tag);
  return match ? Number(match[1]) : null;
}

// 태그 라벨을 화면에 표시할 문자열로 변환 (# 접두어는 호출부에서 붙인다 — 레벨/일반 태그 모두 동일하게)
export function formatTagLabel(tag: string): string {
  const level = parseLevelTag(tag);
  return level === null ? tag : `Lv.${level}`;
}
