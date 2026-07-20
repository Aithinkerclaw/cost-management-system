<template>
  <div class="user-manage">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>用户管理</span>
          <el-button type="primary" @click="showAddDialog">
            <el-icon><Plus /></el-icon> 新增用户
          </el-button>
        </div>
      </template>

      <!-- 搜索栏 -->
      <el-form :inline="true" class="search-form">
        <el-form-item label="关键词">
          <el-input v-model="searchForm.keyword" placeholder="用户名/姓名/部门" clearable @clear="loadUsers" @keyup.enter="loadUsers" />
        </el-form-item>
        <el-form-item label="角色">
          <el-select v-model="searchForm.roleCode" placeholder="全部角色" clearable @change="loadUsers">
            <el-option v-for="r in roles" :key="r.roleCode" :label="r.roleName" :value="r.roleCode" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadUsers">查询</el-button>
        </el-form-item>
      </el-form>

      <!-- 用户表格 -->
      <el-table :data="userList" v-loading="loading" stripe>
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column prop="username" label="用户名" width="120" />
        <el-table-column prop="real_name" label="姓名" width="100" />
        <el-table-column prop="role_name" label="角色" width="120">
          <template #default="{ row }">
            <el-tag :type="getRoleTagType(row.role_code)" size="small">{{ row.role_name }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="department" label="部门" width="100" />
        <el-table-column prop="phone" label="手机号" width="130" />
        <el-table-column prop="status" label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'" size="small">
              {{ row.status === 1 ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="170" />
        <el-table-column label="操作" fixed="right" width="260">
          <template #default="{ row }">
            <el-button size="small" @click="showEditDialog(row)">编辑</el-button>
            <el-button size="small" type="warning" @click="handleResetPassword(row)">重置密码</el-button>
            <el-button size="small" :type="row.status === 1 ? 'danger' : 'success'" @click="handleToggleStatus(row)">
              {{ row.status === 1 ? '禁用' : '启用' }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-if="total > 0"
        class="pagination"
        background
        layout="total, prev, pager, next"
        :total="total"
        :page-size="pageSize"
        :current-page="currentPage"
        @current-change="handlePageChange"
      />
    </el-card>

    <!-- 新增/编辑弹窗 -->
    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑用户' : '新增用户'" width="500px" @close="resetForm">
      <el-form :model="formData" :rules="formRules" ref="formRef" label-width="80px">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="formData.username" :disabled="isEdit" placeholder="请输入用户名" />
        </el-form-item>
        <el-form-item v-if="!isEdit" label="密码" prop="password">
          <el-input v-model="formData.password" type="password" show-password placeholder="至少6位" />
        </el-form-item>
        <el-form-item label="姓名" prop="realName">
          <el-input v-model="formData.realName" placeholder="请输入姓名" />
        </el-form-item>
        <el-form-item label="角色" prop="roleCode">
          <el-select v-model="formData.roleCode" placeholder="请选择角色" style="width:100%">
            <el-option v-for="r in roles" :key="r.roleCode" :label="r.roleName + (r.description ? ' - ' + r.description : '')" :value="r.roleCode" />
          </el-select>
        </el-form-item>
        <el-form-item label="部门">
          <el-input v-model="formData.department" placeholder="请输入部门" />
        </el-form-item>
        <el-form-item label="手机号">
          <el-input v-model="formData.phone" placeholder="请输入手机号" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>

    <!-- 重置密码弹窗 -->
    <el-dialog v-model="resetPwdVisible" title="重置密码" width="400px">
      <el-form :model="resetPwdForm" label-width="80px">
        <el-form-item label="用户">
          <span>{{ resetPwdForm.realName }}</span>
        </el-form-item>
        <el-form-item label="新密码">
          <el-input v-model="resetPwdForm.newPassword" type="password" show-password placeholder="至少6位" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="resetPwdVisible = false">取消</el-button>
        <el-button type="primary" @click="submitResetPassword">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { usersApi, rolesApi } from '../../api'

const loading = ref(false)
const userList = ref([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(20)
const roles = ref([])

const searchForm = ref({ keyword: '', roleCode: '' })

// 弹窗
const dialogVisible = ref(false)
const isEdit = ref(false)
const editId = ref(null)
const formRef = ref(null)
const formData = ref({ username: '', password: '', realName: '', roleCode: '', department: '', phone: '' })
const formRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, min: 6, message: '密码至少6位', trigger: 'blur' }],
  realName: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  roleCode: [{ required: true, message: '请选择角色', trigger: 'change' }]
}

// 重置密码
const resetPwdVisible = ref(false)
const resetPwdForm = ref({ id: null, realName: '', newPassword: '' })

onMounted(async () => {
  await loadRoles()
  await loadUsers()
})

async function loadUsers() {
  loading.value = true
  try {
    const res = await usersApi.getList({
      keyword: searchForm.value.keyword,
      roleCode: searchForm.value.roleCode,
      page: currentPage.value,
      pageSize: pageSize.value
    })
    if (res.code === 200) {
      userList.value = res.data.list
      total.value = res.data.total
    }
  } catch (e) {
    console.error(e)
  }
  loading.value = false
}

async function loadRoles() {
  try {
    const res = await rolesApi.getList()
    if (res.code === 200) {
      roles.value = res.data
    }
  } catch (e) {
    console.error(e)
  }
}

function handlePageChange(page) {
  currentPage.value = page
  loadUsers()
}

function showAddDialog() {
  isEdit.value = false
  editId.value = null
  formData.value = { username: '', password: '', realName: '', roleCode: '', department: '', phone: '' }
  dialogVisible.value = true
}

function showEditDialog(row) {
  isEdit.value = true
  editId.value = row.id
  formData.value = {
    username: row.username,
    password: '',
    realName: row.real_name,
    roleCode: row.role_code,
    department: row.department,
    phone: row.phone
  }
  dialogVisible.value = true
}

async function handleSubmit() {
  try {
    await formRef.value.validate()
  } catch { return }

  try {
    if (isEdit.value) {
      const res = await usersApi.update(editId.value, {
        realName: formData.value.realName,
        roleCode: formData.value.roleCode,
        department: formData.value.department,
        phone: formData.value.phone
      })
      if (res.code === 200) {
        ElMessage.success('用户信息已更新')
        dialogVisible.value = false
        loadUsers()
      } else {
        ElMessage.error(res.message || '更新失败')
      }
    } else {
      const res = await usersApi.create({
        username: formData.value.username,
        password: formData.value.password,
        realName: formData.value.realName,
        roleCode: formData.value.roleCode,
        department: formData.value.department,
        phone: formData.value.phone
      })
      if (res.code === 200) {
        ElMessage.success('用户创建成功')
        dialogVisible.value = false
        loadUsers()
      } else {
        ElMessage.error(res.message || '创建失败')
      }
    }
  } catch (e) {
    ElMessage.error('操作失败')
  }
}

function handleToggleStatus(row) {
  const newStatus = row.status === 1 ? 0 : 1
  const action = newStatus === 0 ? '禁用' : '启用'
  ElMessageBox.confirm(`确定要${action}用户 ${row.real_name} 吗？`, '确认', { type: 'warning' })
    .then(async () => {
      try {
        const res = await usersApi.toggleStatus(row.id, newStatus)
        if (res.code === 200) {
          ElMessage.success(`已${action}`)
          loadUsers()
        } else {
          ElMessage.error(res.message)
        }
      } catch { ElMessage.error('操作失败') }
    })
    .catch(() => {})
}

function handleResetPassword(row) {
  resetPwdForm.value = { id: row.id, realName: row.real_name, newPassword: '' }
  resetPwdVisible.value = true
}

async function submitResetPassword() {
  if (!resetPwdForm.value.newPassword || resetPwdForm.value.newPassword.length < 6) {
    ElMessage.warning('密码至少6位')
    return
  }
  try {
    const res = await usersApi.resetPassword(resetPwdForm.value.id, resetPwdForm.value.newPassword)
    if (res.code === 200) {
      ElMessage.success('密码重置成功')
      resetPwdVisible.value = false
    } else {
      ElMessage.error(res.message)
    }
  } catch { ElMessage.error('操作失败') }
}

function resetForm() {
  if (formRef.value) formRef.value.resetFields()
}

function getRoleTagType(roleCode) {
  const map = {
    super_admin: 'danger',
    owner: 'warning',
    finance_manager: '',
    procurement_manager: 'success',
    production_manager: 'info',
    warehouse_manager: '',
    quality_manager: '',
    staff: 'info'
  }
  return map[roleCode] || ''
}
</script>

<style scoped>
.user-manage { padding: 0; }
.card-header { display: flex; justify-content: space-between; align-items: center; }
.search-form { margin-bottom: 16px; }
.pagination { margin-top: 16px; display: flex; justify-content: flex-end; }
</style>
