const express = require('express');
const { getDb, isSaaS } = require('../config/database');
const { verifyToken, requirePermission, loadPermissions } = require('../middleware/auth');
const { tenantIsolation } = require('../middleware/tenant');
const { success, error } = require('../utils/response');

const router = express.Router();

// 获取角色列表
router.get('/', verifyToken, tenantIsolation, requirePermission('system'), (req, res) => {
  const db = getDb();
  // 角色通常是平台级共享数据（所有租户使用同一套角色定义）
  // 但 SaaS 模式下如果 roles 表有 tenant_id 字段，需要限定本租户可见的角色
  let sql = `
    SELECT r.*,
           GROUP_CONCAT(rp.module_code || ':' || rp.access_level) as permissions_str
    FROM roles r
    LEFT JOIN role_permissions rp ON r.role_code = rp.role_code
    WHERE r.status = 1
  `;
  const params = [];
  // roles 表没有 tenant_id 列（角色是平台级共享），SaaS 模式下不做租户过滤
  sql += ` GROUP BY r.id ORDER BY r.sort_order ASC`;

  const roles = db.prepare(sql).all(...params);

  // 转换权限字符串为对象
  const result = roles.map(role => {
    const permissions = {};
    if (role.permissions_str) {
      role.permissions_str.split(',').forEach(item => {
        const [moduleCode, accessLevel] = item.split(':');
        permissions[moduleCode] = accessLevel;
      });
    }
    return {
      id: role.id,
      roleCode: role.role_code,
      roleName: role.role_name,
      description: role.description,
      isSystem: role.is_system,
      sortOrder: role.sort_order,
      permissions
    };
  });

  res.json(success(result));
});

// 获取当前用户权限
router.get('/my-permissions', verifyToken, (req, res) => {
  const permissions = loadPermissions(req.user.roleCode);
  res.json(success({
    roleCode: req.user.roleCode,
    permissions
  }));
});

module.exports = router;
