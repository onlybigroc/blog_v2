import aiNewsDigest from './ai-news.json';

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

export function getAiNewsDigest(): AINewsDigest {
  return aiNewsDigest as AINewsDigest;
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
