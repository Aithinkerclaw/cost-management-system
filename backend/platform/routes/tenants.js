/**
 * 租户管理路由（平台总后台核心模块）
 * CRUD + 统计 + 模拟登录
 */
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getDb } = require('../../config/database');
const { isSaaS } = require('../../config/index');
const { verifyPlatformToken } = require('./auth');
const { auditLog, logAction } = require('../../middleware/audit-log');
const { success, error } = require('../../utils/response');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'cost-mgmt-secret-key-2026';

// 全部接口都需要平台管理员认证
router.use(verifyPlatformToken);

// 租户列表（分页+搜索）
router.get('/', auditLog('tenant.list'), (req, res) => {
  const db = getDb();
  const { page = 1, pageSize = 10, keyword = '', status = '' } = req.query;
  const offset = (page - 1) * pageSize;

  let where = '1=1';
  const params = [];
  if (keyword) {
    where += ' AND (company_name LIKE ? OR short_name LIKE ? OR contact_person LIKE ?)';
    params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
  }
  if (status) {
    where += ' AND status = ?';
    params.push(status);
  }

  const total = db.prepare(`SELECT COUNT(*) as cnt FROM tenants WHERE ${where}`).get(...params).cnt;
  const list = db.prepare(`
    SELECT t.*, p.plan_name,
      (SELECT COUNT(*) FROM users WHERE tenant_id = t.id AND status = 1) as user_count
    FROM tenants t LEFT JOIN plans p ON t.plan_id = p.id
    WHERE ${where} ORDER BY t.created_at DESC LIMIT ? OFFSET ?
  `).all(...params, +pageSize, +offset);

  res.json(success({ total, list: list || [] }));
});

// 租户详情
router.get('/:id', auditLog('tenant.view'), (req, res) => {
  const db = getDb();
  const tenant = db.prepare(`
    SELECT t.*, p.plan_name, p.features
    FROM tenants t LEFT JOIN plans p ON t.plan_id = p.id WHERE t.id = ?
  `).get(req.params.id);

  if (!tenant) return res.json(error(404, '租户不存在'));

  // 统计数据
  const stats = {
    userCount: db.prepare('SELECT COUNT(*) as cnt FROM users WHERE tenant_id = ? AND status = 1').get(tenant.id).cnt,
    orderCount: db.prepare('SELECT COUNT(*) as cnt FROM orders WHERE tenant_id = ?').get(tenant.id).cnt,
    materialCount: db.prepare('SELECT COUNT(*) as cnt FROM materials WHERE tenant_id = ?').get(tenant.id).cnt,
    lastLogin: db.prepare('SELECT MAX(created_at) as last_login FROM users WHERE tenant_id = ?').get(tenant.id).last_login
  };

  res.json(success({ ...tenant, stats }));
});

