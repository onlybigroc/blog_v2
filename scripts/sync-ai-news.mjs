import fs from 'fs/promises';
import path from 'path';
import { createHash } from 'crypto';
import { fileURLToPath } from 'url';
import Parser from 'rss-parser';
import { JSDOM } from 'jsdom';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_PATH = path.join(__dirname, '../src/data/ai-news.json');
const OUTPUT_DETAILS_PATH = path.join(__dirname, '../src/data/ai-news-details.json');
const AI_NEWS_IMAGES_DIR = path.join(__dirname, '../public/images/ai-news');
const AI_NEWS_IMAGES_PUBLIC_PATH = '/images/ai-news';
const USER_AGENT = 'bigroc-blog-ai-news-bot/2.0 (+https://bigroc.cn)';
const BROWSER_USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36';
const LATEST_WINDOW_HOURS = 72;
const MAX_LATEST_ITEMS = 24;
const MAX_LATEST_ITEMS_PER_SOURCE = 4;
const MIN_CN_LATEST_ITEMS = 6;
const MAX_SNAPSHOT_FETCHES_PER_RUN = 24;
const TRANSLATION_ENABLED = process.env.AI_NEWS_TRANSLATOR !== 'none';
const TRANSLATION_BASE_URL = 'https://api.mymemory.translated.net/get';
const TRANSLATION_DELAY_MS = 250;
const ARTICLE_CONTENT_MAX_CHARS = 20000;
const ARTICLE_BLOCK_MAX_COUNT = 120;
const REQUEST_TIMEOUT_MS = 8000;
const REWRITE_STORAGE_ONLY = process.argv.includes('--rewrite-storage');

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

const translationCache = new Map();

const SOURCES = [
  {
    id: 'openai-news',
    name: 'OpenAI News',
    homepage: 'https://openai.com/news/',
    url: 'https://openai.com/news/rss.xml',
    kind: 'rss',
    sourceType: 'official',
    sourceRegion: 'global',
    language: 'en',
    priority: 30,
  },
  {
    id: 'google-ai-blog',
    name: 'Google AI Blog',
    homepage: 'https://blog.google/technology/ai/',
    url: 'https://blog.google/technology/ai/rss/',
    kind: 'rss',
    sourceType: 'official',
    sourceRegion: 'global',
    language: 'en',
    priority: 28,
  },
  {
    id: 'google-deepmind',
    name: 'Google DeepMind',
    homepage: 'https://www.deepmind.com/blog',
    url: 'https://www.deepmind.com/blog/rss.xml',
    kind: 'rss',
    sourceType: 'official',
    sourceRegion: 'global',
    language: 'en',
    priority: 28,
  },
  {
    id: 'techcrunch-ai',
    name: 'TechCrunch AI',
    homepage: 'https://techcrunch.com/category/artificial-intelligence/',
    url: 'https://techcrunch.com/category/artificial-intelligence/feed/',
    kind: 'rss',
    sourceType: 'media',
    sourceRegion: 'global',
    language: 'en',
    priority: 20,
  },
  {
    id: 'the-verge-ai',
    name: 'The Verge AI',
    homepage: 'https://www.theverge.com/ai-artificial-intelligence',
    url: 'https://www.theverge.com/rss/ai-artificial-intelligence/index.xml',
    kind: 'rss',
    sourceType: 'media',
    sourceRegion: 'global',
    language: 'en',
    priority: 18,
  },
  {
    id: 'venturebeat-ai',
    name: 'VentureBeat AI',
    homepage: 'https://venturebeat.com/ai/',
    url: 'https://venturebeat.com/category/ai/feed/',
    kind: 'rss',
    sourceType: 'media',
    sourceRegion: 'global',
    language: 'en',
    priority: 18,
  },
  {
    id: 'wired-ai',
    name: 'WIRED AI',
    homepage: 'https://www.wired.com/tag/ai/',
    url: 'https://www.wired.com/feed/tag/ai/latest/rss',
    kind: 'rss',
    sourceType: 'media',
    sourceRegion: 'global',
    language: 'en',
    priority: 16,
  },
  {
    id: 'ai-news',
    name: 'AI News',
    homepage: 'https://www.artificialintelligence-news.com/',
    url: 'https://www.artificialintelligence-news.com/feed/',
    kind: 'rss',
    sourceType: 'media',
    sourceRegion: 'global',
    language: 'en',
    priority: 14,
  },
  {
    id: '36kr-ai',
    name: '36Kr AI',
    homepage: 'https://36kr.com/information/AI/',
    url: 'https://36kr.com/information/AI/',
    kind: 'html',
    sourceType: 'media',
    sourceRegion: 'cn',
    language: 'zh',
    priority: 26,
  },
  {
    id: 'ithome-ai',
    name: 'IT之家 AI',
    homepage: 'https://www.ithome.com/tag/ai/',
    url: 'https://www.ithome.com/tag/ai/',
    kind: 'html',
    sourceType: 'media',
    sourceRegion: 'cn',
    language: 'zh',
    priority: 24,
  },
  {
    id: 'qbitai',
    name: '量子位',
    homepage: 'https://www.qbitai.com/',
    url: 'https://www.qbitai.com/',
    kind: 'html',
    sourceType: 'media',
    sourceRegion: 'cn',
    language: 'zh',
    priority: 24,
  },
  {
    id: 'leiphone-ai',
    name: '雷锋网 AI',
    homepage: 'https://www.leiphone.com/category/ai',
    url: 'https://www.leiphone.com/category/ai',
    kind: 'html',
    sourceType: 'media',
    sourceRegion: 'cn',
    language: 'zh',
    priority: 22,
  },
  {
    id: 'deepseek-news',
    name: 'DeepSeek 官方动态',
    homepage: 'https://www.deepseek.com/news',
    url: 'https://www.deepseek.com/news',
    kind: 'html',
    sourceType: 'official',
    sourceRegion: 'cn',
    language: 'zh',
    priority: 32,
  },
];

