<template>
  <div class="abc-analysis">
    <el-card shadow="hover">
      <template #header><span>📊 ABC 库存分类分析</span></template>
      
      <el-row :gutter="16" style="margin-bottom:20px">
        <el-col :span="8">
          <div class="class-card" style="border-top:4px solid #F44336">
            <div class="class-label">A类 - 高价值</div>
            <b>{{ (abcData.categories || [])[0]?.count || 0 }}</b>
            <span class="class-pct">占金额 ~70%</span>
            <span class="class-desc">重点管控，精确采购</span>
          </div>
        </el-col>
        <el-col :span="8">
          <div class="class-card" style="border-top:4px solid #FF9800">
            <div class="class-label">B类 - 中价值</div>
            <b>{{ (abcData.categories || [])[1]?.count || 0 }}</b>
            <span class="class-pct">占金额 ~20%</span>
            <span class="class-desc">定期盘点，适度控制</span>
          </div>
        </el-col>
        <el-col :span="8">
          <div class="class-card" style="border-top:4px solid #4CAF50">
            <div class="class-label">C类 - 低价值</div>
            <b>{{ (abcData.categories || [])[2]?.count || 0 }}</b>
            <span class="class-pct">占金额 ~10%</span>
            <span class="class-desc">简化管理，批量采购</span>
          </div>
        </el-col>
      </el-row>

      <h4 style="margin:16px 0 10px">📋 物料分类明细</h4>
      <el-table :data="abcData.items || []" stripe size="small">
        <el-table-column prop="materialName" label="物料名称" />
        <el-table-column prop="unitCost" label="单价(元)" width="90" align="right" />
        <el-table-column prop="annualUsage" label="年用量" width="80" align="center" />
        <el-table-column prop="abcClass" label="分类" width="70" align="center">
          <template #default="{ row }"><el-tag size="small" :type="{A:'danger',B:'warning',C:'success'}[row.abcClass]">{{ row.abcClass }}类</el-tag></template>
        </el-table-column>
      </el-table>

      <div ref="chartRef" style="height:300px;margin-top:20px"></div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import * as echarts from 'echarts'
import { inventoryApi } from '../../api/index'

const abcData = ref({})
const chartRef = ref(null)

onMounted(async () => {
  const res = await inventoryApi.getAbcAnalysis()
  abcData.value = res.data

  await nextTick()
  if (chartRef.value) {
    const chart = echarts.init(chartRef.value)
    const items = abcData.value.items || []
    chart.setOption({
      tooltip: { trigger: 'item' },
      series: [{
        type: 'treemap', data: [
          { name: 'A类物料', value: items.filter(i => i.abcClass === 'A').length, itemStyle: { color: '#F44336' }, children: items.filter(i => i.abcClass === 'A').map(i => ({ name: i.materialName, value: i.unitCost * i.annualUsage })) },
          { name: 'B类物料', value: items.filter(i => i.abcClass === 'B').length, itemStyle: { color: '#FF9800' }, children: items.filter(i => i.abcClass === 'B').map(i => ({ name: i.materialName, value: i.unitCost * i.annualUsage })) },
          { name: 'C类物料', value: items.filter(i => i.abcClass === 'C').length, itemStyle: { color: '#4CAF50' }, children: items.filter(i => i.abcClass === 'C').map(i => ({ name: i.materialName, value: i.unitCost * i.annualUsage })) }
        ]
      }]
    })
  }
})
</script>

<style scoped>
.class-card { background:#f8f9fa; padding:16px; border-radius:8px; text-align:center; min-height:120px; display:flex; flex-direction:column; justify-content:center; gap:6px; }
.class-label { font-size:13px; color:#666; }
.class-card b { font-size:32px; color:#333; }
.class-pct { font-size:12px; color:#888; }
.class-desc { font-size:11px; color:#aaa; }
</style>
