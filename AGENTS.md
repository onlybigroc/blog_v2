# AGENTS.md

适用范围：本文件位于仓库根目录，规则适用于整个 `blog_v2` 项目。

## 项目概览

这是一个基于 Astro 5、Tailwind CSS 和 MDX 的个人静态博客。核心能力包括：

- 从博客园同步文章到 `src/content/posts/`。
- 聚合 AI 资讯到 `src/data/ai-news.json` 并生成归档页面。
- 提供文章、标签、归档、搜索、RSS、推广页和在线工具页。
- 通过 Cloudflare Pages 部署静态站点，并带有 Cloudflare Workers/D1 相关统计能力。

## 常用命令

使用 npm 和现有 `package-lock.json`，不要引入其他包管理器锁文件。

```bash
npm install
npm run dev
npm run build
npm run preview
```

同步与诊断命令：

```bash
npm run sync
npm run sync:history
npm run sync:all
npm run sync:ai-news
npm run diagnose
```

当前没有单独的 lint/test 脚本。涉及页面、组件、内容集合、路由、脚本或配置的改动，至少运行 `npm run build` 验证。

## 目录职责

- `src/pages/`：Astro 文件路由。新增页面时遵循现有 URL 结构和命名方式。
- `src/layouts/`：页面布局。通用站点页面优先使用 `MainLayout.astro`，工具页使用 `ToolLayout.astro`。
- `src/components/`：可复用组件。文章卡片使用 `PostCard.astro`，评论使用 `GiscusComments.astro`，工具组件放在 `src/components/tools/`。
- `src/content/posts/`：博客文章 Markdown/MDX 内容。Frontmatter 必须符合 `src/content/config.ts` 的 schema。
- `src/utils/`：共享工具函数。文章链接生成使用 `src/utils/slug.ts` 中的 `getPostUrl`，站点信息使用 `src/utils/site.ts`。
- `src/data/`：站点结构化数据，例如工具、推广、AI 资讯。
- `scripts/`：同步和诊断脚本。脚本是 ESM，保持 Node 运行方式兼容 `package.json`。
- `public/`：静态资源。文章图片在 `public/images/posts/`，AI 资讯图片在 `public/images/ai-news/`。
- `data/`：同步缓存等运行数据。
- `database/`：D1 数据库 schema 和说明。
- `workers/`：Cloudflare Workers 代码和独立 wrangler 配置。
- `dist/`、`.astro/`、`node_modules/`、`.wrangler/`：生成产物或本地依赖，不要手动维护。

## 开发约定

- 保持现有 Astro + TypeScript + ESM 风格。新增模块使用显式导入，不引入全局副作用。
- 优先复用已有组件、布局和工具函数，不要在多个页面复制相同的卡片、链接、日期格式化或统计逻辑。
- Tailwind 是主要样式方案。暗黑模式按 `tailwind.config.mjs` 使用 `class` 模式，新增样式要同时检查亮色和暗色状态。
- 客户端脚本只在交互确实需要时添加。搜索、高亮、统计等涉及用户输入的逻辑避免直接拼接 `innerHTML`，优先使用 DOM API 或安全转义。
- 页面可访问性要保持基本语义：链接用 `<a>`，按钮用 `<button>`，图片补充有意义的 `alt`。
- 不要把密钥、token、账号密码写入代码。环境变量以 `.env.example` 为模板说明。
- 不要修改 `.env` 中的本地私有值，除非用户明确要求。

## 内容与同步规则

- 手写或修改文章时，Frontmatter 至少关注 `title`、`date`、`categories`、`tags`、`summary`、`originUrl`、`draft` 等字段是否满足 schema。
- 大批量文章、图片、缓存更新通常应通过 `scripts/sync-cnblogs.mjs` 或 `scripts/sync-ai-news.mjs` 完成，不要无说明地手动重写生成内容。
- 同步脚本可能更新 `src/content/posts/`、`public/images/posts/`、`src/data/ai-news.json`、`public/images/ai-news/` 和 `data/sync-cache.json`。提交前要区分生成变更和人工代码变更。
- AI 资讯同步默认可能进行中文辅助处理；如需关闭翻译，使用 `AI_NEWS_TRANSLATOR=none`。

## 路由与功能约定

- 文章详情路由在 `src/pages/posts/[...slug].astro`。
- 文章列表、标签、归档、搜索应复用统一的文章 URL 生成逻辑。
- 搜索索引由 `src/pages/search-index.json.ts` 构建生成，搜索页客户端侧拉取索引。
- RSS 入口在 `src/pages/rss.xml.js`。
- 工具页应在 `src/pages/tools/` 下提供页面入口，主要交互实现放到 `src/components/tools/`，需要无站点壳的版本时放在对应 `clean.astro` 路由。
- Workers/D1 统计逻辑改动时，同时检查 `workers/stats-api.ts`、`database/schema.sql`、`database/README.md` 和相关前端统计组件。

## 验证要求

- 常规代码、页面、组件、内容集合或脚本改动：运行 `npm run build`。
- 只改文档时可不运行构建，但最终说明中要明确未运行。
- 改同步脚本时，优先用小范围参数或 dry-run 式检查；如果脚本会联网或批量改内容，先说明影响范围。
- 改 Workers/D1 时，按变更范围运行 `npm run diagnose` 或 Cloudflare/Wrangler 相关验证。

## Git 与变更边界

- 工作区可能已有用户改动。开始前查看 `git status --short`，不要回滚或覆盖与当前任务无关的改动。
- Git commit message 使用中文，简洁说明本次变更目的。
- 保持变更范围小而清晰。不要顺手重排大量 Markdown 内容、格式化全仓库或改动无关配置。
- 最终回复中说明改了哪些文件、运行了哪些验证，以及是否存在未验证项。
