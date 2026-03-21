import { getCollection } from 'astro:content';
import { getPostUrl } from '@utils/slug';

export const prerender = true;

function escapeXml(value = '') {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export async function GET(context) {
  const site = context.site ?? new URL('https://bigroc.cn');
  const posts = (await getCollection('posts'))
    .filter((post) => !post.data.draft)
    .sort((a, b) => b.data.date.getTime() - a.data.date.getTime());

  const lastBuildDate = posts[0]?.data.date ?? new Date();
  const feedUrl = new URL('/rss.xml', site).toString();

  const items = posts
    .map((post) => {
      const postUrl = new URL(`/posts/${getPostUrl(post.id)}`, site).toString();
      const categories = [...post.data.categories, ...post.data.tags]
        .map((category) => `<category>${escapeXml(category)}</category>`)
        .join('');

      return [
        '<item>',
        `<title>${escapeXml(post.data.title)}</title>`,
        `<link>${escapeXml(postUrl)}</link>`,
        `<guid>${escapeXml(postUrl)}</guid>`,
        `<pubDate>${post.data.date.toUTCString()}</pubDate>`,
        `<description>${escapeXml(post.data.summary)}</description>`,
        categories,
        '</item>',
      ].join('');
    })
    .join('');

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    '<channel>',
    `<title>${escapeXml('Bigroc - 技术博客')}</title>`,
    `<description>${escapeXml('分享技术文章与开发心得')}</description>`,
    `<link>${escapeXml(site.toString())}</link>`,
    '<language>zh-CN</language>',
    `<lastBuildDate>${lastBuildDate.toUTCString()}</lastBuildDate>`,
    `<atom:link href="${escapeXml(feedUrl)}" rel="self" type="application/rss+xml" />`,
    items,
    '</channel>',
    '</rss>',
  ].join('');

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
    },
  });
}
