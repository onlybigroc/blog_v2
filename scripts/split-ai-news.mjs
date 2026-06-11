// AI News JSON 按月拆分工具
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const AI_NEWS_PATH = path.join(__dirname, '../src/data/ai-news.json');
const OUTPUT_DIR = path.join(__dirname, '../src/data/ai-news-items');

async function splitAiNewsByMonth() {
  console.log('=== AI News JSON 按月拆分 ===\n');

  // 读取原始文件
  const content = await fs.readFile(AI_NEWS_PATH, 'utf-8');
  const data = JSON.parse(content);
  const items = data.items || [];

  console.log(`原始文件: ${(content.length / 1024 / 1024).toFixed(2)} MB`);
  console.log(`总条目: ${items.length}\n`);

  // 按月份分组
  const byMonth = new Map();
  for (const item of items) {
    const date = new Date(item.publishedAt);
    const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    if (!byMonth.has(month)) byMonth.set(month, []);
    byMonth.get(month).push(item);
  }

  // 创建输出目录
  await fs.mkdir(OUTPUT_DIR, { recursive: true });

  // 写入每月文件
  const monthFiles = [];
  for (const [month, monthItems] of [...byMonth.entries()].sort((a, b) => b[0].localeCompare(a[0]))) {
    const filename = `${month}.json`;
    const filepath = path.join(OUTPUT_DIR, filename);
    await fs.writeFile(filepath, JSON.stringify(monthItems, null, 2), 'utf-8');
    monthFiles.push({ month, filename, count: monthItems.length });
    console.log(`  ${filename}: ${monthItems.length} 条`);
  }

  // 创建元数据文件（不含 items）
  const metadata = {
    updatedAt: data.updatedAt,
    windowHours: data.windowHours,
    note: data.note,
    stats: data.stats,
    sources: data.sources,
    failures: data.failures,
    latestIds: data.latestIds,
    monthFiles: monthFiles.map(m => m.filename),
  };

  const metadataPath = path.join(__dirname, '../src/data/ai-news-meta.json');
  await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2), 'utf-8');

  console.log(`\n元数据文件: ai-news-meta.json`);
  console.log(`月度文件目录: src/data/ai-news-items/`);
  console.log(`\n拆分完成!`);
}

splitAiNewsByMonth().catch(console.error);
