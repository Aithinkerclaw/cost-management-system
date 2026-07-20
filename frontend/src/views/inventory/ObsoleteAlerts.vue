<template>
  <div class="obsolete-alerts">
    <el-card shadow="hover">
      <template #header><span>⚠️ 呆滞物料预警</span></template>
      
      <el-row :gutter="16" style="margin-bottom:20px">
        <el-col :span="8">
          <el-statistic title="呆滞物料总数" :value="(summary?.totalObsolete || 0)" />
        </el-col>
        <el-col :span="8">
          <el-statistic title="涉及金额" :value="(summary?.totalAmount || 0).toFixed(2)" suffix="元" />
        </el-col>
        <el-col :span="8">
          <div style="text-align:center;padding-top:10px"><b style="color:#F44336;font-size:24px">{{ (alerts || []).length }}</b><br/><small>条预警记录</small></div>
        </el-col>
      </el-row>

      <el-table :data="alerts" stripe size="small">
        <el-table-column prop="material_name" label="物料名称" width="140" />
        <el-table-column prop="obsolete_days" label="未流动天数" width="110" align="center">
          <template #default="{ row }">
            <el-tag size="small" :type="row.obsolete_days > 180 ? 'danger' : 'warning'" effect="dark">
              {{ row.obsolete_days }}天
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="原因标签" width="200">
          <template #default="{ row }">
            <el-tag v-for="tag in (row.reasonTags || [])" :key="tag" size="small" style="margin:2px">{{ tag }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="unit_cost" label="单价(元)" width="90" align="right" />
        <el-table-column label="操作" fixed="right" width="160">
          <template #default>
            <el-button link type="primary" size="small">处理</el-button>
            <el-button link type="warning" size="small">转售</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { inventoryApi } from '../../api/index'

const alerts = ref([])
const summary = ref(null)

onMounted(async () => {
  const res = await inventoryApi.getObsoleteAlerts()
  alerts.value = res.data.items || []
  summary.value = res.data.summary
})
</script>

<style scoped></style>
