<template>
  <div class="quality-record">
    <el-card shadow="hover">
      <template #header>
        <div style="display:flex;justify-content:space-between;align-items:center">
          <span>✅ 质量成本录入</span>
          <el-button type="primary" size="small" @click="openForm()">+ 新增记录</el-button>
        </div>
      </template>

      <el-table :data="list" size="small" stripe style="width:100%">
        <el-table-column prop="record_date" label="日期" width="110" />
        <el-table-column label="类型" width="100" align="center">
          <template #default="{ row }">
            {{ {prevention:'预防',appraisal:'鉴定',internal_failure:'内部失败',external_failure:'外部失败'}[row.type] || row.type }}
          </template>
        </el-table-column>
        <el-table-column prop="description" label="说明" />
        <el-table-column prop="amount" label="金额(¥)" width="110" align="right">
          <template #default="{ row }">{{ Number(row.amount || 0).toLocaleString() }}</template>
        </el-table-column>
        <el-table-column prop="batch_no" label="批次号" width="130" />
        <el-table-column label="操作" width="140" align="center">
          <template #default="{ row }">
            <el-button size="small" @click="openForm(row)">编辑</el-button>
            <el-button size="small" type="danger" @click="handleDelete(row.id)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 录入对话框 -->
    <el-dialog v-model="dialogVisible" :title="formMode === 'add' ? '新增质量成本' : '编辑质量成本'" width="500px">
      <el-form :model="form" label-width="90px" size="small">
        <el-form-item label="日期"><el-date-picker v-model="form.record_date" type="date" style="width:100%" /></el-form-item>
        <el-form-item label="类型">
          <el-select v-model="form.type" style="width:100%">
            <el-option label="预防成本" value="prevention" />
            <el-option label="鉴定成本" value="appraisal" />
            <el-option label="内部失败" value="internal_failure" />
            <el-option label="外部失败" value="external_failure" />
          </el-select>
        </el-form-item>
        <el-form-item label="金额(¥)"><el-input-number v-model="form.amount" :min="0" :step="100" style="width:100%" /></el-form-item>
        <el-form-item label="说明"><el-input v-model="form.description" type="textarea" :rows="2" /></el-form-item>
        <el-form-item label="批次号"><el-input v-model="form.batch_no" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSave">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { qualityApi } from '../../api/index'
import { ElMessage, ElMessageBox } from 'element-plus'

const list = ref([])
const dialogVisible = ref(false)
const formMode = ref('add')
const form = ref({})

const loadList = async () => {
  const res = await qualityApi.getRecordList()
  list.value = res.data || []
}

const openForm = (row) => {
  formMode.value = row ? 'edit' : 'add'
  form.value = row ? { ...row } : { record_date: new Date().toISOString().slice(0, 10), type: 'internal_failure', amount: 0, description: '', batch_no: '' }
  dialogVisible.value = true
}

const handleSave = async () => {
  if (formMode.value === 'add') {
    await qualityApi.createRecord(form.value)
    ElMessage.success('新增成功')
  } else {
    await qualityApi.updateRecord(form.value.id, form.value)
    ElMessage.success('修改成功')
  }
  dialogVisible.value = false
  loadList()
}

const handleDelete = async (id) => {
  await ElMessageBox.confirm('确定删除？', '提示', { type: 'warning' })
  await qualityApi.deleteRecord(id)
  ElMessage.success('删除成功')
  loadList()
}

onMounted(loadList)
</script>
