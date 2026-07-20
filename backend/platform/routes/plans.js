/**
 * 套餐管理路由
 */
const express = require('express');
const { getDb } = require('../../config/database');
const { isSaaS } = require('../../config/index');
const { verifyPlatformToken } = require('./auth');
const { auditLog, logAction } = require('../../middleware/audit-log');
const { success, error } = require('../../utils/response');

const router = express.Router();
router.use(verifyPlatformToken);

// 套餐列表
router.get('/', (req, res) => {
  if (!isSaaS) return res.json(error(403, '当前非 SaaS 模式'));
  const db = getDb();
  const list = db.prepare('SELECT * FROM plans WHERE status = 1 ORDER BY sort_order ASC').all();
  res.json(success(list));
});

// 套餐详情
router.get('/:id', (req, res) => {
  const db = getDb();
  const plan = db.prepare('SELECT * FROM plans WHERE id = ?').get(req.params.id);
  if (!plan) return res.json(error(404, '套餐不存在'));
  // 解析 features JSON
  plan.featuresObj = typeof plan.features === 'string' ? JSON.parse(plan.features || '{}') : (plan.features || {});
  res.json(success(plan));
});

// 创建/更新套餐（系统内置的 free/pro/enterprise 通过 seed 初始化，这里允许修改价格等）
router.put('/:id', auditLog('plan.update'), (req, res) => {
  const db = getDb();
  const exists = db.prepare('SELECT id FROM plans WHERE id = ?').get(req.params.id);
  if (!exists) return res.json(error(404, '套餐不存在'));

  const allowedFields = ['plan_name', 'price_monthly', 'price_yearly', 'max_users', 'data_retention_days', 'features', 'sort_order'];
  const updates = [];
  const params = [];
  for (const f of allowedFields) {
    if (req.body[f] !== undefined) {
      updates.push(`${f} = ?`);
      params.push(typeof req.body[f] === 'object' ? JSON.stringify(req.body[f]) : req.body[f]);
    }
  }
  if (updates.length === 0) return res.json(error(400, '没有要更新的字段'));
  params.push(req.params.id);

  db.prepare(`UPDATE plans SET ${updates.join(', ')} WHERE id = ?`).run(...params);
  res.json(success(null, '套餐更新成功'));
});

module.exports = router;
