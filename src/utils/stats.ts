export interface PostStats {
  views: number;
  likes: number;
  lastViewed?: string;
  liked?: boolean;
}

export interface AllStats {
  [postId: string]: PostStats;
}

const STORAGE_KEY = 'blog_post_stats';

function debugLog(...args: unknown[]) {
  if (import.meta.env.DEV) {
    console.log(...args);
  }
}

function getApiBaseUrl(): string {
  if (import.meta.env.PUBLIC_STATS_API_URL) {
    return import.meta.env.PUBLIC_STATS_API_URL;
  }

  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    const domainMap: Record<string, string> = {
      'qinrenjihe.com': 'https://blog-stats-api.qinrenjihe.com',
      'www.qinrenjihe.com': 'https://blog-stats-api.qinrenjihe.com',
      'bigroc.cn': 'https://blog-stats-api.bigroc.cn',
      'www.bigroc.cn': 'https://blog-stats-api.bigroc.cn',
    };

    if (domainMap[hostname]) {
      return domainMap[hostname];
    }

    for (const [domain, apiUrl] of Object.entries(domainMap)) {
      if (hostname.includes(domain)) {
        return apiUrl;
      }
    }
  }

  return '';
}

const API_BASE_URL = getApiBaseUrl();
const USE_CLOUD_SYNC = !!API_BASE_URL;

debugLog('[Stats] API_BASE_URL:', API_BASE_URL);
debugLog('[Stats] USE_CLOUD_SYNC:', USE_CLOUD_SYNC);

export function getAllStats(): AllStats {
  if (typeof window === 'undefined') {
    return {};
  }

  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : {};
  } catch {
    return {};
  }
}

function saveStats(stats: AllStats): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
  } catch (error) {
    console.error('保存统计数据失败:', error);
  }
}

export function getPostStats(postId: string): PostStats {
  const allStats = getAllStats();
  return allStats[postId] || { views: 0, likes: 0, liked: false };
}

export async function recordView(postId: string): Promise<PostStats> {
  if (USE_CLOUD_SYNC) {
    try {
      const url = `${API_BASE_URL}/stats/${encodeURIComponent(postId)}/view`;
      debugLog('[Stats] Recording view:', url);

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      debugLog('[Stats] Response status:', response.status);

      if (response.ok) {
        const stats = await response.json();
        debugLog('[Stats] Cloud stats:', stats);
        updateLocalStats(postId, stats);
        return stats;
      }

      const error = await response.text();
      console.error('[Stats] API error:', error);
    } catch (error) {
      console.warn('云端记录阅读失败，使用本地存储:', error);
    }
  } else {
    debugLog('[Stats] Using localStorage (no API configured)');
  }

  const allStats = getAllStats();
  const stats = allStats[postId] || { views: 0, likes: 0, liked: false };

  stats.views += 1;
  stats.lastViewed = new Date().toISOString();

  allStats[postId] = stats;
  saveStats(allStats);

  debugLog('[Stats] Local stats:', stats);
  return stats;
}

export async function toggleLike(postId: string): Promise<PostStats> {
  if (USE_CLOUD_SYNC) {
    try {
      const url = `${API_BASE_URL}/stats/${encodeURIComponent(postId)}/like`;
      debugLog('[Stats] Toggling like:', url);

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      debugLog('[Stats] Response status:', response.status);

      if (response.ok) {
        const stats = await response.json();
        debugLog('[Stats] Cloud stats:', stats);
        updateLocalStats(postId, stats);
        return stats;
      }

      const error = await response.text();
      console.error('[Stats] API error:', error);
    } catch (error) {
      console.warn('云端点赞失败，使用本地存储:', error);
    }
  } else {
    debugLog('[Stats] Using localStorage (no API configured)');
  }

  const allStats = getAllStats();
  const stats = allStats[postId] || { views: 0, likes: 0, liked: false };

  if (stats.liked) {
    stats.likes -= 1;
    stats.liked = false;
  } else {
    stats.likes += 1;
    stats.liked = true;
  }

  allStats[postId] = stats;
  saveStats(allStats);

  debugLog('[Stats] Local stats:', stats);
  return stats;
}

export function formatCount(count: number): string {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`;
  }

  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}k`;
  }

  return count.toString();
}

function updateLocalStats(postId: string, stats: PostStats): void {
  const allStats = getAllStats();
  allStats[postId] = stats;
  saveStats(allStats);
}

export async function getCloudStats(postId: string): Promise<PostStats | null> {
  if (!USE_CLOUD_SYNC) {
    return null;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/stats/${encodeURIComponent(postId)}`);
    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    console.warn('获取云端数据失败:', error);
  }

  return null;
}

export async function getPopularPosts(
  limit: number = 10,
): Promise<Array<{ post_id: string; views: number; likes: number }>> {
  if (!USE_CLOUD_SYNC) {
    return [];
  }

  try {
    const response = await fetch(`${API_BASE_URL}/stats/popular?limit=${limit}`);
    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    console.warn('获取热门文章失败:', error);
  }

  return [];
}
