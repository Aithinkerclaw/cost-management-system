import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '../stores/user'
import { isSaaSMode } from '../config'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/login/LoginView.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/403',
    name: 'Forbidden',
    component: () => import('../views/error/Forbidden.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/',
    component: () => import('../views/layout/MainLayout.vue'),
    redirect: '/dashboard',
    meta: { requiresAuth: true },
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('../views/dashboard/DashboardView.vue'),
        meta: { title: '成本驾驶舱', icon: 'DataAnalysis', module: 'dashboard', accessLevel: 'read' }
      },
      // 成本核算
      {
        path: 'cost/overview',
        name: 'CostOverview',
        component: () => import('../views/cost-accounting/CostOverview.vue'),
        meta: { title: '核算总览', icon: 'Coin', module: 'cost', accessLevel: 'read' }
      },
      {
        path: 'cost/material',
        name: 'MaterialCost',
        component: () => import('../views/cost-accounting/MaterialCost.vue'),
        meta: { title: '材料成本', icon: 'Box', module: 'cost', accessLevel: 'read' }
      },
      {
        path: 'cost/order-trace/:id?',
        name: 'OrderTrace',
        component: () => import('../views/cost-accounting/OrderTrace.vue'),
        meta: { title: '订单追溯', icon: 'Search', module: 'cost', accessLevel: 'read' }
      },
      // 采购管理
      {
        path: 'procurement/suppliers',
        name: 'SupplierList',
        component: () => import('../views/procurement/SupplierList.vue'),
        meta: { title: '供应商管理', icon: 'OfficeBuilding', module: 'procurement', accessLevel: 'read' }
      },
      {
        path: 'procurement/tco',
        name: 'TcoCalculator',
        component: () => import('../views/procurement/TcoCalculator.vue'),
        meta: { title: 'TCO分析', icon: 'Calculator', module: 'procurement', accessLevel: 'read' }
      },
      {
        path: 'procurement/price-trend',
        name: 'PriceTrend',
        component: () => import('../views/procurement/PriceTrend.vue'),
        meta: { title: '价格趋势', icon: 'TrendCharts', module: 'procurement', accessLevel: 'read' }
      },
      // 库存管理
      {
        path: 'inventory/materials',
        name: 'InventoryMaterials',
        component: () => import('../views/inventory/AbcAnalysis.vue'),
        meta: { title: '库存概览', icon: 'Goods', module: 'inventory', accessLevel: 'read' }
      },
      {
        path: 'inventory/safety-stock',
        name: 'SafetyStock',
        component: () => import('../views/inventory/SafetyStock.vue'),
        meta: { title: '安全库存', icon: 'Shield', module: 'inventory', accessLevel: 'read' }
      },
      {
        path: 'inventory/obsolete-alerts',
        name: 'ObsoleteAlerts',
        component: () => import('../views/inventory/ObsoleteAlerts.vue'),
        meta: { title: '呆滞预警', icon: 'WarningFilled', module: 'inventory', accessLevel: 'read' }
      },
      // 生产精益
      {
        path: 'production/oee',
        name: 'OeeCalculator',
        component: () => import('../views/production/OeeCalculator.vue'),
        meta: { title: 'OEE计算', icon: 'Cpu', module: 'production', accessLevel: 'read' }
      },
      {
        path: 'production/vsm',
        name: 'ValueStreamMap',
        component: () => import('../views/production/ValueStreamMap.vue'),
        meta: { title: '价值流图', icon: 'Share', module: 'production', accessLevel: 'read' }
      },
      {
        path: 'production/smed',
        name: 'SmedTracker',
        component: () => import('../views/production/SmedTracker.vue'),
        meta: { title: 'SMED换模', icon: 'Timer', module: 'production', accessLevel: 'read' }
      },
      // 质量成本
      {
        path: 'quality/overview',
        name: 'QualityOverview',
        component: () => import('../views/quality/QualityCostView.vue'),
        meta: { title: '质量成本总览', icon: 'CircleCheck', module: 'quality', accessLevel: 'read' }
      },
      {
        path: 'quality/paf',
        name: 'PafAnalysis',
        component: () => import('../views/quality/PafAnalysis.vue'),
        meta: { title: 'PAF分析', icon: 'PieChart', module: 'quality', accessLevel: 'read' }
      },
      {
        path: 'quality/spc',
        name: 'SpcChart',
        component: () => import('../views/quality/SpcChart.vue'),
        meta: { title: 'SPC控制图', icon: 'LineChart', module: 'quality', accessLevel: 'read' }
      },
      {
        path: 'quality/records',
        name: 'QualityRecords',
        component: () => import('../views/quality/QualityCostRecord.vue'),
        meta: { title: '质量成本录入', icon: 'Document', module: 'quality', accessLevel: 'full' }
      },
      {
        path: 'quality/standard',
        name: 'QualityCostStandard',
        component: () => import('../views/quality/QualityCostStandard.vue'),
        meta: { title: '质量成本标准分类', icon: 'List', module: 'quality', accessLevel: 'full' }
      },
      // v2.0 新增（国家标准对齐）
      {
        path: 'cost-estimate',
        name: 'CostEstimate',
        component: () => import('../views/cost-estimate/CostEstimate.vue'),
        meta: { title: '成本估算', icon: 'Calculator', module: 'cost', accessLevel: 'read' }
      },
      {
        path: 'cost-budgetary',
        name: 'CostBudgetary',
        component: () => import('../views/cost-budgetary/CostBudgetary.vue'),
        meta: { title: '成本概算', icon: 'Document', module: 'cost', accessLevel: 'read' }
      },
      // v2.0 P1功能（成本预算编制与控制）
      // v2.0 P1功能（成本核算方法配置）
      {
        path: 'cost-accounting/methods',
        name: 'CostAccountingMethods',
        component: () => import('../views/cost-accounting/CostAccountingMethods.vue'),
        meta: { title: '成本核算方法', icon: 'Setting', module: 'cost', accessLevel: 'full' }
      },
      // v2.0 P1功能（成本绩效评价KPI）
      {
        path: 'cost-kpi',
        name: 'CostKPI',
        component: () => import('../views/cost-kpi/CostKPI.vue'),
        meta: { title: '成本绩效评价', icon: 'DataAnalysis', module: 'cost', accessLevel: 'read' }
      },
      {
        path: 'cost-budget',
        name: 'CostBudget',
        component: () => import('../views/cost-budget/CostBudget.vue'),
        meta: { title: '成本预算', icon: 'Money', module: 'cost', accessLevel: 'full' }
      },
      {
        path: 'settings/cost-accounts',
        name: 'CostAccounts',
        component: () => import('../views/settings/CostAccounts.vue'),
        meta: { title: '成本科目配置', icon: 'Setting', module: 'system', accessLevel: 'full' }
      },
      // AI成本诊断（新方向核心功能）
      {
        path: 'ai/diagnosis',
        name: 'AIDiagnosis',
        component: () => import('../views/ai/Diagnosis.vue'),
        meta: { title: 'AI成本诊断', icon: 'Cpu', module: 'ai', accessLevel: 'read' }
      },
      // 设计成本
      {
        path: 'design/changes',
        name: 'DesignChanges',
        component: () => import('../views/design-cost/DesignCostView.vue'),
        meta: { title: '设计变更', icon: 'Edit', module: 'design', accessLevel: 'read' }
      },
      // 设计成本子模块
      {
        path: 'design/target',
        name: 'DesignTarget',
        component: () => import('../views/design-cost/TargetCost.vue'),
        meta: { title: '目标成本', icon: 'Aim', module: 'design', accessLevel: 'read' }
      },
      {
        path: 'design/track',
        name: 'DesignTrack',
        component: () => import('../views/design-cost/DesignCostTrack.vue'),
        meta: { title: '设计成本核算', icon: 'Scale', module: 'design', accessLevel: 'read' }
      },
      // 激励中心
      {
        path: 'incentive/calculator',
        name: 'ShareCalculator',
        component: () => import('../views/incentive/ShareCalculator.vue'),
        meta: { title: '分享计算器', icon: 'Money', module: 'incentive', accessLevel: 'full' }
      },
      {
        path: 'incentive/proposals',
        name: 'ProposalManage',
        component: () => import('../views/incentive/ProposalManage.vue'),
        meta: { title: '改善提案', icon: 'EditPen', module: 'incentive', accessLevel: 'read' }
      },
      {
        path: 'incentive/leaderboard',
        name: 'LeanCert',
        component: () => import('../views/incentive/LeanCert.vue'),
        meta: { title: '积分排行榜', icon: 'Trophy', module: 'incentive', accessLevel: 'read' }
      },
      // 系统管理
      {
        path: 'system/users',
        name: 'UserManage',
        component: () => import('../views/system/UserManage.vue'),
        meta: { title: '用户管理', icon: 'User', module: 'system', accessLevel: 'read' }
      }
    ]
  },
  // ====== 平台总后台路由（仅 SaaS 模式）======
  ...(isSaaSMode ? [{
    path: '/platform/login',
    name: 'PlatformLogin',
    component: () => import('../views/platform/login/PlatformLoginView.vue'),
    meta: { requiresAuth: false }
  }, {
    path: '/platform',
    redirect: '/platform/dashboard',
    component: () => import('../views/platform/layout/PlatformLayout.vue'),
    children: [
      { path: 'dashboard', name: 'PlatformDashboard', component: () => import('../views/platform/dashboard/PlatformDashboard.vue') },
      { path: 'tenants', name: 'TenantList', component: () => import('../views/platform/tenants/TenantList.vue') },
      { path: 'plans', name: 'PlanManage', component: () => import('../views/platform/plans/PlanManage.vue') },
      { path: 'users', name: 'PlatformUsers', component: () => import('../views/platform/users/PlatformUserManage.vue') },
      { path: 'analytics', name: 'Analytics', component: () => import('../views/platform/analytics/AnalyticsView.vue') },
      { path: 'settings', name: 'PlatformSettings', component: () => import('../views/platform/settings/SystemSettings.vue') },
      { path: 'audit-log', name: 'AuditLog', component: () => import('../views/platform/audit-log/AuditLogView.vue') }
    ]
  }] : []),
  {
    path: '/:pathMatch(.*)*',
    redirect: '/'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫
router.beforeEach((to, from, next) => {
  const userStore = useUserStore()

  // 平台总后台路由的独立认证
  if (isSaaSMode && to.path.startsWith('/platform')) {
    const platformToken = localStorage.getItem('platformToken')
    if (to.path === '/platform/login') {
      if (platformToken) { next('/platform/dashboard'); return }
      next(); return
    }
    if (!platformToken) { next('/platform/login'); return }
    next(); return
  }

  // 不需要认证的页面直接放行
  if (to.meta.requiresAuth === false) {
    if (to.path === '/login' && userStore.isLoggedIn) {
      next('/')
    } else {
      next()
    }
    return
  }

  // 需要认证但未登录
  if (!userStore.isLoggedIn) {
    next('/login')
    return
  }

  // 权限检查
  if (to.meta.module) {
    const perms = userStore.userInfo?.permissions || {}
    const level = perms[to.meta.module] || 'none'
    const requiredLevel = to.meta.accessLevel || 'read'

    // 兼容处理：如果权限对象为空（旧缓存）或模块不存在于权限列表中，对已登录用户默认放行
    // 防止新增模块部署后，未重新登录的用户被误拦到403
    if (Object.keys(perms).length === 0) {
      next() // 权限为空时放行（可能是旧缓存或非权限模式）
      return
    }

    if (level === 'none') {
      next('/403')
      return
    }
    if (level === 'read' && requiredLevel === 'full') {
      next('/403')
      return
    }
  }

  next()
})

export default router
