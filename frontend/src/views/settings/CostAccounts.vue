<template>
  <div class="cost-accounts-page">
    <div class="page-header">
      <h2>成本科目配置</h2>
      <div class="header-actions">
        <el-button type="primary" @click="handleInitStandard" v-if="!hasStandard">初始化标准科目</el-button>
        <el-button type="primary" @click="handleCreate">新增科目</el-button>
      </div>
    </div>

    <el-table :data="list" border style="width: 100%">
      <el-table-column prop="account_code" label="科目编码" width="120"></el-table-column>
      <el-table-column prop="account_name" label="科目名称" width="200"></el-table-column>
      <el-table-column prop="account_type" label="科目类型" width="150">
        <template #default="scope">
          {{ accountTypeMap[scope.row.account_type] || scope.row.account_type }}
        </template>
      </el-table-column>
      <el-table-column label="是否标准" width="100">
        <template #default="scope">
          <el-tag :type="scope.row.is_standard ? 'success' : 'info'">
            {{ scope.row.is_standard ? '是' : '否' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="状态" width="100">
        <template #default="scope">
          <el-tag :type="scope.row.is_enabled ? 'success' : 'danger'">
            {{ scope.row.is_enabled ? '启用' : '禁用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="200">
        <template #default="scope">
          <el-button size="small" @click="handleEdit(scope.row)">编辑</el-button>
          <el-button size="small" type="danger" @click="handleDelete(scope.row)" :disabled="scope.row.is_standard">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 新增/编辑对话框 -->
    <el-dialog :title="dialogTitle" v-model="dialogVisible" width="500px">
      <el-form :model="form" label-width="100px">
        <el-form-item label="科目编码">
          <el-input v-model="form.account_code" :disabled="isEdit"></el-input>
        </el-form-item>
        <el-form-item label="科目名称">
          <el-input v-model="form.account_name"></el-input>
        </el-form-item>
        <el-form-item label="科目类型">
          <el-select v-model="form.account_type" placeholder="请选择">
            <el-option label="直接材料" value="direct_material"></el-option>
            <el-option label="燃料和动力" value="fuel_labor"></el-option>
            <el-option label="直接人工" value="direct_labor"></el-option>
            <el-option label="制造费用" value="manufacturing_overhead"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-switch v-model="form.is_enabled" :active-value="1" :inactive-value="0"></el-switch>
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
import { ElMessage, ElMessageBox } from 'element-plus';
import * as costAccountsApi from '@/api/costAccounts';

const list = ref([]);
const dialogVisible = ref(false);
const dialogTitle = ref('新增成本科目');
const isEdit = ref(false);
const hasStandard = ref(false);

const accountTypeMap = {
  direct_material: '直接材料',
  fuel_labor: '燃料和动力',
  direct_labor: '直接人工',
  manufacturing_overhead: '制造费用'
};

const form = ref({
  account_code: '',
  account_name: '',
  account_type: '',
  parent_id: null,
  is_enabled: 1
});

const loadData = async () => {
  const res = await costAccountsApi.getCostAccountList({});
  list.value = res.data || [];
  hasStandard.value = list.value.some(item => item.is_standard);
};

const handleInitStandard = async () => {
  await ElMessageBox.confirm('确定要初始化标准成本科目吗？', '提示', { type: 'warning' });
  await costAccountsApi.initStandardAccounts();
  ElMessage.success('初始化成功');
  loadData();
};

const handleCreate = () => {
  isEdit.value = false;
  dialogTitle.value = '新增成本科目';
  form.value = { account_code: '', account_name: '', account_type: '', parent_id: null, is_enabled: 1 };
  dialogVisible.value = true;
};

const handleEdit = (row) => {
  isEdit.value = true;
  dialogTitle.value = '编辑成本科目';
  form.value = { ...row };
  dialogVisible.value = true;
};

const handleSave = async () => {
  if (isEdit.value) {
    await costAccountsApi.updateCostAccount(form.value.id, form.value);
  } else {
    await costAccountsApi.createCostAccount(form.value);
  }
  ElMessage.success('保存成功');
  dialogVisible.value = false;
  loadData();
};

const handleDelete = async (row) => {
  await ElMessageBox.confirm('确定要删除该科目吗？', '提示', { type: 'warning' });
  await costAccountsApi.deleteCostAccount(row.id);
  ElMessage.success('删除成功');
  loadData();
};

onMounted(() => {
  loadData();
});
</script>

<style scoped>
.cost-accounts-page { padding: 20px; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
</style>
