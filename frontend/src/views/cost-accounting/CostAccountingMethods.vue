<template>
  <div class="cost-accounting-methods-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>🧮 成本核算方法配置</span>
          <el-button type="primary" @click="handleCreateMethod">
            <el-icon><Plus /></el-icon>
            新增核算方法
          </el-button>
        </div>
      </template>

      <!-- 核算方法列表 -->
      <el-table :data="methodsList" v-loading="loading" style="width: 100%">
        <el-table-column prop="method_code" label="方法编码" width="120" />
        <el-table-column prop="method_name" label="方法名称" width="150" />
        <el-table-column prop="description" label="描述" min-width="200" />
        <el-table-column prop="applicable_scenarios" label="适用场景" min-width="250" />
        <el-table-column prop="is_enabled" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.is_enabled ? 'success' : 'info'">
              {{ row.is_enabled ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="is_default" label="默认方法" width="100">
          <template #default="{ row }">
            <el-tag v-if="row.is_default" type="danger">默认</el-tag>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="handleViewMethod(row)">查看</el-button>
            <el-button size="small" type="primary" @click="handleEditMethod(row)">编辑</el-button>
            <el-button size="small" type="success" @click="handleManageObjects(row)">管理对象</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 核算方法对话框 -->
    <el-dialog
      v-model="methodDialogVisible"
      :title="methodDialogTitle"
      width="600px"
      @close="handleMethodDialogClose"
    >
      <el-form ref="methodFormRef" :model="methodForm" :rules="methodRules" label-width="120px">
        <el-form-item label="方法编码" prop="method_code">
          <el-input v-model="methodForm.method_code" placeholder="如：variety" :disabled="methodForm.id != null" />
        </el-form-item>
        <el-form-item label="方法名称" prop="method_name">
          <el-input v-model="methodForm.method_name" placeholder="如：品种法" />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input v-model="methodForm.description" type="textarea" :rows="3" placeholder="请输入方法描述" />
        </el-form-item>
        <el-form-item label="适用场景" prop="applicable_scenarios">
          <el-input v-model="methodForm.applicable_scenarios" type="textarea" :rows="3" placeholder="请输入适用场景" />
        </el-form-item>
        <el-form-item label="是否启用" prop="is_enabled">
          <el-switch v-model="methodForm.is_enabled" :active-value="1" :inactive-value="0" />
        </el-form-item>
        <el-form-item label="是否默认" prop="is_default">
          <el-switch v-model="methodForm.is_default" :active-value="1" :inactive-value="0" />
        </el-form-item>
      </el-form>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="methodDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleMethodSubmit">确定</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 核算对象管理对话框 -->
    <el-dialog v-model="objectsDialogVisible" title="核算对象管理" width="800px">
      <div>
        <el-button type="primary" @click="handleCreateObject" style="margin-bottom: 20px;">
          <el-icon><Plus /></el-icon>
          新增核算对象
        </el-button>

        <el-table :data="objectsList" style="width: 100%">
          <el-table-column prop="object_code" label="对象编码" width="120" />
          <el-table-column prop="object_name" label="对象名称" width="150" />
          <el-table-column prop="object_type" label="对象类型" width="100">
            <template #default="{ row }">
              {{ getObjectTypeText(row.object_type) }}
            </template>
          </el-table-column>
          <el-table-column prop="is_enabled" label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="row.is_enabled ? 'success' : 'info'">
                {{ row.is_enabled ? '启用' : '禁用' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="150">
            <template #default="{ row }">
              <el-button size="small" @click="handleEditObject(row)">编辑</el-button>
              <el-button size="small" type="danger" @click="handleDeleteObject(row)">删除</el-button>
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
  getCostAccountingMethods,
  getCostAccountingMethodDetail,
  createCostAccountingMethod,
  updateCostAccountingMethod,
  getCostAccountingObjects,
  createCostAccountingObject
} from '@/api/costAccountingMethods';

// 数据定义
const loading = ref(false);
const methodsList = ref([]);
const objectsList = ref([]);
const methodDialogVisible = ref(false);
const objectsDialogVisible = ref(false);
const methodDialogTitle = ref('');
const currentMethodCode = ref('');
const methodFormRef = ref(null);

// 核算方法表单
const methodForm = reactive({
  id: null,
  method_code: '',
  method_name: '',
  description: '',
  applicable_scenarios: '',
  is_enabled: 1,
  is_default: 0
});

// 核算对象表单
const objectForm = reactive({
  id: null,
  object_code: '',
  object_name: '',
  object_type: 'product',
  method_code: '',
  cost_account_code: '',
  parent_object_id: null,
  sort_order: 0,
  notes: ''
});

// 表单验证规则
const methodRules = {
  method_code: [{ required: true, message: '请输入方法编码', trigger: 'blur' }],
  method_name: [{ required: true, message: '请输入方法名称', trigger: 'blur' }]
};

// 初始化
onMounted(() => {
  fetchMethodsList();
});

// 获取核算方法列表
const fetchMethodsList = async () => {
  loading.value = true;
  try {
    const response = await getCostAccountingMethods({ is_enabled: 1 });
    methodsList.value = response.data || response;
  } catch (error) {
    ElMessage.error('获取核算方法列表失败：' + error.message);
  } finally {
    loading.value = false;
  }
};

// 获取核算对象列表
const fetchObjectsList = async (methodCode) => {
  try {
    const response = await getCostAccountingObjects({ method_code: methodCode });
    objectsList.value = response.data || response;
  } catch (error) {
    ElMessage.error('获取核算对象列表失败：' + error.message);
  }
};

// 新增核算方法
const handleCreateMethod = () => {
  methodDialogTitle.value = '新增核算方法';
  resetMethodForm();
  methodDialogVisible.value = true;
};

// 查看核算方法
const handleViewMethod = async (row) => {
  try {
    const response = await getCostAccountingMethodDetail(row.method_code);
    const method = response.data || response;
    Object.assign(methodForm, method);
    methodDialogTitle.value = '查看核算方法';
    methodDialogVisible.value = true;
  } catch (error) {
    ElMessage.error('获取核算方法详情失败：' + error.message);
  }
};

// 编辑核算方法
const handleEditMethod = (row) => {
  methodDialogTitle.value = '编辑核算方法';
  Object.assign(methodForm, row);
  methodDialogVisible.value = true;
};

// 管理核算对象
const handleManageObjects = async (row) => {
  currentMethodCode.value = row.method_code;
  objectsDialogVisible.value = true;
  await fetchObjectsList(row.method_code);
};

// 新增核算对象
const handleCreateObject = () => {
  resetObjectForm();
  objectForm.method_code = currentMethodCode.value;
  // 这里应该打开一个对话框来创建核算对象
  ElMessage.info('核算对象创建功能开发中...');
};

// 编辑核算对象
const handleEditObject = (row) => {
  Object.assign(objectForm, row);
  ElMessage.info('核算对象编辑功能开发中...');
};

// 删除核算对象
const handleDeleteObject = async (row) => {
  try {
    await ElMessageBox.confirm('确定删除该核算对象吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    });
    
    ElMessage.info('核算对象删除功能开发中...');
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败：' + error.message);
    }
  }
};

// 提交核算方法表单
const handleMethodSubmit = async () => {
  if (!methodFormRef.value) return;
  
  try {
    await methodFormRef.value.validate();
    
    if (methodForm.id) {
      await updateCostAccountingMethod(methodForm.method_code, methodForm);
      ElMessage.success('更新成功');
    } else {
      await createCostAccountingMethod(methodForm);
      ElMessage.success('创建成功');
    }
    
    methodDialogVisible.value = false;
    fetchMethodsList();
  } catch (error) {
    ElMessage.error('操作失败：' + error.message);
  }
};

// 重置核算方法表单
const resetMethodForm = () => {
  methodForm.id = null;
  methodForm.method_code = '';
  methodForm.method_name = '';
  methodForm.description = '';
  methodForm.applicable_scenarios = '';
  methodForm.is_enabled = 1;
  methodForm.is_default = 0;
};

// 重置核算对象表单
const resetObjectForm = () => {
  objectForm.id = null;
  objectForm.object_code = '';
  objectForm.object_name = '';
  objectForm.object_type = 'product';
  objectForm.method_code = '';
  objectForm.cost_account_code = '';
  objectForm.parent_object_id = null;
  objectForm.sort_order = 0;
  objectForm.notes = '';
};

// 核算方法对话框关闭
const handleMethodDialogClose = () => {
  resetMethodForm();
  if (methodFormRef.value) {
    methodFormRef.value.resetFields();
  }
};

// 获取对象类型文本
const getObjectTypeText = (type) => {
  const map = {
    'product': '产品',
    'batch': '批次',
    'step': '步骤',
    'project': '项目'
  };
  return map[type] || type;
};
</script>

<style scoped>
.cost-accounting-methods-container {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
