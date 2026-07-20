<template>
  <div class="tco-calculator">
    <el-card shadow="hover">
      <template #header><span>🧮 TCO 总拥有成本对比分析</span></template>
      <p style="color:#666;font-size:13px;margin-bottom:16px">
        TCO（总拥有成本）= 采购价 + 物流费 + 质量成本 + 库存持有成本。帮您找到真正最优的供应商。
      </p>

      <el-table :data="tcoList" stripe size="small" border>
        <el-table-column prop="rank" label="#" width="50" align="center" />
        <el-table-column prop="supplierName" label="供应商" width="130" />
        <el-table-column prop="material" label="物料" />
        <el-table-column prop="purchasePrice" label="采购价(元)" align="right" width="100">
          <template #default="{ row }">{{ row.purchasePrice.toLocaleString() }}</template>
        </el-table-column>
        <el-table-column prop="logisticsCost" label="物流费" align="right" width="80">
          <template #default="{ row }">{{ row.logisticsCost }}</template>
        </el-table-column>
        <el-table-column prop="qualityCost" label="质量成本" align="right" width="90">
          <template #default="{ row }">{{ row.qualityCost }}</template>
        </el-table-column>
        <el-table-column prop="inventoryCost" label="库存成本" align="right" width="90">
          <template #default="{ row }">{{ row.inventoryCost }}</template>
        </el-table-column>
        <el-table-column prop="totalTco" label="TCO总计" align="right" width="100">
          <template #default="{ row }"><b :style="{color: row.recommended ? '#4CAF50' : ''}">{{ row.totalTco.toLocaleString() }}</b></template>
        </el-table-column>
        <el-table-column label="推荐" width="70" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.recommended" type="success" size="small">推荐</el-tag>
          </template>
        </el-table-column>
      </el-table>

      <div ref="tcoChartRef" style="height:300px;margin-top:20px"></div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import * as echarts from 'echarts'
import { procurementApi } from '../../api/index'

const tcoList = ref([])
const tcoChartRef = ref(null)

onMounted(async () => {
  const res = await procurementApi.getTco()
  tcoList.value = res.data

  await nextTick()
  if (tcoChartRef.value) {
    const chart = echarts.init(tcoChartRef.value)
    chart.setOption({
      tooltip: { trigger: 'axis' },
      legend: { data: ['采购价', '物流', '质量', '库存'], bottom: 0 },
      grid: { left: 60, right: 20, top: 20, bottom: 40 },
      xAxis: { type: 'category', data: tcoList.value.map(d => d.supplierName) },
      yAxis: { type: 'value', name: '元' },
      series: [
        { name: '采购价', type: 'bar', stack: 'total', data: tcoList.value.map(d => d.purchasePrice), itemStyle: { color: '#1A73E8' } },
        { name: '物流', type: 'bar', stack: 'total', data: tcoList.value.map(d => d.logisticsCost), itemStyle: { color: '#FF9800' } },
        { name: '质量', type: 'bar', stack: 'total', data: tcoList.value.map(d => d.qualityCost), itemStyle: { color: '#F44336' } },
        { name: '库存', type: 'bar', stack: 'total', data: tcoList.value.map(d => d.inventoryCost), itemStyle: { color: '#9E9E9E' } }
      ]
    })
  }
})
</script>

<style scoped></style>
