<template>
  <div class="cost-kpi-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>📊 成本绩效评价KPI</span>
          <el-button type="primary" @click="handleCreateEvaluation">
            <el-icon><Plus /></el-icon>
            新建评价
          </el-button>
        </div>
      </template>

      <!-- KPI指标库 -->
      <div style="margin-bottom: 30px;">
        <h3>KPI指标库</h3>
        <el-table :data="kpiLibrary" v-loading="kpiLoading" style="width: 100%; margin-top: 10px;">
          <el-table-column prop="kpi_code" label="KPI编码" width="120" />
          <el-table-column prop="kpi_name" label="KPI名称" width="150" />
          <el-table-column prop="kpi_category" label="类别" width="120">
            <template #default="{ row }">
              <el-tag>{{ getCategoryText(row.kpi_category) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="calculation_formula" label="计算公式" min-width="200" />
          <el-table-column prop="target_value" label="目标值" width="100" />
          <el-table-column prop="unit" label="单位" width="80" />
          <el-table-column prop="is_enabled" label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="row.is_enabled ? 'success' : 'info'">
                {{ row.is_enabled ? '启用' : '禁用' }}
              </el-tag>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- 评价列表 -->
      <div>
        <h3>成本绩效评价记录</h3>
        <el-table :data="evaluationsList" v-loading="loading" style="width: 100%; margin-top: 10px;">
          <el-table-column prop="evaluation_code" label="评价编码" width="150" />
          <el-table-column prop="evaluation_name" label="评价名称" min-width="200" />
          <el-table-column prop="evaluation_period" label="评价期间" width="120" />
          <el-table-column prop="total_score" label="总评分" width="100">
            <template #default="{ row }">
              <span :style="{ color: row.total_score >= 90 ? '#67C23A' : row.total_score >= 60 ? '#E6A23C' : '#F56C6C' }">
                {{ row.total_score?.toFixed(2) || '--' }}
              </span>
            </template>
          </el-table-column>
          <el-table-column prop="grade" label="等级" width="100">
            <template #default="{ row }">
              <el-tag :type="getGradeTag(row.grade)">{{ row.grade || '--' }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="status" label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="getStatusTag(row.status)">{{ getStatusText(row.status) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="200" fixed="right">
            <template #default="{ row }">
              <el-button size="small" @click="handleViewEvaluation(row)">查看</el-button>
              <el-button size="small" type="primary" @click="handleCalculateScore(row)" v-if="row.status === 'draft'">计算评分</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-card>

    <!-- 新建评价对话框 -->
    <el-dialog
      v-model="evaluationDialogVisible"
      title="新建成本绩效评价"
      width="500px"
    >
      <el-form ref="evaluationFormRef" :model="evaluationForm" :rules="evaluationRules" label-width="120px">
        <el-form-item label="评价编码" prop="evaluation_code">
          <el-input v-model="evaluationForm.evaluation_code" placeholder="如：EVAL-20260616-001" />
        </el-form-item>
        <el-form-item label="评价名称" prop="evaluation_name">
          <el-input v-model="evaluationForm.evaluation_name" placeholder="请输入评价名称" />
        </el-form-item>
        <el-form-item label="评价期间" prop="evaluation_period">
          <el-date-picker
            v-model="evaluationForm.evaluation_period"
            type="month"
            placeholder="选择月份"
            format="YYYY-MM"
            value-format="YYYY-MM"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="evaluationForm.comments" type="textarea" :rows="3" placeholder="请输入备注信息" />
        </el-form-item>
      </el-form>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="evaluationDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleEvaluationSubmit">确定</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 评价详情对话框 -->
    <el-dialog v-model="evaluationDetailVisible" title="评价详情" width="800px">
      <div v-if="currentEvaluation">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="评价编码">{{ currentEvaluation.evaluation_code }}</el-descriptions-item>
          <el-descriptions-item label="评价名称">{{ currentEvaluation.evaluation_name }}</el-descriptions-item>
          <el-descriptions-item label="评价期间">{{ currentEvaluation.evaluation_period }}</el-descriptions-item>
          <el-descriptions-item label="总评分">{{ currentEvaluation.total_score?.toFixed(2) || '--' }}</el-descriptions-item>
          <el-descriptions-item label="等级">
            <el-tag :type="getGradeTag(currentEvaluation.grade)">{{ currentEvaluation.grade || '--' }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="getStatusTag(currentEvaluation.status)">{{ getStatusText(currentEvaluation.status) }}</el-tag>
          </el-descriptions-item>
        </el-descriptions>

        <!-- KPI评分明细 -->
        <h4 style="margin-top: 20px;">KPI评分明细</h4>
        <el-table :data="currentEvaluation.scores" style="width: 100%; margin-top: 10px;">
          <el-table-column prop="kpi_code" label="KPI编码" width="120" />
          <el-table-column prop="kpi_name" label="KPI名称" width="150" />
          <el-table-column prop="actual_value" label="实际值" width="120">
            <template #default="{ row }">
              <el-input v-model="row.actual_value" size="small" @change="updateScore(row)" />
            </template>
          </el-table-column>
          <el-table-column prop="score" label="得分" width="100">
            <template #default="{ row }">
              {{ row.score?.toFixed(2) || '--' }}
            </template>
          </el-table-column>
          <el-table-column prop="weight" label="权重(%)" width="100">
            <template #default="{ row }">
              {{ row.weight?.toFixed(2) || '--' }}
            </template>
          </el-table-column>
          <el-table-column prop="weighted_score" label="加权得分" width="100">
            <template #default="{ row }">
              {{ row.weighted_score?.toFixed(2) || '--' }}
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import {
  getCostKpiLibrary,
  getCostKpiEvaluations,
  getCostKpiEvaluationDetail,
  createCostKpiEvaluation,
  updateCostKpiScore,
  calculateCostKpiEvaluation
} from '@/api/costKpi';

// 数据定义
const loading = ref(false);
const kpiLoading = ref(false);
const kpiLibrary = ref([]);
const evaluationsList = ref([]);
const evaluationDialogVisible = ref(false);
const evaluationDetailVisible = ref(false);
const currentEvaluation = ref(null);
const evaluationFormRef = ref(null);

// 评价表单
const evaluationForm = reactive({
  evaluation_code: '',
  evaluation_name: '',
  evaluation_period: '',
  comments: ''
});

// 表单验证规则
const evaluationRules = {
  evaluation_code: [{ required: true, message: '请输入评价编码', trigger: 'blur' }],
  evaluation_name: [{ required: true, message: '请输入评价名称', trigger: 'blur' }],
  evaluation_period: [{ required: true, message: '请选择评价期间', trigger: 'change' }]
};

// 初始化
onMounted(() => {
  fetchKpiLibrary();
  fetchEvaluationsList();
});

// 获取KPI指标库
const fetchKpiLibrary = async () => {
  kpiLoading.value = true;
  try {
    const response = await getCostKpiLibrary({ is_enabled: 1 });
    kpiLibrary.value = response.data || response;
  } catch (error) {
    ElMessage.error('获取KPI指标库失败：' + error.message);
  } finally {
    kpiLoading.value = false;
  }
};

// 获取评价列表
const fetchEvaluationsList = async () => {
  loading.value = true;
  try {
    const response = await getCostKpiEvaluations();
    evaluationsList.value = response.data || response;
  } catch (error) {
    ElMessage.error('获取评价列表失败：' + error.message);
  } finally {
    loading.value = false;
  }
};

// 新建评价
const handleCreateEvaluation = () => {
  evaluationForm.evaluation_code = 'EVAL-' + new Date().toISOString().slice(0, 10).replace(/-/g, '') + '-' + Math.floor(Math.random() * 1000);
  evaluationForm.evaluation_name = '';
  evaluationForm.evaluation_period = '';
  evaluationForm.comments = '';
  evaluationDialogVisible.value = true;
};

// 提交评价表单
const handleEvaluationSubmit = async () => {
  if (!evaluationFormRef.value) return;
  
  try {
    await evaluationFormRef.value.validate();
    
    await createCostKpiEvaluation(evaluationForm);
    ElMessage.success('创建评价成功');
    evaluationDialogVisible.value = false;
    fetchEvaluationsList();
  } catch (error) {
    ElMessage.error('创建评价失败：' + error.message);
  }
};

// 查看评价详情
const handleViewEvaluation = async (row) => {
  try {
    const response = await getCostKpiEvaluationDetail(row.id);
    currentEvaluation.value = response.data || response;
    evaluationDetailVisible.value = true;
  } catch (error) {
    ElMessage.error('获取评价详情失败：' + error.message);
  }
};

// 计算评分
const handleCalculateScore = async (row) => {
  try {
    await calculateCostKpiEvaluation(row.id);
    ElMessage.success('评分计算成功');
    fetchEvaluationsList();
  } catch (error) {
    ElMessage.error('评分计算失败：' + error.message);
  }
};

// 更新KPI评分
const updateScore = async (row) => {
  try {
    // 这里应该调用API更新评分
    // 简化版：直接计算得分（实际值/目标值*100）
    ElMessage.info('KPI评分更新功能开发中...');
  } catch (error) {
    ElMessage.error('更新评分失败：' + error.message);
  }
};

// 获取类别文本
const getCategoryText = (category) => {
  const map = {
    'cost_control': '成本控制',
    'budget_execution': '预算执行',
    'efficiency': '效率',
    'quality': '质量'
  };
  return map[category] || category;
};

// 获取等级标签
const getGradeTag = (grade) => {
  const map = {
    'A': 'success',
    'B': '',
    'C': 'warning',
    'D': 'danger'
  };
  return map[grade] || 'info';
};

// 获取状态标签
const getStatusTag = (status) => {
  const map = {
    'draft': 'info',
    'calculated': 'warning',
    'reviewed': 'primary',
    'approved': 'success'
  };
  return map[status] || 'info';
};

// 获取状态文本
const getStatusText = (status) => {
  const map = {
    'draft': '草稿',
    'calculated': '已计算',
    'reviewed': '已审核',
    'approved': '已批准'
  };
  return map[status] || status;
};
</script>

<style scoped>
.cost-kpi-container {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

h3 {
  margin: 0;
  padding-bottom: 10px;
  border-bottom: 1px solid #ebeef5;
}
</style>
