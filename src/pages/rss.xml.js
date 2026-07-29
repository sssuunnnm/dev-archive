import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { isVisible } from '../lib/content-visibility';

export async function GET(context) {
  const articles = await getCollection('articles', ({ data }) => isVisible(data.draft));
  const sorted = articles.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
  const base = import.meta.env.BASE_URL;

  return rss({
    title: 'dev-archive',
    description: '몇 년 뒤에도 다시 찾아볼 수 있는 개발 지식 저장소',
    site: context.site,
    items: sorted.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.date,
      link: `${base}${post.data.category}/${post.id}/`,
    })),
  });
}