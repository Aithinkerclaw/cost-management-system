/**
 * 平台总后台驾驶舱
 */
const express = require('express');
const { getDb } = require('../../config/database');
const { isSaaS } = require('../../config/index');
const { verifyPlatformToken } = require('./auth');
const { success, error } = require('../../utils/response');

const router = express.Router();
router.use(verifyPlatformToken);

router.get('/', (req, res) => {
  if (!isSaaS) return res.json(error(403, '当前非 SaaS 模式'));
  const db = getDb();

  // 基础指标
  const totalTenants = db.prepare('SELECT COUNT(*) as cnt FROM tenants').get().cnt;
  const activeTenants = db.prepare("SELECT COUNT(*) as cnt FROM tenants WHERE status='active'").get().cnt;
  const trialTenants = db.prepare("SELECT COUNT(*) as cnt FROM tenants WHERE status='trial'").get().cnt;
  const suspendedTenants = db.prepare("SELECT COUNT(*) as cnt FROM tenants WHERE status='suspended'").get().cnt;

  const totalUsers = db.prepare('SELECT COUNT(*) as cnt FROM users').get().cnt;
  const activeUsers30d = db.prepare("SELECT COUNT(DISTINCT tenant_id) as cnt FROM users WHERE created_at > date('now','-30 days')").get().cnt;

  // 套餐分布
  const planDistribution = db.prepare(`
    SELECT p.plan_name, COUNT(t.id) as count
    FROM plans p LEFT JOIN tenants t ON t.plan_id = p.id
    GROUP BY p.plan_name
  `).all();

  // 近6月新增租户趋势
  const monthlyNewTenants = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const m = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const c = db.prepare("SELECT COUNT(*) as cnt FROM tenants WHERE strftime('%Y-%m', created_at) = ?").get(m).cnt;
    monthlyNewTenants.push({ month: m, count: c });
  }

  // Top5 活跃租户（用户数最多）
  const topTenants = db.prepare(`
    SELECT t.id, t.company_name, t.short_name, t.status,
      (SELECT COUNT(*) FROM users u WHERE u.tenant_id = t.id AND u.status=1) as user_count,
      t.created_at
    FROM tenants t ORDER BY user_count DESC LIMIT 5
  `).all();

  // 预估月收入
  const revenue = db.prepare(`
    SELECT COALESCE(SUM(p.price_monthly), 0) as monthly
    FROM tenants t JOIN plans p ON t.plan_id = p.id WHERE t.status IN ('active', 'trial')
  `).get();

  res.json(success({
    kpis: { totalTenants, activeTenants, trialTenants, suspendedTenants, totalUsers, activeUsers30d },
    planDistribution: planDistribution || [],
    monthlyTrend: monthlyNewTenants,
    topTenants: topTenants || [],
    revenue: { estimatedMonthly: revenue.monthly }
  }));
});

module.exports = router;
