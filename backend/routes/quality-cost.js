const express = require('express');
const { getDb } = require('../config/database');
const { success, error } = require('../utils/response');
const { verifyToken, requirePermission } = require('../middleware/auth');

const router = express.Router();

// 获取质量成本分类列表
router.get('/list', verifyToken, requirePermission('quality_cost'), (req, res) => {
  const db = getDb();
  const { cost_category, is_enabled } = req.query;
  
  let sql = 'SELECT * FROM quality_cost_standard WHERE 1=1';
  const params = [];
  
  if (cost_category) {
    sql += ' AND cost_category = ?';
    params.push(cost_category);
  }
  if (is_enabled !== undefined) {
    sql += ' AND is_enabled = ?';
    params.push(is_enabled);
  }
  sql += ' ORDER BY cost_category, id';
  
  const list = db.prepare(sql).all(...params);
  res.json(success(list));
});

// 按类别统计质量成本
router.get('/stats', verifyToken, requirePermission('quality_cost'), (req, res) => {
  const db = getDb();
  const sql = `
    SELECT cost_category, COUNT(*) as count
    FROM quality_cost_standard
    WHERE is_enabled = 1
    GROUP BY cost_category
  `;
  const stats = db.prepare(sql).all();
  res.json(success(stats));
});

// 新增质量成本项目
router.post('/create', verifyToken, requirePermission('quality_cost', 'edit'), (req, res) => {
  const db = getDb();
  const { cost_category, cost_item, account_code, description } = req.body;
  
  if (!cost_category || !cost_item) {
    return res.json(error('成本类别和费用项目不能为空'));
  }
  
  const result = db.prepare(`
    INSERT INTO quality_cost_standard (cost_category, cost_item, account_code, description, is_enabled)
    VALUES (?, ?, ?, ?, 1)
  `).run(cost_category, cost_item, account_code, description);
  
  res.json(success({ id: result.lastInsertRowid }));
});

// 更新质量成本项目
router.put('/:id', verifyToken, requirePermission('quality_cost', 'edit'), (req, res) => {
  const db = getDb();
  const { cost_category, cost_item, account_code, description, is_enabled } = req.body;
  
  db.prepare(`
    UPDATE quality_cost_standard SET cost_category = ?, cost_item = ?, account_code = ?, description = ?, is_enabled = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(cost_category, cost_item, account_code, description, is_enabled, req.params.id);
  
  res.json(success());
});

// 删除质量成本项目
router.delete('/:id', verifyToken, requirePermission('quality_cost', 'delete'), (req, res) => {
  const db = getDb();
  db.prepare('DELETE FROM quality_cost_standard WHERE id = ?').run(req.params.id);
  res.json(success());
});

// 初始化GB/T 46709标准分类（一键导入）
router.post('/init-standard', verifyToken, requirePermission('quality_cost', 'edit'), (req, res) => {
  const db = getDb();
  
  const count = db.prepare('SELECT COUNT(*) as cnt FROM quality_cost_standard').get().cnt;
  if (count > 0) return res.json(error('标准分类已初始化'));
  
  const standardData = [
    ['prevention', '质量计划编制费', '4001', '制定质量计划、质量目标等费用'],
    ['prevention', '质量培训费', '4002', '员工质量意识、技能培训费用'],
    ['prevention', '质量评审费', '4003', '设计评审、过程评审等费用'],
    ['prevention', '质量改进费', '4004', '质量改进项目投入'],
    ['prevention', '供应商评估费', '4005', '供应商质量能力评估费用'],
    ['appraisal', '进货检验费', '4006', '原材料、外购件检验费用'],
    ['appraisal', '过程检验费', '4007', '生产过程中检验费用'],
    ['appraisal', '成品检验费', '4008', '成品出厂前检验费用'],
    ['appraisal', '检测设备维护费', '4009', '检测设备校准、维护费用'],
    ['appraisal', '质量认证费', '4010', 'ISO9001等质量体系认证费用'],
    ['internal_failure', '返工返修费', '4011', '不合格品返工、返修费用'],
    ['internal_failure', '报废损失费', '4012', '无法修复的废品损失'],
    ['internal_failure', '停工损失费', '4013', '质量问题导致停工的损失'],
    ['internal_failure', '质量降级损失', '4014', '质量不达标但可降级使用的损失'],
    ['internal_failure', '内部索赔费', '4015', '内部工序间质量索赔'],
    ['external_failure', '保修费', '4016', '产品保修期内维修费用'],
    ['external_failure', '退货损失费', '4017', '客户退货、换货损失'],
    ['external_failure', '索赔费', '4018', '因质量问题向客户支付赔偿'],
    ['external_failure', '投诉处理费', '4019', '处理客户质量投诉费用'],
    ['external_failure', '产品召回费', '4020', '产品召回、销毁费用']
  ];
  
  const insert = db.prepare('INSERT INTO quality_cost_standard (cost_category, cost_item, account_code, description, is_enabled) VALUES (?, ?, ?, ?, 1)');
  for (const item of standardData) {
    insert.run(...item);
  }
  
  res.json(success());
});

module.exports = router;
