// 文章统计管理（阅读量、点赞）
// 支持 LocalStorage + Cloudflare D1 双重存储

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

// 动态获取 API 地址（根据当前域名自动匹配）
function getApiBaseUrl(): string {
  // 优先使用环境变量配置
  if (import.meta.env.PUBLIC_STATS_API_URL) {
    return import.meta.env.PUBLIC_STATS_API_URL;
  }
  
  // 在浏览器环境中根据当前域名动态匹配
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    
    // 域名映射规则
    const domainMap: Record<string, string> = {
      'qinrenjihe.com': 'https://blog-stats-api.qinrenjihe.com',
      'www.qinrenjihe.com': 'https://blog-stats-api.qinrenjihe.com',
      'bigroc.cn': 'https://blog-stats-api.bigroc.cn',
      'www.bigroc.cn': 'https://blog-stats-api.bigroc.cn',
    };
    
    // 精确匹配
    if (domainMap[hostname]) {
      return domainMap[hostname];
    }
    
    // 模糊匹配（检查是否包含域名）
    for (const [domain, apiUrl] of Object.entries(domainMap)) {
      if (hostname.includes(domain)) {
        return apiUrl;
      }
    }
  }
  
  // 默认返回空（使用本地存储）
  return '';
}

const API_BASE_URL = getApiBaseUrl();
const USE_CLOUD_SYNC = !!API_BASE_URL; // 是否启用云端同步

// 调试信息（仅开发环境）
if (typeof window !== 'undefined' && import.meta.env.DEV) {
  console.log('[Stats] API_BASE_URL:', API_BASE_URL);
  console.log('[Stats] USE_CLOUD_SYNC:', USE_CLOUD_SYNC);
}

// 获取所有统计数据
export function getAllStats(): AllStats {
  if (typeof window === 'undefined') return {};
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : {};
  } catch {
    return {};
  }
}

// 保存统计数据
function saveStats(stats: AllStats): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
  } catch (error) {
    console.error('保存统计数据失败:', error);
  }
}

// 获取单篇文章统计
export function getPostStats(postId: string): PostStats {
  const allStats = getAllStats();
  return allStats[postId] || { views: 0, likes: 0, liked: false };
}

// 记录阅读
export async function recordView(postId: string): Promise<PostStats> {
  // 如果启用云端同步，优先使用 API
  if (USE_CLOUD_SYNC) {
    try {
      const url = `${API_BASE_URL}/stats/${encodeURIComponent(postId)}/view`;
      console.log('[Stats] Recording view:', url);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      
      console.log('[Stats] Response status:', response.status);
      
      if (response.ok) {
        const stats = await response.json();
        console.log('[Stats] Cloud stats:', stats);
        // 同步到本地
        updateLocalStats(postId, stats);
        return stats;
      } else {
        const error = await response.text();
        console.error('[Stats] API error:', error);
      }
    } catch (error) {
      console.warn('云端记录阅读失败，使用本地存储:', error);
    }
  } else {
    console.log('[Stats] Using localStorage (no API configured)');
  }
  
  // 降级到本地存储
  const allStats = getAllStats();
  const stats = allStats[postId] || { views: 0, likes: 0, liked: false };
  
  stats.views += 1;
  stats.lastViewed = new Date().toISOString();
  
  allStats[postId] = stats;
  saveStats(allStats);
  
  console.log('[Stats] Local stats:', stats);
  return stats;
}

// 切换点赞
export async function toggleLike(postId: string): Promise<PostStats> {
  // 如果启用云端同步，优先使用 API
  if (USE_CLOUD_SYNC) {
    try {
      const url = `${API_BASE_URL}/stats/${encodeURIComponent(postId)}/like`;
      console.log('[Stats] Toggling like:', url);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      
      console.log('[Stats] Response status:', response.status);
      
      if (response.ok) {
        const stats = await response.json();
        console.log('[Stats] Cloud stats:', stats);
        // 同步到本地
        updateLocalStats(postId, stats);
        return stats;
      } else {
        const error = await response.text();
        console.error('[Stats] API error:', error);
      }
    } catch (error) {
      console.warn('云端点赞失败，使用本地存储:', error);
    }
  } else {
    console.log('[Stats] Using localStorage (no API configured)');
  }
  
  // 降级到本地存储
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
  
  console.log('[Stats] Local stats:', stats);
  return stats;
}

// 格式化数字显示（1000+ -> 1k）
export function formatCount(count: number): string {
  if (count >= 1000000) {
    return (count / 1000000).toFixed(1) + 'M';
  }
  if (count >= 1000) {
    return (count / 1000).toFixed(1) + 'k';
  }
  return count.toString();
}

// 更新本地存储（用于云端数据同步）
function updateLocalStats(postId: string, stats: PostStats): void {
  const allStats = getAllStats();
  allStats[postId] = stats;
  saveStats(allStats);
}

// 获取云端统计数据
export async function getCloudStats(postId: string): Promise<PostStats | null> {
  if (!USE_CLOUD_SYNC) return null;
  
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

// 获取热门文章
export async function getPopularPosts(limit: number = 10): Promise<Array<{ post_id: string; views: number; likes: number }>> {
  if (!USE_CLOUD_SYNC) return [];
  
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
