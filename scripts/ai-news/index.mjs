// AI News 同步主入口
import fs from 'fs/promises';
import path from 'path';
import { createHash } from 'crypto';
import { fileURLToPath } from 'url';
import { JSDOM } from 'jsdom';

import { CONFIG, SOURCES, defaultDigest } from './config.mjs';
import {
  normalizeWhitespace,
  htmlToText,
  containsChinese,
  hashValue,
  toAbsoluteUrl,
  normalizeImageExtension,
  isLikelyArticleImage,
  splitSentences,
  extractHighlights,
  parseDateCandidate,
  parsePublishedAt,
  parseChineseRelativeTime,
  cleanTitle,
  pickSummaryFromContent,
  getSourceName,
  normalizeLink,
} from './utils.mjs';
import { enrichBilingualFields } from './translator.mjs';
import {
  fetchText,
  fetchRssItems,
  fetchListItems,
  normalizeListItem,
} from './fetcher.mjs';
import {
  scoreItem,
  getImportance,
  dedupeItems,
  sortItems,
  pickItems,
} from './processor.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

async function loadArchive() {
  try {
    const content = await fs.readFile(CONFIG.OUTPUT_PATH, 'utf-8');
    const parsed = JSON.parse(content);
    return {
      ...defaultDigest(),
      ...parsed,
      items: Array.isArray(parsed.items) ? parsed.items : [],
      latestIds: Array.isArray(parsed.latestIds) ? parsed.latestIds : [],
      failures: Array.isArray(parsed.failures) ? parsed.failures : [],
      sources: Array.isArray(parsed.sources) ? parsed.sources : [],
    };
  } catch {
    return defaultDigest();
  }
}

async function downloadAiNewsImage(url, itemId, referer = '') {
  try {
    const urlObj = new URL(url);
    const ext = normalizeImageExtension(url, '');
    const filename = `${hashValue(url)}${ext}`;
    const filepath = path.join(CONFIG.AI_NEWS_IMAGES_DIR, filename);
    const publicPath = `${CONFIG.AI_NEWS_IMAGES_PUBLIC_PATH}/${filename}`;

    try {
      await fs.access(filepath);
      return publicPath;
    } catch {
      // File doesn't exist, download it
    }

    const headers = { 'User-Agent': CONFIG.USER_AGENT };
    if (referer) headers['Referer'] = referer;

    const response = await fetch(url, {
      headers,
      signal: AbortSignal.timeout(CONFIG.REQUEST_TIMEOUT_MS),
    });

    if (!response.ok) return null;

    const buffer = await response.arrayBuffer();
    await ensureDir(CONFIG.AI_NEWS_IMAGES_DIR);
    await fs.writeFile(filepath, Buffer.from(buffer));

    return publicPath;
  } catch {
    return null;
  }
}

function cleanDocumentForExtraction(doc) {
  const removeSelectors = [
    'script', 'style', 'nav', 'header', 'footer',
    '.sidebar', '.comment', '.share', '.related',
    '.advertisement', '.social', '.newsletter',
  ];

  for (const selector of removeSelectors) {
    const elements = doc.querySelectorAll(selector);
    elements.forEach((el) => el.remove());
  }
}

function chooseBestContentContainer(doc) {
  const candidates = [
    doc.querySelector('article'),
    doc.querySelector('.article-content'),
    doc.querySelector('.post-content'),
    doc.querySelector('.entry-content'),
    doc.querySelector('.content'),
    doc.querySelector('main'),
    doc.querySelector('body'),
  ];

  for (const candidate of candidates) {
    if (candidate && candidate.textContent.trim().length > 100) {
      return candidate;
    }
  }

  return doc.body;
}

