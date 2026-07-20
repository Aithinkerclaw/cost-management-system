<template>
  <div class="platform-login">
    <div class="login-card">
      <div class="login-header">
        <h2>精益管控 SaaS 平台</h2>
        <p>平台总后台管理系统</p>
      </div>

      <el-form ref="formRef" :model="form" :rules="rules" @keyup.enter="handleLogin">
        <el-form-item prop="username">
          <el-input v-model="form.username" placeholder="管理员账号" prefix-icon="User" size="large" />
        </el-form-item>
        <el-form-item prop="password">
          <el-input v-model="form.password" type="password" placeholder="密码" prefix-icon="Lock" size="large" show-password />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" size="large" :loading="loading" style="width:100%" @click="handleLogin">
            登录总后台
          </el-button>
        </el-form-item>
      </el-form>

      <div class="login-footer">
        <el-link type="info" @click="$router.push('/login')">返回租户登录</el-link>
      </div>
    </div>

    <!-- 底部装饰 -->
    <div class="bg-decoration"></div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { usePlatformStore } from '../../../stores/platform'
import platformRequest from '../../../api/platformRequest'

const router = useRouter()
const platformStore = usePlatformStore()
const formRef = ref(null)
const loading = ref(false)

const form = reactive({ username: '', password: '' })
const rules = {
  username: [{ required: true, message: '请输入账号', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
}

async function handleLogin() {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  loading.value = true

  try {
    const res = await platformRequest.post('/platform/auth/login', {
      username: form.username,
      password: form.password
    })
    platformStore.setAuth(res.data)
    router.push('/platform/dashboard')
  } catch (e) {
    // 错误已在拦截器处理
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.platform-login {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #1a0a2e 0%, #3b0764 40%, #581c87 70%, #7c3aed 100%);
  position: relative;
}
.login-card {
  width: 400px;
  padding: 40px;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 25px 50px rgba(124, 58, 237, 0.3);
  z-index: 1;
}
.login-header {
  text-align: center;
  margin-bottom: 32px;
}
.login-header h2 {
  font-size: 22px;
  color: #4c1d95;
  font-weight: 600;
  margin: 0 0 8px;
}
.login-header p {
  color: #7c3aed;
  font-size: 14px;
  margin: 0;
}
.login-footer {
  text-align: center;
  margin-top: 20px;
}
.bg-decoration {
  position: absolute;
  bottom: -10%;
  left: -5%;
  width: 60%;
  height: 50%;
  background: radial-gradient(ellipse at center, rgba(167, 139, 250, 0.15), transparent);
  border-radius: 50%;
  pointer-events: none;
}
</style>
