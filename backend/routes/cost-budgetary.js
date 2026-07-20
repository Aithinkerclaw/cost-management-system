const express = require('express');
const { getDb } = require('../config/database');
const { success, error } = require('../utils/response');
const { verifyToken, requirePermission } = require('../middleware/auth');

const router = express.Router();

// 获取成本概算列表
router.get('/list', verifyToken, requirePermission('cost_budgetary'), (req, res) => {
  const db = getDb();
  const { project_name, approval_status, page = 1, limit = 20 } = req.query;
  
  let sql = 'SELECT cb.*, u.real_name as approverName FROM cost_budgetary cb LEFT JOIN users u ON cb.approver_id = u.id WHERE 1=1';
  const params = [];
  
  if (project_name) {
    sql += ' AND cb.project_name LIKE ?';
    params.push(`%${project_name}%`);
  }
  if (approval_status) {
    sql += ' AND cb.approval_status = ?';
    params.push(approval_status);
  }
  sql += ' ORDER BY cb.created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));
  
  const list = db.prepare(sql).all(...params);
  res.json(success(list));
});

// 获取单个成本概算
router.get('/:id', verifyToken, requirePermission('cost_budgetary'), (req, res) => {
  const db = getDb();
  const item = db.prepare('SELECT * FROM cost_budgetary WHERE id = ?').get(req.params.id);
  if (!item) return res.json(error('概算记录不存在'));
  
  const details = db.prepare('SELECT * FROM cost_budgetary_details WHERE budgetary_id = ?').all(req.params.id);
  res.json(success({ ...item, details }));
});

// 创建成本概算
router.post('/create', verifyToken, requirePermission('cost_budgetary', 'edit'), (req, res) => {
  const db = getDb();
  const { project_name, project_code, feasibility_stage, total_investment, construction_cost, equipment_cost, installation_cost, other_cost, working_capital, total_estimated_cost, details } = req.body;
  
  if (!project_name) {
    return res.json(error('项目名称不能为空'));
  }
  
  const budgetary_no = `BGY-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
  
  const result = db.prepare(`
    INSERT INTO cost_budgetary (budgetary_no, project_name, project_code, feasibility_stage, total_investment, construction_cost, equipment_cost, installation_cost, other_cost, working_capital, total_estimated_cost, approval_status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
  `).run(budgetary_no, project_name, project_code, feasibility_stage, total_investment, construction_cost, equipment_cost, installation_cost, other_cost, working_capital, total_estimated_cost);
  
  // 保存概算明细
  if (details && Array.isArray(details)) {
    const insertDetail = db.prepare('INSERT INTO cost_budgetary_details (budgetary_id, cost_item, estimated_amount, remark) VALUES (?, ?, ?, ?)');
    for (const detail of details) {
      insertDetail.run(result.lastInsertRowid, detail.cost_item, detail.estimated_amount, detail.remark);
    }
  }
  
  res.json(success({ id: result.lastInsertRowid, budgetary_no }));
});

// 更新成本概算
router.put('/:id', verifyToken, requirePermission('cost_budgetary', 'edit'), (req, res) => {
  const db = getDb();
  const { project_name, project_code, feasibility_stage, total_investment, construction_cost, equipment_cost, installation_cost, other_cost, working_capital, total_estimated_cost, approval_status } = req.body;
  
  db.prepare(`
    UPDATE cost_budgetary SET project_name = ?, project_code = ?, feasibility_stage = ?, total_investment = ?, construction_cost = ?, equipment_cost = ?, installation_cost = ?, other_cost = ?, working_capital = ?, total_estimated_cost = ?, approval_status = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(project_name, project_code, feasibility_stage, total_investment, construction_cost, equipment_cost, installation_cost, other_cost, working_capital, total_estimated_cost, approval_status, req.params.id);
  
  res.json(success());
});

// 提交审批
router.post('/:id/submit', verifyToken, requirePermission('cost_budgetary', 'edit'), (req, res) => {
  const db = getDb();
  db.prepare("UPDATE cost_budgetary SET approval_status = 'submitted', updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(req.params.id);
  res.json(success());
});

// 审批通过
router.post('/:id/approve', verifyToken, requirePermission('cost_budgetary', 'approve'), (req, res) => {
  const db = getDb();
  db.prepare("UPDATE cost_budgetary SET approval_status = 'approved', approver_id = ?, approved_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(req.user.id, req.params.id);
  res.json(success());
});

// 删除成本概算
router.delete('/:id', verifyToken, requirePermission('cost_budgetary', 'delete'), (req, res) => {
  const db = getDb();
  db.prepare('DELETE FROM cost_budgetary WHERE id = ?').run(req.params.id);
  db.prepare('DELETE FROM cost_budgetary_details WHERE budgetary_id = ?').run(req.params.id);
  res.json(success());
});

module.exports = router;
