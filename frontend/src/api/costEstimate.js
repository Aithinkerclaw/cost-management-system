import request from '@/utils/request';

// 获取成本估算列表
export function getCostEstimateList(params) {
  return request({ url: '/api/cost-estimate/list', method: 'get', params });
}

// 获取单个成本估算
export function getCostEstimate(id) {
  return request({ url: `/api/cost-estimate/${id}`, method: 'get' });
}

// 创建成本估算
export function createCostEstimate(data) {
  return request({ url: '/api/cost-estimate/create', method: 'post', data });
}

// 更新成本估算
export function updateCostEstimate(id, data) {
  return request({ url: `/api/cost-estimate/${id}`, method: 'put', data });
}

// 提交审批
export function submitCostEstimate(id) {
  return request({ url: `/api/cost-estimate/${id}/submit`, method: 'post' });
}

// 审批通过
export function approveCostEstimate(id) {
  return request({ url: `/api/cost-estimate/${id}/approve`, method: 'post' });
}

// 删除成本估算
export function deleteCostEstimate(id) {
  return request({ url: `/api/cost-estimate/${id}`, method: 'delete' });
}

// 获取估算明细
export function getCostEstimateDetails(id) {
  return request({ url: `/api/cost-estimate/${id}/details`, method: 'get' });
}
