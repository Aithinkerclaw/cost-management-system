const express = require('express');
const { getDb } = require('../config/database');
const { success, error } = require('../utils/response');
const { verifyToken, requirePermission } = require('../middleware/auth');

const router = express.Router();

// 获取成本估算列表
router.get('/list', verifyToken, requirePermission('cost_estimate'), (req, res) => {
  const db = getDb();
  const { project_name, estimate_method, status, page = 1, limit = 20 } = req.query;
  
  let sql = 'SELECT ce.*, u.real_name as estimatorName FROM cost_estimates ce LEFT JOIN users u ON ce.estimator_id = u.id WHERE 1=1';
  const params = [];
  
  if (project_name) {
    sql += ' AND ce.project_name LIKE ?';
    params.push(`%${project_name}%`);
  }
  if (estimate_method) {
    sql += ' AND ce.estimate_method = ?';
    params.push(estimate_method);
  }
  if (status) {
    sql += ' AND ce.status = ?';
    params.push(status);
  }
  sql += ' ORDER BY ce.created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));
  
  const list = db.prepare(sql).all(...params);
  res.json(success(list));
});

// 获取单个成本估算
router.get('/:id', verifyToken, requirePermission('cost_estimate'), (req, res) => {
  const db = getDb();
  const item = db.prepare('SELECT * FROM cost_estimates WHERE id = ?').get(req.params.id);
  if (!item) return res.json(error('估算记录不存在'));
  res.json(success(item));
});

// 创建成本估算（三种方法）
router.post('/create', verifyToken, requirePermission('cost_estimate', 'edit'), (req, res) => {
  const db = getDb();
  const { project_name, estimate_method, estimated_cost, accuracy_rate, estimate_details } = req.body;
  
  if (!project_name || !estimate_method || !estimated_cost) {
    return res.json(error('项目名称、估算方法和估算成本不能为空'));
  }
  
  // 生成估算编号
  const estimate_no = `EST-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
  
  const result = db.prepare(`
    INSERT INTO cost_estimates (estimate_no, project_name, estimate_method, estimated_cost, accuracy_rate, estimate_date, estimator_id, status)
    VALUES (?, ?, ?, ?, ?, DATE('now'), ?, 'draft')
  `).run(estimate_no, project_name, estimate_method, estimated_cost, accuracy_rate || 10, req.user.id);
  
  // 如果有关联的估算明细（类比/参数/自下而上），保存到单独表
  if (estimate_details && Array.isArray(estimate_details)) {
    const insertDetail = db.prepare('INSERT INTO cost_estimate_details (estimate_id, item_name, quantity, unit_price, total_price) VALUES (?, ?, ?, ?, ?)');
    for (const detail of estimate_details) {
      insertDetail.run(result.lastInsertRowid, detail.item_name, detail.quantity, detail.unit_price, detail.quantity * detail.unit_price);
    }
  }
  
  res.json(success({ id: result.lastInsertRowid, estimate_no }));
});

// 更新成本估算
router.put('/:id', verifyToken, requirePermission('cost_estimate', 'edit'), (req, res) => {
  const db = getDb();
  const { project_name, estimate_method, estimated_cost, accuracy_rate, status } = req.body;
  
  db.prepare(`
    UPDATE cost_estimates SET project_name = ?, estimate_method = ?, estimated_cost = ?, accuracy_rate = ?, status = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(project_name, estimate_method, estimated_cost, accuracy_rate, status, req.params.id);
  
  res.json(success());
});

// 提交审批
router.post('/:id/submit', verifyToken, requirePermission('cost_estimate', 'edit'), (req, res) => {
  const db = getDb();
  db.prepare("UPDATE cost_estimates SET status = 'submitted', updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(req.params.id);
  res.json(success());
});

// 审批通过
router.post('/:id/approve', verifyToken, requirePermission('cost_estimate', 'approve'), (req, res) => {
  const db = getDb();
  db.prepare("UPDATE cost_estimates SET status = 'approved', updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(req.params.id);
  res.json(success());
});

// 删除成本估算
router.delete('/:id', verifyToken, requirePermission('cost_estimate', 'delete'), (req, res) => {
  const db = getDb();
  db.prepare('DELETE FROM cost_estimates WHERE id = ?').run(req.params.id);
  db.prepare('DELETE FROM cost_estimate_details WHERE estimate_id = ?').run(req.params.id);
  res.json(success());
});

// 获取估算明细
router.get('/:id/details', verifyToken, requirePermission('cost_estimate'), (req, res) => {
  const db = getDb();
  const details = db.prepare('SELECT * FROM cost_estimate_details WHERE estimate_id = ?').all(req.params.id);
  res.json(success(details));
});

module.exports = router;
