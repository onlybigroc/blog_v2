// AI News 处理模块
import { CONFIG } from './config.mjs';
import { normalizeWhitespace, containsChinese, extractHighlights } from './utils.mjs';

export function scoreItem(source, title, summary, publishedAt, now) {
  let score = source.priority || 10;

  const ageHours = (now.getTime() - publishedAt.getTime()) / (1000 * 60 * 60);
  if (ageHours < 24) score += 10;
  else if (ageHours < 48) score += 5;
  else if (ageHours < 72) score += 2;

  const titleLower = (title || '').toLowerCase();
  const summaryLower = (summary || '').toLowerCase();
  const combined = `${titleLower} ${summaryLower}`;

  const highKeywords = ['gpt', 'claude', 'gemini', 'llm', 'agi', 'openai', 'anthropic', 'google', 'deepseek', 'agent'];
  for (const keyword of highKeywords) {
    if (combined.includes(keyword)) score += 3;
  }

  const mediumKeywords = ['model', 'training', 'benchmark', 'release', 'launch', 'update', 'research'];
  for (const keyword of mediumKeywords) {
    if (combined.includes(keyword)) score += 1;
  }

  if (source.sourceType === 'official') score += 5;
  if (source.sourceRegion === 'cn') score += 3;
  if (containsChinese(title) || containsChinese(summary)) score += 2;

  return score;
}

export function getImportance(score) {
  if (score >= 30) return 'high';
  if (score >= 20) return 'medium';
  return 'low';
}

export function dedupeItems(items) {
  const seen = new Map();
  const result = [];

  for (const item of items) {
    const key = item.link || item.title?.slice(0, 100);
    if (!key) continue;

    if (!seen.has(key)) {
      seen.set(key, item);
      result.push(item);
    } else {
      const existing = seen.get(key);
      if ((item.score || 0) > (existing.score || 0)) {
        const index = result.indexOf(existing);
        if (index !== -1) result[index] = item;
        seen.set(key, item);
      }
    }
  }

  return result;
}

export function sortItems(items) {
  return items.sort((a, b) => (b.score || 0) - (a.score || 0));
}

export function pickItems(items, options = {}) {
  const {
    maxItems = CONFIG.MAX_LATEST_ITEMS,
    maxItemsPerSource = CONFIG.MAX_LATEST_ITEMS_PER_SOURCE,
    minCnItems = CONFIG.MIN_CN_LATEST_ITEMS,
    recentWindowHours = CONFIG.LATEST_WINDOW_HOURS,
  } = options;

  const now = new Date();
  const windowStart = new Date(now.getTime() - recentWindowHours * 60 * 60 * 1000);

  const recentItems = items.filter((item) => {
    const pubDate = new Date(item.publishedAt);
    return pubDate >= windowStart;
  });

  const bySource = new Map();
  for (const item of recentItems) {
    const sourceId = item.sourceId;
    if (!bySource.has(sourceId)) bySource.set(sourceId, []);
    bySource.get(sourceId).push(item);
  }

  const selected = [];
  const cnItems = [];

  for (const [sourceId, sourceItems] of bySource) {
    const limited = sourceItems.slice(0, maxItemsPerSource);
    for (const item of limited) {
      if (selected.length >= maxItems) break;
      selected.push(item);
      if (item.sourceRegion === 'cn') cnItems.push(item);
    }
  }

  if (cnItems.length < minCnItems) {
    const cnOnly = items.filter((item) => item.sourceRegion === 'cn');
    for (const item of cnOnly) {
      if (cnItems.length >= minCnItems) break;
      if (!selected.includes(item)) {
        selected.push(item);
        cnItems.push(item);
      }
    }
  }

  return sortItems(selected).slice(0, maxItems);
}
