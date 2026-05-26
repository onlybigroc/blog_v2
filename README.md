# 个人博客 v2

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![AI Generated](https://img.shields.io/badge/🤖_AI_Generated-100%25-blueviolet)](#)
[![Built with Astro](https://img.shields.io/badge/Built_with-Astro-BC52EE?logo=astro&logoColor=white)](https://astro.build/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Deploy on Cloudflare Pages](https://img.shields.io/badge/Deploy-Cloudflare_Pages-F38020?logo=cloudflare&logoColor=white)](https://pages.cloudflare.com/)

基于 Astro + Tailwind CSS 构建的静态博客，自动同步博客园文章。全部代码由 AI 大模型生成，零手写代码。

## 🚀 快速开始

### 安装依赖

```bash
npm install
```

### 开发服务器

```bash
npm run dev
```

访问 http://localhost:4321

### 构建生产版本

```bash
npm run build
```

构建产物位于 `dist/` 目录。

### 预览生产构建

```bash
npm run preview
```

## 📝 文章同步

### 同步最新文章（RSS）

```bash
npm run sync
```

从博客园 RSS 获取最新 20 篇文章。

### 同步 AI 资讯

```bash
npm run sync:ai-news
```

从公开 RSS、中文 AI 资讯页与官方公告聚合 AI 动态，生成带有中文辅助阅读、长期历史存档和原文快照的数据。

如需关闭自动中文翻译，可在环境变量中设置：

```bash
AI_NEWS_TRANSLATOR=none
```

### 同步历史文章

```bash
npm run sync:history
```

从博客园归档页获取历史文章（默认 10 页）。

### 同步所有文章

```bash
npm run sync:all
```

获取所有历史文章（最多 50 页）。

### 自定义同步页数

```bash
node scripts/sync-cnblogs.mjs --history --pages=20
```

## 📂 项目结构

```
blog_v2/
├── src/
│   ├── content/
│   │   ├── config.ts        # 内容集合配置
│   │   └── posts/           # 文章 Markdown 文件
│   ├── layouts/
│   │   ├── BaseLayout.astro # 基础布局
│   │   └── MainLayout.astro # 主布局（含导航）
│   ├── pages/
│   │   ├── index.astro      # 首页
│   │   ├── posts/
│   │   │   ├── index.astro           # 文章列表
│   │   │   ├── page/[page].astro     # 分页
│   │   │   └── [...slug].astro       # 文章详情
│   │   ├── tags/
│   │   │   ├── index.astro           # 标签列表
│   │   │   └── [tag].astro           # 标签详情
│   │   └── archives.astro            # 归档页
│   └── styles/
│       └── global.css       # 全局样式
├── public/
│   └── images/
│       └── posts/           # 文章图片
├── scripts/
│   ├── sync-cnblogs.mjs     # 同步博客文章
│   └── sync-ai-news.mjs     # 同步 AI 资讯摘要
├── data/
│   └── sync-cache.json      # 同步缓存
├── astro.config.mjs         # Astro 配置
├── tailwind.config.mjs      # Tailwind CSS 配置
└── package.json
```

## 🎨 功能特性

- ✅ **文章列表** - 支持分页，每页 20 篇文章
- ✅ **标签系统** - 智能提取关键词，标签云展示
- ✅ **归档页面** - 按年月时间轴归档
- ✅ **自动同步** - 从博客园自动同步文章
- ✅ **AI 资讯模块** - 每日聚合中文与国际 AI 动态，保留长期存档与原文快照
- ✅ **图片本地化** - 自动下载文章图片到本地
- ✅ **暗黑模式** - 支持亮色/暗色主题切换
- ✅ **响应式设计** - 适配移动端、平板、桌面
- ✅ **SEO 优化** - 自动生成 sitemap
- ✅ **评论系统** - 集成 Giscus（需配置）

## ⚙️ 配置

### 博客园用户名

修改 `scripts/sync-cnblogs.mjs` 中的用户名：

```javascript
const BLOG_USERNAME = 'bigroc'; // 改为你的博客园用户名
```

### Giscus 评论配置

编辑 `src/pages/posts/[...slug].astro`，替换以下配置：

```html
<script src="https://giscus.app/client.js"
  data-repo="YOUR_GITHUB_USERNAME/YOUR_REPO_NAME"
  data-repo-id="YOUR_REPO_ID"
  data-category="General"
  data-category-id="YOUR_CATEGORY_ID"
  ...
</script>
```

获取配置：访问 https://giscus.app/

## 🚢 部署

### Cloudflare Pages

1. 将代码推送到 GitHub
2. 在 Cloudflare Pages 连接仓库
3. 构建配置：
   - 构建命令：`npm run build`
   - 输出目录：`dist`
   - Node 版本：20

### GitHub Actions 自动同步

项目已配置 GitHub Actions，每天凌晨 2 点自动同步文章。

需要设置以下 Secrets：
- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

## 📦 技术栈

- [Astro](https://astro.build/) - 静态站点生成器
- [Tailwind CSS](https://tailwindcss.com/) - CSS 框架
- [MDX](https://mdxjs.com/) - Markdown 增强
- [Giscus](https://giscus.app/) - 评论系统
- [Cloudflare Pages](https://pages.cloudflare.com/) - 部署平台

## 📄 许可

MIT License

---

原博客地址：https://www.cnblogs.com/bigroc
