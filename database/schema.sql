-- 创建文章统计表
CREATE TABLE IF NOT EXISTS post_stats (
  post_id TEXT PRIMARY KEY,
  views INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- 创建索引以加速查询
CREATE INDEX IF NOT EXISTS idx_views ON post_stats(views DESC);
CREATE INDEX IF NOT EXISTS idx_likes ON post_stats(likes DESC);

-- 创建用户点赞记录表（防止重复点赞）
CREATE TABLE IF NOT EXISTS user_likes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE(post_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_user_likes ON user_likes(post_id, user_id);
