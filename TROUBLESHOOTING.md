# D1 数据库问题诊断与修复指南

## 问题诊断结果

经过系统排查,发现访问统计无法存储到 D1 数据库的原因:

### ❌ 核心问题
1. **环境变量未配置** - `PUBLIC_STATS_API_URL` 未设置,导致前端始终使用本地存储
2. **Workers API 可能未部署** - 需要确认是否已部署到 Cloudflare
3. **D1 数据库表结构可能未初始化** - 需要确认是否执行过初始化脚本

---

## 🔧 完整修复步骤

### 步骤 1: 检查 Cloudflare 登录状态

```powershell
# 登录 Cloudflare (如果还未登录)
npx wrangler login
```

### 步骤 2: 确认 D1 数据库存在

```powershell
# 列出所有 D1 数据库
npx wrangler d1 list

# 如果 blog_stats 不存在,创建它
npx wrangler d1 create blog_stats
```

### 步骤 3: 初始化数据库表结构

```powershell
# 执行 SQL 脚本创建表
npx wrangler d1 execute blog_stats --file=database/schema.sql

# 验证表是否创建成功
npx wrangler d1 execute blog_stats --command="SELECT name FROM sqlite_master WHERE type='table'"
```

预期输出应包含:
- `post_stats`
- `user_likes`

### 步骤 4: 部署 Workers API

```powershell
# 部署统计 API
npx wrangler deploy workers/stats-api.ts

# 记录部署后的 URL,例如:
# ✨ https://blog-stats-api.你的账号.workers.dev
```

### 步骤 5: 测试 Workers API

```powershell
# 替换下面的 URL 为你实际的 Workers 地址

# 测试 1: 记录阅读 (POST)
curl -X POST https://blog-stats-api.onlybigroc.workers.dev/stats/test-article/view

# 测试 2: 获取统计 (GET)
curl https://blog-stats-api.onlybigroc.workers.dev/stats/test-article

# 测试 3: 点赞 (POST)
curl -X POST https://blog-stats-api.onlybigroc.workers.dev/stats/test-article/like

# 测试 4: 查看热门文章
curl https://blog-stats-api.onlybigroc.workers.dev/stats/popular?limit=5
```

预期响应示例:
```json
{
  "post_id": "test-article",
  "views": 1,
  "likes": 0
}
```

### 步骤 6: 验证数据已写入 D1

```powershell
# 查询数据库中的数据
npx wrangler d1 execute blog_stats --command="SELECT * FROM post_stats"

# 查询点赞记录
npx wrangler d1 execute blog_stats --command="SELECT * FROM user_likes"
```

### 步骤 7: 配置环境变量

#### 本地开发环境:
1. 已创建 `.env` 文件
2. 确认 `PUBLIC_STATS_API_URL` 设置正确:
   ```env
   PUBLIC_STATS_API_URL=https://blog-stats-api.onlybigroc.workers.dev
   ```

#### Cloudflare Pages 生产环境:
1. 登录 Cloudflare Dashboard
2. 进入 Pages 项目设置
3. 找到 "Environment Variables"
4. 添加变量:
   - **Name**: `PUBLIC_STATS_API_URL`
   - **Value**: `https://blog-stats-api.onlybigroc.workers.dev`
5. 保存并重新部署

### 步骤 8: 本地测试

```powershell
# 重启开发服务器以加载新的环境变量
npm run dev
```

访问任意文章页面,打开浏览器控制台,应该看到:
```
[Stats] API_BASE_URL: https://blog-stats-api.onlybigroc.workers.dev
[Stats] USE_CLOUD_SYNC: true
[Stats] Recording view: https://blog-stats-api.onlybigroc.workers.dev/stats/...
[Stats] Response status: 200
[Stats] Cloud stats: {post_id: "...", views: 1, likes: 0}
```

### 步骤 9: 监控 Workers 日志

```powershell
# 实时查看 Workers 日志
npx wrangler tail blog-stats-api
```

然后访问网站,观察日志输出,确认请求到达 Workers。

---

## 🔍 快速诊断命令

```powershell
# 一键检查所有关键配置

# 1. 检查 D1 数据库
npx wrangler d1 list

# 2. 检查表结构
npx wrangler d1 execute blog_stats --command="SELECT name FROM sqlite_master WHERE type='table'"

# 3. 检查数据
npx wrangler d1 execute blog_stats --command="SELECT COUNT(*) as total FROM post_stats"

# 4. 检查 Workers 部署
npx wrangler deployments list

# 5. 检查环境变量
Get-Content .env
```

---

## ⚠️ 常见错误排查

### 错误 1: "Database not found"
**原因**: D1 数据库未创建
**解决**: 执行 `npx wrangler d1 create blog_stats`

### 错误 2: "no such table: post_stats"
**原因**: 数据库表未初始化
**解决**: 执行 `npx wrangler d1 execute blog_stats --file=database/schema.sql`

### 错误 3: CORS 错误
**原因**: Workers CORS 配置问题
**解决**: 检查 `wrangler.toml` 中的 `ALLOWED_ORIGINS` 配置

### 错误 4: "USE_CLOUD_SYNC: false"
**原因**: 环境变量未设置
**解决**: 
1. 确认 `.env` 文件存在
2. 确认 `PUBLIC_STATS_API_URL` 已配置
3. 重启开发服务器

---

## ✅ 验证清单

完成以下检查项,确保所有配置正确:

- [ ] Cloudflare 已登录
- [ ] D1 数据库 `blog_stats` 已创建
- [ ] 数据库表结构已初始化 (post_stats, user_likes)
- [ ] Workers API 已部署
- [ ] Workers API 测试通过 (curl 测试成功)
- [ ] D1 数据库中有测试数据
- [ ] `.env` 文件已创建并配置正确
- [ ] 本地开发服务器可以调用 API
- [ ] Cloudflare Pages 环境变量已配置
- [ ] 生产环境可以正常记录统计

---

## 📊 监控数据

部署完成后,可以定期检查数据:

```powershell
# 查看前 10 篇最热门文章
npx wrangler d1 execute blog_stats --command="SELECT post_id, views, likes FROM post_stats ORDER BY views DESC LIMIT 10"

# 查看总统计
npx wrangler d1 execute blog_stats --command="SELECT COUNT(*) as total_posts, SUM(views) as total_views, SUM(likes) as total_likes FROM post_stats"
```

---

## 🆘 需要帮助?

如果问题仍未解决,请提供以下信息:
1. 执行 `npx wrangler d1 list` 的输出
2. 执行 `npx wrangler deployments list` 的输出
3. `.env` 文件内容
4. 浏览器控制台的完整日志
5. Workers 日志 (执行 `npx wrangler tail blog-stats-api`)
