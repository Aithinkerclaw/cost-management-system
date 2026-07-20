import request from '@/utils/request';

// 获取成本概算列表
export function getCostBudgetaryList(params) {
  return request({ url: '/api/cost-budgetary/list', method: 'get', params });
}

// 获取单个成本概算
export function getCostBudgetary(id) {
  return request({ url: `/api/cost-budgetary/${id}`, method: 'get' });
}

// 创建成本概算
export function createCostBudgetary(data) {
  return request({ url: '/api/cost-budgetary/create', method: 'post', data });
}

// 更新成本概算
export function updateCostBudgetary(id, data) {
  return request({ url: `/api/cost-budgetary/${id}`, method: 'put', data });
}

// 提交审批
export function submitCostBudgetary(id) {
  return request({ url: `/api/cost-budgetary/${id}/submit`, method: 'post' });
}

// 审批通过
export function approveCostBudgetary(id) {
  return request({ url: `/api/cost-budgetary/${id}/approve`, method: 'post' });
}

// 删除成本概算
export function deleteCostBudgetary(id) {
  return request({ url: `/api/cost-budgetary/${id}`, method: 'delete' });
}
