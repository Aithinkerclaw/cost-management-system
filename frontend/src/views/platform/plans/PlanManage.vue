<template>
  <div class="plan-page">
    <el-card shadow="never">
      <p class="tip-text">套餐配置决定了各档位的功能开放范围和用户数上限。</p>

      <el-table :data="planList" v-loading="loading" stripe size="default" style="margin-top:12px">
        <el-table-column prop="plan_name" label="套餐名称" min-width="140">
          <template #default="{ row }">
            <strong>{{ row.plan_name }}</strong>
            <el-tag size="small" type="info">{{ row.plan_code }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="月费/年费" width="140">
          <template #default="{ row }">
            ¥{{ row.price_monthly }}/月 / ¥{{ row.price_yearly }}/年
          </template>
        </el-table-column>
        <el-table-column prop="max_users" label="用户上限" width="90" align="center">
          <template #default="{ row }">{{ row.max_users === -1 ? '不限' : row.max_users }}</template>
        </el-table-column>
        <el-table-column prop="data_retention_days" label="数据保留" width="100" align="center">
          <template #default="{ row }">{{ row.data_retention_days === -1 ? '永久' : row.data_retention_days + '天' }}</template>
        </el-table-column>
        <el-table-column label="功能模块" min-width="280">
          <template #default="{ row }">
            const features = typeof row.features === 'string' ? JSON.parse(row.features || '{}') : (row.features || {})
            const labels = { cost:'成本核算', procurement:'采购管理', inventory:'库存控制', production:'生产精益', quality:'质量成本', incentive:'激励中心', api:'API接口' }
            <el-tag
              v-for="(enabled, key) in features"
              :key="key"
              :type="enabled ? '' : 'info'"
              size="small"
              style="margin:2px 4px 2px 0"
            >{{ labels[key] || key }} {{ enabled ? '' : '(关)' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="editPlan(row)">编辑</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 编辑对话框 -->
    <el-dialog v-model="dialogVisible" title="编辑套餐" width="480px">
      <el-form :model="form" label-width="100px">
        <el-form-item label="名称"><el-input v-model="form.plan_name"/></el-form-item>
        <el-row :gutter="16">
          <el-col :span="12"><el-form-item label="月付(元)"><el-input-number v-model="form.price_monthly" :min="0"/></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="年付(元)"><el-input-number v-model="form.price_yearly" :min="0"/></el-form-item></el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12"><el-form-item label="用户上限"><el-input-number v-model="form.max_users" :min="-1"/></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="数据保留(天)"><el-input-number v-model="form.data_retention_days" :min="-1"/></el-form-item></el-col>
        </el-row>
        <el-form-item label="功能开关">
          <div style="display:flex;flex-wrap:wrap;gap:8px;">
            <el-checkbox v-for="key in Object.keys(featureLabels)" :key="key" v-model="form.features[key]">{{ featureLabels[key] }}</el-checkbox>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible=false">取消</el-button>
        <el-button type="primary" @click="savePlan">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import platformRequest from '../../../api/platformRequest'

const loading = ref(false)
const planList = ref([])
const dialogVisible = ref(false)
const editingId = ref(null)

const featureLabels = { cost:'成本核算', procurement:'采购管理', inventory:'库存控制', production:'生产精益', quality:'质量成本', incentive:'激励中心', api:'API接口' }

const form = reactive({ plan_name:'', price_monthly:0, price_yearly:0, max_users:3, data_retention_days:30, features:{ cost:true, procurement:false, inventory:false, production:false, quality:false, incentive:false, api:false } })

onMounted(fetchPlans)

async function fetchPlans() {
  loading.value=true
  try { planList.value=(await platformRequest.get('/platform/plans')).data } finally{ loading.value=false }
}

function editPlan(row) {
  editingId.value=row.id
  form.plan_name=row.plan_name; form.price_monthly=row.price_monthly; form.price_yearly=row.price_yearly
  form.max_users=row.max_users; form.data_retention_days=row.data_retention_days
  const f=typeof row.features==='string'?JSON.parse(row.features||'{}'):(row.features||{})
  Object.keys(featureLabels).forEach(k=>form.features[k]=!!f[k])
  dialogVisible.value=true
}

async function savePlan() {
  try {
    await platformRequest.put(`/platform/plans/${editingId.value}`, form)
    ElMessage.success('保存成功'); dialogVisible.value=false; fetchPlans()
  } catch{}
}
</script>

<style scoped>.tip-text{color:#6b7280;font-size:13px;margin-bottom:8px;}</style>
