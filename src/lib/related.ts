import type { CollectionEntry } from 'astro:content';

type Article = CollectionEntry<'articles'>;

// DESIGN_RULES 11장 원칙: related 수동 지정 우선 → 부족분 자동 추천으로 채움
// 점수: 같은 category +3, 같은 technology 1개당 +2, 같은 tag 1개당 +1
export function getRelatedPosts(current: Article, allPosts: Article[], max = 5): Article[] {
  const manualIds = current.data.related ?? [];
  const manualPosts = manualIds
    .map((id) => allPosts.find((p) => p.id === id))
    .filter((p): p is Article => p !== undefined && p.id !== current.id);

  const usedIds = new Set([current.id, ...manualPosts.map((p) => p.id)]);

  const scored = allPosts
    .filter((p) => !usedIds.has(p.id))
    .map((p) => {
      let score = 0;
      if (p.data.category === current.data.category) score += 3;

      const techOverlap = p.data.technology.filter((t) =>
        current.data.technology.includes(t)
      ).length;
      score += techOverlap * 2;

      const tagOverlap = p.data.tags.filter((t) => current.data.tags.includes(t)).length;
      score += tagOverlap * 1;

      return { post: p, score };
    })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((s) => s.post);

  return [...manualPosts, ...scored].slice(0, max);
}

// series.name 기준 이전글/다음글 네비게이션
export function getSeriesNav(current: Article, allPosts: Article[]) {
  if (!current.data.series) return null;

  const { name } = current.data.series;
  const seriesPosts = allPosts
    .filter((p) => p.data.series?.name === name)
    .sort((a, b) => (a.data.series?.order ?? 0) - (b.data.series?.order ?? 0));

  const idx = seriesPosts.findIndex((p) => p.id === current.id);
  if (idx === -1) return null;

  return {
    prev: idx > 0 ? seriesPosts[idx - 1] : null,
    next: idx < seriesPosts.length - 1 ? seriesPosts[idx + 1] : null,
    all: seriesPosts,
  };
}