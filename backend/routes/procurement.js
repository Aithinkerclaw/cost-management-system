const express = require('express');
const { getDb, isSaaS } = require('../config/database');
const { success, error, paginate } = require('../utils/response');
const { verifyToken, requirePermission } = require('../middleware/auth');
const { tenantIsolation } = require('../middleware/tenant');

const router = express.Router();

// 供应商列表
router.get('/suppliers', verifyToken, tenantIsolation, requirePermission('procurement'), (req, res) => {
  const db = getDb();
  let sql = `SELECT * FROM suppliers WHERE status = 1`;
  const params = [];
  if (isSaaS) {
    sql += ` AND tenant_id = ?`;
    params.push(req.tenantId);
  }
  sql += ` ORDER BY total_score DESC`;
  const rows = db.prepare(sql).all(...params);
  res.json(success(paginate(rows, req.query.page, req.query.pageSize)));
});

// 新增供应商
router.post('/suppliers', verifyToken, tenantIsolation, requirePermission('procurement', 'full'), (req, res) => {
  const db = getDb();
  const data = req.body;
  data.total_score = (data.quality_score || 0) + (data.cost_score || 0) + (data.delivery_score || 0) + (data.service_score || 0);
  data.supplier_code = `SUP${Date.now().toString(36).toUpperCase()}`;

  let insertSql, insertParams;
  if (isSaaS) {
    insertSql = `
      INSERT INTO suppliers (supplier_code, supplier_name, contact_person, phone, address,
        level, quality_score, cost_score, delivery_score, service_score, total_score, tenant_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    insertParams = [data.supplier_code, data.supplier_name, data.contact_person || '', data.phone || '',
      data.address || '', data.level || 'C', data.quality_score || 0, data.cost_score || 0,
      data.delivery_score || 0, data.service_score || 0, data.total_score, req.tenantId];
  } else {
    insertSql = `
      INSERT INTO suppliers (supplier_code, supplier_name, contact_person, phone, address,
        level, quality_score, cost_score, delivery_score, service_score, total_score)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    insertParams = [data.supplier_code, data.supplier_name, data.contact_person || '', data.phone || '',
      data.address || '', data.level || 'C', data.quality_score || 0, data.cost_score || 0,
      data.delivery_score || 0, data.service_score || 0, data.total_score];
  }

  const result = db.prepare(insertSql).run(...insertParams);

  res.json(success({ id: result.lastInsertRowid }, '供应商创建成功'));
});

// 更新QCDS评分
router.put('/suppliers/:id', verifyToken, tenantIsolation, requirePermission('procurement', 'full'), (req, res) => {
  const db = getDb();
  const { quality_score, cost_score, delivery_score, service_score } = req.body;
  const total = (quality_score || 0) + (cost_score || 0) + (delivery_score || 0) + (service_score || 0);

  let updateSql = `UPDATE suppliers SET quality_score=?, cost_score=?, delivery_score=?, service_score=?, total_score=? WHERE id=?`;
  let updateParams = [quality_score, cost_score, delivery_score, service_score, total, req.params.id];
  if (isSaaS) {
    updateSql += ` AND tenant_id=?`;
    updateParams.push(req.tenantId);
  }
  const existing = db.prepare(`SELECT id FROM suppliers WHERE id=?`).get(req.params.id);
  if (!existing) {
    return res.json(error(404, '供应商不存在'));
  }
  db.prepare(updateSql).run(...updateParams);

  res.json(success(null, '评分更新成功'));
});

// TCO对比分析
router.get('/tco', verifyToken, tenantIsolation, requirePermission('procurement'), (req, res) => {
  const db = getDb();
  const tcoData = [
    { supplierName: '鑫源材料', material: '钢板Q235', purchasePrice: 4200, logisticsCost: 120, qualityCost: 85, inventoryCost: 60, totalTco: 4465 },
    { supplierName: '恒达钢铁', material: '钢板Q235', purchasePrice: 4350, logisticsCost: 90, qualityCost: 40, inventoryCost: 55, totalTco: 4535 },
    { supplierName: '东方金属', material: '钢板Q235', purchasePrice: 4100, logisticsCost: 180, qualityCost: 150, inventoryCost: 80, totalTco: 4510 }
  ];
  tcoData.sort((a, b) => a.totalTco - b.totalTco);
  tcoData.forEach((d, i) => { d.rank = i + 1; d.recommended = i === 0; });
  res.json(success(tcoData));
});

// 价格趋势
router.get('/price-trends', verifyToken, tenantIsolation, requirePermission('procurement'), (req, res) => {
  const db = getDb();
  let sql = `
    SELECT po.order_date as date, po.material_name, AVG(po.unit_price) as avgPrice
    FROM purchase_orders po
    WHERE po.status = 'completed'
  `;
  const params = [];
  if (isSaaS) {
    sql += ` AND po.tenant_id = ?`;
    params.push(req.tenantId);
  }
  sql += `
    GROUP BY strftime('%Y-%m', po.order_date), po.material_id
    ORDER BY date DESC LIMIT 24
  `;

  const rows = db.prepare(sql).all(...params);

  if (rows.length === 0) {
    const mock = [];
    for (let i = 11; i >= 0; i--) {
      mock.push({
        date: new Date(Date.now() - i * 30 * 86400000).toISOString().slice(0, 10),
        materialName: '钢板Q235',
        avgPrice: Number((4000 + Math.random() * 600 - 300).toFixed(2)),
        marketIndex: Number((95 + Math.random() * 10).toFixed(1))
      });
    }
    return res.json(success(mock));
  }
  res.json(success(rows));
});

// 集采建议
router.get('/central-purchase', verifyToken, tenantIsolation, requirePermission('procurement'), (req, res) => {
  const suggestions = [
    { id: 1, material: '钢板Q235', departments: ['一车间', '二车间'], totalQty: 50, unit: '吨', currentSuppliers: ['鑫源', '恒达'], suggestedSupplier: '鑫源材料', savingEstimate: 12500, urgency: 'high' },
    { id: 2, material: '铜线', departments: ['三车间', '技术部'], totalQty: 200, unit: 'kg', currentSuppliers: ['华铜'], suggestedSupplier: '华铜实业', savingEstimate: 3200, urgency: 'medium' },
    { id: 3, material: '螺丝M8', departments: ['一车间', '二车间', '三车间'], totalQty: 10000, unit: '个', currentSuppliers: ['标准件厂A', '标准件厂B'], suggestedSupplier: '标准件厂A', savingEstimate: 800, urgency: 'low' }
  ];
  res.json(success(suggestions));
});

module.exports = router;
