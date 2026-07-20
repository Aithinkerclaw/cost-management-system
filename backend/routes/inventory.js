const express = require('express');
const { getDb, isSaaS } = require('../config/database');
const { success, error, paginate } = require('../utils/response');
const { verifyToken, requirePermission } = require('../middleware/auth');
const { tenantIsolation } = require('../middleware/tenant');

const router = express.Router();

// 物料列表
router.get('/materials', verifyToken, tenantIsolation, requirePermission('inventory'), (req, res) => {
  const db = getDb();
  let sql = `SELECT * FROM materials WHERE status = 1`;
  const params = [];
  if (isSaaS) {
    sql += ` AND tenant_id = ?`;
    params.push(req.tenantId);
  }
  sql += ` ORDER BY material_code`;
  const rows = db.prepare(sql).all(...params);

  // 计算当前库存（同样加 tenant 过滤）
  const enriched = rows.map(m => {
    let inSql = `SELECT COALESCE(SUM(quantity),0) as qty FROM inventory_records WHERE material_id=? AND type='in'`;
    let outSql = `SELECT COALESCE(SUM(quantity),0) as qty FROM inventory_records WHERE material_id=? AND type='out'`;
    let inParams = [m.id];
    let outParams = [m.id];
    if (isSaaS) {
      inSql += ` AND tenant_id = ?`;
      outSql += ` AND tenant_id = ?`;
      inParams.push(req.tenantId);
      outParams.push(req.tenantId);
    }
    const inQty = db.prepare(inSql).get(...inParams).qty;
    const outQty = db.prepare(outSql).get(...outParams).qty;
    return { ...m, currentStock: Number((inQty - outQty).toFixed(2)) };
  });

  res.json(success(paginate(enriched, req.query.page, req.query.pageSize)));
});

// ABC分类分析
router.get('/abc-analysis', verifyToken, tenantIsolation, requirePermission('inventory'), (req, res) => {
  const db = getDb();
  let sql = `
    SELECT m.*, (m.annual_usage_amount * m.unit_cost) as annualValue
    FROM materials m WHERE m.status=1
  `;
  const params = [];
  if (isSaaS) {
    sql = `
      SELECT m.*, (m.annual_usage_amount * m.unit_cost) as annualValue
      FROM materials m WHERE m.status=1 AND m.tenant_id = ?
    `;
    params.push(req.tenantId);
  }
  const materials = db.prepare(sql).all(...params);

  // 按年耗用金额排序并划分ABC
  const sorted = [...materials].sort((a, b) => b.annualValue - a.annualValue);
  const totalAnnual = sorted.reduce((s, m) => s + (m.annualValue || 0), 0);
  let cumPct = 0;
  sorted.forEach(m => {
    const pct = totalAnnual > 0 ? ((m.annualValue || 0) * 100 / totalAnnual) : 0;
    cumPct += pct;
    if (cumPct <= 80) m.abcClass = 'A';
    else if (cumPct <= 95) m.abcClass = 'B';
    else m.abcClass = 'C';

    // 回写（仅写本租户数据）
    if (!isSaaS || m.tenant_id === req.tenantId) {
      db.prepare('UPDATE materials SET abc_class=? WHERE id=? AND (tenant_id=? OR ? IS NULL)')
        .run(m.abcClass, m.id, req.tenantId, isSaaS ? null : undefined);
    }
  });

  res.json(success({
    categories: [
      { class: 'A', count: sorted.filter(m => m.abcClass === 'A').length, pctOfItems: '?', pctOfValue: '~70%', color: '#F44336' },
      { class: 'B', count: sorted.filter(m => m.abcClass === 'B').length, pctOfItems: '?', pctOfValue: '~20%', color: '#FF9800' },
      { class: 'C', count: sorted.filter(m => m.abcClass === 'C').length, pctOfItems: '?', pctOfValue: '~10%', color: '#4CAF50' }
    ],
    items: sorted.map(({ id, material_name, unit_cost, annual_usage_amount, abcClass }) => ({
      id, materialName: material_name, unitCost: unit_cost, annualUsage: annual_usage_amount, abcClass
    }))
  }));
});

// 安全库存计算（使用模拟数据，不需要租户过滤）
router.get('/safety-stock', verifyToken, tenantIsolation, requirePermission('inventory'), (req, res) => {
  const { demandVariation, leadTime, serviceLevel } = req.query;
  const sl = Number(serviceLevel) || 95;
  const zScores = { 90: 1.28, 95: 1.65, 99: 2.33 };
  const z = zScores[sl] || 1.65;

  const db = getDb();
  let sql = `SELECT * FROM materials WHERE status=1 LIMIT 10`;
  const params = [];
  if (isSaaS) {
    sql = `SELECT * FROM materials WHERE status=1 AND tenant_id = ? LIMIT 10`;
    params.push(req.tenantId);
  }
  const materials = db.prepare(sql).all(...params).map(m => {
    const avgDemand = m.annual_usage_amount ? m.annual_usage_amount / 250 : 10;
    const lt = Number(leadTime) || 7;
    const dVar = Number(demandVariation) || 3;
    const safetyStock = Math.ceil(z * Math.sqrt(lt) * dVar);
    const reorderPoint = Math.ceil(avgDemand * lt + safetyStock);

    return {
      id: m.id, materialName: m.material_name,
      avgDailyDemand: avgDemand.toFixed(1),
      leadTimeDays: lt,
      serviceLevel: sl + '%',
      safetyStock,
      reorderPoint,
      currentStock: 0
    };
  });

  res.json(success({ zScore: z, items: materials }));
});

// 呆滞预警
router.get('/obsolete-alerts', verifyToken, tenantIsolation, requirePermission('inventory'), (req, res) => {
  const db = getDb();
  let sql = `
    SELECT * FROM materials
    WHERE obsolete_days > 90 AND status = 1
    ORDER BY obsolete_days DESC
  `;
  const params = [];
  if (isSaaS) {
    sql = `
      SELECT * FROM materials
      WHERE obsolete_days > 90 AND status = 1 AND tenant_id = ?
      ORDER BY obsolete_days DESC
    `;
    params.push(req.tenantId);
  }
  const alerts = db.prepare(sql).all(...params).map(m => ({
    ...m,
    reasonTags: m.obsolete_days > 365 ? ['技术变更', '采购过量'] :
               m.obsolete_days > 180 ? ['订单取消'] : ['需求减少']
  }));

  res.json(success({
    summary: {
      totalObsolete: alerts.length,
      totalAmount: alerts.reduce((s, a) => s + (a.currentStock || 0) * (a.unit_cost || 0), 0)
    },
    items: alerts
  }));
});

// 周转模拟（what-if分析，模拟数据不需要租户过滤）
router.post('/turnover-simulate', verifyToken, tenantIsolation, requirePermission('inventory', 'full'), (req, res) => {
  const { targetTurnoverRate, currentSafetyStock, newSafetyStock } = req.body;
  const currentRate = currentSafetyStock ? 4.5 : 4.5;

  const improvement = newSafetyStock && currentSafetyStock ?
    ((currentSafetyStock - newSafetyStock) / currentSafetyStock * 100) : 15;

  res.json(success({
    scenario: {
      before: { turnoverRate: currentRate, workingCapital: 1200000 },
      after: { turnoverRate: +(currentRate * (1 + improvement / 100)).toFixed(1), workingCapital: 1020000 },
      releasedCash: 180000,
      improvementPct: improvement.toFixed(1)
    }
  }));
});

module.exports = router;
