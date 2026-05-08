import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { remarkImagePath } from './src/plugins/remark-image-path.mjs';

export default defineConfig({
  // 动态获取站点 URL：优先使用环境变量，如未设置则使用默认域名
  site: process.env.SITE_URL || process.env.CF_PAGES_URL || 'https://bigroc.cn',
  integrations: [
    tailwind(),
    mdx(),
    sitemap({
      changefreq: 'daily',
      priority: 0.7,
      lastmod: new Date(),
      filter: (page) => {
        const excludePaths = ['/404', '/search'];
        // 排除 AI News 分页（只保留首页和详情页）
        if (/\/ai-news\/page\/\d+/.test(page)) return false;
        return !excludePaths.some(path => page.includes(path));
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
