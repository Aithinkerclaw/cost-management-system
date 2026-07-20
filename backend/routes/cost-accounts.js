const express = require('express');
const { getDb } = require('../config/database');
const { success, error } = require('../utils/response');
const { verifyToken, requirePermission } = require('../middleware/auth');

const router = express.Router();

// 获取成本科目列表
router.get('/list', verifyToken, requirePermission('cost_accounts'), (req, res) => {
  const db = getDb();
  const { account_type, is_enabled, keyword } = req.query;
  
  let sql = 'SELECT * FROM cost_accounts WHERE 1=1';
  const params = [];
  
  if (account_type) {
    sql += ' AND account_type = ?';
    params.push(account_type);
  }
  if (is_enabled !== undefined) {
    sql += ' AND is_enabled = ?';
    params.push(is_enabled);
  }
  if (keyword) {
    sql += ' AND (account_name LIKE ? OR account_code LIKE ?)';
    params.push(`%${keyword}%`, `%${keyword}%`);
  }
  sql += ' ORDER BY account_code';
  
  const list = db.prepare(sql).all(...params);
  res.json(success(list));
});

// 获取单个成本科目
router.get('/:id', verifyToken, requirePermission('cost_accounts'), (req, res) => {
  const db = getDb();
  const item = db.prepare('SELECT * FROM cost_accounts WHERE id = ?').get(req.params.id);
  if (!item) return res.json(error('科目不存在'));
  res.json(success(item));
});

// 新增成本科目
router.post('/create', verifyToken, requirePermission('cost_accounts', 'edit'), (req, res) => {
  const db = getDb();
  const { account_code, account_name, account_type, parent_id } = req.body;
  
  if (!account_code || !account_name || !account_type) {
    return res.json(error('科目编码、名称和类型不能为空'));
  }
  
  const result = db.prepare(`
    INSERT INTO cost_accounts (account_code, account_name, account_type, parent_id, is_standard, is_enabled)
    VALUES (?, ?, ?, ?, 0, 1)
  `).run(account_code, account_name, account_type, parent_id || null);
  
  res.json(success({ id: result.lastInsertRowid }));
});

// 更新成本科目
router.put('/:id', verifyToken, requirePermission('cost_accounts', 'edit'), (req, res) => {
  const db = getDb();
  const { account_name, account_type, parent_id, is_enabled } = req.body;
  
  db.prepare(`
    UPDATE cost_accounts SET account_name = ?, account_type = ?, parent_id = ?, is_enabled = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(account_name, account_type, parent_id, is_enabled, req.params.id);
  
  res.json(success());
});

// 删除成本科目
router.delete('/:id', verifyToken, requirePermission('cost_accounts', 'delete'), (req, res) => {
  const db = getDb();
  const item = db.prepare('SELECT * FROM cost_accounts WHERE id = ?').get(req.params.id);
  if (!item) return res.json(error('科目不存在'));
  if (item.is_standard) return res.json(error('标准科目不能删除'));
  
  db.prepare('DELETE FROM cost_accounts WHERE id = ?').run(req.params.id);
  res.json(success());
});

// 获取标准科目模板
router.get('/template/standard', verifyToken, requirePermission('cost_accounts'), (req, res) => {
  const db = getDb();
  const list = db.prepare('SELECT * FROM cost_accounts WHERE is_standard = 1 ORDER BY account_code').all();
  res.json(success(list));
});

// 初始化标准科目（一键导入）
router.post('/init-standard', verifyToken, requirePermission('cost_accounts', 'edit'), (req, res) => {
  const db = getDb();
  
  // 检查是否已有标准科目
  const count = db.prepare('SELECT COUNT(*) as cnt FROM cost_accounts WHERE is_standard = 1').get().cnt;
  if (count > 0) return res.json(error('标准科目已初始化'));
  
  const standardAccounts = [
    ['1000', '直接材料', 'direct_material', null],
    ['1001', '原材料', 'direct_material', 1],
    ['1002', '辅助材料', 'direct_material', 1],
    ['1003', '外购半成品', 'direct_material', 1],
    ['2000', '燃料和动力', 'fuel_labor', null],
    ['2001', '燃料费', 'fuel_labor', 5],
    ['2002', '动力费', 'fuel_labor', 5],
    ['3000', '直接人工', 'direct_labor', null],
    ['3001', '生产工人工资', 'direct_labor', 8],
    ['3002', '生产工人奖金', 'direct_labor', 8],
    ['3003', '生产工人福利费', 'direct_labor', 8],
    ['4000', '制造费用', 'manufacturing_overhead', null],
    ['4001', '车间管理人员工资', 'manufacturing_overhead', 12],
    ['4002', '车间折旧费', 'manufacturing_overhead', 12],
    ['4003', '车间维修费', 'manufacturing_overhead', 12],
    ['4004', '车间水电费', 'manufacturing_overhead', 12],
    ['4005', '工具摊销费', 'manufacturing_overhead', 12]
  ];
  
  const insert = db.prepare('INSERT INTO cost_accounts (account_code, account_name, account_type, parent_id, is_standard, is_enabled) VALUES (?, ?, ?, ?, 1, 1)');
  for (const acc of standardAccounts) {
    insert.run(...acc);
  }
  
  res.json(success());
});

module.exports = router;