// 新建租户
router.post('/', auditLog('tenant.create'), (req, res) => {
  const db = getDb();
  const { company_name, short_name, industry, contact_person, contact_phone, email, address, plan_id = 1, max_users = 3, notes } = req.body;
  if (!company_name) return res.json(error(400, '企业名称不能为空'));

  const tenant_code = `tenant_${Date.now().toString(36)}`;
  try {
    const result = db.prepare(`
      INSERT INTO tenants (tenant_code, company_name, short_name, industry, contact_person, contact_phone, email, address, plan_id, max_users, notes, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(tenant_code, company_name, short_name, industry, contact_person, contact_phone, email, address, plan_id, max_users, notes, req.platformUser.id);

    logAction(req.platformUser.id, req.platformUser.realName, 'tenant.create', 'tenant', result.lastInsertRowid, req.body);
    res.json(success({ id: result.lastInsertRowid }, '租户创建成功'));
  } catch (e) {
    if (e.message.includes('UNIQUE')) return res.json(error(409, '租户编码重复'));
    throw e;
  }
});

// 编辑租户
router.put('/:id', auditLog('tenant.update'), (req, res) => {
  const db = getDb();
  const tenant = db.prepare('SELECT id FROM tenants WHERE id = ?').get(req.params.id);
  if (!tenant) return res.json(error(404, '租户不存在'));

  const fields = ['company_name', 'short_name', 'industry', 'contact_person', 'contact_phone', 'email', 'address', 'plan_id', 'max_users', 'expire_date', 'notes'];
  const updates = [];
  const params = [];
  for (const f of fields) {
    if (req.body[f] !== undefined) { updates.push(`${f} = ?`); params.push(req.body[f]); }}
  if (updates.length === 0) return res.json(error(400, '没有要更新的字段'));
  params.push(req.params.id);

  db.prepare(`UPDATE tenants SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(...params);
  logAction(req.platformUser.id, req.platformUser.realName, 'tenant.update', 'tenant', req.params.id, req.body);
  res.json(success(null, '更新成功'));
});

// 停用/启用租户
router.patch('/:id/status', auditLog('tenant.toggleStatus'), (req, res) => {
  const db = getDb();
  const { status } = req.body;
  if (!['active', 'suspended', 'expired'].includes(status)) return res.json(error(400, '无效的状态值'));

  db.prepare('UPDATE tenants SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
    .run(status, req.params.id);
  logAction(req.platformUser.id, req.platformUser.realName, `tenant.${status}`, 'tenant', req.params.id, { newStatus: status });
  res.json(success(null, `已${status === 'active' ? '启用' : '停用'}`));
});

// 删除租户
router.delete('/:id', auditLog('tenant.delete'), (req, res) => {
  const db = getDb();
  const tenant = db.prepare('SELECT * FROM tenants WHERE id = ?').get(req.params.id);
  if (!tenant) return res.json(error(404, '租户不存在'));

  // 删除关联数据（级联）
  db.prepare('DELETE FROM users WHERE tenant_id = ?').run(req.params.id);
  db.prepare('DELETE FROM orders WHERE tenant_id = ?').run(req.params.id);
  db.prepare('DELETE FROM materials WHERE tenant_id = ?').run(req.params.id);
  db.prepare('DELETE FROM suppliers WHERE tenant_id = ?').run(req.params.id);
  db.prepare('DELETE FROM products WHERE tenant_id = ?').run(req.params.id);
  db.prepare('DELETE FROM tenants WHERE id = ?').run(req.params.id);

  logAction(req.platformUser.id, req.platformUser.realName, 'tenant.delete', 'tenant', req.params.id, { companyName: tenant.company_name });
  res.json(success(null, '租户及所有数据已删除'));
});

// 模拟登录：以租户管理员身份获取临时 Token
router.post('/:id/login-as', auditLog('tenant.loginAs'), (req, res) => {
  const db = getDb();
  const tenant = db.prepare('SELECT * FROM tenants WHERE id = ?').get(req.params.id);
  if (!tenant) return res.json(error(404, '租户不存在'));

  // 找到该租户的管理员账号（owner 或 super_admin 角色）
  const adminUser = db.prepare("SELECT * FROM users WHERE tenant_id = ? AND role_code IN ('owner', 'super_admin') AND status = 1 LIMIT 1")
    .get(req.params.id);
  if (!adminUser) return res.json(error(404, '该租户没有可用的管理员账号'));

  // 生成临时 Token（有效期1小时）
  const token = jwt.sign(
    { id: adminUser.id, username: adminUser.username, roleCode: adminUser.role_code, tenantId: tenant.id },
    JWT_SECRET,
    { expiresIn: '1h' }
  );

  logAction(req.platformUser.id, req.platformUser.realName, 'tenant.loginAs', 'tenant', req.params.id, { targetUser: adminUser.username });
  res.json(success({ token, targetUser: adminUser.username, expiresIn: '1h' }, '模拟登录成功，有效期1小时'));
});

// 获取租户统计数据概览
router.get('/:id/stats', (req, res) => {
  const db = getDb();
  const tid = req.params.id;

  const stats = {
    users: {
      total: db.prepare('SELECT COUNT(*) as cnt FROM users WHERE tenant_id = ?').get(tid).cnt,
      active: db.prepare("SELECT COUNT(*) as cnt FROM users WHERE tenant_id = ? AND status = 1").get(tid).cnt
    },
    orders: {
      total: db.prepare('SELECT COUNT(*) as cnt FROM orders WHERE tenant_id = ?').get(tid).cnt,
      completed: db.prepare("SELECT COUNT(*) as cnt FROM orders WHERE tenant_id = ? AND status='completed'").get(tid).cnt
    },
    materials: db.prepare('SELECT COUNT(*) as cnt FROM materials WHERE tenant_id = ?').get(tid).cnt,
    suppliers: db.prepare('SELECT COUNT(*) as cnt FROM suppliers WHERE tenant_id = ?').get(tid).cnt,
    proposals: db.prepare('SELECT COUNT(*) as cnt FROM improvement_proposals WHERE tenant_id = ?').get(tid).cnt,
    lastActivity: db.prepare('SELECT MAX(created_at) as last FROM users WHERE tenant_id = ?').get(tid).last
  };

  res.json(success(stats));
});

module.exports = router;
