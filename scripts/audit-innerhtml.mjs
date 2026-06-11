import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOLS_DIR = path.join(__dirname, '../src/components/tools');

// Patterns that indicate user input or external data that needs escaping
const RISKY_PATTERNS = [
  // User input from textareas/inputs
  /\.value/g,
  // API response data
  /data\./g,
  // External fetched content
  /response\./g,
  /result\./g,
];

// Patterns that indicate safe internal data
const SAFE_PATTERNS = [
  // Generated numbers/dates
  /\.toFixed\(/g,
  /\.toLocaleString\(/g,
  // Internal constants
  /Math\./g,
  /Date\./g,
  // Already escaped
  /escapeHtml\(/g,
  /escapeHtmlAttribute\(/g,
];

async function main() {
  const files = await fs.readdir(TOOLS_DIR);
  const toolFiles = files.filter(f => f.endsWith('Tool.astro'));
  
  let totalIssues = 0;
  const issues = [];

  for (const file of toolFiles) {
    const filePath = path.join(TOOLS_DIR, file);
    const content = await fs.readFile(filePath, 'utf-8');
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Check if line uses innerHTML
      if (!line.includes('innerHTML')) continue;
      
      // Skip if already uses escapeHtml
      if (line.includes('escapeHtml') || line.includes('escapeHtmlAttribute')) continue;
      
      // Skip if line is just clearing innerHTML
      if (line.match(/innerHTML\s*=\s*['"](?:['"]|<\/?[^>]*>)/)) continue;
      
      // Check if line contains dynamic content that might need escaping
      const hasTemplateLiteral = line.includes('`') && line.includes('${');
      const hasStringConcat = line.includes('+') && (line.includes('.value') || line.includes('data.'));
      
      if (hasTemplateLiteral || hasStringConcat) {
        // Check if the dynamic parts are safe (numbers, dates, etc.)
        const dynamicParts = line.match(/\$\{([^}]+)\}/g) || [];
        let hasRiskyDynamic = false;
        
        for (const part of dynamicParts) {
          const expr = part.slice(2, -1); // Remove ${ and }
          
          // Skip safe expressions (numbers, dates, math)
          if (/^\d+$/.test(expr)) continue;
          if (/\.toFixed\(/.test(expr)) continue;
          if (/\.toLocaleString\(/.test(expr)) continue;
          if (/Math\./.test(expr)) continue;
          if (/Date\./.test(expr)) continue;
          if (/\.toISOString\(/.test(expr)) continue;
          if (/^['"].*['"]$/.test(expr)) continue; // String literals
          
          // Check for risky patterns
          if (expr.includes('.value') || expr.includes('data.') || expr.includes('input')) {
            hasRiskyDynamic = true;
            break;
          }
        }
        
        if (hasRiskyDynamic) {
          totalIssues++;
          issues.push({
            file,
            line: i + 1,
            content: line.trim().slice(0, 100),
          });
        }
      }
    }
  }

  console.log(`\n=== innerHTML 审计结果 ===\n`);
  console.log(`总问题数: ${totalIssues}\n`);
  
  if (issues.length > 0) {
    console.log('需要添加转义的文件:');
    for (const issue of issues) {
      console.log(`  ${issue.file}:${issue.line}`);
      console.log(`    ${issue.content}...`);
    }
  } else {
    console.log('未发现需要额外转义的 innerHTML 使用。');
  }
}

main().catch(console.error);
