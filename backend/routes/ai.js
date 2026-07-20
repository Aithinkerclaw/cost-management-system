const express = require('express');
const { getDb, isSaaS } = require('../config/database');
const { success, error } = require('../utils/response');
const { verifyToken, requirePermission } = require('../middleware/auth');
const { tenantIsolation } = require('../middleware/tenant');
const axios = require('axios');
const { createNotification } = require('./notifications');

const router = express.Router();

// DeepSeek API 配置
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_API_URL = process.env.DEEPSEEK_API_URL || 'https://api.deepseek.com/v1/chat/completions';
const DEEPSEEK_MODEL = process.env.DEEPSEEK_MODEL || 'deepseek-chat';

// AI成本诊断（优先使用DeepSeek API，降级使用规则引擎）
router.post('/diagnose', verifyToken, tenantIsolation, requirePermission('dashboard'), async (req, res) => {
  const db = getDb();
  const tenantId = req.tenantId;

  // 1. 采集成本数据
  let sql = `
    SELECT
      COUNT(*) as totalOrders,
      COALESCE(SUM(total_cost), 0) as totalCost,
      COALESCE(AVG(unit_cost), 0) as avgUnitCost,
      COALESCE(AVG(material_cost_total), 0) as avgMaterial,
      COALESCE(AVG(labor_cost_total), 0) as avgLabor,
      COALESCE(AVG(overhead_cost_total), 0) as avgOverhead,
      COALESCE(AVG(quality_cost_total), 0) as avgQuality
    FROM orders WHERE status = 'completed'
  `;
  const params = [];
  if (isSaaS) {
    sql += ` AND tenant_id = ?`;
    params.push(tenantId);
  }
  const costData = db.prepare(sql).get(...params);

  // 2. 采集OEE数据
  let oeeSql = `SELECT AVG(oee) as avgOee FROM oee_records`;
  const oeeParams = [];
  if (isSaaS) {
    oeeSql += ` WHERE tenant_id = ?`;
    oeeParams.push(tenantId);
  }
  const oeeData = db.prepare(oeeSql).get(...oeeParams);

  // 3. 采集库存数据
  let invSql = `
    SELECT
      COUNT(*) as totalMaterials,
      COALESCE(SUM(current_stock * standard_price), 0) as totalInventoryValue,
      SUM(CASE WHEN current_stock > max_stock * 2 THEN 1 ELSE 0 END) as overStockCount
    FROM materials
  `;
  const invParams = [];
  if (isSaaS) {
    invSql += ` WHERE tenant_id = ?`;
    invParams.push(tenantId);
  }
  const invData = db.prepare(invSql).get(...invParams);

  // 4. AI诊断逻辑（优先DeepSeek API，降级使用规则引擎）
  let diagnoses = [];
  let suggestions = [];

  // 构造提示词
  const prompt = `你是一位精益成本管理专家。请根据以下数据，诊断企业成本问题并给出改善建议。

成本数据：
- 总订单数：${costData.totalOrders}
- 总成本：¥${costData.totalCost}
- 平均单位成本：¥${costData.avgUnitCost?.toFixed(2) || '0.00'}
- 平均OEE：${oeeData.avgOee ? oeeData.avgOee.toFixed(1) : 'N/A'}%
- 库存总值：¥${(invData.totalInventoryValue || 0).toLocaleString()}
- 积压物料数：${invData.overStockCount || 0} 种

请按以下JSON格式返回：
{
  "diagnoses": [
    {
      "type": "danger|warning|good",
      "title": "问题标题",
      "desc": "问题描述",
      "impact": "高|中|低",
      "action": "建议行动"
    }
  ],
  "suggestions": ["建议1", "建议2", "建议3"]
}

要求：
1. 至少返回1个诊断结果
2. 如果没有问题，返回type=good的诊断
3. 建议要具体可操作`;

  // 尝试调用DeepSeek API
  if (DEEPSEEK_API_KEY) {
    try {
      const aiRes = await axios.post(
        DEEPSEEK_API_URL,
        {
          model: DEEPSEEK_MODEL,
          messages: [{ role: 'user', content: prompt }],
          response_format: { type: 'json_object' }
        },
        {
          headers: {
            'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );

      const aiData = JSON.parse(aiRes.data.choices[0].message.content);
      diagnoses = aiData.diagnoses || [];
      suggestions = aiData.suggestions || [];
    } catch (err) {
      console.error('DeepSeek API调用失败，降级使用规则引擎：', err.message);
      // 降级到规则引擎
      ({ diagnoses, suggestions } = runRuleEngine(costData, oeeData, invData));
    }
  } else {
    // 没有配置API Key，使用规则引擎
    ({ diagnoses, suggestions } = runRuleEngine(costData, oeeData, invData));
  }

  // 5. 保存诊断结果到数据库
  const dataSnapshotJson = JSON.stringify({
    avgUnitCost: costData.avgUnitCost,
    avgOee: oeeData.avgOee,
    totalInventoryValue: invData.totalInventoryValue,
    overStockCount: invData.overStockCount,
    qualityRatio: parseFloat(qualityRatio.toFixed(1))
  });
  const diagnosesJson = JSON.stringify(diagnoses);
  const suggestionsJson = JSON.stringify(suggestions.slice(0, 5));

  const overallScore = diagnoses.filter(d => d.type === 'good').length > 0 ? 85 :
                     diagnoses.filter(d => d.type === 'warning').length > 0 ? 65 : 40;

  try {
    db.prepare(`
      INSERT INTO ai_diagnosis_history (diagnosed_at, overall_score, data_snapshot, diagnoses, suggestions, tenant_id)
      VALUES (datetime('now'), ?, ?, ?, ?, ?)
    `).run(
      overallScore,
      dataSnapshotJson,
      diagnosesJson,
      suggestionsJson,
      tenantId || 1
    );
  } catch (err) {
    console.error('保存诊断历史失败:', err.message);
  }

  // 5.5 自动创建通知（推送给用户）
  if (diagnoses.filter(d => d.type !== 'good').length > 0) {
    // 有问题，创建通知
    const issueCount = diagnoses.filter(d => d.type !== 'good').length;
    const notificationTitle = `🤖 AI诊断发现 ${issueCount} 个问题`;
    const notificationContent = diagnoses.filter(d => d.type !== 'good').map(d => d.title).join('；');

    try {
      createNotification(
        db,
        req.user.id,
        'diagnosis',
        notificationTitle,
        notificationContent,
        tenantId || 1
      );
    } catch (err) {
      console.error('创建通知失败:', err.message);
    }
  }

  // 6. 返回诊断报告
  res.json(success({
    diagnosedAt: new Date().toISOString(),
    dataSnapshot: JSON.parse(dataSnapshotJson),
    diagnoses,
    suggestions: suggestions.slice(0, 5),
    overallScore
  }));
});

// 获取诊断历史
router.get('/history', verifyToken, tenantIsolation, requirePermission('dashboard'), (req, res) => {
  const db = getDb();
  const tenantId = req.tenantId;
  const page = parseInt(req.query.page) || 1;
  const pageSize = parseInt(req.query.pageSize) || 10;
  const offset = (page - 1) * pageSize;

  let sql = `
    SELECT id, diagnosed_at, overall_score, data_snapshot, diagnoses, suggestions
    FROM ai_diagnosis_history
    WHERE 1=1
  `;
  const params = [];

  if (isSaaS) {
    sql += ` AND tenant_id = ?`;
    params.push(tenantId);
  }

  sql += ` ORDER BY diagnosed_at DESC LIMIT ? OFFSET ?`;
  params.push(pageSize, offset);

  const history = db.prepare(sql).all(...params).map(row => ({
    ...row,
    dataSnapshot: JSON.parse(row.data_snapshot || '{}'),
    diagnoses: JSON.parse(row.diagnoses || '[]'),
    suggestions: JSON.parse(row.suggestions || '[]')
  }));

  // 获取总数
  let countSql = `SELECT COUNT(*) as total FROM ai_diagnosis_history WHERE 1=1`;
  const countParams = [];
  if (isSaaS) {
    countSql += ` AND tenant_id = ?`;
    countParams.push(tenantId);
  }
  const total = db.prepare(countSql).get(...countParams).total;

  res.json(success({
    list: history,
    total,
    page,
    pageSize
  }));
});

// AI改善建议（针对特定模块）
router.post('/suggest', verifyToken, tenantIsolation, requirePermission('dashboard'), async (req, res) => {
  const { module, context } = req.body;

  // 模拟AI建议（实际应调用LLM）
  const suggestionsMap = {
    'procurement': [
      '实施TCO（总拥有成本）分析，选择最优供应商',
      '建立供应商评分卡，定期评估供应商绩效',
      '开展集中采购，提高议价能力'
    ],
    'production': [
      '应用价值流图（VSM），识别并消除浪费',
      '实施标准作业，减少变异',
      '开展OEE提升项目，目标达到85%'
    ],
    'inventory': [
      '执行ABC分析，差异化库存管理策略',
      '建立安全库存模型，平衡服务水平和库存成本',
      '实施周期盘点，提高库存准确性'
    ],
    'quality': [
      '加强预防措施，减少内部故障成本',
      '开展FMEA分析，预防质量问题',
      '实施SPC控制图，实时监控过程稳定性'
    ]
  };

  const suggestions = suggestionsMap[module] || [
    '建议先完成成本核算，再针对性优化',
    '参考行业最佳实践，持续改进'
  ];

  res.json(success({
    module,
    context,
    suggestions,
    generatedAt: new Date().toISOString()
  }));
});

// 规则引擎（DeepSeek API不可用时的降级方案）
function runRuleEngine(costData, oeeData, invData) {
  const diagnoses = [];
  const suggestions = [];

  // 规则1：单位成本偏高
  if (costData.avgUnitCost > 100) {
    diagnoses.push({
      type: 'danger',
      title: '单位成本偏高',
      desc: `当前平均单位成本 ¥${costData.avgUnitCost.toFixed(2)}，超过行业基准（¥80）`,
      impact: '高',
      action: '建议立即执行价值工程（VE）分析，优化材料成本和工艺流程'
    });
    suggestions.push('执行价值工程（VE）工作坊，邀请研发、生产、采购三方参与');
    suggestions.push('审查BOM表，识别可替代的低成本材料');
  }

  // 规则2：OEE偏低
  if (oeeData.avgOee < 65) {
    diagnoses.push({
      type: 'warning',
      title: 'OEE偏低',
      desc: `当前平均OEE ${oeeData.avgOee ? oeeData.avgOee.toFixed(1) : 'N/A'}%，低于行业基准（85%）`,
      impact: '中',
      action: '建议开展OEE提升项目，重点改善设备停机时间和性能率'
    });
    suggestions.push('实施TPM（全员生产维护），减少设备故障');
    suggestions.push('应用SMED（快速换模），缩短换线时间');
  }

  // 规则3：库存积压
  if (invData.overStockCount > 0) {
    diagnoses.push({
      type: 'warning',
      title: '库存积压风险',
      desc: `发现 ${invData.overStockCount} 种物料库存超过安全库存2倍，占用资金 ¥${(invData.totalInventoryValue * 0.3).toFixed(0)}`,
      impact: '中',
      action: '建议立即清理呆滞库存，优化采购计划'
    });
    suggestions.push('执行ABC分析，对C类物料实施Just-in-Time采购');
    suggestions.push('与供应商协商，建立VMI（供应商管理库存）机制');
  }

  // 规则4：质量成本占比过高
  const qualityRatio = costData.totalCost > 0 ? (costData.avgQuality * costData.totalOrders) / costData.totalCost * 100 : 0;
  if (qualityRatio > 5) {
    diagnoses.push({
      type: 'danger',
      title: '质量成本占比过高',
      desc: `质量成本占总成本 ${qualityRatio.toFixed(1)}%，超过基准（5%）`,
      impact: '高',
      action: '建议加强预防措施，减少内部故障成本'
    });
    suggestions.push('开展FMEA（失效模式与影响分析），预防质量问题');
    suggestions.push('强化供应商质量管理，实施来料检验标准化');
  }

  // 如果没有诊断结果，返回健康状态
  if (diagnoses.length === 0) {
    diagnoses.push({
      type: 'good',
      title: '成本管控良好',
      desc: '当前各项成本指标均在合理范围内，继续保持',
      impact: '低',
      action: '建议定期监控，持续优化'
    });
  }

  return { diagnoses, suggestions: suggestions.slice(0, 5) };
}

module.exports = router;
