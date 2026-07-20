<template>
  <div class="cost-budget-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>💰 成本预算编制与控制</span>
          <el-button type="primary" @click="handleCreate">
            <el-icon><Plus /></el-icon>
            新建预算
          </el-button>
        </div>
      </template>

      <!-- 搜索区域 -->
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="预算类型">
          <el-select v-model="searchForm.budget_type" placeholder="请选择" clearable>
            <el-option label="年度预算" value="annual" />
            <el-option label="项目预算" value="project" />
            <el-option label="月度预算" value="monthly" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="请选择" clearable>
            <el-option label="草稿" value="draft" />
            <el-option label="审批中" value="reviewing" />
            <el-option label="已批准" value="approved" />
            <el-option label="已驳回" value="rejected" />
            <el-option label="执行中" value="executing" />
          </el-select>
        </el-form-item>
        <el-form-item label="预算年度">
          <el-date-picker
            v-model="searchForm.fiscal_year"
            type="year"
            placeholder="选择年度"
            format="YYYY"
            value-format="YYYY"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>

      <!-- 预算列表 -->
      <el-table :data="budgetList" v-loading="loading" style="width: 100%">
        <el-table-column prop="budget_code" label="预算编号" width="150" />
        <el-table-column prop="budget_name" label="预算名称" min-width="200" />
        <el-table-column prop="budget_type" label="预算类型" width="100">
          <template #default="{ row }">
            <el-tag :type="getBudgetTypeTag(row.budget_type)">
              {{ getBudgetTypeText(row.budget_type) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="fiscal_year" label="预算年度" width="100" />
        <el-table-column prop="total_amount" label="预算总金额" width="150">
          <template #default="{ row }">
            ¥{{ formatNumber(row.total_amount) }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusTag(row.status)">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="prepared_name" label="编制人" width="100" />
        <el-table-column label="操作" width="250" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="handleView(row)">查看</el-button>
            <el-button size="small" type="primary" @click="handleEdit(row)" v-if="row.status === 'draft'">编辑</el-button>
            <el-button size="small" type="success" @click="handleSubmitApproval(row)" v-if="row.status === 'draft'">提交审批</el-button>
            <el-button size="small" type="warning" @click="handleExecution(row)" v-if="row.status === 'approved'">执行监控</el-button>
            <el-button size="small" type="danger" @click="handleDelete(row)" v-if="row.status === 'draft'">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.page_size"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 预算编制对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="800px"
      @close="handleDialogClose"
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="120px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="预算编号" prop="budget_code">
              <el-input v-model="form.budget_code" placeholder="如：BUDGET-2026-001" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="预算名称" prop="budget_name">
              <el-input v-model="form.budget_name" placeholder="请输入预算名称" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="预算类型" prop="budget_type">
              <el-select v-model="form.budget_type" placeholder="请选择预算类型" style="width: 100%">
                <el-option label="年度预算" value="annual" />
                <el-option label="项目预算" value="project" />
                <el-option label="月度预算" value="monthly" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="预算年度" prop="fiscal_year">
              <el-date-picker
                v-model="form.fiscal_year"
                type="year"
                placeholder="选择年度"
                format="YYYY"
                value-format="YYYY"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="开始日期" prop="start_date">
              <el-date-picker
                v-model="form.start_date"
                type="date"
                placeholder="选择开始日期"
                format="YYYY-MM-DD"
                value-format="YYYY-MM-DD"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="结束日期" prop="end_date">
              <el-date-picker
                v-model="form.end_date"
                type="date"
                placeholder="选择结束日期"
                format="YYYY-MM-DD"
                value-format="YYYY-MM-DD"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="预算总金额" prop="total_amount">
          <el-input-number
            v-model="form.total_amount"
            :min="0"
            :precision="2"
            :step="10000"
            controls-position="right"
            style="width: 100%"
            placeholder="请输入预算总金额"
          />
        </el-form-item>

        <el-form-item label="备注">
          <el-input v-model="form.notes" type="textarea" :rows="3" placeholder="请输入备注信息" />
        </el-form-item>

        <!-- WBS分解结构（简化版） -->
        <el-form-item label="WBS分解">
          <el-button size="small" @click="addWbsItem">添加WBS项</el-button>
          <div v-for="(item, index) in wbsItems" :key="index" style="margin-top: 10px;">
            <el-row :gutter="10">
              <el-col :span="6">
                <el-input v-model="item.code" placeholder="WBS编码" />
              </el-col>
              <el-col :span="12">
                <el-input v-model="item.name" placeholder="WBS名称" />
              </el-col>
              <el-col :span="4">
                <el-input-number v-model="item.amount" :min="0" placeholder="金额" />
              </el-col>
              <el-col :span="2">
                <el-button type="danger" size="small" @click="removeWbsItem(index)">删除</el-button>
              </el-col>
            </el-row>
          </div>
        </el-form-item>
      </el-form>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSubmit">确定</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 预算详情对话框 -->
    <el-dialog v-model="detailVisible" title="预算详情" width="900px">
      <div v-if="currentBudget">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="预算编号">{{ currentBudget.budget_code }}</el-descriptions-item>
          <el-descriptions-item label="预算名称">{{ currentBudget.budget_name }}</el-descriptions-item>
          <el-descriptions-item label="预算类型">{{ getBudgetTypeText(currentBudget.budget_type) }}</el-descriptions-item>
          <el-descriptions-item label="预算年度">{{ currentBudget.fiscal_year }}</el-descriptions-item>
          <el-descriptions-item label="预算总金额">¥{{ formatNumber(currentBudget.total_amount) }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="getStatusTag(currentBudget.status)">{{ getStatusText(currentBudget.status) }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="开始日期">{{ currentBudget.start_date }}</el-descriptions-item>
          <el-descriptions-item label="结束日期">{{ currentBudget.end_date }}</el-descriptions-item>
          <el-descriptions-item label="编制人">{{ currentBudget.prepared_name }}</el-descriptions-item>
        </el-descriptions>

        <!-- 预算明细 -->
        <h3 style="margin-top: 20px;">预算明细</h3>
        <el-table :data="currentBudget.details" style="width: 100%; margin-top: 10px;">
          <el-table-column prop="account_code" label="科目编码" width="120" />
          <el-table-column prop="account_name" label="科目名称" min-width="150" />
          <el-table-column prop="planned_amount" label="计划金额" width="150">
            <template #default="{ row }">
              ¥{{ formatNumber(row.planned_amount) }}
            </template>
          </el-table-column>
          <el-table-column prop="actual_amount" label="实际金额" width="150">
            <template #default="{ row }">
              ¥{{ formatNumber(row.actual_amount) }}
            </template>
          </el-table-column>
          <el-table-column prop="variance_rate" label="差异率" width="100">
            <template #default="{ row }">
              <span :style="{ color: row.variance_rate > 5 ? '#F56C6C' : '#67C23A' }">
                {{ row.variance_rate?.toFixed(2) }}%
              </span>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import {
  getCostBudgetList,
  getCostBudgetDetail,
  createCostBudget,
  updateCostBudget,
  deleteCostBudget,
  submitBudgetApproval
} from '@/api/costBudget';

// 数据定义
const loading = ref(false);
const budgetList = ref([]);
const dialogVisible = ref(false);
const detailVisible = ref(false);
const dialogTitle = ref('');
const currentBudget = ref(null);
const formRef = ref(null);

// 搜索表单
const searchForm = reactive({
  budget_type: '',
  status: '',
  fiscal_year: ''
});

// 分页
const pagination = reactive({
  page: 1,
  page_size: 20,
  total: 0
});

// 表单
const form = reactive({
  id: null,
  budget_code: '',
  budget_name: '',
  budget_type: 'annual',
  fiscal_year: new Date().getFullYear().toString(),
  start_date: '',
  end_date: '',
  total_amount: 0,
  notes: ''
});

// WBS项
const wbsItems = ref([]);

// 表单验证规则
const rules = {
  budget_code: [{ required: true, message: '请输入预算编号', trigger: 'blur' }],
  budget_name: [{ required: true, message: '请输入预算名称', trigger: 'blur' }],
  budget_type: [{ required: true, message: '请选择预算类型', trigger: 'change' }],
  start_date: [{ required: true, message: '请选择开始日期', trigger: 'change' }],
  end_date: [{ required: true, message: '请选择结束日期', trigger: 'change' }]
};

// 初始化
onMounted(() => {
  fetchBudgetList();
});

// 获取预算列表
const fetchBudgetList = async () => {
  loading.value = true;
  try {
    const params = {
      ...searchForm,
      page: pagination.page,
      page_size: pagination.page_size
    };
    const response = await getCostBudgetList(params);
    budgetList.value = response.data || response;
    // 这里需要根据实际API响应结构调整
  } catch (error) {
    ElMessage.error('获取预算列表失败：' + error.message);
  } finally {
    loading.value = false;
  }
};

// 搜索
const handleSearch = () => {
  pagination.page = 1;
  fetchBudgetList();
};

// 重置
const handleReset = () => {
  searchForm.budget_type = '';
  searchForm.status = '';
  searchForm.fiscal_year = '';
  pagination.page = 1;
  fetchBudgetList();
};

// 新建预算
const handleCreate = () => {
  dialogTitle.value = '新建预算';
  resetForm();
  dialogVisible.value = true;
};

// 查看预算
const handleView = async (row) => {
  try {
    const response = await getCostBudgetDetail(row.id);
    currentBudget.value = response.data || response;
    detailVisible.value = true;
  } catch (error) {
    ElMessage.error('获取预算详情失败：' + error.message);
  }
};

// 编辑预算
const handleEdit = (row) => {
  dialogTitle.value = '编辑预算';
  Object.assign(form, row);
  dialogVisible.value = true;
};

// 提交审批
const handleSubmitApproval = async (row) => {
  try {
    await ElMessageBox.confirm('确定提交审批吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    });
    
    await submitBudgetApproval(row.id);
    ElMessage.success('提交审批成功');
    fetchBudgetList();
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('提交审批失败：' + error.message);
    }
  }
};

// 删除预算
const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm('确定删除该预算吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    });
    
    await deleteCostBudget(row.id);
    ElMessage.success('删除成功');
    fetchBudgetList();
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败：' + error.message);
    }
  }
};

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return;
  
  try {
    await formRef.value.validate();
    
    // 构建WBS结构
    if (wbsItems.value.length > 0) {
      form.wbs_structure = JSON.stringify(wbsItems.value);
    }
    
    if (form.id) {
      await updateCostBudget(form.id, form);
      ElMessage.success('更新成功');
    } else {
      await createCostBudget(form);
      ElMessage.success('创建成功');
    }
    
    dialogVisible.value = false;
    fetchBudgetList();
  } catch (error) {
    ElMessage.error('操作失败：' + error.message);
  }
};

// 重置表单
const resetForm = () => {
  form.id = null;
  form.budget_code = 'BUDGET-' + new Date().getFullYear() + '-' + String(Math.floor(Math.random() * 1000)).padStart(3, '0');
  form.budget_name = '';
  form.budget_type = 'annual';
  form.fiscal_year = new Date().getFullYear().toString();
  form.start_date = '';
  form.end_date = '';
  form.total_amount = 0;
  form.notes = '';
  wbsItems.value = [];
};

// 对话框关闭
const handleDialogClose = () => {
  resetForm();
  if (formRef.value) {
    formRef.value.resetFields();
  }
};

// 添加WBS项
const addWbsItem = () => {
  wbsItems.value.push({
    code: '',
    name: '',
    amount: 0
  });
};

// 删除WBS项
const removeWbsItem = (index) => {
  wbsItems.value.splice(index, 1);
};

// 分页大小改变
const handleSizeChange = (val) => {
  pagination.page_size = val;
  pagination.page = 1;
  fetchBudgetList();
};

// 当前页改变
const handleCurrentChange = (val) => {
  pagination.page = val;
  fetchBudgetList();
};

// 格式化数字
const formatNumber = (num) => {
  if (!num) return '0.00';
  return Number(num).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

// 获取预算类型标签
const getBudgetTypeTag = (type) => {
  const map = {
    'annual': '',
    'project': 'success',
    'monthly': 'warning'
  };
  return map[type] || '';
};

// 获取预算类型文本
const getBudgetTypeText = (type) => {
  const map = {
    'annual': '年度预算',
    'project': '项目预算',
    'monthly': '月度预算'
  };
  return map[type] || type;
};

// 获取状态标签
const getStatusTag = (status) => {
  const map = {
    'draft': 'info',
    'reviewing': 'warning',
    'approved': 'success',
    'rejected': 'danger',
    'executing': '',
    'completed': 'success'
  };
  return map[status] || 'info';
};

// 获取状态文本
const getStatusText = (status) => {
  const map = {
    'draft': '草稿',
    'reviewing': '审批中',
    'approved': '已批准',
    'rejected': '已驳回',
    'executing': '执行中',
    'completed': '已完成'
  };
  return map[status] || status;
};
</script>

<style scoped>
.cost-budget-container {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.search-form {
  margin-bottom: 20px;
}

.pagination-container {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}
</style>
