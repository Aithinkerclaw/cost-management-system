const express = require('express');
const { getDb, isSaaS } = require('../config/database');
const { success, error } = require('../utils/response');
const { verifyToken, requirePermission } = require('../middleware/auth');
const { tenantIsolation } = require('../middleware/tenant');

const router = express.Router();

// 录入OEE数据
router.post('/oee', verifyToken, tenantIsolation, requirePermission('production', 'full'), (req, res) => {
  const db = getDb();
  const data = req.body;

  // 正确OEE计算
  const runningTime = Math.max(data.planned_time - data.downtime, 1);
  const availability = data.planned_time > 0
    ? +((runningTime / data.planned_time * 100).toFixed(1)) : 0;

  // 性能率 = (实际产量 × 理论周期时间) / 运行时间 × 100
  const cycleTime = Number(data.cycle_time) || 1;
  const performance = runningTime > 0
    ? +((data.output_qty * cycleTime) / runningTime * 100).toFixed(1) : 0;

  const quality_rate = data.output_qty > 0
    ? +(((data.output_qty - (data.defect_qty || 0)) / data.output_qty * 100).toFixed(1)) : 0;

  // OEE = 可用率 × 性能率 × 合格率 / 10000
  const oee = +(availability * performance * quality_rate / 10000).toFixed(1);

  let insertSql, insertParams;
  if (isSaaS) {
    insertSql = `
      INSERT INTO oee_records (record_date, equipment_id, equipment_name, shift,
        planned_time, downtime, output_qty, defect_qty, cycle_time,
        availability, performance, quality_rate, oee, created_by, tenant_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    insertParams = [data.record_date, data.equipment_id, data.equipment_name, data.shift,
      data.planned_time, data.downtime, data.output_qty, data.defect_qty, cycleTime,
      availability, performance, quality_rate, oee, req.user?.id, req.tenantId];
  } else {
    insertSql = `
      INSERT INTO oee_records (record_date, equipment_id, equipment_name, shift,
        planned_time, downtime, output_qty, defect_qty, cycle_time,
        availability, performance, quality_rate, oee, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    insertParams = [data.record_date, data.equipment_id, data.equipment_name, data.shift,
      data.planned_time, data.downtime, data.output_qty, data.defect_qty, cycleTime,
      availability, performance, quality_rate, oee, req.user?.id];
  }
  const result = db.prepare(insertSql).run(...insertParams);

  res.json(success({ id: result.lastInsertRowid, oee }, 'OEE数据录入成功'));
});

// 查询OEE记录
router.get('/oee/:date?', verifyToken, tenantIsolation, requirePermission('production'), (req, res) => {
  const db = getDb();
  const date = req.params.date || new Date().toISOString().slice(0, 10);
  let sql = 'SELECT * FROM oee_records WHERE record_date = ?';
  const params = [date];
  if (isSaaS) {
    sql += ' AND tenant_id = ?';
    params.push(req.tenantId);
  }
  sql += ' ORDER BY id';
  const rows = db.prepare(sql).all(...params);
  res.json(success(rows));
});

// VSM图数据（模拟数据，无需租户过滤）
router.get('/vsm-data', verifyToken, tenantIsolation, requirePermission('production'), (req, res) => {
  const vsmData = {
    processFlow: [
      { step: 1, name: '原材料入库', ct: 15, co: 5, waitTime: 120, valueAdded: false },
      { step: 2, name: '下料切割', ct: 30, co: 2, waitTime: 10, valueAdded: true },
      { step: 3, name: '数控加工', ct: 45, co: 3, waitTime: 15, valueAdded: true },
      { step: 4, name: '焊接组装', ct: 60, co: 5, waitTime: 20, valueAdded: true },
      { step: 5, name: '表面处理', ct: 25, co: 4, waitTime: 30, valueAdded: true },
      { step: 6, name: '质检', ct: 20, co: 2, waitTime: 45, valueAdded: false },
      { step: 7, name: '包装入库', ct: 10, co: 3, waitTime: 60, valueAdded: false }
    ],
    summary: {
      totalCT: 205, totalCO: 24, totalWait: 300,
      leadTime: 505,
      valueAddedRatio: +(160 / 505 * 100).toFixed(1),
      bottleneckStep: 4,
      industryBenchmark: { vaRatio: 15, leadTime: 400 }
    }
  };
  res.json(success(vsmData));
});

// SMED换模录入（模拟计算，无需租户过滤）
router.post('/smed', verifyToken, tenantIsolation, requirePermission('production', 'full'), (req, res) => {
  const db = getDb();
  const { equipmentId, steps } = req.body;
  const internalTotal = steps.filter(s => s.type === 'internal').reduce((s, st) => s + st.time, 0);
  const externalTotal = steps.filter(s => s.type === 'external').reduce((s, st) => s + st.time, 0);
  const totalTime = internalTotal + externalTotal;

  res.json(success({
    equipmentId,
    internalTime: internalTotal,
    externalTime: externalTotal,
    totalTime,
    internalPct: +(internalTotal / totalTime * 100).toFixed(1),
    improvementSuggestions: [
      internalTotal > 60 ? '建议：将部分内部操作转换为外部操作' : null,
      steps.length > 8 ? '建议：合并/简化换模步骤' : null,
      externalTotal > internalTotal * 3 ? '外部准备充分，继续保持' : null
    ].filter(Boolean)
  }));
});

// 瓶颈工序识别（模拟数据，无需租户过滤）
router.get('/bottleneck', verifyToken, tenantIsolation, requirePermission('production'), (req, res) => {
  const bottlenecks = [
    { process: '焊接组装', wipQty: 85, cycleTime: 60, capacityUtil: 95, isBottleneck: true, suggestion: '增加班次或优化工艺' },
    { process: '数控加工', wipQty: 42, cycleTime: 45, capacityUtil: 78, isBottleneck: false, suggestion: '' },
    { process: '表面处理', wipQty: 28, cycleTime: 25, capacityUtil: 62, isBottleneck: false, suggestion: '' },
    { process: '下料切割', wipQty: 18, cycleTime: 30, capacityUtil: 55, isBottleneck: false, suggestion: '' }
  ];
  res.json(success(bottlenecks));
});

module.exports = router;
