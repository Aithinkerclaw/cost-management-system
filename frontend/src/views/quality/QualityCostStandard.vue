<template>
  <div class="quality-cost-standard-page">
    <div class="page-header">
      <h2>质量成本标准分类</h2>
      <div class="header-actions">
        <el-button type="primary" @click="handleInitStandard" v-if="!hasStandard">初始化GB/T 46709标准分类</el-button>
        <el-button type="primary" @click="handleCreate">新增分类</el-button>
      </div>
    </div>

    <!-- 按类别筛选 -->
    <el-radio-group v-model="filterCategory" @change="loadData" style="margin-bottom: 20px;">
      <el-radio-button label="">全部</el-radio-button>
      <el-radio-button label="prevention">预防成本</el-radio-button>
      <el-radio-button label="appraisal">鉴定成本</el-radio-button>
      <el-radio-button label="internal_failure">内部质量损失</el-radio-button>
      <el-radio-button label="external_failure">外部质量损失</el-radio-button>
    </el-radio-group>

    <el-table :data="list" border style="width: 100%">
      <el-table-column prop="cost_category" label="成本类别" width="150">
        <template #default="scope">
          {{ categoryMap[scope.row.cost_category] || scope.row.cost_category }}
        </template>
      </el-table-column>
      <el-table-column prop="cost_item" label="费用项目" width="200"></el-table-column>
      <el-table-column prop="account_code" label="会计科目编码" width="150"></el-table-column>
      <el-table-column prop="description" label="说明"></el-table-column>
      <el-table-column label="状态" width="100">
        <template #default="scope">
          <el-tag :type="scope.row.is_enabled ? 'success' : 'danger'">
            {{ scope.row.is_enabled ? '启用' : '禁用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="150">
        <template #default="scope">
          <el-button size="small" @click="handleEdit(scope.row)">编辑</el-button>
          <el-button size="small" type="danger" @click="handleDelete(scope.row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import * as qualityCostApi from '@/api/qualityCost';

const list = ref([]);
const filterCategory = ref('');
const hasStandard = ref(false);

const categoryMap = {
  prevention: '预防成本',
  appraisal: '鉴定成本',
  internal_failure: '内部质量损失',
  external_failure: '外部质量损失'
};

const loadData = async () => {
  const res = await qualityCostApi.getQualityCostStandardList({ cost_category: filterCategory.value });
  list.value = res.data || [];
  hasStandard.value = list.value.length > 0;
};

const handleInitStandard = async () => {
  await ElMessageBox.confirm('确定要初始化GB/T 46709标准分类吗？', '提示', { type: 'warning' });
  await qualityCostApi.initStandardQualityCost();
  ElMessage.success('初始化成功');
  loadData();
};

const handleCreate = () => {
  // 新增逻辑
};

const handleEdit = (row) => {
  // 编辑逻辑
};

const handleDelete = async (row) => {
  await ElMessageBox.confirm('确定要删除该分类吗？', '提示', { type: 'warning' });
  await qualityCostApi.deleteQualityCostStandard(row.id);
  ElMessage.success('删除成功');
  loadData();
};

onMounted(() => {
  loadData();
});
</script>

<style scoped>
.quality-cost-standard-page { padding: 20px; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
</style>
