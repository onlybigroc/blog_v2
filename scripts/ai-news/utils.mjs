// AI News 工具函数
import { JSDOM } from 'jsdom';

export function normalizeWhitespace(value) {
  return (value || '').replace(/\s+/g, ' ').trim();
}

export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function htmlToText(value) {
  const content = normalizeWhitespace(value);

  if (!content) {
    return '';
  }

  const dom = new JSDOM(`<body>${content}</body>`);
  return normalizeWhitespace(dom.window.document.body.textContent || '');
}

export function containsChinese(text) {
  return /[\u4e00-\u9fff]/.test(text || '');
}

export function shouldTranslateToChinese(text) {
  const normalized = normalizeWhitespace(text);
  return Boolean(normalized) && !containsChinese(normalized) && /[a-zA-Z]/.test(normalized);
}

export function escapeSummaryNoise(value) {
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

export function normalizeLink(link) {
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
      'ref',
      'source',
    ];

    for (const param of removableParams) {
      url.searchParams.delete(param);
    }

    return url.toString();
  } catch {
    return link;
  }
}

export function hashValue(value) {
  const { createHash } = require('crypto');
  return createHash('md5').update(value).digest('hex').slice(0, 12);
}

export function toAbsoluteUrl(value, baseUrl) {
  if (!value) return '';
  if (value.startsWith('http://') || value.startsWith('https://')) return value;
  if (value.startsWith('//')) return `https:${value}`;
  if (value.startsWith('/')) {
    try {
      const base = new URL(baseUrl);
      return `${base.protocol}//${base.host}${value}`;
    } catch {
      return value;
    }
  }
  return value;
}

export function normalizeImageExtension(url, contentType = '') {
  if (contentType.includes('jpeg') || contentType.includes('jpg')) return '.jpg';
  if (contentType.includes('png')) return '.png';
  if (contentType.includes('webp')) return '.webp';
  if (contentType.includes('gif')) return '.gif';

  const ext = url.split('?')[0].split('#')[0].split('.').pop()?.toLowerCase();
  if (['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext)) return `.${ext}`;
  return '.jpg';
}

export function isLikelyArticleImage(url, alt = '') {
  const skipPatterns = [
    /logo/i,
    /icon/i,
    /avatar/i,
    /banner/i,
    /ad[_-]/i,
    /sponsor/i,
    /tracking/i,
    /pixel/i,
    /badge/i,
    /button/i,
  ];

  for (const pattern of skipPatterns) {
    if (pattern.test(url) || pattern.test(alt)) return false;
  }

  return true;
}

export function splitSentences(value) {
  if (!value) return [];
  return value
    .replace(/([。！？.!?])\s*/g, '$1\n')
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);
}

export function extractHighlights(title, summary) {
  const sentences = [
    ...splitSentences(title),
    ...splitSentences(summary),
  ];

  const highlights = [];
  for (const sentence of sentences) {
    if (sentence.length >= 10 && sentence.length <= 200) {
      highlights.push(sentence);
      if (highlights.length >= 3) break;
    }
  }

  return highlights;
}

export function parseDateCandidate(candidate) {
  if (!candidate) return null;
  const date = new Date(candidate);
  return isNaN(date.getTime()) ? null : date;
}

export function parsePublishedAt(item) {
  return (
    parseDateCandidate(item.pubDate) ||
    parseDateCandidate(item.published) ||
    parseDateCandidate(item.updated) ||
    parseDateCandidate(item.created) ||
    null
  );
}

export function parseChineseRelativeTime(value, now) {
  const match = value.match(/(\d+)\s*(分钟|小时|天|周|月|年)前/);
  if (!match) return null;

  const num = parseInt(match[1], 10);
  const unit = match[2];

  const date = new Date(now);
  switch (unit) {
    case '分钟': date.setMinutes(date.getMinutes() - num); break;
    case '小时': date.setHours(date.getHours() - num); break;
    case '天': date.setDate(date.getDate() - num); break;
    case '周': date.setDate(date.getDate() - num * 7); break;
    case '月': date.setMonth(date.getMonth() - num); break;
    case '年': date.setFullYear(date.getFullYear() - num); break;
  }

  return date;
}

export function cleanTitle(title) {
  return normalizeWhitespace(title)
    .replace(/\s*[-–—|]\s*[^-–—|]*$/, '')
    .replace(/\s*\([^)]*\)\s*$/, '')
    .trim();
}

export function pickSummaryFromContent(contentText, title = '', fallback = '') {
  if (!contentText) return fallback;

  const sentences = splitSentences(contentText);
  const titleWords = new Set(
    title
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 2)
  );

  const scored = sentences.map((sentence) => {
    let score = 0;
    if (sentence.length >= 50 && sentence.length <= 300) score += 2;
    if (sentence.length >= 100) score += 1;

    const words = sentence.toLowerCase().split(/\s+/);
    for (const word of words) {
      if (titleWords.has(word)) score += 1;
    }

    return { sentence, score };
  });

  scored.sort((a, b) => b.score - a.score);

  const best = scored[0];
  return best && best.score > 0 ? best.sentence : fallback;
}

export function getSourceName(source, item) {
  if (item.creator) return item.creator;
  if (item.source) return item.source;
  return source.name;
}
