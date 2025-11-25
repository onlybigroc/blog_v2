# 博客统计数据同步方案

## 架构概述

```
┌─────────────┐      ┌──────────────────┐      ┌─────────────┐
│   浏览器    │ ←──→ │ Cloudflare       │ ←──→ │ D1 数据库   │
│ LocalStorage│      │ Workers API      │      │  (SQLite)   │
└─────────────┘      └──────────────────┘      └─────────────┘
```

## 特性

✅ **双重存储**：LocalStorage + D1 云端数据库  
✅ **优雅降级**：API 失败时自动使用本地存储  
✅ **跨设备同步**：数据存储在云端，支持多设备访问  
✅ **防刷机制**：基于 IP + User-Agent 生成用户唯一标识  
✅ **完全免费**：Cloudflare D1 免费额度足够个人博客使用

## 快速开始

### 1. 创建数据库
```bash
npx wrangler d1 create blog_stats
```

### 2. 初始化表结构
```bash
npx wrangler d1 execute blog_stats --file=database/schema.sql
```

### 3. 部署 API
```bash
npx wrangler deploy workers/stats-api.ts --name blog-stats-api
```

### 4. 配置环境变量
在 Cloudflare Pages 中添加：
```
PUBLIC_STATS_API_URL=https://blog-stats-api.你的账号.workers.dev
```

详细步骤请参考 [D1-SETUP.md](./D1-SETUP.md)

## 文件说明

- `schema.sql` - 数据库表结构定义
- `D1-SETUP.md` - 详细部署指南
- `../workers/stats-api.ts` - Workers API 实现
- `../src/utils/stats.ts` - 客户端统计模块

## API 端点

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/stats/:postId` | 获取文章统计 |
| POST | `/stats/:postId/view` | 记录阅读 |
| POST | `/stats/:postId/like` | 切换点赞 |
| GET | `/stats/popular` | 获取热门文章 |

## 数据结构

### post_stats 表
- `post_id` - 文章 ID（主键）
- `views` - 阅读量
- `likes` - 点赞数
- `created_at` - 创建时间
- `updated_at` - 更新时间

### user_likes 表
- `post_id` - 文章 ID
- `user_id` - 用户标识（IP+UA 哈希）
- `created_at` - 点赞时间

## 本地测试

```bash
# 终端 1：启动 Workers API
npx wrangler dev workers/stats-api.ts --local --persist

# 终端 2：启动博客
npm run dev
```

## 注意事项

⚠️ 不要将 `database_id` 和敏感配置提交到 Git  
⚠️ 确保 CORS 配置正确，否则浏览器会拦截请求  
⚠️ D1 数据库位于 Cloudflare 边缘网络，首次查询可能较慢
