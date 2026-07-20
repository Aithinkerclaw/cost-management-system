/**
 * 操作日志查询路由
 */
const express = require('express');
const { getDb } = require('../../config/database');
const { isSaaS } = require('../../config/index');
const { verifyPlatformToken } = require('./auth');
const { success, error } = require('../../utils/response');

const router = express.Router();
router.use(verifyPlatformToken);

// 查询操作日志（分页+筛选）
router.get('/', (req, res) => {
  if (!isSaaS) return res.json(error(403, '当前非 SaaS 模式'));
  const db = getDb();
  const { page = 1, pageSize = 20, action = '', operatorName = '', startDate = '' } = req.query;
  const offset = (page - 1) * pageSize;

  let where = '1=1';
  const params = [];
  if (action) { where += " AND action LIKE ?"; params.push(`%${action}%`); }
  if (operatorName) { where += " AND operator_name LIKE ?"; params.push(`%${operatorName}%`); }
  if (startDate) { where += " AND created_at >= ?"; params.push(startDate); }

  const total = db.prepare(`SELECT COUNT(*) as cnt FROM audit_logs WHERE ${where}`).get(...params).cnt;
  const list = db.prepare(`
    SELECT id, operator_id, operator_name, action, target_type, target_id,
      substr(detail, 1, 200) as detail_short, ip, created_at
    FROM audit_logs WHERE ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?
  `).all(...params, +pageSize, +offset);

  res.json(success({ total, list: list || [] }));
});

module.exports = router;
