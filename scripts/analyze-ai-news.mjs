// AI News JSON 文件分析工具
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const AI_NEWS_PATH = path.join(__dirname, '../src/data/ai-news.json');

async function analyzeAiNewsJson() {
  console.log('=== AI News JSON 文件分析 ===\n');

  const content = await fs.readFile(AI_NEWS_PATH, 'utf-8');
  const data = JSON.parse(content);
  const items = data.items || [];

  console.log(`文件大小: ${(content.length / 1024 / 1024).toFixed(2)} MB`);
  console.log(`总行数: ${content.split('\n').length}`);
  console.log(`总条目: ${items.length}`);
  console.log(`最新推荐: ${(data.latestIds || []).length}`);
  console.log('');

  // 按月份统计
  const byMonth = new Map();
  for (const item of items) {
    const date = new Date(item.publishedAt);
    const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    byMonth.set(month, (byMonth.get(month) || 0) + 1);
  }

  console.log('按月份分布:');
  const sortedMonths = [...byMonth.entries()].sort((a, b) => b[0].localeCompare(a[0]));
  for (const [month, count] of sortedMonths) {
    console.log(`  ${month}: ${count} 条`);
  }
  console.log('');

  // 按来源统计
  const bySource = new Map();
  for (const item of items) {
    const source = item.feedName || item.source || 'unknown';
    bySource.set(source, (bySource.get(source) || 0) + 1);
  }

  console.log('按来源分布 (前 10):');
  const sortedSources = [...bySource.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);
  for (const [source, count] of sortedSources) {
    console.log(`  ${source}: ${count} 条`);
  }
  console.log('');

  // 按区域统计
  const byRegion = new Map();
  for (const item of items) {
    const region = item.sourceRegion || 'unknown';
    byRegion.set(region, (byRegion.get(region) || 0) + 1);
  }

  console.log('按区域分布:');
  for (const [region, count] of byRegion) {
    console.log(`  ${region}: ${count} 条`);
  }
  console.log('');

  // 建议拆分策略
  console.log('=== 拆分建议 ===\n');
  console.log('方案 1: 按月拆分');
  console.log('  - 将 items 按 publishedAt 月份拆分为独立文件');
  console.log('  - 文件命名: ai-news-items-YYYY-MM.json');
  console.log('  - 主文件保留 metadata + latestIds + 最近 3 个月数据');
  console.log('  - 优点: 结构清晰，便于归档');
  console.log('  - 缺点: 需要修改加载逻辑');
  console.log('');
  console.log('方案 2: 按来源拆分');
  console.log('  - 将 items 按 feedName/source 拆分为独立文件');
  console.log('  - 文件命名: ai-news-items-{source}.json');
  console.log('  - 优点: 便于按来源管理');
  console.log('  - 缺点: 来源数量多，文件碎片化');
  console.log('');
  console.log('方案 3: 保持现状');
  console.log('  - 当前文件虽大但构建正常');
  console.log('  - 144K 行 JSON 在现代工具链中可接受');
  console.log('  - 优点: 无需修改代码');
  console.log('  - 缺点: 文件较大，Git diff 不友好');
  console.log('');
  console.log('推荐: 方案 1（按月拆分）- 结构清晰，便于长期维护');
}

analyzeAiNewsJson().catch(console.error);
