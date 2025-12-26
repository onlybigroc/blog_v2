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
      // sitemap 优化配置
      changefreq: 'daily',
      priority: 0.7,
      lastmod: new Date(),
      // 过滤掉不需要的页面
      filter: (page) => {
        // 排除特定路径
        const excludePaths = ['/404', '/search'];
        return !excludePaths.some(path => page.includes(path));
      },
      // 自定义页面优先级
      customPages: [],
      // 启用多语言支持（如需要）
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
      wrap: true,
    },
  },
  output: 'static',
});
