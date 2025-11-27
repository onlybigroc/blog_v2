import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  // 动态获取站点 URL：优先使用环境变量，如未设置则 sitemap 会使用构建时的 URL
  site: process.env.SITE_URL || process.env.CF_PAGES_URL || undefined,
  integrations: [
    tailwind(),
    mdx(),
    sitemap({
      // 自定义 sitemap 配置
      customPages: [],
      // 如果 site 未定义，sitemap 将跳过生成或使用相对路径
    }),
  ],
  markdown: {
    shikiConfig: {
      theme: 'github-dark-dimmed',
      wrap: true,
    },
  },
  output: 'static',
});
