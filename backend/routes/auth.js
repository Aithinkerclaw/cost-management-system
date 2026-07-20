const express = require('express');
const bcrypt = require('bcryptjs');
const { getDb } = require('../config/database');
const { generateToken, verifyToken, loadPermissions, getRoleName } = require('../middleware/auth');
const { isSaaS } = require('../config/index');
const { success, error } = require('../utils/response');

const router = express.Router();

// ====== 租户用户登录 ======
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.json(error(400, '用户名和密码不能为空'));
  }

  const db = getDb();
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);

  if (!user) {
    return res.json(error(401, '用户名或密码错误'));
  }
  if (user.status !== 1) {
    return res.json(error(403, '账号已被禁用，请联系管理员'));
  }

  // SaaS 模式：验证租户状态
  let tenantInfo = null;
  if (isSaaS) {
    const tid = user.tenant_id;
    if (tid) {
      tenantInfo = db.prepare('SELECT id, company_name, status, plan_id, max_users FROM tenants WHERE id = ?').get(tid);
      if (!tenantInfo) return res.json(error(403, '关联租户不存在'));
      if (tenantInfo.status === 'suspended') return res.json(error(403, '该企业账号已被停用，请联系平台客服'));
      if (tenantInfo.status === 'expired') return res.json(error(403, '该企业账号已过期，请联系管理员续费'));

      // 检查用户数配额
      if (tenantInfo.max_users && tenantInfo.max_users > 0) {
        const userCount = db.prepare('SELECT COUNT(*) as cnt FROM users WHERE tenant_id = ? AND status = 1').get(tid).cnt;
        if (userCount >= tenantInfo.max_users) {
          // 已有用户可以登录，新用户不行（在创建时检查更合理）
        }
      }
    }
  }

  const valid = bcrypt.compareSync(password, user.password_hash);
  if (!valid) {
    return res.json(error(401, '用户名或密码错误'));
  }

  const roleCode = user.role_code || user.role || 'staff';
  const roleName = getRoleName(roleCode);
  const permissions = loadPermissions(roleCode);

  // 构造 JWT payload
  const payload = {
    id: user.id,
    username: user.username,
    roleCode: roleCode
  };
  if (isSaaS && user.tenant_id) {
    payload.tenantId = user.tenant_id;
    payload.tenantCode = tenantInfo?.id ? `tenant_${String(tenantInfo.id).padStart(4, '0')}` : null;
  }

  const token = generateToken(payload);

  res.json(success({
    token,
    user: {
      id: user.id,
      username: user.username,
      realName: user.real_name,
      roleCode: roleCode,
      roleName: roleName,
      department: user.department,
      phone: user.phone,
      avatarUrl: user.avatar_url,
      permissions: permissions,
      ...(isSaaS ? {
        tenantId: user.tenant_id,
        tenantName: tenantInfo?.company_name || null
      } : {})
    }
  }, '登录成功'));
});

// 获取当前用户信息
router.get('/profile', verifyToken, (req, res) => {
  const db = getDb();
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);

  if (!user) {
    return res.json(error(404, '用户不存在'));
  }

  const roleCode = user.role_code || user.role || 'staff';
  const roleName = getRoleName(roleCode);
  const permissions = loadPermissions(roleCode);

  res.json(success({
    id: user.id,
    username: user.username,
    realName: user.real_name,
    roleCode: roleCode,
    roleName: roleName,
    department: user.department,
    phone: user.phone,
    avatarUrl: user.avatar_url,
    status: user.status,
    permissions: permissions,
    ...(isSaaS ? { tenantId: user.tenant_id } : {})
  }));
});

// 修改密码
router.put('/change-password', verifyToken, (req, res) => {
  const { oldPassword, newPassword } = req.body;
  if (!oldPassword || !newPassword) {
    return res.json(error(400, '请输入旧密码和新密码'));
  }
  if (newPassword.length < 6) {
    return res.json(error(400, '新密码长度不能少于6位'));
  }

  const db = getDb();
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  if (!user) {
    return res.json(error(404, '用户不存在'));
  }

  const valid = bcrypt.compareSync(oldPassword, user.password_hash);
  if (!valid) {
    return res.json(error(401, '旧密码错误'));
  }

  const hash = bcrypt.hashSync(newPassword, 10);
  db.prepare('UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
    .run(hash, req.user.id);

  res.json(success(null, '密码修改成功'));
});

module.exports = router;
