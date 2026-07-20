<template>
  <div class="dashboard">
    <!-- KPI指标卡片 -->
    <el-row :gutter="16" class="kpi-row">
      <el-col :xs="24" :sm="12" :md="6" v-for="(item, i) in kpis" :key="i">
        <el-card shadow="hover" class="kpi-card" :class="'status-' + item.status">
          <div class="kpi-header">
            <span class="kpi-title">{{ item.title }}</span>
            <span class="kpi-trend" :class="item.trend <= 0 ? 'up' : 'down'">
              {{ item.trend > 0 ? '+' : '' }}{{ item.trend }}%
              <el-icon v-if="item.trend > 0"><Top /></el-icon>
              <el-icon v-else><Bottom /></el-icon>
            </span>
          </div>
          <div class="kpi-value">
            <span class="number">{{ item.value }}</span>
            <span class="unit">{{ item.unit }}</span>
          </div>
          <div class="kpi-indicator" :class="'dot-' + item.status"></div>
        </el-card>
      </el-col>
    </el-row>

    <!-- AI诊断推送 -->
    <el-row :gutter="16" style="margin-top:16px">
      <el-col :span="24">
        <el-card shadow="hover" v-if="aiDiagnosis" class="ai-diagnosis-card" :class="aiScoreClass">
          <template #header>
            <div class="ai-header">
              <span>🤖 AI 成本诊断</span>
              <el-button type="primary" link @click="goToDiagnosis">查看详细报告</el-button>
            </div>
          </template>
          <div class="ai-diagnosis-content">
            <div class="ai-score">
              <div class="score-circle" :class="aiScoreClass">
                <span class="score-num">{{ aiDiagnosis.overallScore }}</span>
                <span class="score-label">综合评分</span>
              </div>
            </div>
            <div class="ai-issues">
              <h5>诊断结果：</h5>
              <div v-for="(item, idx) in aiDiagnosis.diagnoses?.slice(0, 3)" :key="idx" class="ai-issue-item" :class="item.type">
                <el-tag :type="item.type === 'danger' ? 'danger' : item.type === 'warning' ? 'warning' : 'success'" size="small">
                  {{ item.type === 'danger' ? '严重' : item.type === 'warning' ? '警告' : '正常' }}
                </el-tag>
                <span>{{ item.title }}：{{ item.desc }}</span>
              </div>
              <div v-if="!aiDiagnosis.diagnoses || aiDiagnosis.diagnoses.length === 0" class="no-issues">
                ✅ 当前无异常，成本管控良好
              </div>
            </div>
            <div class="ai-suggestions">
              <h5>改善建议：</h5>
              <ul>
                <li v-for="(sug, idx) in aiDiagnosis.suggestions?.slice(0, 3)" :key="idx">{{ sug }}</li>
              </ul>
            </div>
          </div>
        </el-card>
        <el-card shadow="hover" v-else>
          <template #header><span>🤖 AI 成本诊断</span></template>
          <el-empty description="正在诊断..." />
        </el-card>
      </el-col>
    </el-row>

    <!-- 图表行 -->
    <el-row :gutter="16" style="margin-top:16px">
      <el-col :xs="24" :lg="10">
        <el-card shadow="hover">
          <template #header><span>📊 成本结构分析</span></template>
          <div ref="ringChartRef" style="height:280px"></div>
        </el-card>
      </el-col>
      <el-col :xs="24" :lg="14">
        <el-card shadow="hover">
          <template #header><span>📈 单位成本趋势（近12月）</span></template>
          <div ref="trendChartRef" style="height:280px"></div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 预警 + 改善项目 -->
    <el-row :gutter="16" style="margin-top:16px">
      <el-col :xs="24" :lg="12">
        <el-card shadow="hover">
          <template #header><span>⚠️ 异常预警</span></template>
          <div class="alert-list">
            <div v-for="a in alerts" :key="a.id" class="alert-item" :class="'type-' + a.type">
              <span class="alert-icon">{{ a.icon }}</span>
              <div class="alert-body">
                <div class="alert-title">{{ a.title }}</div>
                <div class="alert-desc">{{ a.desc }}</div>
              </div>
              <span class="alert-time">{{ a.time }}</span>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :lg="12">
        <el-card shadow="hover">
          <template #header><span>🚀 改善项目动态</span></template>
          <div v-for="p in projects" :key="p.id" class="project-item">
            <div class="project-info">
              <span class="project-title">{{ p.title }}</span>
              <el-tag size="small" :type="{ approved:'success', implementing:'warning', completed:'' }[p.status]">
                {{ p.statusText }}
              </el-tag>
            </div>
            <el-progress :percentage="p.progress" :stroke-width="6" style="margin-top:8px" />
            <div class="project-meta">
              <span>预期节约 ¥{{ (p.expectedSaving || 0).toLocaleString() }}</span>
              <span>负责人：{{ p.proposerName }}</span>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 快捷入口 -->
    <el-row :gutter="16" style="margin-top:16px">
      <el-col :span="24">
        <el-card shadow="hover">
          <template #header><span>⚡ 快捷操作</span></template>
          <div class="quick-actions">
            <router-link to="/cost/overview" class="action-item">
              <el-icon :size="28"><Coin /></el-icon><span>成本核算</span>
            </router-link>
            <router-link to="/procurement/tco" class="action-item">
              <el-icon :size="28"><TrendCharts /></el-icon><span>TCO分析</span>
            </router-link>
            <router-link to="/production/oee" class="action-item">
              <el-icon :size="28"><Cpu /></el-icon><span>OEE录入</span>
            </router-link>
            <router-link to="/incentive/calculator" class="action-item">
              <el-icon :size="28"><Money /></el-icon><span>奖金计算</span>
            </router-link>
            <router-link to="/inventory/safety-stock" class="action-item">
              <el-icon :size="28"><Box /></el-icon><span>安全库存</span>
            </router-link>
            <router-link to="/quality/paf" class="action-item">
              <el-icon :size="28"><PieChart /></el-icon><span>质量成本</span>
            </router-link>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, computed } from 'vue'
