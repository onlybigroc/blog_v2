# Cloudflare D1 数据库部署指南

## 1. 创建 D1 数据库

```bash
# 登录 Cloudflare
npx wrangler login

# 创建 D1 数据库
npx wrangler d1 create blog_stats
```

执行后会返回数据库信息，复制 `database_id` 到 `wrangler.toml` 中：

```toml
[[d1_databases]]
binding = "DB"
database_name = "blog_stats"
database_id = "你的-数据库-ID"  # 替换这里
```

## 2. 初始化数据库表结构

```bash
# 执行 SQL 脚本
npx wrangler d1 execute blog_stats --file=database/schema.sql
```

## 3. 部署 Workers API

```bash
# 部署统计 API
npx wrangler deploy workers/stats-api.ts --name blog-stats-api
```

部署成功后会返回 API 地址，例如：
```
https://blog-stats-api.你的账号.workers.dev
```

## 4. 配置环境变量

在项目根目录创建 `.env` 文件（本地开发用）：

```env
PUBLIC_STATS_API_URL=https://blog-stats-api.你的账号.workers.dev
```

在 Cloudflare Pages 设置中添加环境变量：
- 变量名：`PUBLIC_STATS_API_URL`
- 值：`https://blog-stats-api.你的账号.workers.dev`

## 5. 更新 CORS 配置

在 `wrangler.toml` 中更新允许的域名：

```toml
[vars]
ALLOWED_ORIGINS = "https://你的域名.com,https://blog.onlybigroc.workers.dev"
```

## 6. 测试 API

### 测试获取统计
```bash
curl https://blog-stats-api.你的账号.workers.dev/stats/test-post-id
```

### 测试记录阅读
```bash
curl -X POST https://blog-stats-api.你的账号.workers.dev/stats/test-post-id/view
```

### 测试点赞
```bash
curl -X POST https://blog-stats-api.你的账号.workers.dev/stats/test-post-id/like
```

### 测试热门文章
```bash
curl https://blog-stats-api.你的账号.workers.dev/stats/popular?limit=10
```

## 7. 查看数据库数据

```bash
# 查询所有统计
npx wrangler d1 execute blog_stats --command="SELECT * FROM post_stats ORDER BY views DESC LIMIT 10"

# 查询点赞记录
npx wrangler d1 execute blog_stats --command="SELECT * FROM user_likes LIMIT 10"
```

## 8. 本地开发

```bash
# 启动本地 Workers 开发服务器
npx wrangler dev workers/stats-api.ts --local --persist

# 启动 Astro 开发服务器（另一个终端）
npm run dev
```

## API 端点说明

### GET /stats/:postId
获取文章统计数据

**响应：**
```json
{
  "post_id": "article-slug",
  "views": 100,
  "likes": 10,
  "user_liked": false
}
```

### POST /stats/:postId/view
记录文章阅读

**响应：**
```json
{
  "post_id": "article-slug",
  "views": 101,
  "likes": 10
}
```

### POST /stats/:postId/like
切换点赞状态

**响应：**
```json
{
  "post_id": "article-slug",
  "views": 101,
  "likes": 11,
  "user_liked": true
}
```

### GET /stats/popular?limit=10
获取热门文章列表

**响应：**
```json
[
  {
    "post_id": "article-1",
    "views": 1000,
    "likes": 50
  }
]
```

## 数据迁移

如果需要从 LocalStorage 迁移数据到 D1：

1. 在浏览器控制台导出数据：
```javascript
console.log(JSON.stringify(localStorage.getItem('blog_post_stats')));
```

2. 创建迁移脚本并导入（需要自己编写批量插入脚本）

## 监控和维护

### 查看 Workers 日志
```bash
npx wrangler tail blog-stats-api
```

### 备份数据库
```bash
npx wrangler d1 export blog_stats --output=backup.sql
```

### 恢复数据库
```bash
npx wrangler d1 execute blog_stats --file=backup.sql
```

## 费用说明

Cloudflare D1 免费额度：
- ✅ 每天 100,000 次读取操作
- ✅ 每天 50,000 次写入操作
- ✅ 5 GB 存储空间

对于个人博客来说，免费额度完全够用！
