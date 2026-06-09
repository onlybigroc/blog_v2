import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { basename, extname, join } from 'node:path';
import { remarkImagePath } from './src/plugins/remark-image-path.mjs';

const SITE_URL = process.env.SITE_URL || process.env.CF_PAGES_URL || 'https://bigroc.cn';
const CONTENT_POSTS_DIR = 'src/content/posts';
const AI_NEWS_JSON = 'src/data/ai-news.json';

function normalizePostSlug(value) {
  return value
    .trim()
    .replace(/^\/?posts\//, '')
    .replace(/\.mdx?$/, '')
    .replace(/^\/+|\/+$/g, '');
}

function readFrontmatterValue(frontmatter, key) {
  const match = frontmatter.match(new RegExp(`^${key}:\\s*(.+)$`, 'm'));
  return match?.[1]?.trim().replace(/^['"]|['"]$/g, '');
}

function toIsoDate(value) {
  const date = value ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime()) ? date.toISOString() : null;
}

function setLastmod(lastmodByPath, pathname, lastmod) {
  lastmodByPath.set(pathname, lastmod);
  lastmodByPath.set(encodeURI(pathname), lastmod);
}

function buildSitemapLastmodMap() {
  const lastmodByPath = new Map();

  if (existsSync(CONTENT_POSTS_DIR)) {
    for (const fileName of readdirSync(CONTENT_POSTS_DIR)) {
      const ext = extname(fileName);
      if (!['.md', '.mdx'].includes(ext)) {
        continue;
      }

      const content = readFileSync(join(CONTENT_POSTS_DIR, fileName), 'utf8');
      const frontmatter = content.match(/^---\n([\s\S]*?)\n---/)?.[1] || '';
      const date = readFrontmatterValue(frontmatter, 'date');
      const lastmod = toIsoDate(date);
      if (!lastmod) {
        continue;
      }

      const fileSlug = normalizePostSlug(basename(fileName, ext));
      const canonicalSlug = normalizePostSlug(readFrontmatterValue(frontmatter, 'slug') || fileSlug);
      const originUrl = readFrontmatterValue(frontmatter, 'originUrl') || '';
      const originSlug = originUrl.match(/^\/posts\/(.+?)\/?$/)?.[1];

      for (const slug of new Set([canonicalSlug, fileSlug, originSlug ? normalizePostSlug(originSlug) : ''])) {
        if (slug) {
          setLastmod(lastmodByPath, `/posts/${slug}`, lastmod);
        }
      }
    }
  }

  if (existsSync(AI_NEWS_JSON)) {
    const digest = JSON.parse(readFileSync(AI_NEWS_JSON, 'utf8'));
    const aiNewsUpdatedAt = toIsoDate(digest.updatedAt);
    if (aiNewsUpdatedAt) {
      setLastmod(lastmodByPath, '/ai-news', aiNewsUpdatedAt);
    }

    for (const item of digest.items || []) {
      const lastmod = toIsoDate(item.lastSeenAt || item.publishedAt || item.archiveFirstSeenAt);
      if (item.id && lastmod) {
        setLastmod(lastmodByPath, `/ai-news/${item.id}`, lastmod);
      }
    }
  }

  return lastmodByPath;
}

const sitemapLastmodByPath = buildSitemapLastmodMap();

export default defineConfig({
  // 动态获取站点 URL：优先使用环境变量，如未设置则使用默认域名
  site: SITE_URL,
  integrations: [
    tailwind(),
    mdx(),
    sitemap({
      changefreq: 'daily',
      priority: 0.7,
      filter: (page) => {
        const excludePaths = ['/404', '/search'];
        if (/\/posts\/page\/1\/?$/.test(page)) return false;
        // 排除 AI News 分页（只保留首页和详情页）
        if (/\/ai-news\/page\/\d+/.test(page)) return false;
        return !excludePaths.some(path => page.includes(path));
      },
      serialize(item) {
        const pathname = new URL(item.url, SITE_URL).pathname.replace(/\/+$/, '') || '/';
        const lastmod = sitemapLastmodByPath.get(pathname);

        return {
          ...item,
          ...(lastmod ? { lastmod } : {}),
        };
      },
      customPages: [],
      i18n: {
        defaultLocale: 'zh-CN',
        locales: {
          'zh-CN': 'zh-CN',
        },
      },
    }),
  ],
  markdown: {
    remarkPlugins: [remarkImagePath],
    shikiConfig: {
      theme: 'github-dark-dimmed',
      langAlias: {
        golang: 'go',
      },
      wrap: true,
    },
  },
  output: 'static',
});
