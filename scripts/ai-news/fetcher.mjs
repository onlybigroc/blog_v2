// AI News 抓取模块
import Parser from 'rss-parser';
import { JSDOM } from 'jsdom';
import { CONFIG } from './config.mjs';
import {
  normalizeWhitespace,
  htmlToText,
  toAbsoluteUrl,
  normalizeImageExtension,
  isLikelyArticleImage,
  parsePublishedAt,
  parseChineseRelativeTime,
  cleanTitle,
  getSourceName,
  normalizeLink,
} from './utils.mjs';

const parser = new Parser({
  customFields: {
    item: [
      ['content:encoded', 'contentEncoded'],
      ['dc:creator', 'creator'],
      ['source', 'source'],
      ['description', 'description'],
    ],
  },
});

export async function fetchText(url) {
  const response = await fetch(url, {
    headers: {
      'User-Agent': url.includes('36kr') || url.includes('ithome') || url.includes('qbitai') || url.includes('leiphone') || url.includes('deepseek')
        ? CONFIG.BROWSER_USER_AGENT
        : CONFIG.USER_AGENT,
    },
    signal: AbortSignal.timeout(CONFIG.REQUEST_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  return response.text();
}

export function extractSummaryFromFeed(item) {
  const candidates = [
    item.contentEncoded,
    item.description,
    item.content,
    item.summary,
  ];

  for (const candidate of candidates) {
    if (candidate) {
      const text = htmlToText(candidate);
      if (text && text.length > 20) return text;
    }
  }

  return '';
}

export async function fetchRssItems(source) {
  const feed = await parser.parseURL(source.url);
  return (feed.items || []).map((item) => ({
    title: cleanTitle(item.title || ''),
    link: normalizeLink(item.link || ''),
    summary: extractSummaryFromFeed(item),
    publishedAt: parsePublishedAt(item),
    creator: getSourceName(source, item),
    sourceId: source.id,
    sourceName: source.name,
    sourceType: source.sourceType,
    sourceRegion: source.sourceRegion,
    language: source.language,
    priority: source.priority,
  }));
}

export function extract36KrItems(html, source, now) {
  const dom = new JSDOM(html);
  const doc = dom.window.document;
  const items = [];

  const articles = doc.querySelectorAll('article, .article-item, .kr-flow-article-item');
  for (const article of articles) {
    const titleEl = article.querySelector('h2 a, .article-item-title a, a.title');
    if (!titleEl) continue;

    const title = normalizeWhitespace(titleEl.textContent || '');
    const link = toAbsoluteUrl(titleEl.href || '', source.url);
    if (!title || !link) continue;

    const summaryEl = article.querySelector('.article-item-description, .summary, p');
    const summary = summaryEl ? normalizeWhitespace(summaryEl.textContent || '') : '';

    const timeEl = article.querySelector('time, .time, .publish-time');
    let publishedAt = null;
    if (timeEl) {
      const timeStr = timeEl.getAttribute('datetime') || timeEl.textContent || '';
      publishedAt = parseDateCandidate(timeStr) || parseChineseRelativeTime(timeStr, now);
    }

    items.push({
      title,
      link: normalizeLink(link),
      summary,
      publishedAt: publishedAt || now,
      sourceId: source.id,
      sourceName: source.name,
      sourceType: source.sourceType,
      sourceRegion: source.sourceRegion,
      language: source.language,
      priority: source.priority,
    });
  }

  return items;
}

export function extractITHomeItems(html, source) {
  const dom = new JSDOM(html);
  const doc = dom.window.document;
  const items = [];

  const articles = doc.querySelectorAll('.news-list li, .list-item');
  for (const article of articles) {
    const titleEl = article.querySelector('a');
    if (!titleEl) continue;

    const title = normalizeWhitespace(titleEl.textContent || '');
    const link = toAbsoluteUrl(titleEl.href || '', source.url);
    if (!title || !link) continue;

    items.push({
      title,
      link: normalizeLink(link),
      summary: '',
      publishedAt: new Date(),
      sourceId: source.id,
      sourceName: source.name,
      sourceType: source.sourceType,
      sourceRegion: source.sourceRegion,
      language: source.language,
      priority: source.priority,
    });
  }

  return items;
}

export function extractDeepSeekItems(html, source) {
  const dom = new JSDOM(html);
  const doc = dom.window.document;
  const items = [];

  const articles = doc.querySelectorAll('article, .post-item, .blog-item');
  for (const article of articles) {
    const titleEl = article.querySelector('h2 a, h3 a, a.title');
    if (!titleEl) continue;

    const title = normalizeWhitespace(titleEl.textContent || '');
    const link = toAbsoluteUrl(titleEl.href || '', source.url);
    if (!title || !link) continue;

    const summaryEl = article.querySelector('p, .summary, .excerpt');
    const summary = summaryEl ? normalizeWhitespace(summaryEl.textContent || '') : '';

    items.push({
      title,
      link: normalizeLink(link),
      summary,
      publishedAt: new Date(),
      sourceId: source.id,
      sourceName: source.name,
      sourceType: source.sourceType,
      sourceRegion: source.sourceRegion,
      language: source.language,
      priority: source.priority,
    });
  }

  return items;
}

export function extractQbitAIItems(html, source) {
  const dom = new JSDOM(html);
  const doc = dom.window.document;
  const items = [];

  const articles = doc.querySelectorAll('article, .post, .entry');
  for (const article of articles) {
    const titleEl = article.querySelector('h2 a, h3 a, .entry-title a');
    if (!titleEl) continue;

    const title = normalizeWhitespace(titleEl.textContent || '');
    const link = toAbsoluteUrl(titleEl.href || '', source.url);
    if (!title || !link) continue;

    const summaryEl = article.querySelector('.entry-summary, .excerpt, p');
    const summary = summaryEl ? normalizeWhitespace(summaryEl.textContent || '') : '';

    items.push({
      title,
      link: normalizeLink(link),
      summary,
      publishedAt: new Date(),
      sourceId: source.id,
      sourceName: source.name,
      sourceType: source.sourceType,
      sourceRegion: source.sourceRegion,
      language: source.language,
      priority: source.priority,
    });
  }

  return items;
}

export function extractLeiphoneItems(html, source) {
  const dom = new JSDOM(html);
  const doc = dom.window.document;
  const items = [];

  const articles = doc.querySelectorAll('.article-item, .list-item, article');
  for (const article of articles) {
    const titleEl = article.querySelector('h2 a, h3 a, .title a');
    if (!titleEl) continue;

    const title = normalizeWhitespace(titleEl.textContent || '');
    const link = toAbsoluteUrl(titleEl.href || '', source.url);
    if (!title || !link) continue;

    const summaryEl = article.querySelector('.summary, .excerpt, p');
    const summary = summaryEl ? normalizeWhitespace(summaryEl.textContent || '') : '';

    items.push({
      title,
      link: normalizeLink(link),
      summary,
      publishedAt: new Date(),
      sourceId: source.id,
      sourceName: source.name,
      sourceType: source.sourceType,
      sourceRegion: source.sourceRegion,
      language: source.language,
      priority: source.priority,
    });
  }

  return items;
}

export async function fetchListItems(source, now) {
  const html = await fetchText(source.url);

  switch (source.id) {
    case '36kr-ai':
      return extract36KrItems(html, source, now);
    case 'ithome-ai':
      return extractITHomeItems(html, source);
    case 'deepseek':
      return extractDeepSeekItems(html, source);
    case 'qbitai':
      return extractQbitAIItems(html, source);
    case 'leiphone':
      return extractLeiphoneItems(html, source);
    default:
      return [];
  }
}

export function normalizeListItem(source, item, now) {
  if (!item.title) return null;

  return {
    id: `list-${source.id}-${item.title.slice(0, 50)}`,
    title: item.title,
    link: item.link,
    summary: item.summary || '',
    publishedAt: item.publishedAt || now,
    creator: item.creator || source.name,
    sourceId: source.id,
    sourceName: source.name,
    sourceType: source.sourceType,
    sourceRegion: source.sourceRegion,
    language: source.language,
    priority: source.priority,
  };
}