function extractContentText(doc) {
  cleanDocumentForExtraction(doc);
  const container = chooseBestContentContainer(doc);
  if (!container) return '';

  let text = '';
  const paragraphs = container.querySelectorAll('p, h1, h2, h3, h4, h5, h6, li');

  for (const p of paragraphs) {
    const content = normalizeWhitespace(p.textContent || '');
    if (content.length > 10) {
      text += content + '\n\n';
    }
  }

  if (text.length < 50) {
    text = normalizeWhitespace(container.textContent || '');
  }

  return text.slice(0, CONFIG.ARTICLE_CONTENT_MAX_CHARS);
}

function parseArticlePublishedAt(doc, fallbackDate) {
  const timeEl = doc.querySelector('time[datetime], meta[property="article:published_time"]');
  if (timeEl) {
    const datetime = timeEl.getAttribute('datetime') || timeEl.getAttribute('content');
    if (datetime) {
      const date = parseDateCandidate(datetime);
      if (date) return date;
    }
  }

  const datePatterns = [
    /(\d{4})[-年](\d{1,2})[-月](\d{1,2})[日]?/,
    /(\d{1,2})[-/](\d{1,2})[-/](\d{4})/,
  ];

  const bodyText = doc.body?.textContent || '';
  for (const pattern of datePatterns) {
    const match = bodyText.match(pattern);
    if (match) {
      const date = parseDateCandidate(match[0]);
      if (date) return date;
    }
  }

  return fallbackDate;
}

function extractArticleImage(doc, pageUrl, title = '') {
  const ogImage = doc.querySelector('meta[property="og:image"]');
  if (ogImage) {
    const url = ogImage.getAttribute('content');
    if (url && isLikelyArticleImage(url)) return toAbsoluteUrl(url, pageUrl);
  }

  const images = doc.querySelectorAll('article img, .content img, main img');
  for (const img of images) {
    const src = img.getAttribute('src') || img.getAttribute('data-src');
    const alt = img.getAttribute('alt') || '';
    if (src && isLikelyArticleImage(src, alt)) {
      return toAbsoluteUrl(src, pageUrl);
    }
  }

  return null;
}

async function fetchArticleSnapshot(item) {
  if (!item.link) return null;

  try {
    const html = await fetchText(item.link);
    const dom = new JSDOM(html);
    const doc = dom.window.document;

    const contentText = extractContentText(doc);
    const publishedAt = parseArticlePublishedAt(doc, item.publishedAt);
    const image = extractArticleImage(doc, item.link, item.title);

    return {
      contentText: contentText.slice(0, CONFIG.ARTICLE_CONTENT_MAX_CHARS),
      publishedAt,
      image,
    };
  } catch {
    return null;
  }
}

async function upsertArchivedItem(existingItem, incomingItem, now, shouldFetchSnapshot = false) {
  const item = {
    ...existingItem,
    ...incomingItem,
    lastSeenAt: now.toISOString(),
  };

  if (!existingItem) {
    item.firstSeenAt = now.toISOString();
  }

  const score = scoreItem(
    { priority: incomingItem.priority },
    incomingItem.title,
    incomingItem.summary,
    new Date(incomingItem.publishedAt),
    now
  );
  item.score = score;
  item.importance = getImportance(score);

  if (shouldFetchSnapshot && !item.contentText) {
    const snapshot = await fetchArticleSnapshot(item);
    if (snapshot) {
      if (snapshot.contentText && !item.contentText) {
        item.contentText = snapshot.contentText;
      }
      if (snapshot.image && !item.image) {
        item.image = snapshot.image;
      }
      if (snapshot.publishedAt) {
        item.publishedAt = snapshot.publishedAt.toISOString();
      }
    }
  }

  if (item.summary && !item.highlights) {
    item.highlights = extractHighlights(item.title, item.summary);
  }

  return item;
}

