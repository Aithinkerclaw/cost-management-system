const express = require('express');
const { getDb, isSaaS } = require('../config/database');
const { success, error } = require('../utils/response');
const { verifyToken, requirePermission } = require('../middleware/auth');
const { tenantIsolation } = require('../middleware/tenant');

const router = express.Router();

// 查询设计变更列表
router.get('/', verifyToken, tenantIsolation, requirePermission('design'), (req, res) => {
  const db = getDb();
  let sql = `SELECT * FROM design_changes`;
  const params = [];
  if (isSaaS) {
    sql += ` WHERE tenant_id = ?`;
    params.push(req.tenantId);
  }
  sql += ` ORDER BY created_at DESC`;
  const list = db.prepare(sql).all(...params);
  res.json(success(list));
});

// 新增设计变更
router.post('/', verifyToken, tenantIsolation, requirePermission('design', 'full'), (req, res) => {
  const db = getDb();
  const data = req.body;
  const changeNo = data.change_no || `DC${Date.now()}`;

  let insertSql, insertParams;
  if (isSaaS) {
    insertSql = `INSERT INTO design_changes (change_no, project_name, part_name, change_type, description, old_material, new_material, old_process, new_process, cost_impact, saving_amount, status, proposer_name, approver_name, tenant_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    insertParams = [changeNo, data.project_name, data.part_name, data.change_type, data.description, data.old_material, data.new_material, data.old_process, data.new_process, data.cost_impact || 0, data.saving_amount || 0, data.status || 'draft', data.proposer_name, data.approver_name, req.tenantId];
  } else {
    insertSql = `INSERT INTO design_changes (change_no, project_name, part_name, change_type, description, old_material, new_material, old_process, new_process, cost_impact, saving_amount, status, proposer_name, approver_name) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    insertParams = [changeNo, data.project_name, data.part_name, data.change_type, data.description, data.old_material, data.new_material, data.old_process, data.new_process, data.cost_impact || 0, data.saving_amount || 0, data.status || 'draft', data.proposer_name, data.approver_name];
  }
  const info = db.prepare(insertSql).run(...insertParams);
  res.json(success({ id: info.lastInsertRowid, change_no: changeNo, ...data }));
});

// 修改设计变更
router.put('/:id', verifyToken, tenantIsolation, requirePermission('design', 'full'), (req, res) => {
  const db = getDb();
  const { id } = req.params;
  const data = req.body;
  let updateSql = `UPDATE design_changes SET project_name = ?, part_name = ?, change_type = ?, description = ?, old_material = ?, new_material = ?, old_process = ?, new_process = ?, cost_impact = ?, saving_amount = ?, status = ?, proposer_name = ?, approver_name = ? WHERE id = ?`;
  let updateParams = [data.project_name, data.part_name, data.change_type, data.description, data.old_material, data.new_material, data.old_process, data.new_process, data.cost_impact, data.saving_amount, data.status, data.proposer_name, data.approver_name, id];
  if (isSaaS) {
    updateSql += ` AND tenant_id = ?`;
    updateParams.push(req.tenantId);
  }
  db.prepare(updateSql).run(...updateParams);
  res.json(success({ id, ...data }));
});

// 删除设计变更
router.delete('/:id', verifyToken, tenantIsolation, requirePermission('design', 'full'), (req, res) => {
  const db = getDb();
  let delSql = `DELETE FROM design_changes WHERE id = ?`;
  let delParams = [req.params.id];
  if (isSaaS) {
    delSql += ` AND tenant_id = ?`;
    delParams.push(req.tenantId);
  }
  db.prepare(delSql).run(...delParams);
  res.json(success({ deleted: true }));
});

