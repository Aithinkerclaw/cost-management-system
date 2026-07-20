<template>
  <div class="forbidden-container">
    <div class="forbidden-content">
      <div class="error-code">403</div>
      <h2>访问受限</h2>
      <p class="error-desc">您没有权限访问该页面，请联系管理员开通相关权限</p>
      <el-button type="primary" @click="$router.push('/')">返回首页</el-button>
    </div>
  </div>
</template>

<script setup>
</script>

<style scoped>
.forbidden-container {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100vh;
  background: #f5f7fa;
}
.forbidden-content {
  text-align: center;
  padding: 60px 40px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.08);
}
.error-code {
  font-size: 96px;
  font-weight: 700;
  color: #E53935;
  line-height: 1;
  margin-bottom: 16px;
}
h2 {
  font-size: 24px;
  color: #333;
  margin: 0 0 12px;
}
.error-desc {
  color: #666;
  margin: 0 0 32px;
  font-size: 15px;
}
</style>
