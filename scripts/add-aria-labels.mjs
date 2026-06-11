import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOLS_DIR = path.join(__dirname, '../src/components/tools');

async function main() {
  const files = await fs.readdir(TOOLS_DIR);
  const toolFiles = files.filter(f => f.endsWith('Tool.astro'));
  
  let updated = 0;

  for (const file of toolFiles) {
    const filePath = path.join(TOOLS_DIR, file);
    let content = await fs.readFile(filePath, 'utf-8');
    const original = content;

    // Add aria-label to swap buttons (⇄)
    content = content.replace(
      /<button([^>]*id="swap"[^>]*)>⇄<\/button>/g,
      '<button$1 aria-label="互换">⇄</button>'
    );

    // Add aria-label to delete buttons (&times;)
    content = content.replace(
      /<button([^>]*)>(&times;)<\/button>/g,
      (match, attrs, content) => {
        if (attrs.includes('aria-label')) return match;
        return `<button${attrs} aria-label="删除">${content}</button>`;
      }
    );

    if (content !== original) {
      await fs.writeFile(filePath, content);
      updated++;
      console.log(`Updated: ${file}`);
    }
  }

  console.log(`\nTotal updated: ${updated} files`);
}

main().catch(console.error);
