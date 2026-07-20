<template>
  <div class="supplier-list">
    <el-card shadow="hover">
      <template #header>
        <span>🏭 供应商管理</span>
        <el-button type="primary" size="small" style="float:right" @click="showDialog = true">+ 新增供应商</el-button>
      </template>

      <el-table :data="suppliers" stripe size="small">
        <el-table-column prop="supplier_name" label="供应商名称" min-width="160" />
        <el-table-column prop="contact_person" label="联系人" width="90" />
        <el-table-column prop="phone" label="电话" width="120" />
        <el-table-column prop="level" label="等级" width="60" align="center">
          <template #default="{ row }"><el-tag size="small" :type="{A:'danger',B:'warning',C:'info'}[row.level]">{{ row.level }}</el-tag></template>
        </el-table-column>
        <el-table-column label="QCDS评分" align="center">
          <el-table-column prop="quality_score" label="质量" width="60" align="center" />
          <el-table-column prop="cost_score" label="成本" width="60" align="center" />
          <el-table-column prop="delivery_score" label="交付" width="60" align="center" />
          <el-table-column prop="service_score" label="服务" width="60" align="center" />
          <el-table-column prop="total_score" label="总分" width="60" align="center">
            <template #default="{ row }"><b>{{ row.total_score }}</b></template>
          </el-table-column>
        </el-table-column>
        <el-table-column label="操作" width="140" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="editSupplier(row)">编辑评分</el-button>
            <el-button link type="danger">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 新增/编辑对话框 -->
    <el-dialog v-model="showDialog" :title="editing ? '编辑供应商' : '新增供应商'" width="520px">
      <el-form :model="form" label-width="100px" size="default">
        <el-form-item label="供应商名称"><el-input v-model="form.supplier_name" /></el-form-item>
        <el-form-item label="联系人"><el-input v-model="form.contact_person" /></el-form-item>
        <el-form-item label="电话"><el-input v-model="form.phone" /></el-form-item>
        <el-form-item label="地址"><el-input v-model="form.address" /></el-form-item>
        <el-divider>QCDS 评分（各0-100）</el-divider>
        <el-row :gutter="16">
          <el-col :span="12"><el-form-item label="质量分数"><el-input-number v-model="form.quality_score" :min="0" :max="100" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="成本分数"><el-input-number v-model="form.cost_score" :min="0" :max="100" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="交付分数"><el-input-number v-model="form.delivery_score" :min="0" :max="100" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="服务分数"><el-input-number v-model="form.service_score" :min="0" :max="100" /></el-form-item></el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="showDialog = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { procurementApi } from '../../api/index'

const suppliers = ref([])
const showDialog = ref(false)
const editing = ref(null)
const form = reactive({ supplier_name: '', contact_person: '', phone: '', address: '', level: 'C', quality_score: 80, cost_score: 75, delivery_score: 80, service_score: 70 })

async function loadData() {
  const res = await procurementApi.getSuppliers()
  suppliers.value = res.data.list || []
}

function editSupplier(row) {
  editing.value = row
  Object.assign(form, row)
  showDialog.value = true
}

async function handleSubmit() {
  if (editing.value) {
    await procurementApi.updateSupplier(editing.value.id, form)
    ElMessage.success('更新成功')
  } else {
    await procurementApi.createSupplier(form)
    ElMessage.success('创建成功')
  }
  showDialog.value = false
  editing.value = null
  loadData()
}

onMounted(loadData)
</script>

<style scoped></style>
