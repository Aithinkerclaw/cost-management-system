<template>
  <div class="proposal-manage">
    <el-card shadow="hover">
      <template #header>
        <span>📝 改善提案管理</span>
        <el-button type="primary" size="small" style="float:right" @click="showSubmit = true">+ 提交新提案</el-button>
      </template>

      <!-- 状态筛选 -->
      <div style="margin-bottom:16px;display:flex;gap:8px;flex-wrap:wrap">
        <el-radio-group v-model="statusFilter" size="small" @change="loadData">
          <el-radio-button value="">全部</el-radio-button>
          <el-radio-button value="submitted">待评审</el-radio-button>
          <el-radio-button value="reviewing">评审中</el-radio-button>
          <el-radio-button value="approved">已批准</el-radio-button>
          <el-radio-button value="implementing">实施中</el-radio-button>
          <el-radio-button value="completed">已完成</el-radio-button>
        </el-radio-group>
      </div>

      <!-- 提案列表 -->
      <el-table :data="proposals.list || []" stripe size="small">
        <el-table-column prop="title" label="提案标题" min-width="200" />
        <el-table-column prop="department" label="部门" width="90" />
        <el-table-column prop="category" label="类别" width="90">
          <template #default="{ row }"><el-tag size="small">{{ { 'cost-saving':'成本节约', 'efficiency':'效率提升', 'quality':'质量改善', 'safety':'安全' }[row.category] }}</el-tag></template>
        </el-table-column>
        <el-table-column prop="expected_saving" label="预期节约(元)" align="right" width="110">
          <template #default="{ row }">{{ row.expected_saving?.toLocaleString() }}</template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="90" align="center">
          <template #default="{ row }"><el-tag size="small" :type="statusMap[row.status]">{{ statusTextMap[row.status] }}</el-tag></template>
        </el-table-column>
        <el-table-column prop="points" label="积分" width="60" align="center" />
        <el-table-column prop="proposerName" label="提交人" width="80" />
        <el-table-column label="操作" fixed="right" width="140">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="approve(row)" v-if="row.status === 'submitted' || row.status === 'reviewing'">审批</el-button>
            <el-button link type="warning" size="small" @click="complete(row)" v-if="row.status === 'implementing'">验收完成</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div style="margin-top:16px;text-align:right">
        <el-pagination
          :current-page="page" :page-size="pageSize"
          :total="(proposals.total || 0)"
          layout="total, prev, pager, next"
          @current-change="(p) => { page = p; loadData() }"
        />
      </div>
    </el-card>

    <!-- 提交提案对话框 -->
    <el-dialog v-model="showSubmit" title="提交改善提案" width="550px">
      <el-form :model="newForm" label-width="100px">
        <el-form-item label="提案标题"><el-input v-model="newForm.title" /></el-form-item>
        <el-form-item label="部门"><el-input v-model="newForm.department" /></el-form-item>
        <el-form-item label="类别">
          <el-select v-model="newForm.category" style="width:100%">
            <el-option label="成本节约" value="cost-saving" /><el-option label="效率提升" value="efficiency" />
            <el-option label="质量改善" value="quality" /><el-option label="安全" value="safety" />
          </el-select>
        </el-form-item>
        <el-form-item label="预期节约(元)"><el-input-number v-model="newForm.expected_saving" :min="0" style="width:100%" /></el-form-item>
        <el-form-item label="详细描述"><el-input v-model="newForm.description" type="textarea" :rows="4" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showSubmit = false">取消</el-button>
        <el-button type="primary" @click="submitProposal">提交提案</el-button>
      </template>
    </el-dialog>

    <!-- 审批对话框 -->
    <el-dialog v-model="showApprove" :title="'审批提案：' + (currentProposal?.title || '')" width="450px">
      <el-form :model="approveForm">
        <el-form-item label="审批结果">
          <el-select v-model="approveForm.status" style="width:100%">
            <el-option label="批准实施" value="approved" /><el-option label="驳回" value="rejected" />
          </el-select>
        </el-form-item>
        <el-form-item label="审批意见"><el-input v-model="approveForm.reviewNote" type="textarea" /></el-form-item>
      </el-form>
      <template #footer><el-button @click="showApprove=false">取消</el-button><el-button type="primary" @click="doApprove">确认审批</el-button></template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { incentiveApi } from '../../api/index'

const proposals = ref({})
const page = ref(1)
const pageSize = ref(10)
const statusFilter = ref('')
const showSubmit = ref(false)
const showApprove = ref(false)
const currentProposal = ref(null)

const newForm = reactive({ title: '', department: '', category: 'cost-saving', expected_saving: 0, description: '' })
const approveForm = reactive({ status: 'approved', reviewNote: '', points: 0, bonusAmount: 0 })

const statusMap = { submitted: 'warning', reviewing: '', approved: 'success', implementing: 'warning', completed: '', rejected: 'danger' }
const statusTextMap = { submitted: '待评审', reviewing: '评审中', approved: '已批准', implementing: '实施中', completed: '已完成', rejected: '已驳回' }

async function loadData() {
  const res = await incentiveApi.getProposals({ page: page.value, pageSize: pageSize.value, status: statusFilter.value })
  proposals.value = res.data
}

function approve(row) {
  currentProposal.value = row
  showApprove.value = true
}

function complete(row) {
  ElMessage.confirm('确认该提案已通过验收？', '提案验收').then(async () => {
    await incentiveApi.updateProposalStatus(row.id, { status: 'completed' })
    ElMessage.success('验收完成！')
    loadData()
  }).catch(() => {})
}

async function doApprove() {
  if (approveForm.status === 'approved') {
    approveForm.points = Math.ceil((currentProposal.value?.expected_saving || 0) / 100)
    approveForm.bonusAmount = Math.round((currentProposal.value?.expected_saving || 0) * 0.3 / 2)
  }
  await incentiveApi.updateProposalStatus(currentProposal.value.id, approveForm)
  showApprove.value = false
  ElMessage.success('审批完成')
  loadData()
}

async function submitProposal() {
  await incentiveApi.submitProposal(newForm)
  showSubmit.value = false
  ElMessage.success('提案提交成功！')
  loadData()
}

onMounted(loadData)
</script>

<style scoped></style>
