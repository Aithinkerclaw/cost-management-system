<template>
  <div class="price-trend">
    <el-card shadow="hover">
      <template #header><span>📈 采购价格趋势分析</span></template>
      <div ref="chartRef" style="height:380px"></div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import * as echarts from 'echarts'
import { procurementApi } from '../../api/index'

const chartRef = ref(null)

onMounted(async () => {
  const res = await procurementApi.getPriceTrends()
  const data = res.data || []
  await nextTick()
  if (chartRef.value) {
    const chart = echarts.init(chartRef.value)
    chart.setOption({
      tooltip: { trigger: 'axis' },
      legend: { data: ['采购均价', '大宗商品指数'], top: 0 },
      grid: { left: 60, right: 60, top: 40, bottom: 30 },
      xAxis: { type: 'category', boundaryGap: false, data: data.map(d => d.date.slice(5)) },
      yAxis: [
        { type: 'value', name: '元/单位', position: 'left', min: function(v) { return Math.floor(v.min * 0.9); } },
        { type: 'value', name: '指数', position: 'right', min: 80, max: 110 }
      ],
      series: [
        { name: '采购均价', type: 'line', yAxisIndex: 0, data: data.map(d => d.avgPrice), smooth: true,
          lineStyle: { color: '#1A73E8', width: 3 }, areaStyle: { color: 'rgba(26,115,232,0.1)' },
          markPoint: { data: [{ type: 'max', name: '最高价' }, { type: 'min', name: '最低价' }] } },
        { name: '大宗商品指数', type: 'line', yAxisIndex: 1, data: data.map(d => d.marketIndex),
          lineStyle: { color: '#FF9800', width: 2, type: 'dashed' } }
      ]
    })
  }
})
</script>

<style scoped></style>
