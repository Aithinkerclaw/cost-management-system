<template>
  <div class="tenant-page">
    <!-- 搜索栏 -->
    <el-card shadow="never" class="search-card">
      <el-form :inline="true" :model="search" @submit.prevent="handleSearch">
        <el-form-item label="关键词">
          <el-input v-model="search.keyword" placeholder="企业名称/联系人" clearable style="width:200px"/>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="search.status" placeholder="全部" clearable style="width:120px">
            <el-option label="正常" value="active"/>
            <el-option label="试用中" value="trial"/>
            <el-option label="已停用" value="suspended"/>
            <el-option label="已过期" value="expired"/>
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button type="primary" @click="dialogVisible = true; editingTenant = null">
            <el-icon><Plus /></el-icon> 新建租户
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 租户列表 -->
    <el-card shadow="never" style="margin-top:16px">
      <el-table :data="tenantList" v-loading="loading" stripe size="default">
        <el-table-column prop="id" label="ID" width="60" align="center"/>

        <el-table-column prop="company_name" label="企业名称" min-width="180">
          <template #default="{ row }">
            {{ row.company_name }}
            <el-tag v-if="row.short_name" size="small" type="info">{{ row.short_name }}</el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="industry" label="行业" width="100"/>
        <el-table-column prop="contact_person" label="联系人" width="90"/>
        <el-table-column prop="contact_phone" label="电话" width="130"/>

        <el-table-column prop="plan_name" label="套餐" width="90">
          <template #default="{ row }">
            <el-tag
              :type="row.plan_id === 3 ? 'danger' : row.plan_id === 2 ? 'warning' : 'info'"
              size="small"
            >{{ row.plan_name || '免费版' }}</el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="status" label="状态" width="80" align="center">
          <template #default="{ row }">
            <el-tag
              :type="row.status === 'active' ? 'success' : row.status === 'suspended' ? 'danger' : 'warning'"
              size="small"
            >{{ { active:'正常', suspended:'停用', expired:'过期', trial:'试用' }[row.status] || row.status }}</el-tag>
          </template>
        </el-table-column>

        <el-table-column label="用户数" width="70" align="right">
          <template #default="{ row }">
            <span>{{ row.user_count || 0 }}<span class="text-gray text-xs">/{{ row.max_users === -1 ? '不限' : row.max_users || 0 }}</span></span>
          </template>
        </el-table-column>

        <el-table-column prop="expire_date" label="到期时间" width="110"/>

        <el-table-column label="操作" width="260" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="viewDetail(row)">详情</el-button>
            <el-button link type="primary" @click="editTenant(row)">编辑</el-button>
            <el-button link :type="row.status === 'active' ? 'danger' : 'success'" @click="toggleStatus(row)">
              {{ row.status === 'active' ? '停用' : '启用' }}
            </el-button>
            <el-popconfirm title="确定删除此租户？所有数据将被清除！" confirm-button-text="确定" cancel-button-text="取消"
                          @confirm="deleteTenant(row.id)">
              <template #reference>
                <el-button link type="danger">删除</el-button>
              </template>
            </el-popconfirm>
            <el-button link type="warning" @click="loginAs(row)">模拟登录</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div style="margin-top:16px;display:flex;justify-content:flex-end;">
        <el-pagination
          v-model:current-page="page"
          v-model:page-size="pageSize"
          :total="total"
          layout="total, prev, pager, next"
          @current-change="fetchList"
        />
      </div>
    </el-card>

    <!-- 新建/编辑对话框 -->
    <el-dialog v-model="dialogVisible" :title="editingTenant ? '编辑租户' : '新建租户'" width="560px" destroy-on-close>
      <el-form ref="formRef" :model="form" :rules="formRules" label-width="100px">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="企业全称" prop="company_name">
              <el-input v-model="form.company_name" placeholder="工商注册名"/>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="简称">
              <el-input v-model="form.short_name" placeholder="简称"/>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="所属行业">
              <el-input v-model="form.industry" placeholder="如：机械制造"/>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="联系人">
              <el-input v-model="form.contact_person" placeholder=""/>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="联系电话">
              <el-input v-model="form.contact_phone" placeholder=""/>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="邮箱">
              <el-input v-model="form.email" placeholder=""/>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="套餐">
              <el-select v-model="form.plan_id" style="width:100%">
                <el-option v-for="p in planOptions" :key="p.id" :label="p.plan_name" :value="p.id"/>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="用户上限">
              <el-input-number v-model="form.max_users" :min="1" :max="9999" style="width:100%"/>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="地址">
          <el-input v-model="form.address" placeholder=""/>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.notes" type="textarea" :rows="2"/>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitForm">确定</el-button>
      </template>
    </el-dialog>

    <!-- 详情抽屉 -->
    <el-drawer v-model="detailVisible" :title="'租户详情 - ' + (detailData?.company_name || '')" size="500px">
      <template v-if="detailData">
        <el-descriptions :column="1" border size="small">
          <el-descriptions-item label="企业全称">{{ detailData.company_name }}</el-descriptions-item>
          <el-descriptions-item label="简称">{{ detailData.short_name || '-' }}</el-descriptions-item>
          <el-descriptions-item label="行业">{{ detailData.industry || '-' }}</el-descriptions-item>
          <el-descriptions-item label="联系人">{{ detailData.contact_person }} / {{ detailData.contact_phone }}</el-descriptions-item>
          <el-descriptions-item label="邮箱">{{ detailData.email || '-' }}</el-descriptions-item>
          <el-descriptions-item label="地址">{{ detailData.address || '-' }}</el-descriptions-item>
          <el-descriptions-item label="套餐">{{ detailData.plan_name }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="detailData.status==='active'?'success':'warning'">{{ detailData.status }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="到期时间">{{ detailData.expire_date || '-' }}</el-descriptions-item>
        </el-descriptions>

        <h4 style="margin:20px 0 10px">数据统计</h4>
        <div v-if="detailStats" class="stats-grid">
          <div class="stat-box"><strong>{{ detailStats.users?.active || 0 }}</strong><span>活跃用户</span></div>
          <div class="stat-box"><strong>{{ detailStats.orders?.total || 0 }}</strong><span>订单数</span></div>
          <div class="stat-box"><strong>{{ detailStats.materials || 0 }}</strong><span>物料数</span></div>
          <div class="stat-box"><strong>{{ detailStats.suppliers || 0 }}</strong><span>供应商</span></div>
          <div class="stat-box"><strong>{{ detailStats.proposals || 0 }}</strong><span>提案数</span></div>
        </div>

        <div style="margin-top:16px;text-align:center;">
          <el-button type="warning" @click="loginAs(detailData)" :loading="loginAsLoading">
            模拟登录该租户
          </el-button>
        </div>
      </template>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import platformRequest from '../../../api/platformRequest'

const loading = ref(false)
const tenantList = ref([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(10)
const search = reactive({ keyword: '', status: '' })
const dialogVisible = ref(false)
const detailVisible = ref(false)
const editingTenant = ref(null)
const detailData = ref(null)
const detailStats = ref(null)
const submitting = ref(false)
const loginAsLoading = ref(false)
const formRef = ref(null)

// 套餐选项
const planOptions = ref([])

const form = reactive({
  company_name: '', short_name: '', industry: '', contact_person: '',
  contact_phone: '', email: '', address: '', notes: '',
  plan_id: 1, max_users: 3
})
const formRules = {
  company_name: [{ required: true, message: '请输入企业全称', trigger: 'blur' }]
}

onMounted(() => {
  fetchList()
  fetchPlans()
})

async function fetchPlans() {
  const res = await platformRequest.get('/platform/plans')
  planOptions.value = res.data
}

async function fetchList() {
  loading.value = true
  try {
    const res = await platformRequest.get('/platform/tenants', {
      params: { page: page.value, pageSize: pageSize.value, ...search }
    })
    tenantList.value = res.data.list
    total.value = res.data.total
  } finally {
    loading.value = false
  }
}

function handleSearch() { page.value = 1; fetchList() }

async function viewDetail(row) {
  detailData.value = row
  detailVisible.value = true
  try {
    const res = await platformRequest.get(`/platform/tenants/${row.id}/stats`)
    detailStats.value = res.data
  } catch (e) { /* ignore */ }
}

function editTenant(row) {
  editingTenant.value = row
  Object.assign(form, {
    company_name: row.company_name, short_name: row.short_name,
    industry: row.industry, contact_person: row.contact_person,
    contact_phone: row.contact_phone, email: row.email,
    address: row.address, notes: row.notes,
    plan_id: row.plan_id, max_users: row.max_users
  })
  dialogVisible.value = true
}

function resetForm() {
  Object.assign(form, { company_name:'', short_name:'', industry:'', contact_person:'', contact_phone:'', email:'', address:'', notes:'', plan_id:1, max_users:3 })
}

async function submitForm() {
  await formRef.value.validate().catch(()=>false) && ElMessage.warning('请完善必填项')
  submitting.value = true
  try {
    if (editingTenant.value) {
      await platformRequest.put(`/platform/tenants/${editingTenant.value.id}`, form)
      ElMessage.success('更新成功')
    } else {
      await platformRequest.post('/platform/tenants', form)
      ElMessage.success('创建成功')
    }
    dialogVisible.value = false
    editingTenant.value = null
    resetForm()
    fetchList()
  } catch(e){/* handled */} finally{ submitting.value=false}
}

async function toggleStatus(row) {
  const newStatus = row.status === 'active' ? 'suspended' : 'active'
  try {
    await platformRequest.patch(`/platform/tenants/${row.id}/status`, { status: newStatus })
    ElMessage.success(newStatus === 'active' ? '已启用' : '已停用')
    fetchList()
  }catch{}
}

async function deleteTenant(id) {
  try{
    await platformRequest.delete(`/platform/tenants/${id}`)
    ElMessage.success('已删除')
    fetchList()
  }catch{}
}

async function loginAs(row) {
  loginAsLoading.value = true
  try {
    const res = await platformRequest.post(`/platform/tenants/${row.id}/login-as`)
    // 存储临时 token，切换到租户端
    localStorage.setItem('token', res.data.token)
    localStorage.setItem('userInfo', JSON.stringify({
      id: 0, username: res.data.targetUser, realName: res.data.targetUser,
      roleCode: 'owner', permissions: {},
      tenantId: row.id, tenantName: row.company_name
    }))
    ElMessage.success(`模拟登录成功，有效期${res.data.expiresIn}`)
    window.open('/', '_blank') // 新窗口打开租户端
  } catch {} finally { loginAsLoading.value=false }
}
</script>

<style scoped>
.search-card { margin-bottom: 0; }
.text-gray { color: #9ca3af; }
.text-xs { font-size: 11px; }
.stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
.stat-box { background:#f5f0ff; border-radius:8px; padding:12px; text-align:center; }
.stat-box strong { display:block; font-size:20px; color:#4c1d95; }
.stat-box span { font-size:12px; color:#6b7280; }
</style>
