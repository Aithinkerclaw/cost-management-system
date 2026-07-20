<template>
  <div class="order-trace">
    <el-card shadow="hover">
      <template #header>
        <span>🔍 订单成本追溯</span>
        <el-input v-model="searchId" placeholder="输入订单号或ID" size="small" style="width:200px;float:right" @keyup.enter="doSearch">
          <template #append><el-button :icon="Search" @click="doSearch" /></template>
        </el-input>
      </template>

      <div v-if="orderData">
        <!-- 订单信息 -->
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="订单号">{{ orderData.order.order_no }}</el-descriptions-item>
          <el-descriptions-item label="产品名称">{{ orderData.product_name }}</el-descriptions-item>
          <el-descriptions-item label="数量">{{ orderData.order.quantity }} {{ '件' }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="{pending:'info', production:'warning', completed:'success'}[orderData.order.status]">{{ orderData.order.status }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="材料成本">¥{{ Number(orderData.order.material_cost_total || 0).toFixed(2) }}</el-descriptions-item>
          <el-descriptions-item label="人工成本">¥{{ Number(orderData.order.labor_cost_total || 0).toFixed(2) }}</el-descriptions-item>
          <el-descriptions-item label="制造费用">¥{{ Number(orderData.order.overhead_cost_total || 0).toFixed(2) }}</el-descriptions-item>
          <el-descriptions-item label="质量成本">¥{{ Number(orderData.order.quality_cost_total || 0).toFixed(2) }}</el-descriptions-item>
          <el-descriptions-item label="总成本" :span="2"><b style="color:#1A73E8;font-size:16px">¥{{ Number(orderData.order.total_cost || 0).toFixed(2) }}</b></el-descriptions-item>
        </el-descriptions>

        <h4 style="margin:20px 0 12px">📦 BOM物料明细</h4>
        <el-table :data="orderData.bomItems || []" size="small" stripe>
          <el-table-column prop="material_name" label="物料名称" />
          <el-table-column prop="quantity" label="用量" width="80" align="center" />
          <el-table-column prop="unit" label="单位" width="60" />
          <el-table-column prop="standard_price" label="标准单价" width="100" align="right" />
        </el-table>

        <h4 style="margin:20px 0 12px">🛒 关联采购记录</h4>
        <el-table :data="orderData.purchases || []" size="small" stripe>
          <el-table-column prop="po_no" label="采购单号" width="140" />
          <el-table-column prop="material_name" label="物料" />
          <el-table-column prop="quantity" label="数量" width="80" align="center" />
          <el-table-column prop="unit_price" label="单价" width="90" align="right" />
          <el-table-column prop="status" label="状态" width="80" align="center" />
        </el-table>
        <h4 style="margin:20px 0 12px">🛠️ 关联工单</h4>
        <el-table :data="orderData.workOrders || []" size="small" stripe>
          <el-table-column prop="wo_no" label="工单号" width="140" />
          <el-table-column prop="plan_qty" label="计划数量" width="90" align="center" />
          <el-table-column prop="actual_qty" label="实际产量" width="90" align="center" />
          <el-table-column prop="defect_qty" label="不良数" width="80" align="center" />
          <el-table-column prop="status" label="状态" width="90" align="center" />
          <el-table-column label="工单成本" width="180">
            <template #default="{ row }">
              ¥{{ Number(row.material_cost || 0 + row.labor_cost || 0 + row.overhead_cost || 0).toFixed(2) }}
            </template>
          </el-table-column>
        </el-table>

        <h4 style="margin:20px 0 12px">✅ 质检记录</h4>
        <el-table :data="orderData.inspections || []" size="small" stripe>
          <el-table-column prop="inspection_no" label="检验单号" width="160" />
          <el-table-column prop="inspect_type" label="类型" width="90" align="center" />
          <el-table-column prop="sample_size" label="抽样数" width="80" align="center" />
          <el-table-column prop="defect_count" label="缺陷数" width="80" align="center" />
          <el-table-column prop="pass_rate" label="合格率" width="90" align="center">
            <template #default="{ row }">{{ (row.pass_rate || 0) }}%</template>
          </el-table-column>
          <el-table-column prop="result" label="结果" width="90" align="center">
            <template #default="{ row }">
              <el-tag :type="row.result === 'pass' ? 'success' : row.result === 'fail' ? 'danger' : 'warning'">
                {{ {pass:'合格',fail:'不合格',pending:'待检'}[row.result] || row.result }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="inspector_name" label="检验员" width="100" />
        </el-table>
      </div>

      <el-empty v-else description="请输入订单号进行查询" :image-size="120" />
    </el-card>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { Search } from '@element-plus/icons-vue'
import { costApi } from '../../api/index'

const searchId = ref('1')
const orderData = ref(null)

async function doSearch() {
  if (!searchId.value) return
  try {
    const res = await costApi.getOrderTrace(searchId.value)
    orderData.value = res.data
  } catch (e) { orderData.value = null }
}
</script>

<style scoped></style>
