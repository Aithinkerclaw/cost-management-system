<template>
  <div class="cost-estimate-page">
    <div class="page-header">
      <h2>项目成本估算</h2>
      <el-button type="primary" @click="handleCreate">新增估算</el-button>
    </div>

    <!-- 估算方法筛选 -->
    <el-radio-group v-model="filterMethod" @change="loadData" style="margin-bottom: 20px;">
      <el-radio-button label="">全部</el-radio-button>
      <el-radio-button label="analogy">类比估算</el-radio-button>
      <el-radio-button label="parametric">参数估算</el-radio-button>
      <el-radio-button label="bottom_up">自下而上估算</el-radio-button>
    </el-radio-group>

    <!-- 估算列表 -->
    <el-table :data="list" border style="width: 100%">
      <el-table-column prop="estimate_no" label="估算编号" width="150"></el-table-column>
      <el-table-column prop="project_name" label="项目名称" width="200"></el-table-column>
      <el-table-column prop="estimate_method" label="估算方法" width="120">
        <template #default="scope">
          {{ methodMap[scope.row.estimate_method] || scope.row.estimate_method }}
        </template>
      </el-table-column>
      <el-table-column prop="estimated_cost" label="估算成本(元)" width="120"></el-table-column>
      <el-table-column prop="accuracy_rate" label="精度(±%)" width="100"></el-table-column>
      <el-table-column prop="status" label="状态" width="100">
        <template #default="scope">
          <el-tag :type="statusType(scope.row.status)">{{ statusText(scope.row.status) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="250">
        <template #default="scope">
          <el-button size="small" @click="handleView(scope.row)">查看</el-button>
          <el-button size="small" type="primary" @click="handleEdit(scope.row)" :disabled="scope.row.status !== 'draft'">编辑</el-button>
          <el-button size="small" type="success" @click="handleSubmit(scope.row)" :disabled="scope.row.status !== 'draft'">提交</el-button>
          <el-button size="small" type="warning" @click="handleApprove(scope.row)" :disabled="scope.row.status !== 'submitted'">审批</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 新增/编辑对话框 -->
    <el-dialog :title="dialogTitle" v-model="dialogVisible" width="600px">
      <el-form :model="form" label-width="100px">
        <el-form-item label="项目名称">
          <el-input v-model="form.project_name"></el-input>
        </el-form-item>
        <el-form-item label="估算方法">
          <el-select v-model="form.estimate_method" placeholder="请选择">
            <el-option label="类比估算" value="analogy"></el-option>
            <el-option label="参数估算" value="parametric"></el-option>
            <el-option label="自下而上估算" value="bottom_up"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="估算成本(元)">
          <el-input-number v-model="form.estimated_cost" :min="0" :precision="2"></el-input-number>
        </el-form-item>
        <el-form-item label="精度(±%)">
          <el-input-number v-model="form.accuracy_rate" :min="0" :max="100" :precision="2"></el-input-number>
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
import * as costEstimateApi from '@/api/costEstimate';

const list = ref([]);
const dialogVisible = ref(false);
const dialogTitle = ref('新增成本估算');
const isEdit = ref(false);
const filterMethod = ref('');

const methodMap = {
  analogy: '类比估算',
  parametric: '参数估算',
  bottom_up: '自下而上估算'
};

const form = ref({
  project_name: '',
  estimate_method: 'analogy',
  estimated_cost: 0,
  accuracy_rate: 10
});

const loadData = async () => {
  const res = await costEstimateApi.getCostEstimateList({ estimate_method: filterMethod.value });
  list.value = res.data || [];
};

const statusText = (status) => {
  const map = { draft: '草稿', submitted: '已提交', approved: '已审批' };
  return map[status] || status;
};

const statusType = (status) => {
  const map = { draft: 'info', submitted: 'warning', approved: 'success' };
  return map[status] || 'info';
};

const handleCreate = () => {
  isEdit.value = false;
  dialogTitle.value = '新增成本估算';
  form.value = { project_name: '', estimate_method: 'analogy', estimated_cost: 0, accuracy_rate: 10 };
  dialogVisible.value = true;
};

const handleEdit = (row) => {
  isEdit.value = true;
  dialogTitle.value = '编辑成本估算';
  form.value = { ...row };
  dialogVisible.value = true;
};

const handleView = (row) => {
  // 查看详情
};

const handleSave = async () => {
  if (isEdit.value) {
    await costEstimateApi.updateCostEstimate(form.value.id, form.value);
  } else {
    await costEstimateApi.createCostEstimate(form.value);
  }
  ElMessage.success('保存成功');
  dialogVisible.value = false;
  loadData();
};

const handleSubmit = async (row) => {
  await costEstimateApi.submitCostEstimate(row.id);
  ElMessage.success('提交成功');
  loadData();
};

const handleApprove = async (row) => {
  await costEstimateApi.approveCostEstimate(row.id);
  ElMessage.success('审批通过');
  loadData();
};

onMounted(() => {
  loadData();
});
</script>

<style scoped>
.cost-estimate-page { padding: 20px; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
</style>
