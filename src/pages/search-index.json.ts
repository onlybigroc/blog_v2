import { getCollection } from 'astro:content';
import { getPostUrl } from '@utils/slug';

export const prerender = true;

export async function GET() {
  const posts = (await getCollection('posts'))
    .filter((post) => !post.data.draft)
    .sort((a, b) => b.data.date.getTime() - a.data.date.getTime())
    .map((post) => ({
      id: getPostUrl(post.id),
      title: post.data.title,
      date: post.data.date.toISOString(),
      dateFormatted: post.data.date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      tags: post.data.tags,
      categories: post.data.categories,
      summary: post.data.summary.trim(),
    }));

  return new Response(JSON.stringify(posts), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
    },
  });
}
