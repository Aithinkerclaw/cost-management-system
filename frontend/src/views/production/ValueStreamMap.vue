<template>
  <div class="value-stream-map">
    <el-card shadow="hover">
      <template #header><span>🗺️ 价值流图 VSM（向导式）</span></template>
      <p style="color:#666;font-size:13px;margin-bottom:16px">
        系统自动计算各工序增值比，并在瓶颈工序高亮标注。
      </p>

      <!-- 工序流程图 -->
      <div class="vsm-flow" v-if="vsmData.processFlow">
        <div v-for="(step, i) in vsmData.processFlow" :key="i"
          class="vsm-step" :class="{ 'value-added': step.valueAdded, bottleneck: vsmData.summary.bottleneckStep === i + 1 }">
          <div class="step-header">
            <b>步骤{{ step.step }}: {{ step.name }}</b>
            <el-tag size="small" :type="step.valueAdded ? 'success' : 'info'">{{ step.valueAdded ? '增值' : '非增值' }}</el-tag>
            <el-tag v-if="vsmData.summary.bottleneckStep === i + 1" type="danger" size="small" effect="dark">⚠️ 瓶颈</el-tag>
          </div>
          <div class="step-metrics">
            <span>CT={{ step.ct }}s</span>
            <span>CO={{ step.co }}s</span>
            <span>等待={{ step.waitTime }}s</span>
          </div>
        </div>

        <!-- 汇总 -->
        <div class="vsm-summary" style="margin-top:20px;padding:16px;background:#f8f9fa;border-radius:8px;">
          <h4 style="margin-bottom:12px">📋 VSM 分析汇总</h4>
          <el-row :gutter="24">
            <el-col :span="6"><div class="sum-item"><label>总周期时间</label><b>{{ vsmData.summary.leadTime }}秒</b></div></el-col>
            <el-col :span="6"><div class="sum-item"><label>增值时间</label><b>{{ vsmData.summary.totalCT }}秒</b></div></el-col>
            <el-col :span="6"><div class="sum-item"><label>增值比率</label><b style="color:vsmData.summary.vaRatio < 15 ? '#F44336' : '#4CAF50';font-size:18px">{{ vsmData.summary.vaRatio }}%</b></div></el-col>
            <el-col :span="6"><div class="sum-item"><label>行业基准(增值比)</label><b>{{ vsmData.summary.industryBenchmark?.vaRatio || '-' }}%</b></div></el-col>
          </el-row>

          <div ref="chartRef" style="height:250px;margin-top:16px"></div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import * as echarts from 'echarts'
import { productionApi } from '../../api/index'

const vsmData = ref({ processFlow: [], summary: {} })
const chartRef = ref(null)

onMounted(async () => {
  const res = await productionApi.getVsmData()
  vsmData.value = res.data

  await nextTick()
  if (chartRef.value) {
    const chart = echarts.init(chartRef.value)
    const steps = vsmData.value.processFlow || []
    chart.setOption({
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      legend: { data: ['周期时间CT', '等待时间'], bottom: 0 },
      grid: { left: 60, right: 20, top: 10, bottom: 30 },
      xAxis: { type: 'category', data: steps.map(s => s.name) },
      yAxis: { type: 'value', name: '秒' },
      series: [
        {
          name: '周期时间CT', type: 'bar',
          data: steps.map(s => ({ value: s.ct, itemStyle: { color: s.valueAdded ? '#4CAF50' : '#E0E0E0' } })),
          barWidth: 30
        },
        { name: '等待时间', type: 'bar', data: steps.map(s => ({ value: s.waitTime, itemStyle: { color: '#FF9800' } })), barWidth: 30 }
      ]
    })
  }
})
</script>

<style scoped>
.vsm-flow { display:flex; flex-direction: column; gap: 12px; }
.vsm-step {
  padding: 14px 18px; border-radius: 8px; border-left: 4px solid #ddd;
  background: #fff; transition: all 0.2s;
}
.vsm-step.value-added { border-left-color: #4CAF50; background: #f1f8e9; }
.vsm-step.bottleneck { border-left-width: 5px; border-left-color: #F44336; background: #fce4ec; box-shadow: 0 0 12px rgba(244,67,54,0.3); }
.step-header { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
.step-metrics { display: flex; gap: 16px; font-size: 12px; color: #666; font-family: monospace; }
.sum-item label { display:block; font-size:12px; color:#888; margin-bottom:2px; }
.sum-item b { font-size:18px; color:#333; }
</style>
