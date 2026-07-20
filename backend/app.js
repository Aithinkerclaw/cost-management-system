const express = require('express');
const cors = require('cors');
const path = require('path');
const { isSaaS } = require('./config/index');

// 路由
const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');
const costRoutes = require('./routes/cost-accounting');
const procurementRoutes = require('./routes/procurement');
const inventoryRoutes = require('./routes/inventory');
const productionRoutes = require('./routes/production');
const qualityRoutes = require('./routes/quality');
const designCostRoutes = require('./routes/design-cost');
const incentiveRoutes = require('./routes/incentive');
const usersRoutes = require('./routes/users');
const rolesRoutes = require('./routes/roles');
// v2.0 新增路由（国家标准对齐）
const costAccountsRoutes = require('./routes/cost-accounts');
const qualityCostRoutes = require('./routes/quality-cost');
const costEstimateRoutes = require('./routes/cost-estimate');
const costBudgetaryRoutes = require('./routes/cost-budgetary');
const costBudgetRoutes = require('./routes/cost-budget');  // 成本预算编制与控制
const costAccountingMethodsRoutes = require('./routes/cost-accounting-methods');  // 成本核算方法配置
const costKpiRoutes = require('./routes/cost-kpi');  // 成本绩效评价KPI
const aiRoutes = require('./routes/ai');  // AI成本诊断与改善建议
const notificationRoutes = require('./routes/notifications');  // 通知推送

// 租户隔离中间件（SaaS 模式）
const { tenantIsolation } = require('./middleware/tenant');

const app = express();

// 基础中间件
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 静态文件服务（前端构建产物）
app.use(express.static(path.join(__dirname, '../frontend/dist')));

// ====== SaaS 平台总后台路由（仅 saas 模式加载）======
if (isSaaS) {
  const platformAuth = require('./platform/routes/auth');
  const platformTenants = require('./platform/routes/tenants');
  const platformPlans = require('./platform/routes/plans');
  const platformUsers = require('./platform/routes/users');
  const platformDashboard = require('./platform/routes/dashboard');
  const platformAnalytics = require('./platform/routes/analytics');
  const platformSettings = require('./platform/routes/settings');
  const platformAuditLog = require('./platform/routes/audit-log');

  // 平台管理 API（独立认证体系）
  app.use('/platform/auth', platformAuth.router);
  app.use('/platform/tenants', platformTenants);
  app.use('/platform/plans', platformPlans);
  app.use('/platform/users', platformUsers);
  app.use('/platform/dashboard', platformDashboard);
  app.use('/platform/analytics', platformAnalytics);
  app.use('/platform/settings', platformSettings);
  app.use('/platform/audit-log', platformAuditLog);

  console.log('[SaaS] 平台总后台路由已加载 (/platform/*)');
}

// ====== 租户业务 API 路由（两种模式都有）======
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/cost-accounting', costRoutes);
app.use('/api/procurement', procurementRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/production', productionRoutes);
app.use('/api/quality', qualityRoutes);
app.use('/api/design-cost', designCostRoutes);
app.use('/api/incentive', incentiveRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/roles', rolesRoutes);
// v2.0 新增路由（国家标准对齐）
app.use('/api/cost-accounts', costAccountsRoutes);
app.use('/api/quality-cost', qualityCostRoutes);
app.use('/api/cost-estimate', costEstimateRoutes);
app.use('/api/cost-budgetary', costBudgetaryRoutes);
app.use('/api/cost-budget', costBudgetRoutes);  // 成本预算编制与控制
app.use('/api/cost-accounting-methods', costAccountingMethodsRoutes);  // 成本核算方法配置
app.use('/api/cost-kpi', costKpiRoutes);  // 成本绩效评价KPI
app.use('/api/ai', aiRoutes);  // AI成本诊断与改善建议
app.use('/api/notifications', notificationRoutes.router);  // 通知推送

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({
    code: 200,
    message: 'ok',
    data: {
      timestamp: new Date().toISOString(),
      mode: isSaaS ? 'saas' : 'standalone'
    }
  });
});

// 测试路由
app.get('/api/test', (req, res) => {
  res.json({ message: 'test ok' });
});

// 全局错误处理
const errorHandler = require('./middleware/errorHandler');
app.use(errorHandler);

// 404处理 + SPA fallback
app.use((req, res) => {
  // API 路由未找到
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ code: 404, message: '接口不存在', data: null });
  }
  // SPA fallback: 非API请求返回 index.html
  res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});

module.exports = app;
