import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import Parser from 'rss-parser';
import TurndownService from 'turndown';
import { JSDOM } from 'jsdom';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RSS_URL = 'https://www.cnblogs.com/bigroc/rss';
const POSTS_DIR = path.join(__dirname, '../src/content/posts');
const IMAGES_DIR = path.join(__dirname, '../public/images/posts');
const SYNC_CACHE = path.join(__dirname, '../data/sync-cache.json');

const parser = new Parser();
const turndownService = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced',
});

// 确保目录存在
async function ensureDir(dir) {
  try {
    await fs.access(dir);
  } catch {
    await fs.mkdir(dir, { recursive: true });
  }
}

// 加载同步缓存
async function loadCache() {
  try {
    const content = await fs.readFile(SYNC_CACHE, 'utf-8');
    return JSON.parse(content);
  } catch {
    return { synced: [] };
  }
}

// 保存同步缓存
async function saveCache(cache) {
  await ensureDir(path.dirname(SYNC_CACHE));
  await fs.writeFile(SYNC_CACHE, JSON.stringify(cache, null, 2));
}

// 生成 slug
function generateSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 50);
}

// 下载图片
async function downloadImage(url, postSlug) {
  try {
    const response = await fetch(url);
    if (!response.ok) return url;

    const buffer = await response.arrayBuffer();
    const ext = path.extname(new URL(url).pathname) || '.jpg';
    const filename = `${postSlug}-${Date.now()}${ext}`;
    const filepath = path.join(IMAGES_DIR, filename);

    await ensureDir(IMAGES_DIR);
    await fs.writeFile(filepath, Buffer.from(buffer));

    return `/images/posts/${filename}`;
  } catch (error) {
    console.warn(`图片下载失败: ${url}`, error.message);
    return url;
  }
}

// 处理文章内容中的图片
async function processImages(html, postSlug) {
  const dom = new JSDOM(html);
  const images = dom.window.document.querySelectorAll('img');

  for (const img of images) {
    const src = img.getAttribute('src');
    if (src && src.startsWith('http')) {
      const localPath = await downloadImage(src, postSlug);
      img.setAttribute('src', localPath);
    }
  }

  return dom.window.document.body.innerHTML;
}

// 提取摘要
function extractSummary(content, maxLength = 200) {
  const text = content.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
}

// 抓取文章详情页完整内容
async function fetchFullArticle(url) {
  try {
    console.log(`  正在抓取完整内容: ${url}`);
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const html = await response.text();
    const dom = new JSDOM(html);
    const doc = dom.window.document;
    
    // 博客园文章主体在 #cnblogs_post_body 或 .post 内
    let contentElement = doc.querySelector('#cnblogs_post_body') || 
                         doc.querySelector('.blogpost-body') ||
                         doc.querySelector('.post-body') ||
                         doc.querySelector('article');
    
    if (!contentElement) {
      console.warn('  ⚠ 未找到文章主体，使用 RSS 内容');
      return null;
    }
    
    return contentElement.innerHTML;
  } catch (error) {
    console.error(`  ✗ 抓取失败: ${error.message}`);
    return null;
  }
}

// 抓取并处理单篇文章
async function fetchAndProcessPost(item, cache) {
  const guid = item.guid || item.link;
  
  // 检查是否已同步
  if (cache.synced.includes(guid)) {
    console.log(`跳过已同步文章: ${item.title}`);
    return null;
  }

  console.log(`\n正在处理: ${item.title}`);

  const slug = generateSlug(item.title);
  const pubDate = new Date(item.pubDate);
  
  // 1. 先尝试抓取完整内容
  let content = await fetchFullArticle(item.link);
  
  // 2. 如果抓取失败，降级使用 RSS 内容
  if (!content) {
    console.log('  使用 RSS 摘要内容');
    content = item.content || item['content:encoded'] || item.contentSnippet || '';
  }
  
  // 3. 处理图片（下载并本地化）
  console.log('  处理图片资源...');
  content = await processImages(content, slug);
  
  // 4. 转换为 Markdown
  console.log('  转换为 Markdown...');
  const markdown = turndownService.turndown(content);
  
  // 5. 提取分类和标签
  const categories = item.categories || [];
  const tags = categories.slice(0, 5);
  
  // 6. 生成 frontmatter
  const frontmatter = `---
title: "${item.title.replace(/"/g, '\\"')}"
date: ${pubDate.toISOString()}
slug: ${slug}
categories: [${categories.length > 0 ? `"${categories[0]}"` : ''}]
tags: [${tags.map(t => `"${t}"`).join(', ')}]
summary: "${extractSummary(content).replace(/"/g, '\\"')}"
originUrl: "${item.link}"
---

`;

  const fullContent = frontmatter + markdown;
  const filename = `${pubDate.toISOString().split('T')[0]}-${slug}.md`;
  const filepath = path.join(POSTS_DIR, filename);

  await fs.writeFile(filepath, fullContent, 'utf-8');
  console.log(`✓ 已保存: ${filename}`);

  return guid;
}

// 主同步函数
async function syncBlog() {
  console.log('开始同步博客文章...\n');

  await ensureDir(POSTS_DIR);
  await ensureDir(IMAGES_DIR);

  const cache = await loadCache();
  const feed = await parser.parseURL(RSS_URL);

  console.log(`发现 ${feed.items.length} 篇文章\n`);

  let syncedCount = 0;

  for (const item of feed.items) {
    try {
      const guid = await fetchAndProcessPost(item, cache);
      if (guid) {
        cache.synced.push(guid);
        syncedCount++;
        // 限速，避免被封（3秒间隔）
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    } catch (error) {
      console.error(`处理文章失败: ${item.title}`, error.message);
    }
  }

  await saveCache(cache);

  console.log(`\n同步完成！新增 ${syncedCount} 篇文章`);
}

syncBlog().catch(console.error);
