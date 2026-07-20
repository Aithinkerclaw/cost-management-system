const express = require('express');
const { getDb, isSaaS } = require('../config/database');
const { success, error, paginate } = require('../utils/response');
const { verifyToken, requirePermission } = require('../middleware/auth');
const { tenantIsolation } = require('../middleware/tenant');

const router = express.Router();

// 获取激励规则
router.get('/calculator', verifyToken, tenantIsolation, requirePermission('incentive'), (req, res) => {
  const db = getDb();
  let sql = 'SELECT * FROM incentive_rules WHERE status=1';
  const params = [];
  if (isSaaS) {
    sql = 'SELECT * FROM incentive_rules WHERE status=1 AND tenant_id = ?';
    params.push(req.tenantId);
  }
  const rules = db.prepare(sql).all(...params);
  if (rules.length === 0) {
    return res.json(success([
      { id: 1, ruleName: '成本节约分享', savingFrom: 0, savingTo: 50000, shareRatio: 0.30, teamRatio: 0.5 },
      { id: 2, ruleName: '效率提升奖励', savingFrom: 0, savingTo: 100000, shareRatio: 0.20, teamRatio: 0.6 },
      { id: 3, ruleName: '重大改善项目', savingFrom: 100000, savingTo: 9999999, shareRatio: 0.15, teamRatio: 0.4 }
    ]));
  }
  res.json(success(rules));
});

// 计算分享奖金（纯计算逻辑，无需租户过滤）
router.post('/calculate', verifyToken, tenantIsolation, requirePermission('incentive', 'full'), (req, res) => {
  const { baselineCost, actualCost, ruleId } = req.body;
  const saving = Math.max(0, baselineCost - actualCost);

  const rules = {
    1: { ratio: 0.30, teamRatio: 0.5 },
    2: { ratio: 0.20, teamRatio: 0.6 },
    3: { ratio: 0.15, teamRatio: 0.4 }
  };
  const rule = rules[ruleId] || rules[1];

  const totalBonus = +(saving * rule.ratio).toFixed(2);
  const teamBonus = +(totalBonus * rule.teamRatio).toFixed(2);
  const personalBonus = +(totalBonus * (1 - rule.teamRatio)).toFixed(2);

  res.json(success({
    baselineCost, actualCost, saving,
    appliedRule: rule,
    totalBonus, teamBonus, personalBonus,
    breakdown: [
      { item: '节约金额', amount: saving, color: '#4CAF50' },
      { item: '团队奖金池', amount: teamBonus, color: '#1A73E8' },
      { item: '个人可分配', amount: personalBonus, color: '#FF9800' }
    ]
  }));
});

// 提案列表
router.get('/proposals', verifyToken, tenantIsolation, requirePermission('incentive'), (req, res) => {
  const db = getDb();
  let sql = `
    SELECT ip.*, u.real_name as proposerName
    FROM improvement_proposals ip
    LEFT JOIN users u ON ip.proposer_id = u.id
    WHERE 1=1
  `;
  const params = [];
  if (isSaaS) {
    sql += ` AND ip.tenant_id = ?`;
    params.push(req.tenantId);
  }
  if (req.query.status) sql += ` AND ip.status=?`;
  if (req.query.status) params.push(req.query.status);
  sql += ' ORDER BY ip.submitted_at DESC';

  const rows = db.prepare(sql).all(...params);
  res.json(success(paginate(rows, req.query.page, req.query.pageSize)));
});

// 提交提案
router.post('/proposals', verifyToken, tenantIsolation, requirePermission('incentive'), (req, res) => {
  const db = getDb();
  const data = req.body;

  let insertSql, insertParams;
  if (isSaaS) {
    insertSql = `
      INSERT INTO improvement_proposals (title, proposer_id, department, category,
        description, expected_saving, status, submitted_at, tenant_id)
      VALUES (?, ?, ?, ?, ?, ?, 'submitted', datetime('now'), ?)
    `;
    insertParams = [data.title, req.user?.id, data.department || '', data.category || '',
      data.description || '', data.expected_saving || 0, req.tenantId];
  } else {
    insertSql = `
      INSERT INTO improvement_proposals (title, proposer_id, department, category,
        description, expected_saving, status, submitted_at)
      VALUES (?, ?, ?, ?, ?, ?, 'submitted', datetime('now'))
    `;
    insertParams = [data.title, req.user?.id, data.department || '', data.category || '',
      data.description || '', data.expected_saving || 0];
  }
  const result = db.prepare(insertSql).run(...insertParams);

  const points = Math.ceil((data.expected_saving || 0) / 100);
  res.json(success({ id: result.lastInsertRowid, points }, `提案提交成功！获得${points}积分`));
});

// 审批提案
router.put('/proposals/:id/status', verifyToken, tenantIsolation, requirePermission('incentive', 'full'), (req, res) => {
  const db = getDb();
  const { status, reviewNote, points, bonusAmount } = req.body;

  let updateSql = `
    UPDATE improvement_proposals SET status=?, review_note=?, points=?, bonus_amount=?,
      reviewer_id=?, completed_at=CASE WHEN status='completed' THEN datetime('now') ELSE completed_at END
    WHERE id=?
  `;
  let updateParams = [status, reviewNote || '', points || 0, bonusAmount || 0, req.user?.id, req.params.id];
  if (isSaaS) {
    updateSql += ` AND tenant_id=?`;
    updateParams.push(req.tenantId);
  }
  db.prepare(updateSql).run(...updateParams);
  res.json(success(null, `状态已更新为：${status}`));
});

// 积分排行榜（同样加 tenant 过滤）
router.get('/leaderboard', verifyToken, tenantIsolation, requirePermission('incentive'), (req, res) => {
  const db = getDb();
  let sql = `
    SELECT u.real_name, u.department, COALESCE(SUM(ip.points), 0) as totalPoints,
           COUNT(ip.id) as proposalCount
    FROM users u LEFT JOIN improvement_proposals ip ON u.id = ip.proposer_id
  `;
  const params = [];
  if (isSaaS) {
    sql += ` WHERE u.tenant_id = ? AND (ip.tenant_id = ? OR ip.tenant_id IS NULL)`;
    params.push(req.tenantId, req.tenantId);
  }
  sql += ` GROUP BY u.id ORDER BY totalPoints DESC LIMIT 20`;

  const board = db.prepare(sql).all(...params);

  board.forEach((b, i) => { b.rank = i + 1; b.level = i < 3 ? 'gold' : i < 8 ? 'silver' : 'bronze'; });

  res.json(success(board));
});

module.exports = router;
