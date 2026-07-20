<template>
  <div class="paf-analysis">
    <el-card shadow="hover">
      <template #header><span>📊 PAF 趋势分析（近6个月）</span></template>
      <div ref="chartRef" style="height:380px"></div>
    </el-card>

    <el-row :gutter="16" style="margin-top:16px">
      <el-col :span="12">
        <el-card shadow="hover"><template #header><span>💡 质量成本改善建议</span></template>
          <div v-for="(tip, i) in tips" :key="i" style="padding:10px 0;border-bottom:1px solid #f0f0f0">
            <b :style="{color:tip.color}">{{ tip.icon }} {{ tip.title }}</b><p style="font-size:13px;color:#666;margin-top:4px">{{ tip.desc }}</p>
          </div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card shadow="hover">
          <template #header><span>📈 失败成本占比趋势</span></template>
          <div ref="failRef" style="height:250px"></div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import * as echarts from 'echarts'
import { qualityApi } from '../../api/index'

const chartRef = ref(null)
const failRef = ref(null)

const tips = [
  { icon: '🔴', title: '内部失败偏高', desc: '建议：加强首件检验和过程巡检，减少返工和报废损失', color: '#F44336' },
  { icon: '🟡', title: '预防投入不足', desc: '建议：增加质量培训、设备维护预算，预防成本投入每增1元可降低失败成本3-5元', color: '#FF9800' },
  { icon: '🟢', title: '鉴定效率优化', desc: '建议：引入自动化检测设备，提高检测效率的同时保持鉴定覆盖率', color: '#4CAF50' }
]

onMounted(async () => {
  const res = await qualityApi.getPaf()
  const data = res.data || []
  await nextTick()

  if (chartRef.value) {
    const chart = echarts.init(chartRef.value)
    chart.setOption({
      tooltip: { trigger: 'axis' },
      legend: { data: ['预防成本', '鉴定成本', '内部失败', '外部失败'], bottom: 0 },
      grid: { left: 60, right: 20, top: 20, bottom: 40 },
      xAxis: { type: 'category', data: data.map(d => d.month?.slice(5)) },
      yAxis: { type: 'value', name: '元' },
      series: [
        { name: '预防成本', type: 'bar', stack: 'total', data: data.map(d => d.prevention), itemStyle: { color: '#1A73E8' } },
        { name: '鉴定成本', type: 'bar', stack: 'total', data: data.map(d => d.appraisal), itemStyle: { color: '#4CAF50' } },
        { name: '内部失败', type: 'bar', stack: 'total', data: data.map(d => d.internalFailure), itemStyle: { color: '#FF9800' } },
        { name: '外部失败', type: 'bar', stack: 'total', data: data.map(d => d.externalFailure), itemStyle: { color: '#F44336' } }
      ]
    })
  }

  if (failRef.value && data.length) {
    const fChart = echarts.init(failRef.value)
    fChart.setOption({
      tooltip: { trigger: 'axis' },
      grid: { left: 60, right: 20, top: 10, bottom: 30 },
      xAxis: { type: 'category', data: data.map(d => d.month?.slice(5)) },
      yAxis: { type: 'value', name: '%', max: 100 },
      series: [{
        type: 'line',
        data: data.map(d => {
          const total = (d.prevention || 0) + (d.appraisal || 0) + (d.internalFailure || 0) + (d.externalFailure || 0);
          return +(((d.internalFailure || 0) + (d.externalFailure || 0)) / (total || 1) * 100).toFixed(1);
        }),
        smooth: true, lineStyle: { width: 3, color: '#F44336' },
        areaStyle: { color: 'rgba(244,67,54,0.08)' }
      }]
    })
  }
})
</script>

<style scoped></style>
