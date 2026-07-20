const express = require('express');
const { getDb, isSaaS } = require('../config/database');
const { success, error, paginate } = require('../utils/response');
const { verifyToken, requirePermission } = require('../middleware/auth');
const { tenantIsolation } = require('../middleware/tenant');

const router = express.Router();

// 核算总览
router.get('/overview', verifyToken, tenantIsolation, requirePermission('cost'), (req, res) => {
  const db = getDb();
  let sql = `
    SELECT
      COUNT(*) as totalOrders,
      COALESCE(SUM(total_cost), 0) as totalCost,
      COALESCE(AVG(unit_cost), 0) as avgUnitCost,
      COALESCE(SUM(material_cost_total), 0) as totalMaterial,
      COALESCE(SUM(labor_cost_total), 0) as totalLabor,
      COALESCE(SUM(overhead_cost_total), 0) as totalOverhead,
      COALESCE(SUM(quality_cost_total), 0) as totalQuality
    FROM orders WHERE status = 'completed'
  `;
  const params = [];
  if (isSaaS) {
    sql = `
      SELECT
        COUNT(*) as totalOrders,
        COALESCE(SUM(total_cost), 0) as totalCost,
        COALESCE(AVG(unit_cost), 0) as avgUnitCost,
        COALESCE(SUM(material_cost_total), 0) as totalMaterial,
        COALESCE(SUM(labor_cost_total), 0) as totalLabor,
        COALESCE(SUM(overhead_cost_total), 0) as totalOverhead,
        COALESCE(SUM(quality_cost_total), 0) as totalQuality
      FROM orders WHERE status = 'completed' AND tenant_id = ?
    `;
    params.push(req.tenantId);
  }
  const summary = db.prepare(sql).get(...params);

  // 按产品分类成本
  let byProductSql = `
    SELECT p.product_name, COUNT(o.id) as orderCount,
           SUM(o.total_cost) as totalCost, AVG(o.unit_cost) as avgUnitCost
    FROM orders o LEFT JOIN products p ON o.product_id = p.id
    WHERE o.status = 'completed' GROUP BY o.product_id
  `;
  const byProductParams = [];
  if (isSaaS) {
    byProductSql = `
      SELECT p.product_name, COUNT(o.id) as orderCount,
             SUM(o.total_cost) as totalCost, AVG(o.unit_cost) as avgUnitCost
      FROM orders o LEFT JOIN products p ON o.product_id = p.id
      WHERE o.status = 'completed' AND o.tenant_id = ? GROUP BY o.product_id
    `;
    byProductParams.push(req.tenantId);
  }
  const byProduct = db.prepare(byProductSql).all(...byProductParams);

  res.json(success({ ...summary, byProduct }));
});

// 材料成本明细
router.get('/materials', verifyToken, tenantIsolation, requirePermission('cost'), (req, res) => {
  const { page, pageSize, product_id } = req.query;
  const db = getDb();
  let sql = `
    SELECT bi.*, p.product_name
    FROM bom_items bi LEFT JOIN products p ON bi.product_id = p.id
    WHERE 1=1
  `;
  const params = [];
  if (isSaaS) {
    sql = `
      SELECT bi.*, p.product_name
      FROM bom_items bi LEFT JOIN products p ON bi.product_id = p.id
      WHERE bi.tenant_id = ?
    `;
    params.push(req.tenantId);
  }
  if (product_id) sql += ` AND bi.product_id = ${Number(product_id)}`;
  sql += ' ORDER BY bi.id';

  const rows = db.prepare(sql).all(...params);
  res.json(success(paginate(rows, page, pageSize)));
});

// 人工成本明细（模拟数据，无需租户过滤）
router.get('/labor', verifyToken, tenantIsolation, requirePermission('cost'), (req, res) => {
  const db = getDb();
  // 按班组/工序模拟数据
  const laborData = [
    { team: '一班', hours: 160, rate: 25, cost: 4000, efficiency: 92 },
    { team: '二班', hours: 155, rate: 25, cost: 3875, efficiency: 88 },
    { team: '三班', hours: 162, rate: 28, cost: 4536, efficiency: 95 }
  ];
  res.json(success(laborData));
});

