import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { createHash } from 'crypto';
import Parser from 'rss-parser';
import TurndownService from 'turndown';
import { JSDOM } from 'jsdom';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BLOG_USERNAME = 'bigroc'; // 博客园用户名
const RSS_URL = `https://www.cnblogs.com/${BLOG_USERNAME}/rss`;
const ARCHIVE_URL = `https://www.cnblogs.com/${BLOG_USERNAME}/default.html`; // 文章归档页
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
    .replace(/\s+/g, '-')           // 空格转短横线
    .replace(/[/\\:*?"<>|]/g, '') // 移除文件名非法字符
    .replace(/-+/g, '-')            // 多个短横线合并为一个
    .replace(/^-|-$/g, '')          // 移除首尾短横线
    .substring(0, 100);             // 限制长度
}

// 生成图片文件名（基于 URL 哈希，确保同一图片不重复下载）
function getImageFilename(url, ext) {
  const hash = createHash('md5').update(url).digest('hex');
  return `${hash}${ext}`;
}

// 下载图片
async function downloadImage(url, postSlug) {
  try {
    const urlObj = new URL(url);
    const ext = path.extname(urlObj.pathname) || '.jpg';
    const filename = getImageFilename(url, ext);
    const filepath = path.join(IMAGES_DIR, filename);
    const localPath = `/images/posts/${filename}`;

    // 检查文件是否已存在
    try {
      await fs.access(filepath);
      console.log(`  ↓ 图片已存在，跳过下载: ${filename}`);
      return localPath;
    } catch {
      // 文件不存在，继续下载
    }

    console.log(`  ↓ 下载图片: ${url}`);
    const response = await fetch(url);
    if (!response.ok) return url;

    const buffer = await response.arrayBuffer();
    await ensureDir(IMAGES_DIR);
    await fs.writeFile(filepath, Buffer.from(buffer));

    console.log(`  ✓ 图片已保存: ${filename}`);
    return localPath;
  } catch (error) {
    console.warn(`  ✗ 图片下载失败: ${url}`, error.message);
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

// 从标题和内容提取关键词作为标签
function extractKeywords(title, content) {
  const keywords = new Set();
  
  // 常见技术关键词
  const techKeywords = [
    'Docker', 'Kubernetes', 'K8s', 'Linux', 'Windows', 'Ubuntu', 'Debian',
    'MySQL', 'PostgreSQL', 'Oracle', 'MongoDB', 'Redis',
    'Java', 'JavaScript', 'Python', 'Go', 'Golang', 'Rust', 'TypeScript',
    'Spring', 'SpringBoot', 'React', 'Vue', 'Angular',
    'Git', 'GitHub', 'GitLab', 'Jenkins', 'CI/CD',
    'WSL', 'SSL', 'HTTPS', 'Nginx', 'Apache',
    'MQTT', 'RabbitMQ', 'Kafka',
    'Nacos', 'Eureka', 'Dubbo',
    'JDK', 'JVM', 'Maven', 'Gradle', 'npm',
    'API', 'REST', 'GraphQL',
    'SQL', 'NoSQL',
    '数据结构', '算法', '设计模式',
    '微服务', '容器', '虚拟化',
  ];
  
  const text = title + ' ' + content.replace(/<[^>]*>/g, '');
  
  // 匹配技术关键词（不区分大小写）
  techKeywords.forEach(keyword => {
    const regex = new RegExp(`\\b${keyword}\\b`, 'i');
    if (regex.test(text)) {
      keywords.add(keyword);
    }
  });
  
  // 从标题提取（移除常见停用词）
  const stopWords = ['如何', '使用', '学习', '笔记', '教程', '简介', '入门', '-', 'bigroc'];
  const titleWords = title.split(/[\s\-\u3001\uff0c\u3002\uff01\uff1f\uff1b\uff1a\u300a\u300b\u300c\u300d\u201c\u201d\u2018\u2019\uff08\uff09\u3010\u3011『\u300f]+/);
  
  titleWords.forEach(word => {
    const cleaned = word.trim();
    if (cleaned.length >= 2 && !stopWords.includes(cleaned.toLowerCase())) {
      // 检查是否是技术词汇或中文词汇
      if (/[\u4e00-\u9fa5]{2,}/.test(cleaned) || /^[a-zA-Z]{2,}$/.test(cleaned)) {
        keywords.add(cleaned);
      }
    }
  });
  
  // 限制标签数量
  return Array.from(keywords).slice(0, 8);
}

// 转义 YAML 字符串
function escapeYamlString(str) {
  if (!str) return '';
  return str
    .replace(/\\/g, '\\\\')  // 反斜杠
    .replace(/"/g, '\\"')    // 双引号
    .replace(/\n/g, ' ')      // 换行
    .replace(/\r/g, '')       // 回车
    .replace(/\t/g, ' ')      // 制表符
    .replace(/[\[\]]/g, '');  // 移除方括号（避免 YAML 解析问题）
}

// 抓取文章详情页完整内容和元数据
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
      return { content: null, tags: [], categories: [] };
    }
    
    // 提取标签和分类
    const tags = [];
    const categories = [];
    
    // 尝试从文章底部的标签区域提取
    const tagElements = doc.querySelectorAll('#BlogPostCategory a, .postTagList a, [id^="EntryTag"] a');
    tagElements.forEach(tag => {
      const text = tag.textContent.trim();
      if (text) tags.push(text);
    });
    
    // 尝试从分类区域提取
    const categoryElements = doc.querySelectorAll('#BlogPostCategory a');
    categoryElements.forEach(cat => {
      const text = cat.textContent.trim();
      if (text && !categories.includes(text)) {
        categories.push(text);
      }
    });
    
    console.log(`  找到 ${tags.length} 个标签, ${categories.length} 个分类`);
    
    return { 
      content: contentElement.innerHTML,
      tags,
      categories
    };
  } catch (error) {
    console.error(`  ✗ 抓取失败: ${error.message}`);
    return { content: null, tags: [], categories: [] };
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

  // 清理标题：移除博客园 RSS 自动添加的 " - 用户名" 后缀
  let cleanTitle = item.title;
  const suffixPattern = new RegExp(` - ${BLOG_USERNAME}$`, 'i');
  if (suffixPattern.test(cleanTitle)) {
    cleanTitle = cleanTitle.replace(suffixPattern, '').trim();
  }

  console.log(`\n正在处理: ${cleanTitle}`);

  const slug = generateSlug(cleanTitle);
  const pubDate = new Date(item.pubDate);
  
  // 1. 先尝试抓取完整内容和标签
  const { content, tags: extractedTags, categories: extractedCategories } = await fetchFullArticle(item.link);
  
  // 2. 如果抓取失败，降级使用 RSS 内容
  let finalContent = content;
  if (!finalContent) {
    console.log('  使用 RSS 摘要内容');
    finalContent = item.content || item['content:encoded'] || item.contentSnippet || '';
  }
  
  // 3. 处理图片（下载并本地化）
  console.log('  处理图片资源...');
  finalContent = await processImages(finalContent, slug);
  
  // 4. 转换为 Markdown
  console.log('  转换为 Markdown...');
  const markdown = turndownService.turndown(finalContent);
  
  // 5. 提取分类和标签（优先使用从页面提取的，其次使用 RSS 的，最后使用关键词提取）
  const categories = extractedCategories.length > 0 ? extractedCategories : (item.categories || []);
  let tags = extractedTags.length > 0 ? extractedTags : [];
  
  // 如果没有标签，从标题和内容自动提取
  if (tags.length === 0) {
    tags = extractKeywords(cleanTitle, finalContent);
    console.log(`  自动提取标签: ${tags.join(', ')}`);
  }
  
  // 6. 生成 frontmatter
  const frontmatter = `---
title: "${escapeYamlString(cleanTitle)}"
date: ${pubDate.toISOString()}
slug: ${slug}
categories: [${categories.map(c => `"${escapeYamlString(c)}"`).join(', ')}]
tags: [${tags.map(t => `"${escapeYamlString(t)}"`).join(', ')}]
summary: "${escapeYamlString(extractSummary(finalContent))}"
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

// 抓取历史文章列表（从归档页）
async function fetchHistoricalPosts(maxPages = 10) {
  const posts = [];
  console.log('正在抓取历史文章列表...\n');

  for (let page = 1; page <= maxPages; page++) {
    try {
      const url = page === 1 
        ? ARCHIVE_URL 
        : `https://www.cnblogs.com/${BLOG_USERNAME}/default.html?page=${page}`;
      
      console.log(`  正在抓取第 ${page} 页...`);
      const response = await fetch(url);
      
      if (!response.ok) {
        console.log(`  第 ${page} 页不存在，停止抓取`);
        break;
      }
      
      const html = await response.text();
      const dom = new JSDOM(html);
      const doc = dom.window.document;
      
      // 博客园文章列表结构
      const articleElements = doc.querySelectorAll('.day .postTitle, .postTitle2');
      
      if (articleElements.length === 0) {
        console.log(`  第 ${page} 页没有更多文章`);
        break;
      }
      
      articleElements.forEach(element => {
        const link = element.querySelector('a');
        if (link) {
          const title = link.textContent.trim();
          const url = link.href;
          
          // 提取发布日期（如果有）
          const dateElement = element.closest('.day')?.querySelector('.dayTitle');
          let date = new Date();
          if (dateElement) {
            const dateText = dateElement.textContent.trim();
            const dateMatch = dateText.match(/(\d{4})\u5e74(\d{1,2})\u6708(\d{1,2})\u65e5/);
            if (dateMatch) {
              date = new Date(dateMatch[1], dateMatch[2] - 1, dateMatch[3]);
            }
          }
          
          posts.push({
            title,
            link: url,
            guid: url,
            pubDate: date.toISOString(),
            categories: [],
          });
        }
      });
      
      console.log(`  ✓ 发现 ${articleElements.length} 篇文章`);
      
      // 限速
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      console.error(`  抓取第 ${page} 页失败:`, error.message);
      break;
    }
  }
  
  console.log(`\n总计发现 ${posts.length} 篇历史文章\n`);
  return posts;
}

