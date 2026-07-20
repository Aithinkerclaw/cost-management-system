import request from '@/utils/request';

// 获取成本科目列表
export function getCostAccountList(params) {
  return request({ url: '/api/cost-accounts/list', method: 'get', params });
}

// 获取单个成本科目
export function getCostAccount(id) {
  return request({ url: `/api/cost-accounts/${id}`, method: 'get' });
}

// 新增成本科目
export function createCostAccount(data) {
  return request({ url: '/api/cost-accounts/create', method: 'post', data });
}

// 更新成本科目
export function updateCostAccount(id, data) {
  return request({ url: `/api/cost-accounts/${id}`, method: 'put', data });
}

// 删除成本科目
export function deleteCostAccount(id) {
  return request({ url: `/api/cost-accounts/${id}`, method: 'delete' });
}

// 获取标准科目模板
export function getStandardTemplate() {
  return request({ url: '/api/cost-accounts/template/standard', method: 'get' });
}

// 初始化标准科目
export function initStandardAccounts() {
  return request({ url: '/api/cost-accounts/init-standard', method: 'post' });
}