const KEYWORD_RULES = [
  { pattern: /\b(release|launch|unveil|announce|introduc|roll out|ship)\w*/gi, score: 14, tag: '发布' },
  { pattern: /(发布|推出|上线|开源|首发|官宣|发布了)/g, score: 14, tag: '发布' },
  { pattern: /\b(model|llm|reasoning|multimodal|agent|inference|embedding)\b/gi, score: 10, tag: '模型' },
  { pattern: /(模型|推理|多模态|Agent|智能体|编码|大模型)/gi, score: 10, tag: '模型' },
  { pattern: /\b(api|sdk|developer|coding|code|copilot)\b/gi, score: 8, tag: '开发工具' },
  { pattern: /(API|SDK|开发者|编程|代码|Copilot)/g, score: 8, tag: '开发工具' },
  { pattern: /\b(open source|open-source|weights|github)\b/gi, score: 10, tag: '开源' },
  { pattern: /(开源|权重|GitHub)/g, score: 10, tag: '开源' },
  { pattern: /\b(raise|funding|investment|valuation|acquire|merger)\b/gi, score: 8, tag: '资本' },
  { pattern: /(融资|投资|估值|收购|并购)/g, score: 8, tag: '资本' },
  { pattern: /\b(regulation|policy|safety|governance|copyright)\b/gi, score: 8, tag: '监管' },
  { pattern: /(监管|政策|安全|治理|版权)/g, score: 8, tag: '监管' },
  { pattern: /\b(nvidia|gpu|chip|infrastructure|datacenter)\b/gi, score: 6, tag: '算力' },
  { pattern: /(NVIDIA|GPU|芯片|算力|数据中心|智算)/g, score: 6, tag: '算力' },
];

const DOWNRANK_RULES = [
  /\b(tutorial|guide|walkthrough|how to|step by step|implementation)\b/gi,
  /(教程|指南|实战|一步一步|手把手|实现)/g,
];

const AI_RELEVANCE_RULES = [
  /\b(ai|artificial intelligence|llm|model|agent|copilot|reasoning|inference|openai|anthropic|deepmind|gemini|claude|qwen|deepseek)\b/gi,
  /(AI|人工智能|模型|智能体|推理|OpenAI|Anthropic|DeepMind|Gemini|Claude|通义|千问|DeepSeek)/g,
];

const PRIORITY_COMPANIES = [
  'OpenAI',
  'Anthropic',
  'Google',
  'DeepMind',
  'Meta',
  'Microsoft',
  'NVIDIA',
  'xAI',
  'Mistral',
  'DeepSeek',
  'Qwen',
  '通义',
  '阿里',
  '腾讯',
  '字节',
  '百度',
  '月之暗面',
  '智谱',
  'MiniMax',
];

function defaultDigest() {
  return {
    updatedAt: '1970-01-01T00:00:00.000Z',
    windowHours: LATEST_WINDOW_HOURS,
    note: '数据来自公开 RSS、中文资讯页与官方公告，按来源权重、发布时间和关键词排序；历史存档长期保留，并尽量抓取站内原文快照。',
    stats: {
      totalItems: 0,
      recent24h: 0,
      officialCount: 0,
      sourceCount: SOURCES.length,
      failedSourceCount: 0,
      cnCount: 0,
      globalCount: 0,
    },
    sources: [],
    failures: [],
    latestIds: [],
    items: [],
  };
}

async function loadArchive() {
  try {
    const content = await fs.readFile(OUTPUT_PATH, 'utf-8');
    const parsed = JSON.parse(content);
    const details = await loadDetailMap();

    return {
      ...defaultDigest(),
      ...parsed,
      items: Array.isArray(parsed.items)
        ? parsed.items.map((item) => mergeStoredItemWithDetails(item, details[item.id]))
        : [],
      latestIds: Array.isArray(parsed.latestIds) ? parsed.latestIds : [],
      failures: Array.isArray(parsed.failures) ? parsed.failures : [],
      sources: Array.isArray(parsed.sources) ? parsed.sources : [],
    };
  } catch {
    return defaultDigest();
  }
}

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

