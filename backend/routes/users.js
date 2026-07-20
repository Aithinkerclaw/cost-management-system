const express = require('express');
const bcrypt = require('bcryptjs');
const { getDb, isSaaS } = require('../config/database');
const { verifyToken, requirePermission, invalidatePermissionCache } = require('../middleware/auth');
const { tenantIsolation } = require('../middleware/tenant');
const { success, error } = require('../utils/response');

const router = express.Router();

// 获取用户列表
router.get('/', verifyToken, tenantIsolation, requirePermission('system'), (req, res) => {
  const db = getDb();
  const { keyword = '', roleCode = '', page = 1, pageSize = 20 } = req.query;
  const offset = (page - 1) * pageSize;

  let where = 'WHERE 1=1';
  const params = [];

  if (isSaaS) {
    where += ' AND u.tenant_id = ?';
    params.push(req.tenantId);
  }
  if (keyword) {
    where += ' AND (u.username LIKE ? OR u.real_name LIKE ? OR u.department LIKE ?)';
    params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
  }
  if (roleCode) {
    where += ' AND u.role_code = ?';
    params.push(roleCode);
  }

  const total = db.prepare(`SELECT COUNT(*) as count FROM users u ${where}`).get(...params).count;
  const users = db.prepare(`
    SELECT u.id, u.username, u.real_name, u.role_code, u.department, u.phone, u.status, u.created_at, u.updated_at,
           COALESCE(r.role_name, u.role_code) as role_name
    FROM users u
    LEFT JOIN roles r ON u.role_code = r.role_code
    ${where}
    ORDER BY u.id ASC
    LIMIT ? OFFSET ?
  `).all(...params, pageSize, offset);

  res.json(success({
    list: users,
    total,
    page: +page,
    pageSize: +pageSize
  }));
});

// 新增用户
router.post('/', verifyToken, tenantIsolation, requirePermission('system', 'full'), (req, res) => {
  const { username, password, realName, roleCode, department, phone } = req.body;

  if (!username || !password || !realName || !roleCode) {
    return res.json(error(400, '用户名、密码、姓名和角色为必填项'));
  }
  if (password.length < 6) {
    return res.json(error(400, '密码长度不能少于6位'));
  }

  const db = getDb();

  // 检查用户名是否已存在（SaaS 模式限定同租户内唯一）
  let existingSql = 'SELECT id FROM users WHERE username = ?';
  let existingParams = [username];
  if (isSaaS) {
    existingSql += ' AND tenant_id = ?';
    existingParams.push(req.tenantId);
  }
  const existing = db.prepare(existingSql).get(...existingParams);
  if (existing) {
    return res.json(error(409, '用户名已存在'));
  }

  // 检查角色是否存在
  const role = db.prepare('SELECT role_code FROM roles WHERE role_code = ? AND status = 1').get(roleCode);
  if (!role) {
    return res.json(error(400, '无效的角色代码'));
  }

  const hash = bcrypt.hashSync(password, 10);
  let insertSql, insertParams;
  if (isSaaS) {
    insertSql = 'INSERT INTO users (username, password_hash, real_name, role, role_code, department, phone, tenant_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
    insertParams = [username, hash, realName, roleCode, roleCode, department || '', phone || '', req.tenantId];
  } else {
    insertSql = 'INSERT INTO users (username, password_hash, real_name, role, role_code, department, phone) VALUES (?, ?, ?, ?, ?, ?, ?)';
    insertParams = [username, hash, realName, roleCode, roleCode, department || '', phone || ''];
  }
  const result = db.prepare(insertSql).run(...insertParams);

  res.json(success({ id: result.lastInsertRowid }, '用户创建成功'));
});