// 制造费用明细（模拟数据，无需租户过滤）
router.get('/overhead', verifyToken, tenantIsolation, requirePermission('cost'), (req, res) => {
  const db = getDb();
  const overheadData = [
    { category: '设备折旧', amount: 25000, driverType: '机器工时', driverValue: 480, unitRate: 52.08 },
    { category: '厂房租金', amount: 15000, driverType: '面积', driverValue: 1000, unitRate: 15 },
    { category: '能源动力', amount: 8000, driverType: '机器工时', driverValue: 480, unitRate: 16.67 },
    { category: '辅助材料', amount: 5000, driverType: '产量', driverValue: 2000, unitRate: 2.5 },
    { category: '其他制造费', amount: 3000, driverType: '人工工时', driverValue: 477, unitRate: 6.29 }
  ];
  res.json(success(overheadData));
});

// 订单成本追溯
router.get('/orders/:id', verifyToken, tenantIsolation, requirePermission('cost'), (req, res) => {
  const db = getDb();
  let orderSql = `
    SELECT o.*, p.product_name FROM orders o
    LEFT JOIN products p ON o.product_id = p.id WHERE o.id = ?
  `;
  const orderParams = [req.params.id];
  if (isSaaS) {
    orderSql = `
      SELECT o.*, p.product_name FROM orders o
      LEFT JOIN products p ON o.product_id = p.id WHERE o.id = ? AND o.tenant_id = ?
    `;
    orderParams.push(req.tenantId);
  }
  const order = db.prepare(orderSql).get(...orderParams);

  if (!order) return res.json(error(404, '订单不存在'));

  // 关联BOM明细（同样加 tenant 过滤）
  let bomSql = 'SELECT * FROM bom_items WHERE product_id = ?';
  let bomParams = [order.product_id];
  if (isSaaS) {
    bomSql = 'SELECT * FROM bom_items WHERE product_id = ? AND tenant_id = ?';
    bomParams.push(req.tenantId);
  }
  const bomItems = db.prepare(bomSql).all(...bomParams);

  // 关联采购记录（同样加 tenant 过滤）
  let purSql = 'SELECT * FROM purchase_orders WHERE material_id IN (SELECT material_id FROM bom_items WHERE product_id = ?)';
  let purParams = [order.product_id];
  if (isSaaS) {
    purSql = 'SELECT * FROM purchase_orders WHERE tenant_id = ? AND material_id IN (SELECT material_id FROM bom_items WHERE product_id = ? AND tenant_id = ?)';
    purParams = [req.tenantId, order.product_id, req.tenantId];
  }
  const purchases = db.prepare(purSql).all(...purParams);

  // 关联工单（订单穿透链路关键数据）
  let woSql = 'SELECT * FROM work_orders WHERE order_id = ?';
  let woParams = [order.id];
  if (isSaaS) {
    woSql = 'SELECT * FROM work_orders WHERE order_id = ? AND tenant_id = ?';
    woParams = [order.id, req.tenantId];
  }
  const workOrders = db.prepare(woSql).all(...woParams);

  // 关联质检记录（通过工单ID或订单ID）
  let qiSql = 'SELECT qi.* FROM quality_inspections qi WHERE qi.order_id = ?';
  let qiParams = [order.id];
  if (isSaaS) {
    qiSql = 'SELECT qi.* FROM quality_inspections qi WHERE qi.order_id = ? AND qi.tenant_id = ?';
    qiParams = [order.id, req.tenantId];
  }
  const inspections = db.prepare(qiSql).all(...qiParams);

  res.json(success({ order, bomItems, purchases, workOrders, inspections }));
});

module.exports = router;
