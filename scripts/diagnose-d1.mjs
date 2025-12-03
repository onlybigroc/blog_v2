#!/usr/bin/env node
/**
 * D1 数据库诊断脚本
 * 自动检查配置并提供修复建议
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function success(message) {
  log(`✅ ${message}`, colors.green);
}

function error(message) {
  log(`❌ ${message}`, colors.red);
}

function warning(message) {
  log(`⚠️  ${message}`, colors.yellow);
}

function info(message) {
  log(`ℹ️  ${message}`, colors.blue);
}

function header(message) {
  log(`\n${'='.repeat(60)}`, colors.cyan);
  log(message, colors.cyan);
  log('='.repeat(60), colors.cyan);
}

function exec(command, silent = false) {
  try {
    const output = execSync(command, { encoding: 'utf-8' });
    if (!silent) {
      console.log(output);
    }
    return { success: true, output };
  } catch (err) {
    if (!silent) {
      console.error(err.message);
    }
    return { success: false, output: err.message };
  }
}

async function diagnose() {
  log('\n🔍 开始诊断 D1 数据库配置...\n', colors.cyan);

  const issues = [];
  const fixes = [];

  // 检查 1: .env 文件
  header('检查 1: 环境变量配置');
  const envPath = path.join(__dirname, '..', '.env');
  if (fs.existsSync(envPath)) {
    success('.env 文件存在');
    const envContent = fs.readFileSync(envPath, 'utf-8');
    const apiUrlMatch = envContent.match(/PUBLIC_STATS_API_URL=(.+)/);
    
    if (apiUrlMatch && apiUrlMatch[1].trim()) {
      const apiUrl = apiUrlMatch[1].trim();
      if (apiUrl.includes('你的账号')) {
        warning('.env 文件存在,但 URL 未配置实际地址');
        issues.push('环境变量 PUBLIC_STATS_API_URL 需要配置实际的 Workers URL');
        fixes.push('部署 Workers 后,更新 .env 文件中的 PUBLIC_STATS_API_URL');
      } else {
        success(`API URL 已配置: ${apiUrl}`);
      }
    } else {
      error('.env 文件存在,但未配置 PUBLIC_STATS_API_URL');
      issues.push('缺少环境变量 PUBLIC_STATS_API_URL');
      fixes.push('在 .env 文件中添加: PUBLIC_STATS_API_URL=你的Workers地址');
    }
  } else {
    error('.env 文件不存在');
    issues.push('缺少 .env 配置文件');
    fixes.push('创建 .env 文件并配置 PUBLIC_STATS_API_URL');
  }

  // 检查 2: Wrangler 登录状态
  header('检查 2: Cloudflare 登录状态');
  const whoamiResult = exec('npx wrangler whoami', true);
  if (whoamiResult.success) {
    success('已登录 Cloudflare');
  } else {
    error('未登录 Cloudflare');
    issues.push('未登录 Cloudflare 账号');
    fixes.push('执行: npx wrangler login');
  }

  // 检查 3: D1 数据库
  header('检查 3: D1 数据库');
  const d1ListResult = exec('npx wrangler d1 list', true);
  if (d1ListResult.success) {
    if (d1ListResult.output.includes('blog_stats')) {
      success('D1 数据库 blog_stats 存在');
      
      // 检查表结构
      log('\n检查数据库表结构...');
      const tablesResult = exec(
        'npx wrangler d1 execute blog_stats --command="SELECT name FROM sqlite_master WHERE type=\'table\'"',
        true
      );
      
      if (tablesResult.success) {
        const hasPostStats = tablesResult.output.includes('post_stats');
        const hasUserLikes = tablesResult.output.includes('user_likes');
        
        if (hasPostStats && hasUserLikes) {
          success('数据库表结构完整 (post_stats, user_likes)');
          
          // 检查数据
          log('\n检查数据库数据...');
          const countResult = exec(
            'npx wrangler d1 execute blog_stats --command="SELECT COUNT(*) as count FROM post_stats"',
            true
          );
          
          if (countResult.success) {
            const match = countResult.output.match(/count.*?(\d+)/i);
            const count = match ? parseInt(match[1]) : 0;
            
            if (count > 0) {
              success(`数据库有 ${count} 条记录`);
            } else {
              warning('数据库为空,尚未记录任何统计数据');
              info('这可能是因为:');
              info('  1. Workers API 未部署');
              info('  2. 环境变量未配置');
              info('  3. 网站尚未有访问量');
            }
          }
        } else {
          error('数据库表结构不完整');
          issues.push('数据库表未初始化');
          fixes.push('执行: npx wrangler d1 execute blog_stats --file=database/schema.sql');
        }
      }
    } else {
      error('D1 数据库 blog_stats 不存在');
      issues.push('D1 数据库未创建');
      fixes.push('执行: npx wrangler d1 create blog_stats');
    }
  } else {
    error('无法检查 D1 数据库列表');
  }

  // 检查 4: Workers 部署
  header('检查 4: Workers API 部署状态');
  const deploymentsResult = exec('npx wrangler deployments list', true);
  if (deploymentsResult.success) {
    if (deploymentsResult.output.includes('blog-stats-api')) {
      success('Workers API (blog-stats-api) 已部署');
    } else {
      warning('找不到 blog-stats-api 部署记录');
      issues.push('Workers API 可能未部署');
      fixes.push('执行: npx wrangler deploy workers/stats-api.ts');
    }
  } else {
    warning('无法检查 Workers 部署状态');
  }

  // 检查 5: wrangler.toml 配置
  header('检查 5: wrangler.toml 配置');
  const wranglerTomlPath = path.join(__dirname, '..', 'workers', 'wrangler.toml');
  if (fs.existsSync(wranglerTomlPath)) {
    success('wrangler.toml 文件存在');
    const tomlContent = fs.readFileSync(wranglerTomlPath, 'utf-8');
    
    if (tomlContent.includes('database_id')) {
      success('database_id 已配置');
    } else {
      error('wrangler.toml 中缺少 database_id');
      issues.push('wrangler.toml 配置不完整');
    }
    
    if (tomlContent.includes('ALLOWED_ORIGINS')) {
      success('CORS 配置存在');
    } else {
      warning('未配置 ALLOWED_ORIGINS');
    }
  } else {
    error('wrangler.toml 文件不存在');
  }

  // 输出诊断结果
  header('诊断结果汇总');
  
  if (issues.length === 0) {
    success('\n🎉 所有检查通过!');
    info('\n下一步:');
    info('1. 确认 .env 中的 API URL 是否正确');
    info('2. 重启开发服务器: npm run dev');
    info('3. 访问文章页面,检查浏览器控制台日志');
    info('4. 执行测试请求验证 API 工作正常');
  } else {
    error(`\n发现 ${issues.length} 个问题:\n`);
    issues.forEach((issue, index) => {
      log(`${index + 1}. ${issue}`, colors.red);
    });
    
    warning('\n\n建议的修复步骤:\n');
    fixes.forEach((fix, index) => {
      log(`${index + 1}. ${fix}`, colors.yellow);
    });
  }

  log('\n详细修复指南请查看: TROUBLESHOOTING.md\n', colors.cyan);
}

// 运行诊断
diagnose().catch(console.error);