// 编辑用户
router.put('/:id', verifyToken, tenantIsolation, requirePermission('system', 'full'), (req, res) => {
  const { id } = req.params;
  const { realName, roleCode, department, phone } = req.body;

  const db = getDb();
  let userSql = 'SELECT * FROM users WHERE id = ?';
  let userParams = [id];
  if (isSaaS) {
    userSql += ' AND tenant_id = ?';
    userParams.push(req.tenantId);
  }
  const user = db.prepare(userSql).get(...userParams);
  if (!user) {
    return res.json(error(404, '用户不存在'));
  }

  // 不能禁用自己
  if (+id === req.user.id && roleCode && roleCode !== user.role_code) {
    return res.json(error(400, '不能修改自己的角色'));
  }

  if (roleCode) {
    const role = db.prepare('SELECT role_code FROM roles WHERE role_code = ? AND status = 1').get(roleCode);
    if (!role) {
      return res.json(error(400, '无效的角色代码'));
    }
  }

  const newRoleCode = roleCode || user.role_code;
  db.prepare(
    'UPDATE users SET real_name = ?, role_code = ?, role = ?, department = ?, phone = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
  ).run(
    realName || user.real_name,
    newRoleCode,
    newRoleCode,
    department !== undefined ? department : user.department,
    phone !== undefined ? phone : user.phone,
    id
  );

  // 使权限缓存失效
  invalidatePermissionCache(newRoleCode);
  if (newRoleCode !== user.role_code) {
    invalidatePermissionCache(user.role_code);
  }

  res.json(success(null, '用户信息更新成功'));
});

// 启用/禁用用户
router.patch('/:id/status', verifyToken, tenantIsolation, requirePermission('system', 'full'), (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (+id === req.user.id) {
    return res.json(error(400, '不能禁用自己'));
  }

  const db = getDb();
  let userSql = 'SELECT * FROM users WHERE id = ?';
  let userParams = [id];
  if (isSaaS) {
    userSql += ' AND tenant_id = ?';
    userParams.push(req.tenantId);
  }
  const user = db.prepare(userSql).get(...userParams);
  if (!user) {
    return res.json(error(404, '用户不存在'));
  }

  let updateSql = 'UPDATE users SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
  let updateParams = [status !== undefined ? status : (user.status === 1 ? 0 : 1), id];
  if (isSaaS) {
    updateSql += ' AND tenant_id = ?';
    updateParams.push(req.tenantId);
  }
  db.prepare(updateSql).run(...updateParams);

  res.json(success(null, status === 1 ? '用户已启用' : '用户已禁用'));
});

// 重置密码
router.put('/:id/password', verifyToken, tenantIsolation, requirePermission('system', 'full'), (req, res) => {
  const { id } = req.params;
  const { newPassword } = req.body;

  if (!newPassword || newPassword.length < 6) {
    return res.json(error(400, '新密码长度不能少于6位'));
  }

  const db = getDb();
  let userSql = 'SELECT * FROM users WHERE id = ?';
  let userParams = [id];
  if (isSaaS) {
    userSql += ' AND tenant_id = ?';
    userParams.push(req.tenantId);
  }
  const user = db.prepare(userSql).get(...userParams);
  if (!user) {
    return res.json(error(404, '用户不存在'));
  }

  const hash = bcrypt.hashSync(newPassword, 10);
  let updateSql = 'UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
  let updateParams = [hash, id];
  if (isSaaS) {
    updateSql += ' AND tenant_id = ?';
    updateParams.push(req.tenantId);
  }
  db.prepare(updateSql).run(...updateParams);

  res.json(success(null, '密码重置成功'));
});

// 删除用户
router.delete('/:id', verifyToken, tenantIsolation, requirePermission('system', 'full'), (req, res) => {
  const { id } = req.params;

  if (+id === req.user.id) {
    return res.json(error(400, '不能删除自己'));
  }

  const db = getDb();
  let userSql = 'SELECT * FROM users WHERE id = ?';
  let userParams = [id];
  if (isSaaS) {
    userSql += ' AND tenant_id = ?';
    userParams.push(req.tenantId);
  }
  const user = db.prepare(userSql).get(...userParams);
  if (!user) {
    return res.json(error(404, '用户不存在'));
  }

  let deleteSql = 'DELETE FROM users WHERE id = ?';
  let deleteParams = [id];
  if (isSaaS) {
    deleteSql += ' AND tenant_id = ?';
    deleteParams.push(req.tenantId);
  }
  db.prepare(deleteSql).run(...deleteParams);
  res.json(success(null, '用户已删除'));
});

module.exports = router;
