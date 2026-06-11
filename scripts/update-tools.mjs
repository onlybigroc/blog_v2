import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOLS_DIR = path.join(__dirname, '../src/components/tools');

async function main() {
  const files = await fs.readdir(TOOLS_DIR);
  const toolFiles = files.filter(f => f.endsWith('Tool.astro') && f !== 'ToolCleanLink.astro');
  
  let updated = 0;
  let skipped = 0;

  for (const file of toolFiles) {
    const filePath = path.join(TOOLS_DIR, file);
    let content = await fs.readFile(filePath, 'utf-8');
    const original = content;

    // Skip if no cleanPath
    if (!content.includes('cleanPath')) {
      skipped++;
      continue;
    }

    // Skip if already uses ToolCleanLink component
    if (content.includes('ToolCleanLink')) {
      skipped++;
      continue;
    }

    // Replace the inline clean link button with the component
    // Pattern: {showCleanLink && cleanPath && (...<a>...</a>...)}
    // Handle both multiline and single-line formats
    
    // First, replace the multiline pattern
    content = content.replace(
      /\{showCleanLink && cleanPath && \(\s*\n\s*<a\s*\n\s*href=\{cleanPath\}\s*\n\s*title="独立打开"\s*\n\s*class="[^"]*"\s*\n\s*>\s*\n\s*<svg[^>]*>\s*\n\s*<path[^/]*\/>\s*\n\s*<\/svg>\s*\n\s*独立打开\s*\n\s*<\/a>\s*\n\s*\)\}/,
      '{showCleanLink && cleanPath && <ToolCleanLink cleanPath={cleanPath} />}'
    );

    // Then, replace the single-line pattern
    content = content.replace(
      /\{showCleanLink && cleanPath && \(<a href=\{cleanPath\} title="独立打开" class="[^"]*"><svg[^>]*><path[^/]*\/><\/svg>独立打开<\/a>\)\}/,
      '{showCleanLink && cleanPath && <ToolCleanLink cleanPath={cleanPath} />}'
    );

    // Also handle the pattern with <a> on separate line but SVG inline
    content = content.replace(
      /\{showCleanLink && cleanPath && \(\s*\n\s*<a\s+href=\{cleanPath\}\s+title="独立打开"\s+class="[^"]*"\s*>\s*\n\s*<svg[^>]*>\s*<path[^/]*\/>\s*<\/svg>\s*\n\s*独立打开\s*\n\s*<\/a>\s*\n\s*\)\}/,
      '{showCleanLink && cleanPath && <ToolCleanLink cleanPath={cleanPath} />}'
    );

    // If we made changes, add the import
    if (content !== original) {
      // Replace Props interface with shared type
      content = content.replace(
        /interface Props \{\s*cleanPath\?: string;\s*showCleanLink\?: boolean;\s*(?:showPageMeta\?: boolean;\s*)?\}/,
        "import type { ToolWrapperProps } from '../../types/tool';\n\ninterface Props extends ToolWrapperProps {}"
      );

      // Add ToolCleanLink import after the last import in frontmatter
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
        content = lines.join('\n');
      }

      await fs.writeFile(filePath, content);
      updated++;
    } else {
      skipped++;
    }
  }

  console.log(`Updated: ${updated}, Skipped: ${skipped}`);
}

main().catch(console.error);
