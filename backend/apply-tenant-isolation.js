/**
 * 批量给业务路由加 SaaS 租户隔离
 * 用法: node apply-tenant-isolation.js
 *
 * 策略：
 * 1. 在文件顶部加入 tenantIsolation 导入（如果缺失）
 * 2. 在所有 verifyToken 之后插入 tenantIsolation（只插一次，在路由级别）
 * 3. 在 SQL 查询中注入 tenant_id 条件
 *    - SELECT: 有 WHERE → AND tenant_id=?；无 WHERE → WHERE tenant_id=?
 *    - INSERT: 加 tenant_id 列和 req.tenantId 值
 *    - UPDATE: 加 AND tenant_id=? 到 WHERE
 *    - DELETE: 加 AND tenant_id=? 到 WHERE
 *
 * ⚠️ 此脚本做最佳努力注入，完成后必须人工 verify 每个文件。
 */

const fs = require('fs');
const path = require('path');

const ROUTES_DIR = path.join(__dirname, 'routes');

// 需要处理的路由文件（排除 auth.js，它是登录路由）
const FILES = [
  'users.js', 'roles.js', 'dashboard.js',
  'cost-accounting.js', 'procurement.js', 'inventory.js',
  'production.js', 'quality.js', 'incentive.js'
];

// 检查 database.js 中 isSaaS 的导出
// 实际上每个文件应该从 '../config/database' 导入 isSaaS
// 但当前文件都是从 '../config/database' 导入 getDb
// 所以需要加 isSaaS 导入

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  const fileName = path.basename(filePath);

  console.log(`\n处理: ${fileName}`);

  // 1. 加入 tenantIsolation 导入（如果缺失）
  if (!content.includes('tenantIsolation')) {
    // 在 auth 导入那行后面插入 tenant 导入
    const authImportRegex = /(const\s*\{\s*verifyToken[^\}]*\}\s*=\s*require\(['"]\.\.\/middleware\/auth['"]\);?)/;
    const match = content.match(authImportRegex);
    if (match) {
      const insertion = `\nconst { tenantIsolation } = require('../middleware/tenant');`;
      content = content.replace(match[1], match[1] + insertion);
      modified = true;
      console.log('  ✓ 已加入 tenantIsolation 导入');
    }
  }

  // 2. 加入 isSaaS 导入（如果缺失）
  if (!content.includes('isSaaS')) {
    // 在 getDb 导入那行中加 isSaaS
    const dbImportRegex = /(const\s*\{\s*getDb\s*\}\s*=\s*require\(['"]\.\.\/config\/database['"]\);?)/;
    const match = content.match(dbImportRegex);
    if (match) {
      const newImport = match[1].replace('getDb', 'getDb, isSaaS');
      content = content.replace(match[1], newImport);
      modified = true;
      console.log('  ✓ 已加入 isSaaS 导入');
    }
  }

  // 3. 在 verifyToken 之后插入 tenantIsolation（路由级别）
  // 匹配: verifyToken, requirePermission  → verifyToken, tenantIsolation, requirePermission
  const verifyTokenRegex = /(verifyToken,\s*)(requirePermission)/g;
  if (content.includes('verifyToken') && !content.includes('tenantIsolation, requirePermission')) {
    content = content.replace(verifyTokenRegex, 'verifyToken, tenantIsolation, $2');
    modified = true;
    console.log('  ✓ 已在 verifyToken 后插入 tenantIsolation');
  }

  // 4. 处理 SQL 中的 tenant_id 过滤
  // 这是一个复杂任务，我们分步骤处理：
  // 4.1 处理 SELECT 查询
  // 4.2 处理 INSERT 查询
  // 4.3 处理 UPDATE 查询
  // 4.4 处理 DELETE 查询
  //
  // 但是，自动修改 SQL 是非常危险的。我们决定：
  // 只做路由级别的中间件注册，SQL 过滤由开发人员手动完成。
  //
  // 实际上，更好的策略是：
  // 在脚本中标记出所有需要修改的 SQL 位置，由人工完成。
  //
  // 我决定：此脚本只完成中间件的注册，SQL 修改输出警告。

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`  ✅ ${fileName} 已更新`);
  } else {
    console.log(`  ⊙ ${fileName} 无需修改或已修改`);
  }

  // 输出需要人工修改的 SQL 位置
  console.log(`  ⚠️  请人工检查并修改 SQL 查询，加入 tenant_id 过滤`);
}

FILES.forEach(f => {
  const fp = path.join(ROUTES_DIR, f);
  if (fs.existsSync(fp)) {
    processFile(fp);
  } else {
    console.log(`\n跳过: ${f} (文件不存在)`);
  }
});

console.log('\n========================================');
console.log('脚本完成。请人工检查每个文件：');
console.log('1. 确认 tenantIsolation 中间件已注册');
console.log('2. 在 SQL 查询中加入 tenant_id 过滤');
console.log('========================================');
