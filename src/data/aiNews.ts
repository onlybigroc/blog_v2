// AI News 数据加载模块
// 支持按月拆分的 JSON 文件结构

import fs from 'fs';
import path from 'path';

export interface AINewsSource {
  name: string;
  homepage: string;
  sourceType: 'official' | 'media';
  sourceRegion: 'cn' | 'global';
}

export interface AINewsFailure {
  name: string;
  reason: string;
}

export interface AINewsItem {
  id: string;
  title: string;
  titleZh: string;
  link: string;
  source: string;
  sourceType: 'official' | 'media';
  sourceRegion: 'cn' | 'global';
  sourceLanguage: 'zh' | 'en';
  feedName: string;
  sourceHomepage: string;
  publishedAt: string;
  publishedAtEstimated?: boolean;
  summary: string;
  summaryZh: string;
  highlights: string[];
  highlightsZh: string[];
  tags: string[];
  score: number;
  importance: '重点' | '关注' | '快讯';
  archiveFirstSeenAt: string;
  lastSeenAt: string;
  coverImage: string;
  coverImageOriginal: string;
  coverImageAlt: string;
  coverImageWidth?: number;
  coverImageHeight?: number;
  originalContentText: string;
  originalContentAvailable: boolean;
  originalContentWarning: string;
  snapshotFetchedAt: string;
}

export interface AINewsDigest {
  updatedAt: string;
  windowHours: number;
  note: string;
  stats: {
    totalItems: number;
    recent24h: number;
    officialCount: number;
    sourceCount: number;
    failedSourceCount: number;
    cnCount: number;
    globalCount: number;
  };
  sources: AINewsSource[];
  failures: AINewsFailure[];
  latestIds: string[];
  items: AINewsItem[];
}

// 尝试加载按月拆分的文件，如果不存在则加载原始大文件
function loadAiNewsData(): AINewsDigest {
  const metaPath = path.join(process.cwd(), 'src/data/ai-news-meta.json');
  const legacyPath = path.join(process.cwd(), 'src/data/ai-news.json');
  const itemsDir = path.join(process.cwd(), 'src/data/ai-news-items');

  // 优先尝试加载拆分后的文件
  if (fs.existsSync(metaPath) && fs.existsSync(itemsDir)) {
    try {
      const meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
      const items: AINewsItem[] = [];

      // 加载所有月度文件
      const monthFiles = fs.readdirSync(itemsDir).filter(f => f.endsWith('.json'));
      for (const file of monthFiles) {
        const filePath = path.join(itemsDir, file);
        const monthItems = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        items.push(...monthItems);
      }

      return {
        ...meta,
        items,
      };
    } catch (error) {
      console.warn('加载拆分文件失败，回退到原始文件:', error);
    }
  }

  // 回退到原始大文件
  return JSON.parse(fs.readFileSync(legacyPath, 'utf-8'));
}

// 在构建时加载数据
let cachedDigest: AINewsDigest | null = null;

export function getAiNewsDigest(): AINewsDigest {
  if (!cachedDigest) {
    cachedDigest = loadAiNewsData();
  }
  return cachedDigest;
}

const digest = getAiNewsDigest();
const sortedItems = [...digest.items].sort(
  (left, right) => new Date(right.publishedAt).getTime() - new Date(left.publishedAt).getTime()
);
const itemById = new Map(digest.items.map((item) => [item.id, item]));
const latestItems = digest.latestIds
  .map((id) => itemById.get(id))
  .filter((item): item is AINewsItem => Boolean(item));
const itemsByRegion = {
  cn: sortedItems.filter((item) => item.sourceRegion === 'cn'),
  global: sortedItems.filter((item) => item.sourceRegion === 'global'),
} as const;

export function getAiNewsItems(): AINewsItem[] {
  return sortedItems;
}

export function getAiNewsById(id: string): AINewsItem | undefined {
  return itemById.get(id);
}

export function getLatestAiNews(limit = 6, preferredRegion: 'cn' | 'global' | 'all' = 'cn'): AINewsItem[] {
  if (preferredRegion === 'all') {
    return latestItems.slice(0, limit);
  }

  const preferred = latestItems.filter((item) => item.sourceRegion === preferredRegion);
  const remaining = latestItems.filter((item) => item.sourceRegion !== preferredRegion);

  return [...preferred, ...remaining].slice(0, limit);
}

export function getAiNewsByRegion(region: 'cn' | 'global'): AINewsItem[] {
  return itemsByRegion[region];
}