// DFA 简化分析（基于零部件数量）
router.post('/dfa', verifyToken, tenantIsolation, requirePermission('design'), (req, res) => {
  const { partCount, assemblyTime, defectRate } = req.body;
  const n = partCount || 10;
  const t = assemblyTime || 5;
  const d = defectRate || 0.02;

  const totalAssemblyTime = n * t;
  const estimatedDefects = n * d;
  const dfaScore = Math.max(0, 100 - n * 2 - estimatedDefects * 10);
  const suggestions = [];
  if (n > 8) suggestions.push('零部件数量较多，建议合并功能件');
  if (t > 4) suggestions.push('单件装配时间较长，建议优化装配顺序');
  if (d > 0.015) suggestions.push('不良率偏高，建议改进设计公差');

  res.json(success({
    partCount: n,
    assemblyTime: t,
    defectRate: d,
    totalAssemblyTime,
    estimatedDefects,
    dfaScore: +dfaScore.toFixed(1),
    suggestions
  }));
});

// ====== 目标成本管理 ======
// 查询目标成本列表
router.get('/target', verifyToken, tenantIsolation, requirePermission('design'), (req, res) => {
  const db = getDb();
  let sql = `SELECT t.*, p.product_name FROM target_costs t LEFT JOIN products p ON t.product_id = p.id`;
  const params = [];
  if (isSaaS) { sql += ` WHERE t.tenant_id = ?`; params.push(req.tenantId); }
  sql += ` ORDER BY t.created_at DESC`;
  const list = db.prepare(sql).all(...params);
  res.json(success(list));
});

// 新增目标成本
router.post('/target', verifyToken, tenantIsolation, requirePermission('design', 'full'), (req, res) => {
  const db = getDb();
  const data = req.body;
  if (!data.product_id || !data.target_cost) return res.json(error('产品ID和目标成本不能为空'));
  let insertSql, insertParams;
  if (isSaaS) {
    insertSql = `INSERT INTO target_costs (product_id, target_cost, material_target, labor_target, overhead_target, version, status, tenant_id) VALUES (?,?,?,?,?,?,?,?)`;
    insertParams = [data.product_id, data.target_cost, data.material_target||0, data.labor_target||0, data.overhead_target||0, data.version||1, data.status||'active', req.tenantId];
  } else {
    insertSql = `INSERT INTO target_costs (product_id, target_cost, material_target, labor_target, overhead_target, version, status) VALUES (?,?,?,?,?,?,?)`;
    insertParams = [data.product_id, data.target_cost, data.material_target||0, data.labor_target||0, data.overhead_target||0, data.version||1, data.status||'active'];
  }
  const info = db.prepare(insertSql).run(...insertParams);
  res.json(success({ id: info.lastInsertRowid, ...data }));
});

// 修改目标成本
router.put('/target/:id', verifyToken, tenantIsolation, requirePermission('design', 'full'), (req, res) => {
  const db = getDb();
  const { id } = req.params;
  const data = req.body;
  let updateSql = `UPDATE target_costs SET product_id=?, target_cost=?, material_target=?, labor_target=?, overhead_target=?, version=?, status=?, updated_at=CURRENT_TIMESTAMP WHERE id=?`;
  let updateParams = [data.product_id, data.target_cost, data.material_target||0, data.labor_target||0, data.overhead_target||0, data.version||1, data.status||'active', id];
  if (isSaaS) { updateSql += ` AND tenant_id=?`; updateParams.push(req.tenantId); }
  db.prepare(updateSql).run(...updateParams);
  res.json(success({ id, ...data }));
});

// 删除目标成本
router.delete('/target/:id', verifyToken, tenantIsolation, requirePermission('design', 'full'), (req, res) => {
  const db = getDb();
  let delSql = `DELETE FROM target_costs WHERE id=?`;
  let delParams = [req.params.id];
  if (isSaaS) { delSql += ` AND tenant_id=?`; delParams.push(req.tenantId); }
  db.prepare(delSql).run(...delParams);
  res.json(success({ deleted: true }));
});