async function loadDetailMap() {
  try {
    const content = await fs.readFile(OUTPUT_DETAILS_PATH, 'utf-8');
    const parsed = JSON.parse(content);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function mergeStoredItemWithDetails(item, detail) {
  const originalContentText = item.originalContentText || detail?.originalContentText || '';

  return {
    ...item,
    originalContentText,
    originalContentAvailable: item.originalContentAvailable ?? Boolean(originalContentText),
    originalContentWarning: item.originalContentWarning || '',
    snapshotFetchedAt: item.snapshotFetchedAt || '',
  };
}

function splitDigestForStorage(digest) {
  const details = {};
  const items = digest.items.map((item) => {
    const { originalContentText = '', ...summary } = item;

    if (item.id) {
      details[item.id] = {
        originalContentText,
      };
    }

    return summary;
  });

  return [
    {
      ...digest,
      items,
    },
    details,
  ];
}

async function writeDigestFiles(digest) {
  const [summaryDigest, details] = splitDigestForStorage(digest);

  await ensureDir(path.dirname(OUTPUT_PATH));
  await fs.writeFile(OUTPUT_PATH, `${JSON.stringify(summaryDigest, null, 2)}\n`, 'utf-8');
  await fs.writeFile(OUTPUT_DETAILS_PATH, `${JSON.stringify(details, null, 2)}\n`, 'utf-8');
}

function normalizeWhitespace(value) {
  return (value || '').replace(/\s+/g, ' ').trim();
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function htmlToText(value) {
  const content = normalizeWhitespace(value);

  if (!content) {
    return '';
  }

  const dom = new JSDOM(`<body>${content}</body>`);
  return normalizeWhitespace(dom.window.document.body.textContent || '');
}

function containsChinese(text) {
  return /[\u4e00-\u9fff]/.test(text || '');
}

function shouldTranslateToChinese(text) {
  const normalized = normalizeWhitespace(text);
  return Boolean(normalized) && !containsChinese(normalized) && /[a-zA-Z]/.test(normalized);
}

function escapeSummaryNoise(value) {
  return normalizeWhitespace(
    value
      .replace(/The post .*? appeared first on .*?\.?$/i, '')
      .replace(/This article appeared on .*?\.?$/i, '')
      .replace(/Read more at .*?\.?$/i, '')
      .replace(/Continue reading .*?\.?$/i, '')
      .replace(/本文来自.*$/g, '')
      .replace(/^导语[:：]\s*/g, '')
      .replace(/^摘要[:：]\s*/g, '')
  );
}

function normalizeLink(link) {
  try {
    const url = new URL(link);
    url.hash = '';

    const removableParams = [
      'utm_source',
      'utm_medium',
      'utm_campaign',
      'utm_term',
      'utm_content',
      'gclid',
      'fbclid',
      'spm',
      'from',
    ];
    removableParams.forEach((param) => url.searchParams.delete(param));

    return url.toString();
  } catch {
    return link;
  }
}

function hashValue(value) {
  return createHash('sha1').update(value).digest('hex').slice(0, 12);
}

function toAbsoluteUrl(value, baseUrl) {
  if (!normalizeWhitespace(value)) {
    return '';
  }

  try {
    return new URL(value, baseUrl).toString();
  } catch {
    return '';
  }
}

function normalizeImageExtension(url, contentType = '') {
  try {
    const ext = path.extname(new URL(url).pathname).toLowerCase();
    if (['.png', '.jpg', '.jpeg', '.webp', '.gif', '.avif'].includes(ext)) {
      return ext;
    }
  } catch {
    // ignore
  }

  const normalizedType = contentType.toLowerCase();

  if (normalizedType.includes('png')) {
    return '.png';
  }

  if (normalizedType.includes('webp')) {
    return '.webp';
  }

  if (normalizedType.includes('gif')) {
    return '.gif';
  }

  if (normalizedType.includes('avif')) {
    return '.avif';
  }

  return '.jpg';
}

function isLikelyArticleImage(url, alt = '') {
  const normalized = `${url} ${alt}`.toLowerCase();

  if (!url || normalized.includes('.svg')) {
    return false;
  }

  return !/(logo|avatar|icon|emoji|sprite|qr|qrcode|favicon|author)/i.test(normalized);
}

function pickLeiphoneCoverImage(doc, title, pageUrl) {
  for (const image of doc.querySelectorAll('img[src]')) {
    const src = normalizeLink(toAbsoluteUrl(image.getAttribute('src') || '', pageUrl));
    const alt = normalizeWhitespace(image.getAttribute('alt') || '');

    if (
      src &&
      alt === title &&
      /static\.leiphone\.com\/uploads\/new\/images\//i.test(src) &&
      isLikelyArticleImage(src, alt)
    ) {
      return {
        coverImageOriginal: src,
        coverImageAlt: alt,
      };
    }
  }

  return null;
}

function pickITHomeCoverImage(doc, title, pageUrl) {
  for (const image of doc.querySelectorAll('img[data-original]')) {
    const src = normalizeLink(toAbsoluteUrl(image.getAttribute('data-original') || '', pageUrl));
    const imageTitle = normalizeWhitespace(image.getAttribute('title') || '');
    const width = Number.parseInt(image.getAttribute('width') || image.getAttribute('w') || '0', 10);
    const height = Number.parseInt(image.getAttribute('height') || image.getAttribute('h') || '0', 10);

    if (
      src &&
      isLikelyArticleImage(src, imageTitle) &&
      (!title || imageTitle === title) &&
      width >= 600 &&
      height >= 180
    ) {
      return {
        coverImageOriginal: src,
        coverImageAlt: imageTitle || title,
      };
    }
  }

  return null;
}

async function downloadAiNewsImage(url, itemId, referer = '') {
  const normalizedUrl = normalizeLink(url);

  if (!normalizedUrl) {
    return '';
  }

  const filename = `${itemId}-${hashValue(normalizedUrl)}${normalizeImageExtension(normalizedUrl)}`;
  const filepath = path.join(AI_NEWS_IMAGES_DIR, filename);
  const localPath = `${AI_NEWS_IMAGES_PUBLIC_PATH}/${filename}`;

  try {
    await fs.access(filepath);
    return localPath;
  } catch {
    // continue
  }

  try {
    const response = await fetch(normalizedUrl, {
      headers: {
        'User-Agent': BROWSER_USER_AGENT,
        Accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
        ...(referer ? { Referer: referer } : {}),
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.toLowerCase().startsWith('image/')) {
      throw new Error(`unsupported content-type: ${contentType || 'unknown'}`);
    }

    const ext = normalizeImageExtension(normalizedUrl, contentType);
    const finalFilename = `${itemId}-${hashValue(normalizedUrl)}${ext}`;
    const finalFilepath = path.join(AI_NEWS_IMAGES_DIR, finalFilename);
    const finalLocalPath = `${AI_NEWS_IMAGES_PUBLIC_PATH}/${finalFilename}`;
    const buffer = Buffer.from(await response.arrayBuffer());

    await ensureDir(AI_NEWS_IMAGES_DIR);
    await fs.writeFile(finalFilepath, buffer);

    return finalLocalPath;
  } catch {
    return '';
  }
}

function sanitizeXml(xml) {
  return xml.replace(/&(?!(?:#\d+|#x[\da-fA-F]+|[a-zA-Z][\w.-]*);)/g, '&amp;');
}

function parseDateCandidate(candidate) {
  const date = candidate ? new Date(candidate) : null;
  return date && !Number.isNaN(date.getTime()) ? date : null;
}

function parsePublishedAt(item) {
  const candidates = [item.isoDate, item.pubDate, item.published, item.updated, item.dcDate];

  for (const candidate of candidates) {
    const date = parseDateCandidate(candidate);
    if (date) {
      return date;
    }
  }

  return null;
}

function parseChineseRelativeTime(value, now) {
  const text = normalizeWhitespace(value);
  if (!text) {
    return null;
  }

  const minuteMatch = text.match(/(\d+)\s*分钟[前内]/);
  if (minuteMatch) {
    return new Date(now.getTime() - Number.parseInt(minuteMatch[1], 10) * 60 * 1000);
  }

  const hourMatch = text.match(/(\d+)\s*小时[前内]/);
  if (hourMatch) {
    return new Date(now.getTime() - Number.parseInt(hourMatch[1], 10) * 60 * 60 * 1000);
  }

  const dayMatch = text.match(/(\d+)\s*天[前内]/);
  if (dayMatch) {
    return new Date(now.getTime() - Number.parseInt(dayMatch[1], 10) * 24 * 60 * 60 * 1000);
  }

  if (text.includes('刚刚')) {
    return now;
  }

  const monthDayMatch = text.match(/(\d{1,2})[-/月](\d{1,2})/);
  if (monthDayMatch) {
    const year = now.getFullYear();
    const month = Number.parseInt(monthDayMatch[1], 10) - 1;
    const day = Number.parseInt(monthDayMatch[2], 10);
    return new Date(year, month, day, now.getHours(), now.getMinutes());
  }

  return null;
}

function splitSentences(value) {
  const normalized = normalizeWhitespace(value);

  if (!normalized) {
    return [];
  }

  const preservedDecimals = normalized.replace(/(\d)\.(\d)/g, '$1__DOT__$2');
  const matches =
    preservedDecimals
      .split(/(?<=[。！？!?;；])\s+|(?<=\.)\s+(?=[A-Z0-9\u4e00-\u9fa5])/)
      .map((sentence) => sentence.replace(/__DOT__/g, '.')) || [normalized];

  return matches
    .map((sentence) => normalizeWhitespace(sentence))
    .filter(Boolean);
}

function extractHighlights(title, summary) {
  const sentences = splitSentences(summary);
  const highlights = [];

  for (const sentence of sentences) {
    if (highlights.length >= 2) {
      break;
    }

    if (sentence.length < 24 || sentence === title) {
      continue;
    }

    highlights.push(sentence.slice(0, 180));
  }

  if (highlights.length === 0 && summary) {
    highlights.push(summary.slice(0, 180));
  }

  return highlights;
}

async function translateTextToChinese(text) {
  const normalized = normalizeWhitespace(text);

  if (!TRANSLATION_ENABLED || !shouldTranslateToChinese(normalized)) {
    return '';
  }

  if (translationCache.has(normalized)) {
    return translationCache.get(normalized);
  }

  const url = new URL(TRANSLATION_BASE_URL);
  url.searchParams.set('q', normalized);
  url.searchParams.set('langpair', 'en|zh-CN');

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'application/json',
      },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const payload = await response.json();
    const translatedText = htmlToText(payload?.responseData?.translatedText || '');
    const normalizedTranslation = translatedText && translatedText !== normalized ? translatedText : '';

    translationCache.set(normalized, normalizedTranslation);
    await sleep(TRANSLATION_DELAY_MS);
    return normalizedTranslation;
  } catch {
    translationCache.set(normalized, '');
    return '';
  }
}

async function enrichBilingualFields(item) {
  const titleZh =
    item.titleZh ||
    (containsChinese(item.title) ? item.title : await translateTextToChinese(item.title));
  const summaryZh =
    item.summaryZh ||
    (containsChinese(item.summary) ? item.summary : await translateTextToChinese(item.summary));
  const highlightsZh = summaryZh ? extractHighlights(titleZh || item.title, summaryZh) : [];

  return {
    ...item,
    titleZh,
    summaryZh,
    highlightsZh,
  };
}

function scoreItem(source, title, summary, publishedAt, now) {
  const text = `${title} ${summary}`;
  const tags = new Set();
  let score = source.priority;

  if (source.sourceType === 'official') {
    score += 18;
  }

  if (source.sourceRegion === 'cn') {
    score += 8;
  }

  const ageHours = Math.max(0, (now.getTime() - publishedAt.getTime()) / 36e5);
  if (ageHours <= 12) {
    score += 18;
  } else if (ageHours <= 24) {
    score += 14;
  } else if (ageHours <= 48) {
    score += 10;
  } else if (ageHours <= LATEST_WINDOW_HOURS) {
    score += 6;
  }

  for (const rule of KEYWORD_RULES) {
    if (rule.pattern.test(text)) {
      score += rule.score;
      tags.add(rule.tag);
    }
    rule.pattern.lastIndex = 0;
  }

  for (const company of PRIORITY_COMPANIES) {
    if (text.toLowerCase().includes(company.toLowerCase())) {
      score += 4;
    }
  }

  for (const rule of DOWNRANK_RULES) {
    if (rule.test(text)) {
      score -= 10;
    }
    rule.lastIndex = 0;
  }

  const hasAiContext = AI_RELEVANCE_RULES.some((rule) => {
    const matched = rule.test(text);
    rule.lastIndex = 0;
    return matched;
  });

  if (!hasAiContext && source.sourceType === 'media') {
    score -= 16;
  }

  if (summary.length >= 120) {
    score += 4;
  }

  return {
    score,
    tags: Array.from(tags).slice(0, 4),
  };
}

function getImportance(score) {
  if (score >= 72) {
    return '重点';
  }

  if (score >= 52) {
    return '关注';
  }

  return '快讯';
}

async function fetchText(url) {
  const response = await fetch(url, {
    headers: {
      'User-Agent': BROWSER_USER_AGENT,
      'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    },
    redirect: 'follow',
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  return response.text();
}

function extractSummaryFromFeed(item) {
  const candidates = [
    item.contentSnippet,
    item.summary,
    item.description,
    item.contentEncoded,
    item.content,
  ];

  for (const candidate of candidates) {
    const text = escapeSummaryNoise(htmlToText(candidate));
    if (text.length >= 20) {
      return text.slice(0, 320);
    }
  }

  return '';
}

function getSourceName(source, item) {
  if (typeof item?.source === 'string') {
    return normalizeWhitespace(item.source);
  }

  if (item?.source?.title) {
    return normalizeWhitespace(item.source.title);
  }

  return source.name;
}

async function fetchRssItems(source) {
  const xml = await fetchText(source.url);
  let parsed;

  try {
    parsed = await parser.parseString(xml);
  } catch {
    parsed = await parser.parseString(sanitizeXml(xml));
  }

  return (parsed.items || []).map((item) => ({
    title: normalizeWhitespace(item.title),
    link: normalizeLink(item.link),
    summary: extractSummaryFromFeed(item),
    publishedAt: parsePublishedAt(item),
    source: getSourceName(source, item),
  }));
}

function extract36KrItems(html, source, now) {
  const dom = new JSDOM(html, { url: source.url });
  const doc = dom.window.document;

  return [...doc.querySelectorAll('.information-flow-item')]
    .slice(0, 24)
    .map((item) => {
      const titleEl = item.querySelector('.article-item-title');
      const summaryEl = item.querySelector('.article-item-description');
      const timeEl = item.querySelector('.kr-flow-bar-time');

      const title = normalizeWhitespace(titleEl?.textContent || '');
      const link = normalizeLink(titleEl?.href || '');
      const summary = normalizeWhitespace(summaryEl?.textContent || '');
      const publishedAt = parseChineseRelativeTime(timeEl?.textContent || '', now) || now;

      if (!title || !link) {
        return null;
      }

      return {
        title,
        link,
        summary,
        publishedAt,
        source: source.name,
      };
    })
    .filter(Boolean);
}

function extractITHomeItems(html, source) {
  const dom = new JSDOM(html, { url: source.url });
  const doc = dom.window.document;

  return [...doc.querySelectorAll('a.title')]
    .slice(0, 24)
    .map((anchor) => {
      const title = normalizeWhitespace(anchor.textContent || '');
      const link = normalizeLink(anchor.href || '');

      if (!title || !link) {
        return null;
      }

      return {
        title,
        link,
        summary: '',
        publishedAt: null,
        source: source.name,
      };
    })
    .filter(Boolean);
}

function extractDeepSeekItems(html, source) {
  const dom = new JSDOM(html, { url: source.url });
  const doc = dom.window.document;

  return [...doc.querySelectorAll('a[href*="mp.weixin.qq.com"]')]
    .map((anchor) => {
      const title = normalizeWhitespace(anchor.textContent || '');
      const link = normalizeLink(anchor.href || '');

      if (!title || !link) {
        return null;
      }

      return {
        title,
        link,
        summary: '',
        publishedAt: null,
        source: source.name,
      };
    })
    .filter(Boolean)
    .slice(0, 4);
}

function extractQbitAIItems(html, source) {
  const dom = new JSDOM(html, { url: source.url });
  const doc = dom.window.document;
  const items = [];
  const seenLinks = new Set();

  for (const anchor of doc.querySelectorAll('a[href]')) {
    const title = normalizeWhitespace(anchor.textContent || '');
    const link = normalizeLink(anchor.href || '');

    if (
      !title ||
      title.length < 12 ||
      !/^https:\/\/www\.qbitai\.com\/\d{4}\/\d{2}\/\d+\.html$/i.test(link) ||
      seenLinks.has(link)
    ) {
      continue;
    }

    seenLinks.add(link);
    items.push({
      title,
      link,
      summary: '',
      publishedAt: null,
      source: source.name,
    });

    if (items.length >= 24) {
      break;
    }
  }

  return items;
}

function extractLeiphoneItems(html, source) {
  const dom = new JSDOM(html, { url: source.url });
  const doc = dom.window.document;
  const items = [];
  const seenLinks = new Set();

  for (const anchor of doc.querySelectorAll('a[href]')) {
    const title = normalizeWhitespace(anchor.textContent || '');
    const link = normalizeLink(anchor.href || '');

    if (
      !title ||
      title.length < 12 ||
      !/^https:\/\/www\.leiphone\.com\/category\/ai\/[A-Za-z0-9]+\.html$/i.test(link) ||
      seenLinks.has(link)
    ) {
      continue;
    }

    seenLinks.add(link);
    items.push({
      title,
      link,
      summary: '',
      publishedAt: null,
      source: source.name,
    });

    if (items.length >= 24) {
      break;
    }
  }

  return items;
}

async function fetchListItems(source, now) {
  if (source.kind === 'rss') {
    return fetchRssItems(source);
  }

  const html = await fetchText(source.url);

  if (source.id === '36kr-ai') {
    return extract36KrItems(html, source, now);
  }

  if (source.id === 'ithome-ai') {
    return extractITHomeItems(html, source);
  }

  if (source.id === 'qbitai') {
    return extractQbitAIItems(html, source);
  }

  if (source.id === 'leiphone-ai') {
    return extractLeiphoneItems(html, source);
  }

  if (source.id === 'deepseek-news') {
    return extractDeepSeekItems(html, source);
  }

  return [];
}

function normalizeListItem(source, item, now) {
  const title = normalizeWhitespace(item.title);
  const link = normalizeLink(item.link);
  const publishedAt = item.publishedAt || now;
  const summary = normalizeWhitespace(item.summary);

  if (!title || !link) {
    return null;
  }

  const { score, tags } = scoreItem(source, title, summary, publishedAt, now);

  return {
    id: hashValue(link),
    title,
    titleZh: source.language === 'zh' ? title : '',
    link,
    source: item.source || source.name,
    sourceType: source.sourceType,
    sourceRegion: source.sourceRegion,
    sourceLanguage: source.language,
    feedName: source.name,
    sourceHomepage: source.homepage,
    publishedAt: publishedAt.toISOString(),
    publishedAtEstimated: !item.publishedAt,
    summary,
    summaryZh: source.language === 'zh' ? summary : '',
    coverImage: '',
    coverImageOriginal: '',
    coverImageAlt: '',
    highlights: extractHighlights(title, summary),
    highlightsZh: source.language === 'zh' ? extractHighlights(title, summary) : [],
    tags,
    score,
    importance: getImportance(score),
  };
}

function dedupeItems(items) {
  const map = new Map();

  for (const item of items) {
    const key = normalizeLink(item.link);
    const existing = map.get(key);

    if (!existing) {
      map.set(key, item);
      continue;
    }

    const shouldReplace =
      item.score > existing.score ||
      (item.score === existing.score && item.summary.length > existing.summary.length);

    if (shouldReplace) {
      map.set(key, item);
    }
  }

  return Array.from(map.values());
}

function sortItems(items) {
  return items.sort((left, right) => {
    if (right.score !== left.score) {
      return right.score - left.score;
    }

    return new Date(right.publishedAt).getTime() - new Date(left.publishedAt).getTime();
  });
}

function pickItems(items, options = {}) {
  const {
    maxItems,
    maxItemsPerSource,
    minCnItems = 0,
    recentWindowHours = null,
  } = options;

  const threshold =
    recentWindowHours === null ? null : Date.now() - recentWindowHours * 36e5;
  const candidateItems =
    threshold === null
      ? items
      : items.filter((item) => new Date(item.publishedAt).getTime() >= threshold);

  const selected = [];
  const selectedIds = new Set();
  const sourceCounts = new Map();

  const tryPick = (pool, filterFn = () => true, enforceSourceCap = true) => {
    for (const item of pool) {
      if (selected.length >= maxItems) {
        break;
      }

      if (!filterFn(item) || selectedIds.has(item.id)) {
        continue;
      }

      const count = sourceCounts.get(item.feedName) || 0;
      if (enforceSourceCap && count >= maxItemsPerSource) {
        continue;
      }

      selected.push(item);
      selectedIds.add(item.id);
      sourceCounts.set(item.feedName, count + 1);
    }
  };

  if (minCnItems > 0) {
    tryPick(candidateItems, (item) => item.sourceRegion === 'cn');
  }

  tryPick(candidateItems);

  if (selected.length < maxItems) {
    tryPick(candidateItems, () => true, false);
  }

  if (selected.length < maxItems && threshold !== null) {
    tryPick(items);
    tryPick(items, () => true, false);
  }

  return selected;
}

function cleanDocumentForExtraction(doc) {
  doc.querySelectorAll('script, style, noscript, iframe, svg, canvas, form, button, nav, footer, header, aside').forEach((node) => {
    node.remove();
  });
}

function chooseBestContentContainer(doc) {
  const preferredSelectors = [
    '#js_content',
    '.rich_media_content',
    '.lphArticle-detail',
    '.article-detail',
    '.article__content',
    '.article-content',
    '.common-width.content.articleDetailContent.kr-rich-text-wrapper',
    '.post_content',
    '.entry-content',
    '[itemprop="articleBody"]',
    'article',
    'main',
    '.content',
  ];

  for (const selector of preferredSelectors) {
    const candidate = doc.querySelector(selector);
    const textLength = normalizeWhitespace(candidate?.textContent || '').length;
    if (candidate && textLength >= 200) {
      return candidate;
    }
  }

  let bestCandidate = null;
  let bestScore = 0;

  for (const candidate of doc.querySelectorAll('article, main, section, div')) {
    const text = normalizeWhitespace(candidate.textContent || '');
    if (text.length < 200) {
      continue;
    }

    const paragraphCount = candidate.querySelectorAll('p').length;
    const score = text.length + paragraphCount * 200;

    if (score > bestScore) {
      bestScore = score;
      bestCandidate = candidate;
    }
  }

  return bestCandidate;
}

function extractContentText(doc) {
  cleanDocumentForExtraction(doc);
  const container = chooseBestContentContainer(doc);

  if (!container) {
    return '';
  }

  const blocks = [];
  const seen = new Set();

  for (const node of container.querySelectorAll('h1, h2, h3, p, li')) {
    const text = normalizeWhitespace(node.textContent || '');
    if (!text || text.length < 8 || seen.has(text)) {
      continue;
    }

    seen.add(text);
    blocks.push(text);

    if (blocks.length >= ARTICLE_BLOCK_MAX_COUNT) {
      break;
    }
  }

  const combined = blocks.join('\n\n').slice(0, ARTICLE_CONTENT_MAX_CHARS);
  return combined.replace(/\n{3,}/g, '\n\n').trim();
}

function parseArticlePublishedAt(doc, fallbackDate) {
  const selectors = [
    ['meta[property="article:published_time"]', 'content'],
    ['meta[name="publishdate"]', 'content'],
    ['meta[name="pubdate"]', 'content'],
    ['meta[property="og:pubdate"]', 'content'],
    ['meta[itemprop="datePublished"]', 'content'],
    ['time[datetime]', 'datetime'],
  ];

  for (const [selector, attr] of selectors) {
    const value = doc.querySelector(selector)?.getAttribute(attr);
    const date = parseDateCandidate(value);
    if (date) {
      return date;
    }
  }

  return fallbackDate;
}

function cleanTitle(title) {
  return normalizeWhitespace(
    (title || '')
      .replace(/\s*-\s*(36氪|IT之家|WIRED|VentureBeat|The Verge|TechCrunch)\s*$/i, '')
      .replace(/\s*\|\s*OpenAI\s*$/i, '')
  );
}

function parsePublishedAtFromText(text, fallbackDate) {
  const normalized = normalizeWhitespace(text);

  const fullMatch = normalized.match(/(\d{4})\s*[年/-]\s*(\d{1,2})\s*[月/-]\s*(\d{1,2})\s*[日号]?/);
  if (fullMatch) {
    return new Date(
      Number.parseInt(fullMatch[1], 10),
      Number.parseInt(fullMatch[2], 10) - 1,
      Number.parseInt(fullMatch[3], 10)
    );
  }

  const monthDayMatch = normalized.match(/(\d{1,2})\s*月\s*(\d{1,2})\s*[日号]/);
  if (monthDayMatch) {
    return new Date(
      fallbackDate.getFullYear(),
      Number.parseInt(monthDayMatch[1], 10) - 1,
      Number.parseInt(monthDayMatch[2], 10)
    );
  }

  return fallbackDate;
}

function pickSummaryFromContent(contentText, title = '', fallback = '') {
  const blocks = contentText
    .split(/\n{2,}/)
    .map((block) => normalizeWhitespace(block))
    .filter(Boolean);

  for (const block of blocks) {
    if (
      block.length >= 24 &&
      block !== title &&
      !/^(本文作者|作者[:：]|来源[:：]|责编[:：]|责任编辑[:：]|原标题[:：]|图片来源[:：])/i.test(block)
    ) {
      return escapeSummaryNoise(block).slice(0, 320);
    }
  }

  return escapeSummaryNoise(fallback).slice(0, 320);
}

function extractArticleImage(doc, pageUrl, title = '') {
  const hostname = (() => {
    try {
      return new URL(pageUrl).hostname.toLowerCase();
    } catch {
      return '';
    }
  })();
  const metaSelectors = [
    ['meta[property="og:image"]', 'content'],
    ['meta[name="twitter:image"]', 'content'],
    ['meta[property="twitter:image"]', 'content'],
    ['link[rel="image_src"]', 'href'],
  ];

  for (const [selector, attr] of metaSelectors) {
    const rawValue = doc.querySelector(selector)?.getAttribute(attr) || '';
    const imageUrl = normalizeLink(toAbsoluteUrl(rawValue, pageUrl));

    if (isLikelyArticleImage(imageUrl)) {
      return {
        coverImageOriginal: imageUrl,
        coverImageAlt: '',
      };
    }
  }

  if (hostname.endsWith('leiphone.com')) {
    const leiphoneCover = pickLeiphoneCoverImage(doc, title, pageUrl);
    if (leiphoneCover) {
      return leiphoneCover;
    }
  }

  if (hostname.endsWith('ithome.com')) {
    const ithomeCover = pickITHomeCoverImage(doc, title, pageUrl);
    if (ithomeCover) {
      return ithomeCover;
    }
  }

  return {
    coverImageOriginal: '',
    coverImageAlt: '',
  };
}

async function fetchArticleSnapshot(item) {
  try {
    const html = await fetchText(item.link);
    const dom = new JSDOM(html, { url: item.link });
    const doc = dom.window.document;
    const rawText = htmlToText(html.slice(0, 600));

    if (/验证码|captcha|访问受限|access denied/i.test(rawText)) {
      return {
        snapshotFetchedAt: new Date().toISOString(),
        originalContentText: '',
        originalContentAvailable: false,
        originalContentWarning: '源站返回了访问限制页面，未能抓取正文快照。',
      };
    }

    const pageTitle = cleanTitle(doc.title);
    const metaSummary = escapeSummaryNoise(doc.querySelector('meta[name="description"]')?.getAttribute('content') || '');
    const contentText = extractContentText(doc);
    const summary = metaSummary || pickSummaryFromContent(contentText, pageTitle || item.title, item.summary);
    const image = extractArticleImage(doc, item.link, pageTitle || item.title);
    const coverImage = image.coverImageOriginal
      ? await downloadAiNewsImage(image.coverImageOriginal, item.id, item.link)
      : '';
    const fallbackDate = parseDateCandidate(item.publishedAt) || new Date();
    const publishedAt = parsePublishedAtFromText(
      [summary, contentText].filter(Boolean).join(' '),
      parseArticlePublishedAt(doc, fallbackDate)
    );

    return {
      publishedAt: publishedAt.toISOString(),
      publishedAtEstimated: false,
      title: pageTitle || item.title,
      summary,
      coverImage,
      coverImageOriginal: image.coverImageOriginal,
      coverImageAlt: image.coverImageAlt || pageTitle || item.title,
      originalContentText: contentText,
      originalContentAvailable: Boolean(contentText),
      originalContentWarning: contentText ? '' : '未抓取到正文快照，保留了摘要和原文链接。',
      snapshotFetchedAt: new Date().toISOString(),
    };
  } catch (error) {
    return {
      snapshotFetchedAt: new Date().toISOString(),
      coverImage: '',
      coverImageOriginal: '',
      coverImageAlt: '',
      originalContentText: '',
      originalContentAvailable: false,
      originalContentWarning: `抓取正文快照失败：${error.message}`,
    };
  }
}

async function upsertArchivedItem(existingItem, incomingItem, now, shouldFetchSnapshot = false) {
  let merged = {
    ...existingItem,
    ...incomingItem,
    archiveFirstSeenAt: existingItem?.archiveFirstSeenAt || now.toISOString(),
    lastSeenAt: now.toISOString(),
    titleZh: incomingItem.titleZh || existingItem?.titleZh || '',
    summaryZh: incomingItem.summaryZh || existingItem?.summaryZh || '',
    highlightsZh:
      incomingItem.highlightsZh?.length
        ? incomingItem.highlightsZh
        : existingItem?.highlightsZh || [],
    coverImage: existingItem?.coverImage || '',
    coverImageOriginal: existingItem?.coverImageOriginal || '',
    coverImageAlt: existingItem?.coverImageAlt || '',
    originalContentText: existingItem?.originalContentText || '',
    originalContentAvailable: existingItem?.originalContentAvailable ?? false,
    originalContentWarning: existingItem?.originalContentWarning || '',
    snapshotFetchedAt: existingItem?.snapshotFetchedAt || '',
  };

  if (existingItem?.publishedAt && incomingItem.publishedAtEstimated && !existingItem.publishedAtEstimated) {
    merged.publishedAt = existingItem.publishedAt;
    merged.publishedAtEstimated = existingItem.publishedAtEstimated;
  }

  const needsSnapshot =
    !existingItem ||
    !existingItem.originalContentText ||
    !existingItem.snapshotFetchedAt ||
    (shouldFetchSnapshot && !existingItem.coverImage);

  if (needsSnapshot && shouldFetchSnapshot) {
    const snapshot = await fetchArticleSnapshot(merged);
    const hasExistingContent = Boolean(merged.originalContentText);
    const hasFreshContent = Boolean(snapshot.originalContentText);
    merged = {
      ...merged,
      title: snapshot.title || merged.title,
      summary: snapshot.summary || merged.summary,
      publishedAt: snapshot.publishedAt || merged.publishedAt,
      publishedAtEstimated:
        typeof snapshot.publishedAtEstimated === 'boolean' && snapshot.publishedAt
          ? snapshot.publishedAtEstimated
          : merged.publishedAtEstimated,
      coverImage: snapshot.coverImage || merged.coverImage,
      coverImageOriginal: snapshot.coverImageOriginal || merged.coverImageOriginal,
      coverImageAlt: snapshot.coverImageAlt || merged.coverImageAlt,
      originalContentText: snapshot.originalContentText || merged.originalContentText,
      originalContentAvailable: hasFreshContent
        ? snapshot.originalContentAvailable
        : merged.originalContentAvailable,
      originalContentWarning: hasFreshContent
        ? snapshot.originalContentWarning || ''
        : hasExistingContent
          ? merged.originalContentWarning
          : snapshot.originalContentWarning || merged.originalContentWarning,
      snapshotFetchedAt: snapshot.snapshotFetchedAt || merged.snapshotFetchedAt,
    };
  } else if (needsSnapshot && !merged.originalContentWarning) {
    merged.originalContentWarning = '该条资讯暂未抓取正文快照，当前保留了标题、摘要和原文链接。';
  }

  const source =
    SOURCES.find((candidate) => candidate.name === merged.feedName) || {
      priority: 0,
      sourceType: merged.sourceType,
      sourceRegion: merged.sourceRegion,
    };

  const rescored = scoreItem(
    source,
    merged.title,
    merged.summary,
    new Date(merged.publishedAt),
    now
  );

  merged = {
    ...merged,
    score: rescored.score,
    tags: merged.tags?.length ? merged.tags : rescored.tags,
    importance: getImportance(rescored.score),
    highlights: extractHighlights(merged.title, merged.summary),
  };

  return enrichBilingualFields(merged);
}

function buildDigest(allItems, latestItems, failures, now) {
  const sortedItems = [...allItems].sort(
    (left, right) => new Date(right.publishedAt).getTime() - new Date(left.publishedAt).getTime()
  );

  const recent24h = sortedItems.filter(
    (item) => now.getTime() - new Date(item.publishedAt).getTime() <= 24 * 36e5
  ).length;
  const officialCount = sortedItems.filter((item) => item.sourceType === 'official').length;
  const cnCount = sortedItems.filter((item) => item.sourceRegion === 'cn').length;

  return {
    updatedAt: now.toISOString(),
    windowHours: LATEST_WINDOW_HOURS,
    note: '数据来自公开 RSS、中文资讯页与官方公告，按来源权重、发布时间和关键词排序；历史存档长期保留，并尽量抓取站内原文快照与配图。',
    stats: {
      totalItems: sortedItems.length,
      recent24h,
      officialCount,
      sourceCount: SOURCES.length,
      failedSourceCount: failures.length,
      cnCount,
      globalCount: Math.max(0, sortedItems.length - cnCount),
    },
    sources: SOURCES.map((source) => ({
      name: source.name,
      homepage: source.homepage,
      sourceType: source.sourceType,
      sourceRegion: source.sourceRegion,
    })),
    failures,
    latestIds: latestItems.map((item) => item.id),
    items: sortedItems,
  };
}

function normalizeStoredArchiveItem(item, now) {
  return {
    ...item,
    titleZh: item.titleZh || (containsChinese(item.title) ? item.title : ''),
    summaryZh: item.summaryZh || (containsChinese(item.summary) ? item.summary : ''),
    highlightsZh: item.highlightsZh || [],
    sourceRegion: item.sourceRegion || 'global',
    sourceLanguage: item.sourceLanguage || (containsChinese(item.title) ? 'zh' : 'en'),
    coverImage: item.coverImage || '',
    coverImageOriginal: item.coverImageOriginal || '',
    coverImageAlt: item.coverImageAlt || item.titleZh || item.title,
    originalContentText: item.originalContentText || '',
    originalContentAvailable: item.originalContentAvailable ?? Boolean(item.originalContentText),
    originalContentWarning: item.originalContentWarning || '',
    snapshotFetchedAt: item.snapshotFetchedAt || '',
    archiveFirstSeenAt: item.archiveFirstSeenAt || item.lastSeenAt || now.toISOString(),
    lastSeenAt: item.lastSeenAt || now.toISOString(),
  };
}

async function rewriteStorageFromArchive() {
  const now = new Date();
  const archive = await loadArchive();
  const normalizedItems = (archive.items || []).map((item) => normalizeStoredArchiveItem(item, now));
  const digest = {
    ...defaultDigest(),
    ...archive,
    items: normalizedItems,
    latestIds: Array.isArray(archive.latestIds) ? archive.latestIds : [],
    failures: Array.isArray(archive.failures) ? archive.failures : [],
    sources: Array.isArray(archive.sources) ? archive.sources : [],
  };

  await writeDigestFiles(digest);

  console.log('已重写 AI 资讯存储结构');
  console.log(`  摘要文件: ${OUTPUT_PATH}`);
  console.log(`  正文文件: ${OUTPUT_DETAILS_PATH}`);
  console.log(`  历史存档: ${normalizedItems.length}`);
}

async function run() {
  if (REWRITE_STORAGE_ONLY) {
    await rewriteStorageFromArchive();
    return;
  }

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
    maxItems: MAX_LATEST_ITEMS,
    maxItemsPerSource: MAX_LATEST_ITEMS_PER_SOURCE,
    minCnItems: MIN_CN_LATEST_ITEMS,
    recentWindowHours: LATEST_WINDOW_HOURS,
  });
  const snapshotCandidateIds = new Set(
    latestCandidates
      .slice(0, MAX_SNAPSHOT_FETCHES_PER_RUN)
      .map((item) => item.id)
  );

  const existingMap = new Map((archive.items || []).map((item) => [item.id, item]));
  const refreshedItems = [];

  for (const item of archiveCandidates) {
    const existing = existingMap.get(item.id);
    const merged = await upsertArchivedItem(existing, item, now, snapshotCandidateIds.has(item.id));
    refreshedItems.push(merged);
    existingMap.delete(item.id);
  }

  const preservedItems = Array.from(existingMap.values()).map((item) => normalizeStoredArchiveItem(item, now));

  const allItems = [...refreshedItems, ...preservedItems].sort(
    (left, right) => new Date(right.publishedAt).getTime() - new Date(left.publishedAt).getTime()
  );

  const latestIdSet = new Set(latestCandidates.map((item) => item.id));
  const latestItems = allItems.filter((item) => latestIdSet.has(item.id));
  latestItems.sort((left, right) => {
    if (left.sourceRegion !== right.sourceRegion) {
      return left.sourceRegion === 'cn' ? -1 : 1;
    }

    return new Date(right.publishedAt).getTime() - new Date(left.publishedAt).getTime();
  });

  const digest = buildDigest(allItems, latestItems, failures, now);

  await writeDigestFiles(digest);

  console.log('\n同步完成');
  console.log(`  摘要文件: ${OUTPUT_PATH}`);
  console.log(`  正文文件: ${OUTPUT_DETAILS_PATH}`);
  console.log(`  最新条数: ${latestItems.length}`);
  console.log(`  历史存档: ${allItems.length}`);
  console.log(`  失败源数: ${failures.length}`);
}

run().catch((error) => {
  console.error('\n同步 AI 资讯失败');
  console.error(error);
  process.exitCode = 1;
});
