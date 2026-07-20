/**
 * 平台管理员认证路由
 * 独立于租户用户认证体系
 */
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getDb } = require('../../config/database');
const { isSaaS } = require('../../config/index');
const { success, error } = require('../../utils/response');

const router = express.Router();
const PLATFORM_JWT_SECRET = process.env.JWT_SECRET ? process.env.JWT_SECRET + '-platform' : 'cost-mgmt-platform-secret-2026';
const PLATFORM_JWT_EXPIRES_IN = '24h';

function generatePlatformToken(payload) {
  return jwt.sign(payload, PLATFORM_JWT_SECRET, { expiresIn: PLATFORM_JWT_EXPIRES_IN });
}

function verifyPlatformToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ code: 401, message: '未提供认证Token', data: null });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, PLATFORM_JWT_SECRET);
    req.platformUser = decoded;

    // 验证平台用户仍然存在且有效
    const db = getDb();
    const user = db.prepare('SELECT * FROM platform_users WHERE id = ? AND status = 1').get(decoded.id);
    if (!user) {
      return res.status(401).json({ code: 401, message: '平台账号不存在或已被禁用', data: null });
    }

    // 更新最后登录
    db.prepare('UPDATE platform_users SET last_login_at = ?, last_login_ip = ? WHERE id = ?')
      .run(new Date().toISOString(), req.ip || '', decoded.id);

    next();
  } catch (err) {
    return res.status(401).json({ code: 401, message: 'Token已过期或无效', data: null });
  }
}

// 平台管理员登录
router.post('/login', (req, res) => {
  if (!isSaaS) return res.json(error(403, '当前非 SaaS 模式'));

  const { username, password } = req.body;
  if (!username || !password) return res.json(error(400, '用户名和密码不能为空'));

  const db = getDb();
  const user = db.prepare('SELECT * FROM platform_users WHERE username = ?').get(username);
  if (!user) return res.json(error(401, '用户名或密码错误'));
  if (user.status !== 1) return res.json(error(403, '账号已被禁用'));

  if (!bcrypt.compareSync(password, user.password_hash)) {
    return res.json(error(401, '用户名或密码错误'));
  }

  const token = generatePlatformToken({
    id: user.id,
    username: user.username,
    realName: user.real_name,
    role: user.role
  });

  res.json(success({
    token,
    user: { id: user.id, username: user.username, realName: user.real_name, role: user.role }
  }, '登录成功'));
});

// 获取平台管理员信息
router.get('/profile', verifyPlatformToken, (req, res) => {
  res.json(success(req.platformUser));
});

// 修改密码
router.put('/change-password', verifyPlatformToken, (req, res) => {
  const { oldPassword, newPassword } = req.body;
  if (!oldPassword || !newPassword) return res.json(error(400, '请输入完整信息'));
  if (newPassword.length < 6) return res.json(error(400, '新密码长度不能少于6位'));

  const db = getDb();
  const user = db.prepare('SELECT * FROM platform_users WHERE id = ?').get(req.platformUser.id);
  if (!user) return res.json(error(404, '账号不存在'));
  if (!bcrypt.compareSync(oldPassword, user.password_hash)) return res.json(error(401, '旧密码错误'));

  db.prepare('UPDATE platform_users SET password_hash = ? WHERE id = ?')
    .run(bcrypt.hashSync(newPassword, 10), req.platformUser.id);

  res.json(success(null, '密码修改成功'));
});

// 导出验证方法供其他平台路由使用
module.exports = { router, verifyPlatformToken };
