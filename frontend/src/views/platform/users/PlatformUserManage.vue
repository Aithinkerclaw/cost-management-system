<template>
  <div class="platform-users-page">
    <el-card shadow="never">
      <template #header><span>平台管理员账号</span><el-button type="primary" style="float:right" @click="dialogVisible=true;editingId=null"><Plus /> 新建</el-button></template>

      <el-table :data="userList" v-loading="loading" stripe size="small">
        <el-table-column prop="username" label="用户名" width="120"/>
        <el-table-column prop="real_name" label="姓名" width="100"/>
        <el-table-column prop="role" label="角色" width="120">
          <template #default="{ row }">
            <el-tag :type="row.role==='super_admin'?'danger':'info'" size="small">{{ { super_admin:'超级管理员', operator:'运营人员', staff:'普通' }[row.role] || row.role }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="phone" label="手机" width="130"/>
        <el-table-column prop="last_login_at" label="最后登录" min-width="170">
          <template #default="{ row }">{{ String(row.last_login_at||'').slice(0,19).replace('T',' ') }}</template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="80" align="center">
          <template #default="{ row }"><el-tag :type="row.status===1?'success':'danger'" size="small">{{ row.status===1?'正常':'禁用' }}</el-tag></template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="editUser(row)">编辑</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 新建/编辑对话框 -->
    <el-dialog v-model="dialogVisible" :title="editingId ? '编辑平台用户' : '新建平台用户'" width="460px" destroy-on-close>
      <el-form :model="form" :rules="rules" ref="formRef" label-width="80px">
        <el-form-item label="用户名" prop="username" v-if="!editingId">
          <el-input v-model="form.username"/>
        </el-form-item>
        <el-form-item :label="editingId?'新密码':'密码'" :prop="editingId?'':'password'">
          <el-input v-model="form.password" type="password" show-password placeholder="不填则不修改"/>
        </el-form-item>
        <el-form-item label="姓名" prop="real_name"><el-input v-model="form.real_name"/></el-form-item>
        <el-form-item label="角色"><el-select v-model="form.role" style="width:100%"><el-option label="超级管理员" value="super_admin"/><el-option label="运营人员" value="operator"/></el-select></el-form-item>
        <el-form-item label="手机"><el-input v-model="form.phone"/></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible=false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="save">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import platformRequest from '../../../api/platformRequest'

const loading=ref(false), userList=ref([]), dialogVisible=ref(false), editingId=ref(null), submitting=ref(false)
const formRef=ref()
const form = reactive({ username:'', password:'', real_name:'', role:'staff', phone:'' })
const rules = {
  username:[{required:true, message:'请输入用户名', trigger:'blur'}],
  real_name:[{required:true, message:'请输入姓名', trigger:'blur'}],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
}

onMounted(async () => {
  loading.value=true
  try { userList.value=(await platformRequest.get('/platform/users')).data } finally { loading.value=false }
})

function editUser(row) {
  editingId.value=row.id
  Object.assign(form, { username:row.username, password:'', real_name:row.real_name, role:row.role, phone:row.phone })
  dialogVisible.value=true
}

async function save() {
  const valid = await formRef.value?.validate().catch(()=>false) || (editingId.value ? true : false)
  if (!valid && !editingId.value) return ElMessage.warning('请完善必填项')
  if (!form.password && !editingId.value) return ElMessage.warning('新建时密码不能为空')
  submitting.value=true
  try {
    if (editingId.value) {
      await platformRequest.put(`/platform/users/${editingId.value}`, form)
    } else {
      await platformRequest.post('/platform/users', form)
    }
    ElMessage.success(editingId.value ? '更新成功' : '创建成功')
    dialogVisible.value=false
    loading.value=true; userList.value=(await platformRequest.get('/platform/users')).data; loading.value=false
  } catch{} finally { submitting.value=false }
}
</script>