function buildDigest(allItems, latestItems, failures, now) {
  const stats = {
    totalItems: allItems.length,
    recent24h: allItems.filter((item) => {
      const pubDate = new Date(item.publishedAt);
      return (now.getTime() - pubDate.getTime()) < 24 * 60 * 60 * 1000;
    }).length,
    officialCount: allItems.filter((item) => item.sourceType === 'official').length,
    sourceCount: SOURCES.length,
    failedSourceCount: failures.length,
    cnCount: allItems.filter((item) => item.sourceRegion === 'cn').length,
    globalCount: allItems.filter((item) => item.sourceRegion === 'global').length,
  };

  return {
    updatedAt: now.toISOString(),
    windowHours: CONFIG.LATEST_WINDOW_HOURS,
    note: '数据来自公开 RSS、中文资讯页与官方公告，按来源权重、发布时间和关键词排序；历史存档长期保留，并尽量抓取站内原文快照方便回看。',
    stats,
    sources: SOURCES.map((s) => ({ id: s.id, name: s.name, type: s.sourceType, region: s.sourceRegion })),
    failures,
    latestIds: latestItems.map((item) => item.id),
    items: allItems,
  };
}

async function run() {
  const now = new Date();
  const archive = await loadArchive();
  const normalizedItems = [];
  const failures = [];

  console.log('开始同步 AI 资讯...\n');

  for (const source of SOURCES) {
    try {
      console.log(`正在抓取: ${source.name}`);
      const rawItems = await fetchListItems(source, now);
      console.log(`  获取到 ${rawItems.length} 条`);

      for (const item of rawItems) {
        const normalized = normalizeListItem(source, item, now);
        if (normalized) {
          normalizedItems.push(normalized);
        }
      }
    } catch (error) {
      console.warn(`  抓取失败: ${source.name} - ${error.message}`);
      failures.push({
        name: source.name,
        reason: error.message,
      });
    }
  }

  const dedupedItems = sortItems(dedupeItems(normalizedItems));
  const archiveCandidates = dedupedItems;

  const latestCandidates = pickItems(dedupedItems, {
    maxItems: CONFIG.MAX_LATEST_ITEMS,
    maxItemsPerSource: CONFIG.MAX_LATEST_ITEMS_PER_SOURCE,
    minCnItems: CONFIG.MIN_CN_LATEST_ITEMS,
    recentWindowHours: CONFIG.LATEST_WINDOW_HOURS,
  });
  const snapshotCandidateIds = new Set(
    latestCandidates
      .slice(0, CONFIG.MAX_SNAPSHOT_FETCHES_PER_RUN)
      .map((item) => item.id)
  );

  const existingMap = new Map((archive.items || []).map((item) => [item.id, item]));
  const refreshedItems = [];

  for (const item of archiveCandidates) {
    const existing = existingMap.get(item.id);
    const shouldFetchSnapshot = snapshotCandidateIds.has(item.id);

    const enriched = await enrichBilingualFields(item);
    const upserted = await upsertArchivedItem(existing, enriched, now, shouldFetchSnapshot);
    refreshedItems.push(upserted);
  }

  const existingOnlyItems = (archive.items || []).filter(
    (item) => !refreshedItems.some((r) => r.id === item.id)
  );
  const allItems = [...refreshedItems, ...existingOnlyItems];

  const latestItems = latestCandidates.map((candidate) =>
    allItems.find((item) => item.id === candidate.id) || candidate
  );

  const digest = buildDigest(allItems, latestItems, failures, now);

  await ensureDir(path.dirname(CONFIG.OUTPUT_PATH));
  await fs.writeFile(CONFIG.OUTPUT_PATH, JSON.stringify(digest, null, 2), 'utf-8');

  console.log(`\n同步完成:`);
  console.log(`  总条目: ${digest.stats.totalItems}`);
  console.log(`  最新推荐: ${latestItems.length}`);
  console.log(`  24小时内: ${digest.stats.recent24h}`);
  console.log(`  失败来源: ${failures.length}`);
}

run().catch((error) => {
  console.error('同步失败:', error);
  process.exit(1);
});
