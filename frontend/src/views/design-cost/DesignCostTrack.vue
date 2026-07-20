<template>
  <div class="design-cost-track">
    <el-card shadow="hover">
      <template #header>
        <div style="display:flex;justify-content:space-between;align-items:center">
          <span>📊 设计成本核算（实际 vs 目标）</span>
          <el-button type="primary" size="small" @click="openForm()">+ 录入成本</el-button>
        </div>
      </template>

      <!-- 偏差预警 -->
      <el-alert v-if="overrunCount" type="warning" show-icon style="margin-bottom:12px">
        有 {{ overrunCount }} 条记录成本超目标，请检查设计变更方案。
      </el-alert>

      <el-table :data="list" size="small" stripe style="width:100%">
        <el-table-column label="产品" min-width="120" prop="product_name" />
        <el-table-column label="目标成本(¥)" width="120" align="right">
          <template #default="{ row }">¥{{ (row.target_cost||0).toFixed(2) }}</template>
        </el-table-column>
        <el-table-column label="实际材料" width="100" align="right">
          <template #default="{ row }">¥{{ (row.actual_material_cost||0).toFixed(2) }}</template>
        </el-table-column>
        <el-table-column label="实际人工" width="100" align="right">
          <template #default="{ row }">¥{{ (row.actual_labor_cost||0).toFixed(2) }}</template>
        </el-table-column>
        <el-table-column label="实际制造费用" width="130" align="right">
          <template #default="{ row }">¥{{ (row.actual_overhead_cost||0).toFixed(2) }}</template>
        </el-table-column>
        <el-table-column label="实际总成本" width="120" align="right">
          <template #default="{ row }">
            <b :style="{ color: row.variance>0?'#F56C6C':'#67C23A' }">¥{{ (row.total_actual_cost||0).toFixed(2) }}</b>
          </template>
        </el-table-column>
        <el-table-column label="偏差(¥)" width="110" align="right">
          <template #default="{ row }">
            <span :style="{ color: row.variance>0?'#F56C6C':'#67C23A', fontWeight:'bold' }">
              {{ row.variance>0 ? '+' : '' }}{{ (row.variance||0).toFixed(2) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="偏差率" width="90" align="right">
          <template #default="{ row }">
            <el-tag :type="row.variance_pct>0?'danger':'success'" size="small">
              {{ row.variance_pct>0 ? '+' : '' }}{{ (row.variance_pct||0).toFixed(1) }}%
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="140" align="center">
          <template #default="{ row }">
            <el-button size="small" @click="openForm(row)">编辑</el-button>
            <el-button size="small" type="danger" @click="handleDelete(row.id)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 新增/编辑对话框 -->
    <el-dialog v-model="dialogVisible" :title="formMode==='add'?'录入设计成本':'编辑成本记录'" width="580px">
      <el-form :model="form" label-width="120px" size="small">
        <el-form-item label="关联产品">
          <el-select v-model="form.product_id" style="width:100%">
            <el-option v-for="p in productOptions" :key="p.id" :label="p.product_name" :value="p.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="目标成本">
          <el-select v-model="form.target_cost_id" style="width:100%" placeholder="选择目标成本">
            <el-option v-for="t in targetOptions" :key="t.id" :label="'¥'+t.target_cost+' (v'+t.version" :value="t.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="关联设计变更">
          <el-select v-model="form.design_change_id" style="width:100%" placeholder="可选" clearable>
            <el-option v-for="d in changeOptions" :key="d.id" :label="d.change_no+' '+d.project_name" :value="d.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="实际材料成本(¥)">
          <el-input-number v-model="form.actual_material_cost" :min="0" :step="100" style="width:100%" />
        </el-form-item>
        <el-form-item label="实际人工成本(¥)">
          <el-input-number v-model="form.actual_labor_cost" :min="0" :step="100" style="width:100%" />
        </el-form-item>
        <el-form-item label="实际制造费用(¥)">
          <el-input-number v-model="form.actual_overhead_cost" :min="0" :step="100" style="width:100%" />
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
import { ref, computed, onMounted } from 'vue'
import { designCostApi } from '../../api/index'
import { ElMessage, ElMessageBox } from 'element-plus'

const list = ref([])
const productOptions = ref([])
const targetOptions = ref([])
const changeOptions = ref([])
const dialogVisible = ref(false)
const formMode = ref('add')
const form = ref({ actual_material_cost: 0, actual_labor_cost: 0, actual_overhead_cost: 0 })

const overrunCount = computed(() => (list.value || []).filter(r => (r.variance || 0) > 0).length)

async function loadData() {
  const res = await designCostApi.getTrackList()
  list.value = res.data || []
}

async function loadOptions() {
  // 产品列表（从target_costs联表拿到）
  const res = await designCostApi.getTargetList()
  targetOptions.value = res.data || []

  // 去重产品列表
  const productMap = new Map()
  ;(res.data || []).forEach(t => {
    if (!productMap.has(t.product_id)) {
      productMap.set(t.product_id, { id: t.product_id, product_name: t.product_name })
    }
  })
  productOptions.value = Array.from(productMap.values())

  // 设计变更列表
  const res2 = await designCostApi.list()
  changeOptions.value = res2.data || []
}

function openForm(row) {
  formMode.value = row ? 'edit' : 'add'
  form.value = row ? { ...row } : { actual_material_cost: 0, actual_labor_cost: 0, actual_overhead_cost: 0 }
  dialogVisible.value = true
}

async function handleSave() {
  try {
    if (formMode.value === 'add') {
      await designCostApi.createTrack(form.value)
      ElMessage.success('录入成功')
    } else {
      await designCostApi.updateTrack(form.value.id, form.value)
      ElMessage.success('更新成功')
    }
    dialogVisible.value = false
    loadData()
  } catch (e) { ElMessage.error('保存失败') }
}

async function handleDelete(id) {
  try {
    await ElMessageBox.confirm('确认删除该成本记录？', '提示', { type: 'warning' })
    await designCostApi.deleteTrack(id)
    ElMessage.success('删除成功')
    loadData()
  } catch (e) { if (e !== 'cancel') ElMessage.error('删除失败') }
}

onMounted(() => { loadData(); loadOptions() })
</script>
