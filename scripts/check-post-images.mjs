#!/usr/bin/env node
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');
const postsDir = path.join(rootDir, 'src/content/posts');
const distDir = path.join(rootDir, 'dist');

const markdownImagePattern = /!\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;
const htmlImagePattern = /<img\b[^>]*(?:src|data-src)=["']([^"']*)["'][^>]*>/gi;
const emptyLazyPattern = /<img\b[^>]*src=["']\s*["'][^>]*data-src=["']\/images\//i;

async function pathExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function walk(dir, predicate) {
  if (!(await pathExists(dir))) {
    return [];
  }

  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const entryPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      files.push(...await walk(entryPath, predicate));
    } else if (predicate(entryPath)) {
      files.push(entryPath);
    }
  }

  return files;
}

function relativePath(filePath) {
  return path.relative(rootDir, filePath).replaceAll('\\', '/');
}

function lineNumber(content, index) {
  return content.slice(0, index).split(/\r?\n/).length;
}

function isExternalUrl(url) {
  return /^(?:https?:)?\/\//i.test(url) || url.startsWith('data:');
}

function stripUrlDecorations(url) {
  return url.split('#')[0].split('?')[0];
}

function resolveLocalImage(filePath, rawUrl) {
  const cleanUrl = stripUrlDecorations(rawUrl);

  if (cleanUrl.startsWith('/')) {
    return path.join(rootDir, 'public', cleanUrl.slice(1));
  }

  return path.resolve(path.dirname(filePath), cleanUrl);
}

async function scanPostImageRefs() {
  const files = await walk(postsDir, (filePath) => /\.(?:md|mdx)$/i.test(filePath));
  const issues = [];
  let localRefs = 0;
  let externalRefs = 0;

  for (const filePath of files) {
    const content = await fs.readFile(filePath, 'utf-8');
    const patterns = [markdownImagePattern, htmlImagePattern];

    for (const pattern of patterns) {
      pattern.lastIndex = 0;

      let match;
      while ((match = pattern.exec(content))) {
        const rawUrl = match[1].trim();
        const location = `${relativePath(filePath)}:${lineNumber(content, match.index)}`;

        if (!rawUrl) {
          issues.push(`${location} 图片 src 为空`);
          continue;
        }

        if (isExternalUrl(rawUrl)) {
          externalRefs += 1;
          continue;
        }

        localRefs += 1;

        if (rawUrl.includes('/public/')) {
          issues.push(`${location} 不应在文章图片路径中包含 public: ${rawUrl}`);
        }

        const resolvedPath = resolveLocalImage(filePath, rawUrl);
        if (!(await pathExists(resolvedPath))) {
          issues.push(`${location} 找不到本地图片: ${rawUrl} -> ${relativePath(resolvedPath)}`);
        }
      }
    }
  }

  return { files: files.length, localRefs, externalRefs, issues };
}

async function scanDistHtml() {
  const files = await walk(distDir, (filePath) => filePath.endsWith('.html'));
  const issues = [];

  for (const filePath of files) {
    const content = await fs.readFile(filePath, 'utf-8');

    if (emptyLazyPattern.test(content)) {
      issues.push(`${relativePath(filePath)} 存在空 src + data-src 图片，浏览器可能不会显示图片`);
    }

    if (content.includes('/public/images/')) {
      issues.push(`${relativePath(filePath)} 仍引用 /public/images/ 路径`);
    }
  }

  return { files: files.length, issues };
}

const postResult = await scanPostImageRefs();
const distResult = await scanDistHtml();
const issues = [...postResult.issues, ...distResult.issues];

console.log(`检查文章图片: ${postResult.files} 个内容文件，${postResult.localRefs} 个本地图片，${postResult.externalRefs} 个外链图片`);

if (distResult.files > 0) {
  console.log(`检查构建产物: ${distResult.files} 个 HTML 文件`);
}

if (issues.length > 0) {
  console.error('\n发现图片问题:');
  for (const issue of issues) {
    console.error(`- ${issue}`);
  }
  process.exit(1);
}

console.log('图片检查通过');
