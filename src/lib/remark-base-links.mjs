import { visit } from 'unist-util-visit';

// 마크다운 본문의 링크/이미지 중 "/"로 시작하는 절대경로(우리 사이트 내부 경로)에
// GitHub Pages base 경로(예: /dev-archive/)를 자동으로 붙여준다.
// 외부 링크(http://, https://)나 "//"로 시작하는 프로토콜 상대경로는 건드리지 않는다.
export function remarkBaseLinks(base) {
  const prefix = base.replace(/\/$/, ''); // 끝 슬래시 제거 후 붙일 준비

  return () => (tree) => {
    visit(tree, ['link', 'image'], (node) => {
      if (typeof node.url === 'string' && node.url.startsWith('/') && !node.url.startsWith('//')) {
        node.url = `${prefix}${node.url}`;
      }
    });
  };
}