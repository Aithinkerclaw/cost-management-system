<template>
  <div class="cost-overview">
    <el-card shadow="hover">
      <template #header><span>💰 成本核算总览</span></template>
      <div v-if="summary" class="summary-grid">
        <div class="stat-item"><label>累计订单</label><b>{{ summary.totalOrders }}</b><span>单</span></div>
        <div class="stat-item"><label>总成本</label><b>{{ formatNum(summary.totalCost) }}</b><span>元</span></div>
        <div class="stat-item"><label>平均单位成本</label><b>{{ formatNum(summary.avgUnitCost) }}</b><span>元/件</span></div>
        <div class="stat-item"><label>材料成本合计</label><b style="color:#1A73E8">{{ formatNum(summary.totalMaterial) }}</b></div>
        <div class="stat-item"><label>人工成本合计</label><b style="color:#FF9800">{{ formatNum(summary.totalLabor) }}</b></div>
        <div class="stat-item"><label>制造费用合计</label><b style="color:#4CAF50">{{ formatNum(summary.totalOverhead) }}</b></div>
        <div class="stat-item"><label>质量成本合计</label><b style="color:#F44336">{{ formatNum(summary.totalQuality) }}</b></div>
      </div>

      <h4 style="margin:24px 0 12px">📊 按产品成本分布</h4>
      <el-table :data="summary.byProduct || []" stripe size="small">
        <el-table-column prop="product_name" label="产品名称" />
        <el-table-column prop="orderCount" label="订单数" width="80" align="center" />
        <el-table-column prop="totalCost" label="总成本(元)" align="right">
          <template #default="{ row }">{{ formatNum(row.totalCost) }}</template>
        </el-table-column>
        <el-table-column prop="avgUnitCost" label="单位成本(元)" align="right">
          <template #default="{ row }">{{ formatNum(row.avgUnitCost) }}</template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { costApi } from '../../api/index'

const summary = ref(null)
onMounted(async () => {
  const res = await costApi.getOverview()
  summary.value = res.data
})
function formatNum(n) { return n ? Number(n).toLocaleString('zh-CN', {minimumFractionDigits:2}) : '0.00' }
</script>

<style scoped>
.summary-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px,1fr)); gap: 16px; }
.stat-item { background: #f8f9fa; padding: 14px 18px; border-radius: 8px; text-align: center; }
.stat-item label { display: block; font-size: 12px; color: #888; margin-bottom: 4px; }
.stat-item b { font-size: 22px; color: #333; }
.stat-item span { font-size: 11px; color: #aaa; margin-left: 2px; }
</style>
