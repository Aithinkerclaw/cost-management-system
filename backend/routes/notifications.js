const express = require('express');
const { getDb, isSaaS } = require('../config/database');
const { success, error } = require('../utils/response');
const { verifyToken, requirePermission } = require('../middleware/auth');
const { tenantIsolation } = require('../middleware/tenant');

const router = express.Router();

// 获取通知列表
router.get('/list', verifyToken, tenantIsolation, requirePermission('dashboard'), (req, res) => {
  const db = getDb();
  const tenantId = req.tenantId;
  const userId = req.user.id;
  const page = parseInt(req.query.page) || 1;
  const pageSize = parseInt(req.query.pageSize) || 20;
  const offset = (page - 1) * pageSize;

  let sql = `
    SELECT * FROM notifications
    WHERE user_id = ?
  `;
  const params = [userId];

  if (isSaaS) {
    sql += ` AND tenant_id = ?`;
    params.push(tenantId);
  }

  sql += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
  params.push(pageSize, offset);

  const list = db.prepare(sql).all(...params);
  const total = db.prepare(`
    SELECT COUNT(*) as total FROM notifications WHERE user_id = ?
  `, [userId]).total;

  res.json(success({
    list,
    total,
    page,
    pageSize,
    unreadCount: list.filter(n => n.is_read === 0).length
  }));
});

// 标记已读
router.post('/read/:id', verifyToken, tenantIsolation, requirePermission('dashboard'), (req, res) => {
  const db = getDb();
  const tenantId = req.tenantId;
  const userId = req.user.id;
  const notificationId = req.params.id;

  let sql = `UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?`;
  const params = [notificationId, userId];

  if (isSaaS) {
    sql += ` AND tenant_id = ?`;
    params.push(tenantId);
  }

  db.prepare(sql).run(...params);
  res.json(success(null, '标记已读'));
});

// 全部标记已读
router.post('/read-all', verifyToken, tenantIsolation, requirePermission('dashboard'), (req, res) => {
  const db = getDb();
  const tenantId = req.tenantId;
  const userId = req.user.id;

  let sql = `UPDATE notifications SET is_read = 1 WHERE user_id = ?`;
  const params = [userId];

  if (isSaaS) {
    sql += ` AND tenant_id = ?`;
    params.push(tenantId);
  }

  db.prepare(sql).run(...params);
  res.json(success(null, '全部标记已读'));
});

// 创建通知（内部调用，供其他模块使用）
function createNotification(db, userId, type, title, content, tenantId = 1) {
  try {
    db.prepare(`
      INSERT INTO notifications (user_id, type, title, content, tenant_id)
      VALUES (?, ?, ?, ?, ?)
    `).run(userId, type, title, content, tenantId);
    return true;
  } catch (err) {
    console.error('创建通知失败:', err.message);
    return false;
  }
}

module.exports = { router, createNotification };
