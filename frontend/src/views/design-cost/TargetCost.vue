<template>
  <div class="target-cost">
    <el-card shadow="hover">
      <template #header>
        <div style="display:flex;justify-content:space-between;align-items:center">
          <span>🎯 目标成本管控</span>
          <el-button type="primary" size="small" @click="openForm()">+ 设定目标成本</el-button>
        </div>
      </template>

      <!-- 目标成本列表 -->
      <el-table :data="list" size="small" stripe style="width:100%">
        <el-table-column prop="product_name" label="产品名称" min-width="140" />
        <el-table-column label="目标成本(¥)" width="120" align="right">
          <template #default="{ row }">¥{{ (row.target_cost||0).toFixed(2) }}</template>
        </el-table-column>
        <el-table-column label="材料目标" width="100" align="right">
          <template #default="{ row }">¥{{ (row.material_target||0).toFixed(2) }}</template>
        </el-table-column>
        <el-table-column label="人工目标" width="100" align="right">
          <template #default="{ row }">¥{{ (row.labor_target||0).toFixed(2) }}</template>
        </el-table-column>
        <el-table-column label="制造费用目标" width="120" align="right">
          <template #default="{ row }">¥{{ (row.overhead_target||0).toFixed(2) }}</template>
        </el-table-column>
        <el-table-column prop="version" label="版本" width="70" align="center" />
        <el-table-column label="状态" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status==='active'?'success':'info'" size="small">
              {{ row.status==='active'?'生效':'停用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="160" align="center">
          <template #default="{ row }">
            <el-button size="small" @click="openForm(row)">编辑</el-button>
            <el-button size="small" type="danger" @click="handleDelete(row.id)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 新增/编辑对话框 -->
    <el-dialog v-model="dialogVisible" :title="formMode==='add'?'新增目标成本':'编辑目标成本'" width="560px">
      <el-form :model="form" label-width="110px" size="small">
        <el-form-item label="产品" required>
          <el-select v-model="form.product_id" style="width:100%" placeholder="选择产品">
            <el-option v-for="p in productOptions" :key="p.id" :label="p.product_name" :value="p.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="目标成本(¥)" required>
          <el-input-number v-model="form.target_cost" :min="0" :step="100" style="width:100%" />
        </el-form-item>
        <el-form-item label="材料目标(¥)">
          <el-input-number v-model="form.material_target" :min="0" :step="50" style="width:100%" />
        </el-form-item>
        <el-form-item label="人工目标(¥)">
          <el-input-number v-model="form.labor_target" :min="0" :step="50" style="width:100%" />
        </el-form-item>
        <el-form-item label="制造费用目标(¥)">
          <el-input-number v-model="form.overhead_target" :min="0" :step="50" style="width:100%" />
        </el-form-item>
        <el-form-item label="版本">
          <el-input-number v-model="form.version" :min="1" style="width:100%" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="form.status" style="width:100%">
            <el-option label="生效" value="active" />
            <el-option label="停用" value="inactive" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button size="small" @click="dialogVisible=false">取消</el-button>
        <el-button size="small" type="primary" @click="handleSave">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { designCostApi } from '../../api/index'
import { ElMessage, ElMessageBox } from 'element-plus'

const list = ref([])
const productOptions = ref([])
const dialogVisible = ref(false)
const formMode = ref('add')
const form = ref({})

async function loadData() {
  const res = await designCostApi.getTargetList()
  list.value = res.data || []
}

async function loadProducts() {
  // 复用成本核算接口获取产品列表（或单独提供产品API）
  const res = await designCostApi.getTrackList()
  // 用 design_cost_records 里出现过的 product 去重
  const seen = new Set()
  list.value.forEach(r => {
    if (r.product_name && !seen.has(r.product_id)) {
      seen.add(r.product_id)
      productOptions.value.push({ id: r.product_id, product_name: r.product_name })
    }
  })
  // fallback：如果为空则从订单接口拿
  if (!productOptions.value.length) {
    const { costApi } = require('../../api/index')
    const res2 = await costApi.getOverview()
    // 从 overview 提取产品名（简化处理）
  }
}

function openForm(row) {
  formMode.value = row ? 'edit' : 'add'
  form.value = row ? { ...row } : { target_cost: 0, material_target: 0, labor_target: 0, overhead_target: 0, version: 1, status: 'active' }
  dialogVisible.value = true
}

async function handleSave() {
  if (!form.value.product_id || !form.value.target_cost) return ElMessage.warning('产品和目标成本不能为空')
  try {
    if (formMode.value === 'add') {
      await designCostApi.createTarget(form.value)
      ElMessage.success('创建成功')
    } else {
      await designCostApi.updateTarget(form.value.id, form.value)
      ElMessage.success('更新成功')
    }
    dialogVisible.value = false
    loadData()
  } catch (e) { ElMessage.error('保存失败') }
}

async function handleDelete(id) {
  try {
    await ElMessageBox.confirm('确认删除该目标成本？', '提示', { type: 'warning' })
    await designCostApi.deleteTarget(id)
    ElMessage.success('删除成功')
    loadData()
  } catch (e) { if (e !== 'cancel') ElMessage.error('删除失败') }
}

onMounted(() => { loadData(); loadProducts() })
</script>
