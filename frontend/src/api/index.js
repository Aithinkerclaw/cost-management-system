import request from './request'

// ====== 租户业务 API ======

export const dashboardApi = {
  getKpis: () => request.get('/dashboard/kpis'),
  getCostStructure: () => request.get('/dashboard/cost-structure'),
  getUnitCostTrend: () => request.get('/dashboard/unit-cost-trend'),
  getAlerts: () => request.get('/dashboard/alerts'),
  getProjects: () => request.get('/dashboard/projects')
}

export const costApi = {
  getOverview: () => request.get('/cost-accounting/overview'),
  getMaterials: (params) => request.get('/cost-accounting/materials', { params }),
  getLabor: () => request.get('/cost-accounting/labor'),
  getOverhead: () => request.get('/cost-accounting/overhead'),
  getOrderTrace: (id) => request.get(`/cost-accounting/orders/${id}`)
}

export const procurementApi = {
  getSuppliers: (params) => request.get('/procurement/suppliers', { params }),
  createSupplier: (data) => request.post('/procurement/suppliers', data),
  updateSupplier: (id, data) => request.put(`/procurement/suppliers/${id}`, data),
  getTco: () => request.get('/procurement/tco'),
  getPriceTrends: () => request.get('/procurement/price-trends'),
  getCentralPurchase: () => request.get('/procurement/central-purchase')
}

export const inventoryApi = {
  getMaterials: (params) => request.get('/inventory/materials', { params }),
  getAbcAnalysis: () => request.get('/inventory/abc-analysis'),
  getSafetyStock: (params) => request.get('/inventory/safety-stock', { params }),
  getObsoleteAlerts: () => request.get('/inventory/obsolete-alerts'),
  simulateTurnover: (data) => request.post('/inventory/turnover-simulate', data)
}

export const productionApi = {
  submitOee: (data) => request.post('/production/oee', data),
  getOee: (date) => request.get(`/production/oee/${date || ''}`),
  getVsmData: () => request.get('/production/vsm-data'),
  submitSmed: (data) => request.post('/production/smed', data),
  getBottleneck: () => request.get('/production/bottleneck')
}

export const qualityApi = {
  getOverview: () => request.get('/quality/overview'),
  getPaf: () => request.get('/quality/paf'),
  submitSpc: (data) => request.post('/quality/spc', data),
  getDefectTrace: (batchNo) => request.get(`/quality/defect-trace/${batchNo}`),
  getRecordList: () => request.get('/quality/records'),
  createRecord: (data) => request.post('/quality/record', data),
  updateRecord: (id, data) => request.put(`/quality/record/${id}`, data),
  deleteRecord: (id) => request.delete(`/quality/record/${id}`)
}

export const incentiveApi = {
  getRules: () => request.get('/incentive/calculator'),
  calculateBonus: (data) => request.post('/incentive/calculate', data),
  getProposals: (params) => request.get('/incentive/proposals', { params }),
  submitProposal: (data) => request.post('/incentive/proposals', data),
  updateProposalStatus: (id, data) => request.put(`/incentive/proposals/${id}/status`, data),
  getLeaderboard: () => request.get('/incentive/leaderboard')
}

export const authApi = {
  login: (data) => request.post('/auth/login', data),
  getProfile: () => request.get('/auth/profile'),
  changePassword: (data) => request.put('/auth/change-password', data)
}

export const usersApi = {
  getList: (params) => request.get('/users', { params }),
  create: (data) => request.post('/users', data),
  update: (id, data) => request.put(`/users/${id}`, data),
  toggleStatus: (id, status) => request.patch(`/users/${id}/status`, { status }),
  resetPassword: (id, newPassword) => request.put(`/users/${id}/password`, { newPassword }),
  delete: (id) => request.delete(`/users/${id}`)
}

export const rolesApi = {
  getList: () => request.get('/roles'),
  getMyPermissions: () => request.get('/roles/my-permissions')
}

// ====== 平台总后台 API（仅 SaaS 模式）======
export const platformAuthApi = {
  login: (data) => request.post('/platform/auth/login', data),
  getProfile: () => request.get('/platform/auth/profile'),
  changePassword: (data) => request.put('/platform/auth/change-password', data)
}

export const platformTenantApi = {
  getList: (params) => request.get('/platform/tenants', { params }),
  getDetail: (id) => request.get(`/platform/tenants/${id}`),
  getStats: (id) => request.get(`/platform/tenants/${id}/stats`),
  create: (data) => request.post('/platform/tenants', data),
  update: (id, data) => request.put(`/platform/tenants/${id}`, data),
  toggleStatus: (id, status) => request.patch(`/platform/tenants/${id}/status`, { status }),
  delete: (id) => request.delete(`/platform/tenants/${id}`),
  loginAs: (id) => request.post(`/platform/tenants/${id}/login-as`)
}

export const platformPlanApi = {
  getList: () => request.get('/platform/plans'),
  getDetail: (id) => request.get(`/platform/plans/${id}`),
  update: (id, data) => request.put(`/platform/plans/${id}`, data)
}

export const platformUserApi = {
  getList: () => request.get('/platform/users'),
  create: (data) => request.post('/platform/users', data),
  update: (id, data) => request.put(`/platform/users/${id}`, data)
}

export const platformDashboardApi = {
  getData: () => request.get('/platform/dashboard')
}

export const platformAnalyticsApi = {
  getRevenue: () => request.get('/platform/analytics/revenue'),
  getIndustries: () => request.get('/platform/analytics/industries'),
  getModuleUsage: () => request.get('/platform/analytics/module-usage')
}

export const platformSettingsApi = {
  get: () => request.get('/platform/settings')
}

export const platformAuditLogApi = {
  getList: (params) => request.get('/platform/audit-log', { params })
}

export const designCostApi = {
  list: () => request.get('/design-cost'),
  create: (data) => request.post('/design-cost', data),
  update: (id, data) => request.put(`/design-cost/${id}`, data),
  delete: (id) => request.delete(`/design-cost/${id}`),
  dfa: (data) => request.post('/design-cost/dfa', data),
  // 目标成本
  getTargetList: () => request.get('/design-cost/target'),
  createTarget: (data) => request.post('/design-cost/target', data),
  updateTarget: (id, data) => request.put(`/design-cost/target/${id}`, data),
  deleteTarget: (id) => request.delete(`/design-cost/target/${id}`),
  // 设计成本核算
  getTrackList: () => request.get('/design-cost/track'),
  createTrack: (data) => request.post('/design-cost/track', data),
  updateTrack: (id, data) => request.put(`/design-cost/track/${id}`, data),
  deleteTrack: (id) => request.delete(`/design-cost/track/${id}`)
}

// AI成本诊断与改善建议
export const aiApi = {
  // 成本诊断（自动分析全系统数据）
  diagnose: () => request.post('/ai/diagnose'),
  // 模块改善建议
  suggest: (module, context) => request.post('/ai/suggest', { module, context }),
  // 获取诊断历史
  getHistory: () => request.get('/ai/history')
}

// 通知推送
export const notificationApi = {
  // 获取通知列表
  getList: (page, pageSize) => request.get('/notifications/list', { params: { page, pageSize } }),
  // 标记已读
  read: (id) => request.post(`/notifications/read/${id}`),
  // 全部标记已读
  readAll: () => request.post('/notifications/read-all')
}
