import request from '@/utils/request';

// 获取质量成本标准分类列表
export function getQualityCostStandardList(params) {
  return request({ url: '/api/quality-cost/list', method: 'get', params });
}

// 按类别统计质量成本
export function getQualityCostStats() {
  return request({ url: '/api/quality-cost/stats', method: 'get' });
}

// 新增质量成本项目
export function createQualityCostStandard(data) {
  return request({ url: '/api/quality-cost/create', method: 'post', data });
}

// 更新质量成本项目
export function updateQualityCostStandard(id, data) {
  return request({ url: `/api/quality-cost/${id}`, method: 'put', data });
}

// 删除质量成本项目
export function deleteQualityCostStandard(id) {
  return request({ url: `/api/quality-cost/${id}`, method: 'delete' });
}

// 初始化GB/T 46709标准分类
export function initStandardQualityCost() {
  return request({ url: '/api/quality-cost/init-standard', method: 'post' });
}
