const express = require('express');
const { getDb, isSaaS } = require('../config/database');
const { success, error } = require('../utils/response');
const { verifyToken, requirePermission } = require('../middleware/auth');
const { tenantIsolation } = require('../middleware/tenant');

const router = express.Router();

// 质量成本总览
router.get('/overview', verifyToken, tenantIsolation, requirePermission('quality'), (req, res) => {
  const db = getDb();
  let sql = `
    SELECT
      SUM(CASE WHEN type='prevention' THEN amount ELSE 0 END) as prevention,
      SUM(CASE WHEN type='appraisal' THEN amount ELSE 0 END) as appraisal,
      SUM(CASE WHEN type='internal_failure' THEN amount ELSE 0 END) as internalFailure,
      SUM(CASE WHEN type='external_failure' THEN amount ELSE 0 END) as externalFailure,
      SUM(amount) as totalQualityCost
    FROM quality_costs WHERE record_date >= date('now', '-6 months')
  `;
  const params = [];
  if (isSaaS) {
    sql += ` AND tenant_id = ?`;
    params.push(req.tenantId);
  }
  const summary = db.prepare(sql).get(...params);

  const industryBenchmark = {
    prevention: { actual: summary.prevention || 0, benchmark: (summary.totalQualityCost || 1) * 0.10, optimalPct: '5-15%', status: (summary.prevention || 0) < (summary.totalQualityCost || 1) * 0.05 ? 'low' : 'ok' },
    appraisal: { actual: summary.appraisal || 0, benchmark: (summary.totalQualityCost || 1) * 0.20, optimalPct: '10-25%', status: 'ok' },
    internalFailure: { actual: summary.internalFailure || 0, benchmark: (summary.totalQualityCost || 1) * 0.35, optimalPct: '<30%', status: (summary.internalFailure || 0) > (summary.totalQualityCost || 1) * 0.40 ? 'high' : 'ok' },
    externalFailure: { actual: summary.externalFailure || 0, benchmark: (summary.totalQualityCost || 1) * 0.20, optimalPct: '<15%', status: 'ok' }
  };

  res.json(success({ ...summary, totalQualityCost: summary.totalQualityCost || 0, industryBenchmark }));
});

// PAF分析数据
router.get('/paf', verifyToken, tenantIsolation, requirePermission('quality'), (req, res) => {
  const db = getDb();
  let sql = `
    SELECT strftime('%Y-%m', record_date) as month,
      COALESCE(SUM(CASE WHEN type='prevention' THEN amount END), 0) as prevention,
      COALESCE(SUM(CASE WHEN type='appraisal' THEN amount END), 0) as appraisal,
      COALESCE(SUM(CASE WHEN type='internal_failure' THEN amount END), 0) as internalFailure,
      COALESCE(SUM(CASE WHEN type='external_failure' THEN amount END), 0) as externalFailure
    FROM quality_costs
  `;
  const params = [];
  if (isSaaS) {
    sql += ` WHERE tenant_id = ?`;
    params.push(req.tenantId);
  }
  sql += ` GROUP BY month ORDER BY month DESC LIMIT 12`;
  const monthly = db.prepare(sql).all(...params);

  if (monthly.length === 0) {
    const mock = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(); d.setMonth(d.getMonth() - i);
      mock.push({
        month: d.toISOString().slice(0, 7),
        prevention: +(8000 + Math.random() * 2000).toFixed(0),
        appraisal: +(15000 + Math.random() * 5000).toFixed(0),
        internalFailure: +(25000 - i * 3000 + Math.random() * 5000).toFixed(0),
        externalFailure: +(5000 + Math.random() * 3000).toFixed(0)
      });
    }
    return res.json(success(mock));
  }
  res.json(success(monthly));
});

// 质量成本记录列表
router.get('/records', verifyToken, tenantIsolation, requirePermission('quality'), (req, res) => {
  const db = getDb();
  let sql = `SELECT * FROM quality_costs`;
  const params = [];
  if (isSaaS) {
    sql += ` WHERE tenant_id = ?`;
    params.push(req.tenantId);
  }
  sql += ` ORDER BY record_date DESC`;
  const list = db.prepare(sql).all(...params);
  res.json(success(list));
});

// 录入质量成本
router.post('/record', verifyToken, tenantIsolation, requirePermission('quality', 'full'), (req, res) => {
  const db = getDb();
  const data = req.body;
  const recordDate = data.record_date || new Date().toISOString().slice(0, 10);
  const amount = Number(data.amount) || 0;
  const type = data.type || 'internal_failure';
  const description = data.description || '';
  const batchNo = data.batch_no || '';

  let insertSql, insertParams;
  if (isSaaS) {
    insertSql = `INSERT INTO quality_costs (record_date, type, amount, description, batch_no, tenant_id, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)`;
    insertParams = [recordDate, type, amount, description, batchNo, req.tenantId, req.user?.id];
  } else {
    insertSql = `INSERT INTO quality_costs (record_date, type, amount, description, batch_no, created_by) VALUES (?, ?, ?, ?, ?, ?)`;
    insertParams = [recordDate, type, amount, description, batchNo, req.user?.id];
  }
  const info = db.prepare(insertSql).run(...insertParams);
  res.json(success({ id: info.lastInsertRowid, ...data }));
});

