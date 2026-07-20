import request from '@/utils/request';

/**
 * 获取KPI指标库列表
 * @param {Object} params - 查询参数
 * @returns {Promise}
 */
export function getCostKpiLibrary(params) {
  return request({
    url: '/api/cost-kpi/library',
    method: 'get',
    params
  });
}

/**
 * 获取KPI指标详情
 * @param {number} id - KPI ID
 * @returns {Promise}
 */
export function getCostKpiDetail(id) {
  return request({
    url: `/api/cost-kpi/library/${id}`,
    method: 'get'
  });
}

/**
 * 创建KPI指标
 * @param {Object} data - KPI数据
 * @returns {Promise}
 */
export function createCostKpi(data) {
  return request({
    url: '/api/cost-kpi/library',
    method: 'post',
    data
  });
}

/**
 * 更新KPI指标
 * @param {number} id - KPI ID
 * @param {Object} data - KPI数据
 * @returns {Promise}
 */
export function updateCostKpi(id, data) {
  return request({
    url: `/api/cost-kpi/library/${id}`,
    method: 'put',
    data
  });
}

/**
 * 获取成本绩效评价列表
 * @param {Object} params - 查询参数
 * @returns {Promise}
 */
export function getCostKpiEvaluations(params) {
  return request({
    url: '/api/cost-kpi/evaluations',
    method: 'get',
    params
  });
}

/**
 * 获取评价详情
 * @param {number} id - 评价ID
 * @returns {Promise}
 */
export function getCostKpiEvaluationDetail(id) {
  return request({
    url: `/api/cost-kpi/evaluations/${id}`,
    method: 'get'
  });
}

/**
 * 创建成本绩效评价
 * @param {Object} data - 评价数据
 * @returns {Promise}
 */
export function createCostKpiEvaluation(data) {
  return request({
    url: '/api/cost-kpi/evaluations',
    method: 'post',
    data
  });
}

/**
 * 更新KPI评分
 * @param {number} evaluationId - 评价ID
 * @param {number} scoreId - 评分ID
 * @param {Object} data - 评分数据
 * @returns {Promise}
 */
export function updateCostKpiScore(evaluationId, scoreId, data) {
  return request({
    url: `/api/cost-kpi/evaluations/${evaluationId}/scores/${scoreId}`,
    method: 'put',
    data
  });
}

/**
 * 计算评价总分
 * @param {number} id - 评价ID
 * @returns {Promise}
 */
export function calculateCostKpiEvaluation(id) {
  return request({
    url: `/api/cost-kpi/evaluations/${id}/calculate`,
    method: 'post'
  });
}
