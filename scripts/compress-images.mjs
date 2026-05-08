/**
 * 图片压缩脚本 - 在构建前运行
 * 将 public/images/ai-news/ 下的大图压缩，减少 dist 体积
 * PNG→JPG 转换时自动更新 ai-news.json 中的引用
 *
 * 用法: node scripts/compress-images.mjs
 * 加 --dry-run 可预览不实际修改
 */
import sharp from 'sharp';
import { readdir, stat, unlink, readFile, writeFile } from 'fs/promises';
import { join, extname, basename } from 'path';

const IMAGES_DIR = 'public/images/ai-news';
const AI_NEWS_JSON = 'src/data/ai-news.json';
const MAX_WIDTH = 1200;
const JPG_QUALITY = 78;
const PNG_COMPRESSION = 9;
const SIZE_THRESHOLD_KB = 100;

const dryRun = process.argv.includes('--dry-run');

async function getFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isFile()) {
      const ext = extname(entry.name).toLowerCase();
      if (['.jpg', '.jpeg', '.png'].includes(ext)) {
        files.push({ path: fullPath, ext, name: entry.name });
      }
    }
  }
  return files;
}

async function compressImage(filePath, ext) {
  const info = await stat(filePath);
  const sizeKB = info.size / 1024;
  if (sizeKB < SIZE_THRESHOLD_KB) return null;

  const metadata = await sharp(filePath).metadata();
  const shouldResize = metadata.width > MAX_WIDTH;

  let pipeline = sharp(filePath);
  if (shouldResize) {
    pipeline = pipeline.resize(MAX_WIDTH, null, { withoutEnlargement: true });
  }

  let outputPath = filePath;
  let outputExt = ext;
  let converted = false;

  // PNG > 200KB 且不是透明图 → 转为 JPG
  if (ext === '.png' && sizeKB > 200 && !metadata.hasAlpha) {
    outputExt = '.jpg';
    outputPath = filePath.replace(/\.png$/i, '.jpg');
    pipeline = pipeline.jpeg({ quality: JPG_QUALITY, mozjpeg: true });
    converted = true;
  } else if (ext === '.png') {
    pipeline = pipeline.png({ compressionLevel: PNG_COMPRESSION, palette: true });
  } else {
    pipeline = pipeline.jpeg({ quality: JPG_QUALITY, mozjpeg: true });
  }

  const buffer = await pipeline.toBuffer();
  const newSizeKB = buffer.length / 1024;
  const savedKB = sizeKB - newSizeKB;

  if (savedKB / sizeKB < 0.1) return null;

  if (!dryRun) {
    await writeFile(outputPath, buffer);
    if (converted && filePath !== outputPath) {
      await unlink(filePath);
    }
  }

  return {
    oldName: basename(filePath),
    newName: basename(outputPath),
    beforeKB: Math.round(sizeKB),
    afterKB: Math.round(newSizeKB),
    savedKB: Math.round(savedKB),
    resized: shouldResize,
    converted,
  };
}

async function updateAiNewsJson(conversions) {
  if (conversions.length === 0) return;

  const raw = await readFile(AI_NEWS_JSON, 'utf8');
  let updated = raw;
  let count = 0;

  for (const { oldName, newName } of conversions) {
    if (oldName === newName) continue;
    // 替换所有引用：/images/ai-news/xxx.png → /images/ai-news/xxx.jpg
    const oldRef = `/images/ai-news/${oldName}`;
    const newRef = `/images/ai-news/${newName}`;
    if (updated.includes(oldRef)) {
      updated = updated.replaceAll(oldRef, newRef);
      count++;
    }
  }

  if (count > 0 && !dryRun) {
    await writeFile(AI_NEWS_JSON, updated, 'utf8');
  }
  return count;
}

async function main() {
  console.log(`🖼️  图片压缩${dryRun ? ' (dry-run 模式)' : ''}`);
  console.log(`📁 目录: ${IMAGES_DIR}\n`);

  const files = await getFiles(IMAGES_DIR);
  console.log(`找到 ${files.length} 张图片\n`);

  let totalSaved = 0;
  let processed = 0;
  const results = [];
  const conversions = [];

  for (const file of files) {
    try {
      const result = await compressImage(file.path, file.ext);
      if (result) {
        results.push(result);
        totalSaved += result.savedKB;
        processed++;
        if (result.converted) {
          conversions.push(result);
        }
      }
    } catch (err) {
      console.error(`❌ ${file.name}: ${err.message}`);
    }
  }

  // 更新 JSON 引用
  if (conversions.length > 0) {
    const updated = await updateAiNewsJson(conversions);
    console.log(`\n📝 更新 ai-news.json: ${updated || 0} 条 PNG→JPG 引用`);
  }

  results.sort((a, b) => b.savedKB - a.savedKB);

  console.log('\n--- Top 节省 ---');
  for (const r of results.slice(0, 15)) {
    const extra = [];
    if (r.resized) extra.push('缩放');
    if (r.converted) extra.push('PNG→JPG');
    console.log(`  ${r.oldName}: ${r.beforeKB}KB → ${r.afterKB}KB (省 ${r.savedKB}KB) ${extra.join(', ')}`);
  }

  console.log(`\n✅ 处理完成: ${processed}/${files.length} 张图片`);
  console.log(`💾 总共节省: ${Math.round(totalSaved / 1024)} MB`);
}

main().catch(console.error);