// 修改质量成本记录
router.put('/record/:id', verifyToken, tenantIsolation, requirePermission('quality', 'full'), (req, res) => {
  const db = getDb();
  const { id } = req.params;
  const data = req.body;
  let updateSql = `UPDATE quality_costs SET record_date = ?, type = ?, amount = ?, description = ?, batch_no = ? WHERE id = ?`;
  let updateParams = [data.record_date, data.type, data.amount, data.description, data.batch_no, id];
  if (isSaaS) {
    updateSql += ` AND tenant_id = ?`;
    updateParams.push(req.tenantId);
  }
  db.prepare(updateSql).run(...updateParams);
  res.json(success({ id, ...data }));
});

// 删除质量成本记录
router.delete('/record/:id', verifyToken, tenantIsolation, requirePermission('quality', 'full'), (req, res) => {
  const db = getDb();
  let delSql = `DELETE FROM quality_costs WHERE id = ?`;
  let delParams = [req.params.id];
  if (isSaaS) {
    delSql += ` AND tenant_id = ?`;
    delParams.push(req.tenantId);
  }
  db.prepare(delSql).run(...delParams);
  res.json(success({ deleted: true }));
});

// 不良品追溯（真实数据）
router.get('/defect-trace/:batchNo', verifyToken, tenantIsolation, requirePermission('quality'), (req, res) => {
  const db = getDb();
  const { batchNo } = req.params;

  let sql = `SELECT * FROM quality_inspections WHERE inspection_no = ? OR batch_no = ?`;
  const params = [batchNo, batchNo];
  if (isSaaS) {
    sql += ` AND tenant_id = ?`;
    params.push(req.tenantId);
  }
  const inspection = db.prepare(sql).get(...params);

  if (!inspection) {
    return res.json(success({
      batchNo,
      chain: [],
      rootCause: '未找到该批次的质检记录',
      correctiveActions: []
    }));
  }

  let woSql = `SELECT * FROM work_orders WHERE id = ?`;
  const woParams = [inspection.wo_id];
  if (isSaaS) { woSql += ` AND tenant_id = ?`; woParams.push(req.tenantId); }
  const workOrder = db.prepare(woSql).get(...woParams);

  const chain = [];
  if (workOrder) {
    chain.push(
      { stage: '工单下达', info: `工单号: ${workOrder.wo_no}, 计划数量: ${workOrder.plan_qty}`, date: (workOrder.start_time || '').slice(0, 10) },
      { stage: '生产执行', info: `实际产量: ${workOrder.actual_qty}, 不良数: ${workOrder.defect_qty}, 设备: ${workOrder.equipment_name}`, operator: workOrder.operator_name }
    );
  }
  chain.push({
    stage: '质检',
    info: `检验单: ${inspection.inspection_no}, 抽样: ${inspection.sample_size}, 缺陷数: ${inspection.defect_count}, 合格率: ${inspection.pass_rate}%`,
    inspector: inspection.inspector_name,
    result: inspection.result
  });

  res.json(success({
    batchNo,
    inspection,
    workOrder,
    chain,
    rootCause: inspection.remark || '待分析',
    correctiveActions: []
  }));
});

// SPC控制图数据（模拟计算，无需租户过滤）
router.post('/spc', verifyToken, tenantIsolation, requirePermission('quality', 'full'), (req, res) => {
  const { characteristic, values } = req.body;
  const n = values ? values.length : 25;
  const data = values || Array.from({ length: n }, (_, i) =>
    +(50 + (Math.random() - 0.5) * 10).toFixed(2)
  );

  const mean = data.reduce((s, v) => s + v, 0) / data.length;
  const stdDev = Math.sqrt(data.reduce((s, v) => s + (v - mean) ** 2, 0) / data.length);

  const uclXbar = mean + 3 * stdDev / Math.sqrt(n);
  const lclXbar = mean - 3 * stdDev / Math.sqrt(n);
  const uclR = 4 * stdDev;

  const outOfControl = data.map((v, i) => ({
    index: i + 1, value: v,
    isOutlier: v > uclXbar || v < lclXbar,
    rule1: v > uclXbar || v < lclXbar,
    rule2: i >= 8 && data.slice(i - 8, i).every(d => d > mean),
    rule3: i >= 6 && Math.abs(data[i] - data[i - 1]) > 2 * stdDev
  }));

  res.json(success({
    characteristic: characteristic || '关键尺寸A',
    n, mean: +mean.toFixed(2),
    stdDev: +stdDev.toFixed(2),
    limits: { UCL: +uclXbar.toFixed(2), CL: +mean.toFixed(2), LCL: +lclXbar.toFixed(2), UCLR: +uclR.toFixed(2) },
    data: outOfControl,
    alerts: outOfControl.filter(d => d.isOutlier || d.rule2 || d.rule3).map(d => `第${d.index}点异常`)
  }));
});

module.exports = router;
