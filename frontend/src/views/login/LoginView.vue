<template>
  <div class="login-container">
    <div class="login-card">
      <div class="login-header">
        <div class="logo">📊</div>
        <h1>精益成本管理平台</h1>
        <p>创新型中小企业成本管理系统</p>
      </div>

      <el-form ref="formRef" :model="form" :rules="rules" @keyup.enter="handleLogin">
        <el-form-item prop="username">
          <el-input v-model="form.username" prefix-icon="User" placeholder="用户名" size="large" />
        </el-form-item>
        <el-form-item prop="password">
          <el-input v-model="form.password" prefix-icon="Lock" placeholder="密码" type="password" show-password size="large" />
        </el-form-item>
        <el-button type="primary" size="large" :loading="loading" style="width:100%" @click="handleLogin">
          登 录
        </el-button>
      </el-form>

      <!-- SaaS 模式：平台管理入口 -->
      <div v-if="isSaaSMode" class="platform-entry">
        <el-divider>或</el-divider>
        <el-link type="primary" @click="$router.push('/platform/login')">
          平台总后台入口 →
        </el-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../../stores/user'
import { authApi } from '../../api/index'
import { ElMessage } from 'element-plus'
import { isSaaSMode } from '../../config'

const router = useRouter()
const userStore = useUserStore()
const formRef = ref(null)
const loading = ref(false)

const form = reactive({ username: '', password: '' })
const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
}

async function handleLogin() {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  loading.value = true
  try {
    const res = await authApi.login(form)
    if (res.code === 200) {
      userStore.setAuth(res.data)
      userStore.refreshIsAdmin()
      ElMessage.success('登录成功！')
      router.push('/')
    } else {
      ElMessage.error(res.message || '登录失败')
    }
  } catch (e) {
    ElMessage.error('登录失败，请检查网络')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #1A73E8 0%, #0D47A1 50%, #1a237e 100%);
}
.login-card {
  width: 400px;
  padding: 40px;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.3);
}
.login-header {
  text-align: center;
  margin-bottom: 32px;
}
.logo { font-size: 48px; margin-bottom: 8px; }
.login-header h1 { font-size: 22px; color: #1a237e; font-weight: 600; }
.login-header p { font-size: 13px; color: #999; margin-top: 4px; }
.login-footer {
  text-align: center; margin-top: 16px; color: #bbb; font-size: 12px;
}
.platform-entry { text-align: center; margin-top: 12px; }
</style>