// ====== 设计成本核算 ======
// 查询设计成本记录
router.get('/track', verifyToken, tenantIsolation, requirePermission('design'), (req, res) => {
  const db = getDb();
  let sql = `SELECT r.*, p.product_name, t.target_cost, dc.change_no
               FROM design_cost_records r
               LEFT JOIN products p ON r.product_id=p.id
               LEFT JOIN target_costs t ON r.target_cost_id=t.id
               LEFT JOIN design_changes dc ON r.design_change_id=dc.id`;
  const params = [];
  if (isSaaS) { sql += ` WHERE r.tenant_id=?`; params.push(req.tenantId); }
  sql += ` ORDER BY r.created_at DESC`;
  const list = db.prepare(sql).all(...params);
  res.json(success(list));
});

// 新增设计成本记录
router.post('/track', verifyToken, tenantIsolation, requirePermission('design', 'full'), (req, res) => {
  const db = getDb();
  const data = req.body;
  const variance = (data.total_actual_cost||0) - (data.target_cost||0);
  const variancePct = data.target_cost ? (variance/data.target_cost*100) : 0;
  let insertSql, insertParams;
  if (isSaaS) {
    insertSql = `INSERT INTO design_cost_records (design_change_id,product_id,target_cost_id,actual_material_cost,actual_labor_cost,actual_overhead_cost,total_actual_cost,variance,variance_pct,tenant_id) VALUES (?,?,?,?,?,?,?,?,?,?)`;
    insertParams = [data.design_change_id,data.product_id,data.target_cost_id,data.actual_material_cost||0,data.actual_labor_cost||0,data.actual_overhead_cost||0,data.total_actual_cost||0,variance,variancePct,req.tenantId];
  } else {
    insertSql = `INSERT INTO design_cost_records (design_change_id,product_id,target_cost_id,actual_material_cost,actual_labor_cost,actual_overhead_cost,total_actual_cost,variance,variance_pct) VALUES (?,?,?,?,?,?,?,?,?)`;
    insertParams = [data.design_change_id,data.product_id,data.target_cost_id,data.actual_material_cost||0,data.actual_labor_cost||0,data.actual_overhead_cost||0,data.total_actual_cost||0,variance,variancePct];
  }
  const info = db.prepare(insertSql).run(...insertParams);
  res.json(success({ id: info.lastInsertRowid, ...data, variance, variance_pct: +variancePct.toFixed(2) }));
});

// 修改设计成本记录
router.put('/track/:id', verifyToken, tenantIsolation, requirePermission('design', 'full'), (req, res) => {
  const db = getDb();
  const { id } = req.params;
  const data = req.body;
  const variance = (data.total_actual_cost||0) - (data.target_cost||0);
  const variancePct = data.target_cost ? (variance/data.target_cost*100) : 0;
  let updateSql = `UPDATE design_cost_records SET design_change_id=?,product_id=?,target_cost_id=?,actual_material_cost=?,actual_labor_cost=?,actual_overhead_cost=?,total_actual_cost=?,variance=?,variance_pct=?,updated_at=CURRENT_TIMESTAMP WHERE id=?`;
  let updateParams = [data.design_change_id,data.product_id,data.target_cost_id,data.actual_material_cost||0,data.actual_labor_cost||0,data.actual_overhead_cost||0,data.total_actual_cost||0,variance,variancePct,id];
  if (isSaaS) { updateSql += ` AND tenant_id=?`; updateParams.push(req.tenantId); }
  db.prepare(updateSql).run(...updateParams);
  res.json(success({ id, ...data, variance, variance_pct: +variancePct.toFixed(2) }));
});

// 删除设计成本记录
router.delete('/track/:id', verifyToken, tenantIsolation, requirePermission('design', 'full'), (req, res) => {
  const db = getDb();
  let delSql = `DELETE FROM design_cost_records WHERE id=?`;
  let delParams = [req.params.id];
  if (isSaaS) { delSql += ` AND tenant_id=?`; delParams.push(req.tenantId); }
  db.prepare(delSql).run(...delParams);
  res.json(success({ deleted: true }));
});

module.exports = router;
