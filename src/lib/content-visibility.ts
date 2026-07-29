// draft 글 노출 여부 판단 (dev 서버에서는 미리보기 위해 항상 노출, build/배포에서는 제외)
export function isVisible(draft: boolean): boolean {
  return import.meta.env.DEV ? true : !draft;
}