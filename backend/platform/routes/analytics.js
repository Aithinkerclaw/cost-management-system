/**
 * 运营分析路由
 */
const express = require('express');
const { getDb } = require('../../config/database');
const { isSaaS } = require('../../config/index');
const { verifyPlatformToken } = require('./auth');
const { success, error } = require('../../utils/response');

const router = express.Router();
router.use(verifyPlatformToken);

// 运营分析总览（聚合 3 个子指标）
router.get('/', (req, res) => {
  if (!isSaaS) return res.json(error(403, '当前非 SaaS 模式'));
  const db = getDb();

  // 收费趋势
  const revenue = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const m = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const newTenants = db.prepare("SELECT COUNT(*) as cnt FROM tenants WHERE strftime('%Y-%m', created_at) = ?").get(m).cnt;
    revenue.push({ month: m, newTenants });
  }

  // 行业分布
  const industries = db.prepare("SELECT industry as name, COUNT(*) as value FROM tenants WHERE industry IS NOT NULL AND industry != '' GROUP BY industry ORDER BY value DESC LIMIT 10").all() || [];

  // 模块使用热度
  const moduleUsage = [
    { name: '成本核算', count: db.prepare('SELECT COUNT(*) as cnt FROM orders').get().cnt },
    { name: '采购管理', count: db.prepare('SELECT COUNT(*) as cnt FROM purchase_orders').get().cnt },
    { name: '库存控制', count: db.prepare('SELECT COUNT(*) as cnt FROM inventory_records').get().cnt },
    { name: '生产精益', count: db.prepare('SELECT COUNT(*) as cnt FROM oee_records').get().cnt },
    { name: '质量成本', count: db.prepare('SELECT COUNT(*) as cnt FROM quality_costs').get().cnt },
    { name: '激励中心', count: db.prepare('SELECT COUNT(*) as cnt FROM improvement_proposals').get().cnt }
  ];

  res.json(success({ revenue, industries, moduleUsage }));
});

// 收费趋势
router.get('/revenue', (req, res) => {
  if (!isSaaS) return res.json(error(403, '当前非 SaaS 模式'));
  const db = getDb();
  const data = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const m = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const newTenants = db.prepare("SELECT COUNT(*) as cnt FROM tenants WHERE strftime('%Y-%m', created_at) = ?").get(m).cnt;
    data.push({ month: m, newTenants });
  }
  res.json(success(data));
});

// 行业分布
router.get('/industries', (req, res) => {
  if (!isSaaS) return res.json(error(403, '当前非 SaaS 模式'));
  const db = getDb();
  const list = db.prepare("SELECT industry as name, COUNT(*) as value FROM tenants WHERE industry IS NOT NULL AND industry != '' GROUP BY industry ORDER BY value DESC LIMIT 10").all();
  res.json(success(list || []));
});

// 模块使用热度（基于各表数据量）
router.get('/module-usage', (req, res) => {
  if (!isSaaS) return res.json(error(403, '当前非 SaaS 模式'));
  const db = getDb();
  const modules = [
    { name: '成本核算', count: db.prepare('SELECT COUNT(*) as cnt FROM orders').get().cnt },
    { name: '采购管理', count: db.prepare('SELECT COUNT(*) as cnt FROM purchase_orders').get().cnt },
    { name: '库存控制', count: db.prepare('SELECT COUNT(*) as cnt FROM inventory_records').get().cnt },
    { name: '生产精益', count: db.prepare('SELECT COUNT(*) as cnt FROM oee_records').get().cnt },
    { name: '质量成本', count: db.prepare('SELECT COUNT(*) as cnt FROM quality_costs').get().cnt },
    { name: '激励中心', count: db.prepare('SELECT COUNT(*) as cnt FROM improvement_proposals').get().cnt }
  ];
  res.json(success(modules));
});

module.exports = router;
