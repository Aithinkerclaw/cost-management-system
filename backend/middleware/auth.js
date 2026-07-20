const jwt = require('jsonwebtoken');
const { getDb } = require('../config/database');

const JWT_SECRET = process.env.JWT_SECRET || 'cost-mgmt-secret-key-2026';
const JWT_EXPIRES_IN = '24h';

// 权限缓存: role_code -> { module_code: access_level }
const PERMISSION_CACHE = new Map();

function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ code: 401, message: '未提供认证Token', data: null });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ code: 401, message: 'Token已过期或无效', data: null });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ code: 401, message: '未登录', data: null });
    }
    if (!roles.includes(req.user.roleCode)) {
      return res.status(403).json({ code: 403, message: '权限不足', data: null });
    }
    next();
  };
}

/**
 * 加载角色权限（带缓存）
 */
function loadPermissions(roleCode) {
  if (PERMISSION_CACHE.has(roleCode)) {
    return PERMISSION_CACHE.get(roleCode);
  }
  try {
    const db = getDb();
    const perms = db.prepare(
      'SELECT module_code, access_level FROM role_permissions WHERE role_code = ?'
    ).all(roleCode);
    const map = {};
    perms.forEach(p => { map[p.module_code] = p.access_level; });
    PERMISSION_CACHE.set(roleCode, map);
    return map;
  } catch (err) {
    // 数据库未初始化或表不存在时返回空权限
    return {};
  }
}

/**
 * 获取角色名称
 */
function getRoleName(roleCode) {
  try {
    const db = getDb();
    const role = db.prepare('SELECT role_name FROM roles WHERE role_code = ?').get(roleCode);
    return role ? role.role_name : roleCode;
  } catch (err) {
    return roleCode;
  }
}

/**
 * 权限检查中间件
 * @param {string} moduleCode - 模块代码 (dashboard, cost, procurement, inventory, production, quality, incentive, system)
 * @param {string} requiredLevel - 所需权限级别: 'read' 或 'full'
 */
function requirePermission(moduleCode, requiredLevel = 'read') {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ code: 401, message: '未登录', data: null });
    }
    const perms = loadPermissions(req.user.roleCode);
    const level = perms[moduleCode] || 'none';

    if (level === 'none') {
      return res.status(403).json({ code: 403, message: '您没有访问该模块的权限', data: null });
    }
    if (level === 'read' && requiredLevel === 'full') {
      return res.status(403).json({ code: 403, message: '您只有查看权限，无法执行此操作', data: null });
    }
    next();
  };
}

/**
 * 使权限缓存失效
 */
function invalidatePermissionCache(roleCode) {
  if (roleCode) {
    PERMISSION_CACHE.delete(roleCode);
  } else {
    PERMISSION_CACHE.clear();
  }
}

module.exports = {
  generateToken,
  verifyToken,
  requireRole,
  requirePermission,
  loadPermissions,
  getRoleName,
  invalidatePermissionCache,
  JWT_SECRET
};