import { useRouter } from 'vue-router'
import * as echarts from 'echarts'
import { dashboardApi } from '../../api/index'
import { aiApi } from '../../api/index'

const ringChartRef = ref(null)
const trendChartRef = ref(null)
const kpis = ref([])
const alerts = ref([])
const projects = ref([])
const aiDiagnosis = ref(null)  // AI诊断结果
const router = useRouter()

const aiScoreClass = computed(() => {
  if (!aiDiagnosis.value) return ''
  const score = aiDiagnosis.value.overallScore
  return score >= 85 ? 'good' : score >= 65 ? 'warning' : 'danger'
})

const goToDiagnosis = () => {
  router.push('/ai/diagnosis')
}

const loadAIDiagnosis = async () => {
  try {
    const res = await aiApi.diagnose()
    aiDiagnosis.value = res.data
  } catch (error) {
    console.error('AI诊断加载失败：', error)
  }
}

onMounted(async () => {
  const [kpiRes, structRes, trendRes, alertRes, projRes] = await Promise.all([
    dashboardApi.getKpis(), dashboardApi.getCostStructure(),
    dashboardApi.getUnitCostTrend(), dashboardApi.getAlerts(),
    dashboardApi.getProjects()
  ])

  kpis.value = kpiRes.data
  alerts.value = alertRes.data
  projects.value = projRes.data

  // 加载AI诊断
  loadAIDiagnosis()

  // 环形图
  await nextTick()
  if (ringChartRef.value) {
    const chart = echarts.init(ringChartRef.value)
    const data = structRes.data || []
    chart.setOption({
      tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
      legend: { bottom: 0 },
      series: [{
        type: 'pie', radius: ['40%', '70%'], center: ['50%', '45%'],
        avoidLabelOverlap: true,
        label: { show: true, formatter: '{b}\n{d}%' },
        emphasis: { label: { fontSize: 14, fontWeight: 'bold' } },
        data: data.map(d => ({ name: d.name, value: d.value, itemStyle: { color: d.color } }))
      }]
    })
  }

  // 趋势图
  if (trendChartRef.value) {
    const tChart = echarts.init(trendChartRef.value)
    const tData = trendRes.data || []
    tChart.setOption({
      tooltip: { trigger: 'axis' },
      legend: { data: ['平均单位成本', '最高', '最低'], top: 0 },
      grid: { left: 50, right: 20, top: 40, bottom: 30 },
      xAxis: { type: 'category', data: tData.map(m => m.month), axisLabel: { rotate: 30 } },
      yAxis: { type: 'value', name: '元/件', min: function(v) { return Math.floor(v.min * 0.9); } },
      series: [
        { name: '平均单位成本', type: 'line', data: tData.map(m => m.avgCost), smooth: true,
          lineStyle: { color: '#1A73E8', width: 3 }, areaStyle: { color: 'rgba(26,115,232,0.1)' } },
        { name: '最高', type: 'line', data: tData.map(m => m.maxCost), lineStyle: { type: 'dashed', color: '#F44336' } },
        { name: '最低', type: 'line', data: tData.map(m => m.minCost), lineStyle: { type: 'dashed', color: '#4CAF50' } },
        {
          type: 'scatter',
          data: tData.filter(m => m.isAbnormal).map((m, i) => [i, m.avgCost]),
          symbolSize: 12,
          itemStyle: { color: '#FF9800' }
        }
      ]
    })
  }

  window.addEventListener('resize', () => {
    ringChartRef.value && echarts.getInstanceByDom(ringChartRef.value)?.resize()
    trendChartRef.value && echarts.getInstanceByDom(trendChartRef.value)?.resize()
  })
})
</script>