// 主同步函数
async function syncBlog(options = {}) {
  const { includeHistory = false, maxHistoryPages = 10 } = options;
  
  console.log('开始同步博客文章...\n');

  await ensureDir(POSTS_DIR);
  await ensureDir(IMAGES_DIR);

  const cache = await loadCache();
  let allPosts = [];

  // 1. 从 RSS 获取最新文章
  console.log('📡 正在从 RSS 获取最新文章...\n');
  const feed = await parser.parseURL(RSS_URL);
  console.log(`发现 ${feed.items.length} 篇最新文章\n`);
  allPosts = [...feed.items];

  // 2. 如果需要，抓取历史文章
  if (includeHistory) {
    console.log('\n📚 开始抓取历史文章...\n');
    const historicalPosts = await fetchHistoricalPosts(maxHistoryPages);
    
    // 去重（使用 guid/link 去重）
    const existingLinks = new Set(allPosts.map(p => p.link || p.guid));
    const newHistoricalPosts = historicalPosts.filter(
      p => !existingLinks.has(p.link || p.guid)
    );
    
    console.log(`去重后新增 ${newHistoricalPosts.length} 篇历史文章\n`);
    allPosts = [...allPosts, ...newHistoricalPosts];
  }

  console.log(`\n🚀 开始同步 ${allPosts.length} 篇文章...\n`);
  let syncedCount = 0;

  for (const item of allPosts) {
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

  console.log(`\n✅ 同步完成！新增 ${syncedCount} 篇文章`);
  console.log(`📊 缓存中已有 ${cache.synced.length} 篇文章`);
}

// 命令行参数解析
const args = process.argv.slice(2);
const includeHistory = args.includes('--history') || args.includes('-h');
const maxPagesArg = args.find(arg => arg.startsWith('--pages='));
const maxHistoryPages = maxPagesArg ? parseInt(maxPagesArg.split('=')[1]) : 10;

if (args.includes('--help')) {
  console.log(`
博客文章同步脚本

用法:
  npm run sync                    # 只同步 RSS 中的最新文章
  npm run sync -- --history       # 同步所有历史文章（默认 10 页）
  npm run sync -- -h              # 同 --history
  npm run sync -- --history --pages=20  # 指定抓取页数

选项:
  --history, -h         同步历史文章
  --pages=<number>      指定抓取的最大页数（默认 10）
  --help                显示帮助信息
  `);
  process.exit(0);
}

console.log(`
配置信息:
  博客用户: ${BLOG_USERNAME}
  同步模式: ${includeHistory ? '完整历史同步' : '仅 RSS 最新文章'}
  ${includeHistory ? `最大页数: ${maxHistoryPages}` : ''}
`);

syncBlog({ includeHistory, maxHistoryPages }).catch(console.error);
