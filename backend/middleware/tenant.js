/**
 * 租户隔离中间件（仅 SaaS 模式生效）
 * 从 JWT 中提取 tenantId，自动注入到所有业务查询的 WHERE 条件中
 */
const { getDb } = require('../config/database');
const { isSaaS } = require('../config/index');

function tenantIsolation(req, res, next) {
  // 非 SaaS 模式直接放行
  if (!isSaaS) {
    return next();
  }

  const user = req.user;
  if (!user || !user.tenantId) {
    return res.status(401).json({ code: 401, message: '缺少租户信息', data: null });
  }

  req.tenantId = user.tenantId;

  // 验证租户是否存在且状态正常
  try {
    const db = getDb();
    const tenant = db.prepare('SELECT id, status, max_users, plan_id FROM tenants WHERE id = ?').get(user.tenantId);
    if (!tenant) {
      return res.status(403).json({ code: 403, message: '租户不存在', data: null });
    }
    if (tenant.status === 'suspended') {
      return res.status(403, json({ code: 403, message: '该租户已被停用', data: null }));
    }
    if (tenant.status === 'expired') {
      return res.status(403).json({ code: 403, message: '该租户已过期，请续费', data: null });
    }

    // 将租户信息挂载到请求上，供后续路由使用
    req.tenantInfo = tenant;
    next();
  } catch (err) {
    console.error('[TenantIsolation] 验证租户失败:', err);
    return res.status(500).json({ code: 500, message: '租户验证失败', data: null });
  }
}

/**
 * 辅助方法：为 SQL 查询添加 tenant_id 条件
 * @param {string} baseSQL - 基础 SQL 查询
 * @param {Array} params - 原参数数组
 * @returns {{ sql: string, params: Array }}
 */
function withTenantFilter(baseSQL, params = [], alias = '') {
  if (!isSaaS) {
    return { sql: baseSQL, params };
  }
  const col = alias ? `${alias}.tenant_id` : 'tenant_id';
  const filtered = baseSQL.replace(
    /^(SELECT\s+.*?\s+FROM\s+\w+)(\s+(WHERE|GROUP BY|ORDER BY|LIMIT|$))/i,
    `$1${baseSQL.match(/WHERE/i) ? '' : ` WHERE ${col} = ?`}$2`
  );
  if (filtered === baseSQL && !baseSQL.match(/WHERE/i)) {
    return { sql: `${baseSQL} WHERE ${col} = ?`, params };
  }
  if (baseSQL.match(/WHERE/i) && !baseSQL.includes('tenant_id')) {
    return { sql: baseSQL.replace(/WHERE/, `WHERE ${col} = ? AND`), params };
  }
  return { sql: baseSQL, params };
}

module.exports = { tenantIsolation, withTenantFilter };