<style scoped>
.kpi-row .el-col { margin-bottom: 0; }
.kpi-card {
  position: relative; border-radius: var(--border-radius);
  border-left: 4px solid #1A73E8;
}
.kpi-card.status-good { border-left-color: var(--status-good); }
.kpi-card.status-normal { border-left-color: var(--status-normal); }
.kpi-card.status-danger { border-left-color: var(--status-danger); }
.kpi-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
.kpi-title { font-size: 13px; color: #888; }
.kpi-trend { font-size: 12px; padding: 2px 6px; border-radius: 4px; }
.kpi-trend.up { background: #e8f5e9; color: var(--status-green); }
.kpi-trend.down { background: #fce4ec; color: var(--status-danger); }
.kpi-value { display: flex; align-items: baseline; gap: 4px; }
.kpi-value .number { font-size: 28px; font-weight: 700; color: #333; }
.kpi-value .unit { font-size: 12px; color: #999; }
.kpi-indicator {
  position: absolute; right: 16px; top: 16px;
  width: 8px; height: 8px; border-radius: 50%;
}
.dot-good { background: var(--status-good); }
.dot-normal { background: var(--status-normal); }
.dot-danger { background: var(--status-danger); }

.alert-list { max-height: 320px; overflow-y: auto; }
.alert-item {
  display: flex; align-items: flex-start; gap: 10px;
  padding: 12px 0; border-bottom: 1px solid #f0f0f0;
}
.alert-item:last-child { border-bottom: none; }
.alert-icon { font-size: 20px; flex-shrink: 0; }
.alert-body { flex: 1; min-width: 0; }
.alert-title { font-size: 13px; font-weight: 600; color: #333; }
.alert-desc { font-size: 12px; color: #666; margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.alert-time { font-size: 11px; color: #bbb; flex-shrink: 0; }
.type-danger .alert-title { color: var(--danger-color); }
.type-warning .alert-title { color: var(--warning-color); }

.project-item { padding: 14px 0; border-bottom: 1px solid #f0f0f0; }
.project-item:last-child { border-bottom: none; }
.project-info { display: flex; justify-content: space-between; align-items: center; }
.project-title { font-size: 14px; font-weight: 500; }
.project-meta { display: flex; justify-content: space-between; font-size: 12px; color: #999; margin-top: 4px; }

.quick-actions { display: flex; gap: 32px; justify-content: center; flex-wrap: wrap; }
.action-item {
  display: flex; flex-direction: column; align-items: center; gap: 8px;
  padding: 16px 24px; border-radius: 12px;
  text-decoration: none; color: #555; transition: all 0.3s;
}
.action-item:hover { background: rgba(26,115,232,0.08); color: var(--primary-color); transform: translateY(-2px); }
.action-item span { font-size: 13px; }

.ai-header { display: flex; justify-content: space-between; align-items: center; }
.ai-diagnosis-content { display: flex; gap: 24px; align-items: flex-start; }
.ai-score { flex-shrink: 0; }
.score-circle {
  width: 80px; height: 80px; border-radius: 50%;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  color: white; font-weight: bold;
}
.score-circle.good { background: linear-gradient(135deg, #67c23a, #85ce61); }
.score-circle.warning { background: linear-gradient(135deg, #e6a23c, #ebb563); }
.score-circle.danger { background: linear-gradient(135deg, #f56c6c, #f89898); }
.score-num { font-size: 28px; line-height: 1; }
.score-label { font-size: 11px; margin-top: 2px; }

.ai-issues { flex: 1; min-width: 0; }
.ai-issues h5 { margin: 0 0 12px 0; color: #303133; font-size: 14px; }
.ai-issue-item { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; font-size: 13px; color: #606266; }
.ai-issue-item.danger { color: #f56c6c; }
.ai-issue-item.warning { color: #e6a23c; }
.no-issues { color: #67c23a; font-size: 14px; padding: 8px 0; }

.ai-suggestions { flex-shrink: 0; width: 300px; }
.ai-suggestions h5 { margin: 0 0 12px 0; color: #303133; font-size: 14px; }
.ai-suggestions ul { padding-left: 20px; margin: 0; }
.ai-suggestions li { font-size: 13px; color: #606266; margin-bottom: 6px; line-height: 1.5; }
</style>
