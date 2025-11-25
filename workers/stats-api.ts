// Cloudflare Workers API for Blog Stats
// 提供阅读量和点赞数据的 API 接口

export interface Env {
  DB: D1Database;
  ALLOWED_ORIGINS?: string; // 允许的域名，多个用逗号分隔
}

interface PostStats {
  post_id: string;
  views: number;
  likes: number;
  user_liked?: boolean;
}

// CORS 头设置
const corsHeaders = (origin: string) => ({
  'Access-Control-Allow-Origin': origin,
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400',
});

// 生成用户唯一标识（基于 IP + User-Agent）
function getUserId(request: Request): string {
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  const ua = request.headers.get('User-Agent') || 'unknown';
  return btoa(`${ip}:${ua}`).substring(0, 32);
}

// 检查 CORS
function checkOrigin(request: Request, env: Env): string {
  const origin = request.headers.get('Origin') || '';
  const allowedOrigins = env.ALLOWED_ORIGINS?.split(',') || ['https://blog.onlybigroc.workers.dev'];
  
  if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
    return origin;
  }
  
  return allowedOrigins[0]; // 默认返回第一个允许的域名
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const origin = checkOrigin(request, env);

    // 处理 OPTIONS 预检请求
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders(origin) });
    }

    try {
      // GET /stats/:postId - 获取文章统计
      if (request.method === 'GET' && url.pathname.startsWith('/stats/')) {
        const postId = url.pathname.split('/stats/')[1];
        const userId = getUserId(request);

        const stats = await env.DB.prepare(
          'SELECT views, likes FROM post_stats WHERE post_id = ?'
        ).bind(postId).first<{ views: number; likes: number }>();

        const userLiked = await env.DB.prepare(
          'SELECT 1 FROM user_likes WHERE post_id = ? AND user_id = ?'
        ).bind(postId, userId).first();

        return new Response(JSON.stringify({
          post_id: postId,
          views: stats?.views || 0,
          likes: stats?.likes || 0,
          user_liked: !!userLiked,
        }), {
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders(origin),
          },
        });
      }

      // POST /stats/:postId/view - 记录阅读
      if (request.method === 'POST' && url.pathname.endsWith('/view')) {
        const postId = url.pathname.split('/stats/')[1].replace('/view', '');

        await env.DB.prepare(`
          INSERT INTO post_stats (post_id, views, likes)
          VALUES (?, 1, 0)
          ON CONFLICT(post_id) DO UPDATE SET
            views = views + 1,
            updated_at = datetime('now')
        `).bind(postId).run();

        const stats = await env.DB.prepare(
          'SELECT views, likes FROM post_stats WHERE post_id = ?'
        ).bind(postId).first<{ views: number; likes: number }>();

        return new Response(JSON.stringify({
          post_id: postId,
          views: stats?.views || 0,
          likes: stats?.likes || 0,
        }), {
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders(origin),
          },
        });
      }

      // POST /stats/:postId/like - 切换点赞
      if (request.method === 'POST' && url.pathname.endsWith('/like')) {
        const postId = url.pathname.split('/stats/')[1].replace('/like', '');
        const userId = getUserId(request);

        // 检查是否已点赞
        const existingLike = await env.DB.prepare(
          'SELECT 1 FROM user_likes WHERE post_id = ? AND user_id = ?'
        ).bind(postId, userId).first();

        if (existingLike) {
          // 取消点赞
          await env.DB.batch([
            env.DB.prepare('DELETE FROM user_likes WHERE post_id = ? AND user_id = ?')
              .bind(postId, userId),
            env.DB.prepare(`
              UPDATE post_stats SET 
                likes = MAX(0, likes - 1),
                updated_at = datetime('now')
              WHERE post_id = ?
            `).bind(postId),
          ]);
        } else {
          // 添加点赞
          await env.DB.batch([
            env.DB.prepare('INSERT INTO user_likes (post_id, user_id) VALUES (?, ?)')
              .bind(postId, userId),
            env.DB.prepare(`
              INSERT INTO post_stats (post_id, views, likes)
              VALUES (?, 0, 1)
              ON CONFLICT(post_id) DO UPDATE SET
                likes = likes + 1,
                updated_at = datetime('now')
            `).bind(postId),
          ]);
        }

        const stats = await env.DB.prepare(
          'SELECT views, likes FROM post_stats WHERE post_id = ?'
        ).bind(postId).first<{ views: number; likes: number }>();

        return new Response(JSON.stringify({
          post_id: postId,
          views: stats?.views || 0,
          likes: stats?.likes || 0,
          user_liked: !existingLike,
        }), {
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders(origin),
          },
        });
      }

      // GET /stats/popular - 获取热门文章
      if (request.method === 'GET' && url.pathname === '/stats/popular') {
        const limit = parseInt(url.searchParams.get('limit') || '10');
        const results = await env.DB.prepare(
          'SELECT post_id, views, likes FROM post_stats ORDER BY views DESC LIMIT ?'
        ).bind(limit).all<PostStats>();

        return new Response(JSON.stringify(results.results || []), {
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders(origin),
          },
        });
      }

      return new Response('Not Found', { 
        status: 404,
        headers: corsHeaders(origin),
      });

    } catch (error) {
      console.error('Error:', error);
      return new Response(JSON.stringify({ 
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Unknown error',
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders(origin),
        },
      });
    }
  },
};
