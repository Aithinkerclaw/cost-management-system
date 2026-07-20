import request from '@/utils/request';

/**
 * 获取成本核算方法列表
 * @param {Object} params - 查询参数
 * @returns {Promise}
 */
export function getCostAccountingMethods(params) {
  return request({
    url: '/api/cost-accounting-methods',
    method: 'get',
    params
  });
}

/**
 * 获取核算方法详情
 * @param {string} code - 方法编码
 * @returns {Promise}
 */
export function getCostAccountingMethodDetail(code) {
  return request({
    url: `/api/cost-accounting-methods/${code}`,
    method: 'get'
  });
}

/**
 * 创建核算方法
 * @param {Object} data - 方法数据
 * @returns {Promise}
 */
export function createCostAccountingMethod(data) {
  return request({
    url: '/api/cost-accounting-methods',
    method: 'post',
    data
  });
}

/**
 * 更新核算方法
 * @param {string} code - 方法编码
 * @param {Object} data - 方法数据
 * @returns {Promise}
 */
export function updateCostAccountingMethod(code, data) {
  return request({
    url: `/api/cost-accounting-methods/${code}`,
    method: 'put',
    data
  });
}

/**
 * 获取核算对象列表
 * @param {Object} params - 查询参数
 * @returns {Promise}
 */
export function getCostAccountingObjects(params) {
  return request({
    url: '/api/cost-accounting-methods/objects/list',
    method: 'get',
    params
  });
}

/**
 * 创建核算对象
 * @param {Object} data - 对象数据
 * @returns {Promise}
 */
export function createCostAccountingObject(data) {
  return request({
    url: '/api/cost-accounting-methods/objects',
    method: 'post',
    data
  });
}

/**
 * 获取成本分配列表
 * @param {Object} params - 查询参数
 * @returns {Promise}
 */
export function getCostAllocations(params) {
  return request({
    url: '/api/cost-accounting-methods/allocations/list',
    method: 'get',
    params
  });
}

/**
 * 创建成本分配记录
 * @param {Object} data - 分配数据
 * @returns {Promise}
 */
export function createCostAllocation(data) {
  return request({
    url: '/api/cost-accounting-methods/allocations',
    method: 'post',
    data
  });
}

/**
 * 计算产品成本
 * @param {Object} data - 计算参数
 * @returns {Promise}
 */
export function calculateCost(data) {
  return request({
    url: '/api/cost-accounting-methods/calculate',
    method: 'post',
    data
  });
}
