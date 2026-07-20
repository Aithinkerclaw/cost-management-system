import request from '@/utils/request';

/**
 * 获取成本预算列表
 * @param {Object} params - 查询参数
 * @returns {Promise}
 */
export function getCostBudgetList(params) {
  return request({
    url: '/api/cost-budgets',
    method: 'get',
    params
  });
}

/**
 * 获取成本预算详情
 * @param {number} id - 预算ID
 * @returns {Promise}
 */
export function getCostBudgetDetail(id) {
  return request({
    url: `/api/cost-budgets/${id}`,
    method: 'get'
  });
}

/**
 * 创建成本预算
 * @param {Object} data - 预算数据
 * @returns {Promise}
 */
export function createCostBudget(data) {
  return request({
    url: '/api/cost-budgets',
    method: 'post',
    data
  });
}

/**
 * 更新成本预算
 * @param {number} id - 预算ID
 * @param {Object} data - 预算数据
 * @returns {Promise}
 */
export function updateCostBudget(id, data) {
  return request({
    url: `/api/cost-budgets/${id}`,
    method: 'put',
    data
  });
}

/**
 * 删除成本预算
 * @param {number} id - 预算ID
 * @returns {Promise}
 */
export function deleteCostBudget(id) {
  return request({
    url: `/api/cost-budgets/${id}`,
    method: 'delete'
  });
}

/**
 * 提交预算审批
 * @param {number} id - 预算ID
 * @returns {Promise}
 */
export function submitBudgetApproval(id) {
  return request({
    url: `/api/cost-budgets/${id}/submit-approval`,
    method: 'post'
  });
}

/**
 * 审批预算
 * @param {number} id - 预算ID
 * @param {Object} data - 审批数据
 * @returns {Promise}
 */
export function approveBudget(id, data) {
  return request({
    url: `/api/cost-budgets/${id}/approve`,
    method: 'post',
    data
  });
}

/**
 * 获取预算执行监控数据
 * @param {number} id - 预算ID
 * @param {Object} params - 查询参数
 * @returns {Promise}
 */
export function getBudgetExecution(id, params) {
  return request({
    url: `/api/cost-budgets/${id}/execution`,
    method: 'get',
    params
  });
}

/**
 * 更新预算执行数据
 * @param {number} id - 预算ID
 * @param {Object} data - 执行数据
 * @returns {Promise}
 */
export function updateBudgetExecution(id, data) {
  return request({
    url: `/api/cost-budgets/${id}/update-execution`,
    method: 'post',
    data
  });
}

/**
 * 获取成本科目列表（用于预算编制）
 * @returns {Promise}
 */
export function getCostAccountsForBudget() {
  return request({
    url: '/api/cost-accounts',
    method: 'get',
    params: { is_enabled: true, page_size: 1000 }
  });
}
