<template>
  <div class="design-cost">
    <!-- 成本偏差预警 -->
    <el-alert v-if="overrunCount > 0" type="warning" show-icon style="margin-bottom:16px">
      有 {{ overrunCount }} 条设计成本记录超出目标，请检查
      <router-link to="/design/track" style="margin-left:8px">查看详情</router-link>
    </el-alert>

    <el-row :gutter="16">
      <!-- 设计变更列表 -->
      <el-col :xs="24" :lg="14">
        <el-card shadow="hover">
          <template #header>
            <div style="display:flex;justify-content:space-between;align-items:center">
              <span>📐 设计变更管理</span>
              <el-button type="primary" size="small" @click="openForm()">+ 新增变更</el-button>
            </div>
          </template>
          <el-table :data="list" size="small" stripe style="width:100%">
            <el-table-column prop="change_no" label="变更号" width="140" />
            <el-table-column prop="project_name" label="项目名称" />
            <el-table-column prop="part_name" label="零件名称" width="120" />
            <el-table-column prop="change_type" label="变更类型" width="100" align="center" />
            <el-table-column prop="cost_impact" label="成本影响" width="100" align="right">
              <template #default="{ row }">¥{{ (row.cost_impact || 0).toFixed(2) }}</template>
            </el-table-column>
            <el-table-column prop="saving_amount" label="节约金额" width="100" align="right">
              <template #default="{ row }">¥{{ (row.saving_amount || 0).toFixed(2) }}</template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="90" align="center">
              <template #default="{ row }">
                <el-tag :type="row.status === 'approved' ? 'success' : row.status === 'draft' ? 'info' : 'warning'">
                  {{ {draft:'草稿',approved:'已批准',implemented:'已实施'}[row.status] || row.status }}
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
      </el-col>

      <!-- DFA 分析 -->
      <el-col :xs="24" :lg="10">
        <el-card shadow="hover">
          <template #header><span>🔧 DFMA 简化分析</span></template>
          <el-form :model="dfaForm" label-width="110px" size="small">
            <el-form-item label="零部件数量">
              <el-input-number v-model="dfaForm.partCount" :min="1" :max="50" style="width:100%" />
            </el-form-item>
            <el-form-item label="单件装配时间(分)">
              <el-input-number v-model="dfaForm.assemblyTime" :min="0.5" :step="0.5" style="width:100%" />
            </el-form-item>
            <el-form-item label="不良率(%)">
              <el-input-number v-model="dfaForm.defectRatePct" :min="0" :max="10" :step="0.1" style="width:100%" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="runDfa" style="width:100%">运行 DFMA 分析</el-button>
            </el-form-item>
          </el-form>

          <div v-if="dfaResult" style="margin-top:16px;padding:16px;background:#f8f9fa;border-radius:8px">
            <div style="font-weight:600;margin-bottom:8px">分析结果</div>
            <div>DFA 评分：<strong>{{ dfaResult.dfaScore }}</strong> / 100</div>
            <div>总装配时间：{{ dfaResult.totalAssemblyTime }} 分</div>
            <div>预计缺陷数：{{ dfaResult.estimatedDefects.toFixed(1) }}</div>
            <div style="margin-top:8px">
              <div style="font-size:12px;color:#666;margin-bottom:4px">改进建议：</div>
              <div v-for="(s, i) in dfaResult.suggestions" :key="i" style="font-size:12px;color:#333;margin-bottom:2px">
                • {{ s }}
              </div>
              <div v-if="dfaResult.suggestions.length === 0" style="font-size:12px;color:green">设计已较优，无需改进</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 新增/编辑对话框 -->
    <el-dialog v-model="dialogVisible" :title="formMode === 'add' ? '新增设计变更' : '编辑设计变更'" width="600px">
      <el-form :model="form" label-width="100px" size="small">
        <el-form-item label="项目名称"><el-input v-model="form.project_name" /></el-form-item>
        <el-form-item label="零件名称"><el-input v-model="form.part_name" /></el-form-item>
        <el-form-item label="变更类型">
          <el-select v-model="form.change_type" style="width:100%">
            <el-option label="材料变更" value="material" />
            <el-option label="工艺变更" value="process" />
            <el-option label="结构变更" value="structure" />
            <el-option label="公差调整" value="tolerance" />
          </el-select>
        </el-form-item>
        <el-form-item label="变更描述"><el-input v-model="form.description" type="textarea" :rows="3" /></el-form-item>
        <el-form-item label="原材料"><el-input v-model="form.old_material" /></el-form-item>
        <el-form-item label="新材料"><el-input v-model="form.new_material" /></el-form-item>
        <el-form-item label="原工艺"><el-input v-model="form.old_process" /></el-form-item>
        <el-form-item label="新工艺"><el-input v-model="form.new_process" /></el-form-item>
        <el-form-item label="成本影响(¥)"><el-input-number v-model="form.cost_impact" :step="100" style="width:100%" /></el-form-item>
        <el-form-item label="节约金额(¥)"><el-input-number v-model="form.saving_amount" :step="100" style="width:100%" /></el-form-item>
        <el-form-item label="状态">
          <el-select v-model="form.status" style="width:100%">
            <el-option label="草稿" value="draft" />
            <el-option label="已批准" value="approved" />
            <el-option label="已实施" value="implemented" />
          </el-select>
        </el-form-item>
        <el-form-item label="提出人"><el-input v-model="form.proposer_name" /></el-form-item>
        <el-form-item label="批准人"><el-input v-model="form.approver_name" /></el-form-item>
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
import { designCostApi } from '../../api/index'
import { ElMessage, ElMessageBox } from 'element-plus'

const list = ref([])
const dialogVisible = ref(false)
const formMode = ref('add')
const form = ref({})
const dfaForm = ref({ partCount: 10, assemblyTime: 5, defectRatePct: 2 })
const dfaResult = ref(null)
const overrunCount = ref(0)

const loadOverrun = async () => {
  try {
    const res = await designCostApi.getTrackList()
    overrunCount.value = (res.data || []).filter(r => (r.variance || 0) > 0).length
  } catch (e) {}
}

const loadList = async () => {
  const res = await designCostApi.list()
  list.value = res.data || []
}

const openForm = (row) => {
  formMode.value = row ? 'edit' : 'add'
  form.value = row ? { ...row } : { change_no: '', project_name: '', part_name: '', change_type: 'material', description: '', old_material: '', new_material: '', old_process: '', new_process: '', cost_impact: 0, saving_amount: 0, status: 'draft', proposer_name: '', approver_name: '' }
  dialogVisible.value = true
}

const handleSave = async () => {
  if (formMode.value === 'add') {
    await designCostApi.create(form.value)
    ElMessage.success('新增成功')
  } else {
    await designCostApi.update(form.value.id, form.value)
    ElMessage.success('修改成功')
  }
  dialogVisible.value = false
  loadList()
}

const handleDelete = async (id) => {
  await ElMessageBox.confirm('确定删除？', '提示', { type: 'warning' })
  await designCostApi.delete(id)
  ElMessage.success('删除成功')
  loadList()
}

const runDfa = async () => {
  const res = await designCostApi.dfa({
    partCount: dfaForm.value.partCount,
    assemblyTime: dfaForm.value.assemblyTime,
    defectRate: dfaForm.value.defectRatePct / 100
  })
  dfaResult.value = res.data
}

onMounted(() => {
  loadList()
  loadOverrun()
})
</script>
