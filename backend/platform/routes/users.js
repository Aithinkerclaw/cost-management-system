/**
 * 平台用户管理路由
 */
const express = require('express');
const bcrypt = require('bcryptjs');
const { getDb } = require('../../config/database');
const { isSaaS } = require('../../config/index');
const { verifyPlatformToken } = require('./auth');
const { auditLog } = require('../../middleware/audit-log');
const { success, error } = require('../../utils/response');

const router = express.Router();
router.use(verifyPlatformToken);

// 列表
router.get('/', (req, res) => {
  if (!isSaaS) return res.json(error(403, '当前非 SaaS 模式'));
  const db = getDb();
  const list = db.prepare(`
    SELECT id, username, real_name, role, phone, last_login_at, last_login_ip, status, created_at
    FROM platform_users ORDER BY id ASC
  `).all();
  res.json(success(list || []));
});

// 创建平台用户
router.post('/', auditLog('platformUser.create'), (req, res) => {
  const { username, password, real_name, role = 'staff', phone } = req.body;
  if (!username || !password || !real_name) return res.json(error(400, '用户名、密码、姓名不能为空'));

  const db = getDb();
  try {
    db.prepare('INSERT INTO platform_users (username, password_hash, real_name, role, phone) VALUES (?,?,?,?,?)')
      .run(username, bcrypt.hashSync(password, 10), real_name, role, phone);
    res.json(success(null, '创建成功'));
  } catch (e) {
    if (e.message.includes('UNIQUE')) return res.json(error(409, '用户名已存在'));
    throw e;
  }
});

// 更新
router.put('/:id', auditLog('platformUser.update'), (req, res) => {
  const db = getDb();
  const user = db.prepare('SELECT id FROM platform_users WHERE id = ?').get(req.params.id);
  if (!user) return res.json(error(404, '用户不存在'));

  const updates = [];
  const params = [];
  if (req.body.real_name !== undefined) { updates.push('real_name = ?'); params.push(req.body.real_name); }
  if (req.body.role !== undefined) { updates.push('role = ?'); params.push(req.body.role); }
  if (req.body.phone !== undefined) { updates.push('phone = ?'); params.push(req.body.phone); }
  if (req.body.status !== undefined) { updates.push('status = ?'); params.push(req.body.status); }
  if (req.body.password) { updates.push('password_hash = ?'); params.push(bcrypt.hashSync(req.body.password, 10)); }

  if (updates.length === 0) return res.json(error(400, '没有要更新的字段'));
  params.push(req.params.id);
  db.prepare(`UPDATE platform_users SET ${updates.join(', ')} WHERE id = ?`).run(...params);
  res.json(success(null, '更新成功'));
});

module.exports = router;
