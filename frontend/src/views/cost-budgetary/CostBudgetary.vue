<template>
  <div class="cost-budgetary-page">
    <div class="page-header">
      <h2>项目成本概算</h2>
      <el-button type="primary" @click="handleCreate">新增概算</el-button>
    </div>

    <el-table :data="list" border style="width: 100%">
      <el-table-column prop="budgetary_no" label="概算编号" width="150"></el-table-column>
      <el-table-column prop="project_name" label="项目名称" width="200"></el-table-column>
      <el-table-column prop="total_estimated_cost" label="总估算成本(元)" width="150"></el-table-column>
      <el-table-column prop="approval_status" label="审批状态" width="120">
        <template #default="scope">
          <el-tag :type="statusType(scope.row.approval_status)">{{ statusText(scope.row.approval_status) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="200">
        <template #default="scope">
          <el-button size="small" @click="handleView(scope.row)">查看</el-button>
          <el-button size="small" type="primary" @click="handleEdit(scope.row)" :disabled="scope.row.approval_status !== 'pending'">编辑</el-button>
          <el-button size="small" type="success" @click="handleSubmit(scope.row)" :disabled="scope.row.approval_status !== 'pending'">提交</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 新增/编辑对话框 -->
    <el-dialog :title="dialogTitle" v-model="dialogVisible" width="600px">
      <el-form :model="form" label-width="120px">
        <el-form-item label="项目名称">
          <el-input v-model="form.project_name"></el-input>
        </el-form-item>
        <el-form-item label="项目编码">
          <el-input v-model="form.project_code"></el-input>
        </el-form-item>
        <el-form-item label="可行性研究阶段">
          <el-input v-model="form.feasibility_stage"></el-input>
        </el-form-item>
        <el-form-item label="总投资(元)">
          <el-input-number v-model="form.total_investment" :min="0" :precision="2"></el-input-number>
        </el-form-item>
        <el-form-item label="总估算成本(元)">
          <el-input-number v-model="form.total_estimated_cost" :min="0" :precision="2"></el-input-number>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSave">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import * as costBudgetaryApi from '@/api/costBudgetary';

const list = ref([]);
const dialogVisible = ref(false);
const dialogTitle = ref('新增成本概算');
const isEdit = ref(false);

const form = ref({
  project_name: '',
  project_code: '',
  feasibility_stage: '',
  total_investment: 0,
  total_estimated_cost: 0
});

const loadData = async () => {
  const res = await costBudgetaryApi.getCostBudgetaryList({});
  list.value = res.data || [];
};

const statusText = (status) => {
  const map = { pending: '待审批', submitted: '已提交', approved: '已审批' };
  return map[status] || status;
};

const statusType = (status) => {
  const map = { pending: 'warning', submitted: 'info', approved: 'success' };
  return map[status] || 'info';
};

const handleCreate = () => {
  isEdit.value = false;
  dialogTitle.value = '新增成本概算';
  form.value = { project_name: '', project_code: '', feasibility_stage: '', total_investment: 0, total_estimated_cost: 0 };
  dialogVisible.value = true;
};

const handleEdit = (row) => {
  isEdit.value = true;
  dialogTitle.value = '编辑成本概算';
  form.value = { ...row };
  dialogVisible.value = true;
};

const handleView = (row) => {
  // 查看详情
};

const handleSave = async () => {
  if (isEdit.value) {
    await costBudgetaryApi.updateCostBudgetary(form.value.id, form.value);
  } else {
    await costBudgetaryApi.createCostBudgetary(form.value);
  }
  ElMessage.success('保存成功');
  dialogVisible.value = false;
  loadData();
};

const handleSubmit = async (row) => {
  await costBudgetaryApi.submitCostBudgetary(row.id);
  ElMessage.success('提交成功');
  loadData();
};

onMounted(() => {
  loadData();
});
</script>

<style scoped>
.cost-budgetary-page { padding: 20px; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
</style>
