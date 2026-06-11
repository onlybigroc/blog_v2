import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOLS_DIR = path.join(__dirname, '../src/components/tools');

async function main() {
  const files = await fs.readdir(TOOLS_DIR);
  const toolFiles = files.filter(f => f.endsWith('Tool.astro') && f !== 'ToolCleanLink.astro');
  
  let fixed = 0;

  for (const file of toolFiles) {
    const filePath = path.join(TOOLS_DIR, file);
    const content = await fs.readFile(filePath, 'utf-8');

    // Check if uses ToolCleanLink but missing import
    if (content.includes('ToolCleanLink') && !content.includes("import ToolCleanLink")) {
      // Find the last import line in frontmatter
      const lines = content.split('\n');
      let lastImportIndex = -1;
      let inFrontmatter = false;
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].trim() === '---') {
          if (inFrontmatter) break;
          inFrontmatter = true;
          continue;
        }
        if (inFrontmatter && lines[i].startsWith('import ')) {
          lastImportIndex = i;
        }
      }
      
      if (lastImportIndex >= 0) {
        lines.splice(lastImportIndex + 1, 0, "import ToolCleanLink from './ToolCleanLink.astro';");
        await fs.writeFile(filePath, lines.join('\n'));
        fixed++;
      }
    }
  }

  console.log(`Fixed ${fixed} files missing ToolCleanLink import`);
}

main().catch(console.error);
