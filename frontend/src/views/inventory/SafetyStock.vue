<template>
  <div class="safety-stock">
    <el-card shadow="hover">
      <template #header><span>🛡️ 安全库存计算器</span></template>
      <el-row :gutter="16" style="margin-bottom:20px">
        <el-col :span="8">
          <el-form-item label="需求标准差(件/天)">
            <el-input-number v-model="demandVar" :min="0" :max="50" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="采购提前期(天)">
            <el-input-number v-model="leadTime" :min="1" :max="60" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="服务水平">
            <el-select v-model="serviceLevel" style="width:100%">
              <el-option label="90%" value="90" />
              <el-option label="95%" value="95" />
              <el-option label="99%" value="99" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>
      <el-button type="primary" @click="calculate">📐 计算安全库存</el-button>

      <div v-if="result" style="margin-top:20px">
        <h4 style="margin-bottom:12px">📋 计算结果</h4>
        <el-table :data="result.items || []" stripe size="small">
          <el-table-column prop="materialName" label="物料名称" />
          <el-table-column prop="avgDailyDemand" label="日均需求" width="90" align="center" />
          <el-table-column prop="leadTimeDays" label="提前期(天)" width="90" align="center" />
          <el-table-column prop="serviceLevel" label="服务水平" width="80" align="center" />
          <el-table-column prop="safetyStock" label="安全库存" width="90" align="right">
            <template #default="{ row }"><b>{{ row.safetyStock }}</b></template>
          </el-table-column>
          <el-table-column prop="reorderPoint" label="再订货点" width="100" align="right">
            <template #default="{ row }"><b style="color:#1A73E8">{{ row.reorderPoint }}</b></template>
          </el-table-column>
        </el-table>

        <el-alert v-if="result.scenario" :title="'模拟结果：周转率从 ' + result.scenario.before.turnoverRate + ' 提升至 ' + result.scenario.after.turnoverRate + '，释放现金 ¥' + result.scenario.releasedCash.toLocaleString()" type="success" show-icon :closable="false" style="margin-top:16px" />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { inventoryApi } from '../../api/index'

const demandVar = ref(3)
const leadTime = ref(7)
const serviceLevel = ref('95')
const result = ref(null)

async function calculate() {
  const res = await inventoryApi.getSafetyStock({ demandVariation: demandVar.value, leadTime: leadTime.value, serviceLevel: serviceLevel.value })
  result.value = res.data
}
</script>

<style scoped>.el-form-item { margin-bottom: 16px; }</style>
