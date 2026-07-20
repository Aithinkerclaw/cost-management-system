<template>
  <div class="settings-page">
    <el-card header="系统信息" v-loading="loading">
      <el-descriptions :column="1" border size="default">
        <el-descriptions-item label="部署模式"><el-tag type="danger">SaaS 多租户</el-tag></el-descriptions-item>
        <el-descriptions-item label="系统版本">{{ info?.version || '-' }}</el-descriptions-item>
        <el-descriptions-item label="租户总数">{{ info?.stats?.tenantCount || 0 }} 家</el-descriptions-item>
        <el-descriptions-item label="平台管理员">{{ info?.stats?.platformUserCount || 0 }} 人</el-descriptions-item>
      </el-descriptions>

      <h4 style="margin-top:24px 0 12px">功能开关</h4>
      <p class="tip-text">以下为 SaaS 模式下已启用的全局能力：</p>
      <div class="feature-list">
        <div class="feature-item" v-for="(f,i) in features" :key="i">
          <el-icon color="#10b981"><CircleCheck /></el-icon> {{ f }}
        </div>
      </div>

      <h4 style="margin-top:24px 0 12px">数据库架构</h4>
      <el-alert type="info" :closable="false" show-icon>
        <template #title>共享 SQLite + tenant_id 行级隔离</template>
        所有业务表包含 tenant_id 列，查询时自动过滤。roles/role_permissions 为全局共享表。
      </el-alert>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import platformRequest from '../../../api/platformRequest'

const loading = ref(false)
const info = ref(null)
const features = ['多租户数据隔离', '平台总后台', '套餐分级管理', '操作日志审计', '模拟登录排查', '运营数据分析']

onMounted(async () => {
  loading.value=true
  try { const res=await platformRequest.get('/platform/settings'); info.value=res.data } catch{} finally{ loading.value=false }
})
</script>

<style scoped>
.tip-text { color:#6b7280; font-size:13px; margin-bottom:8px; }
.feature-list { display:flex; flex-wrap:wrap; gap:8px; }
.feature-item { display:flex; align-items:center; gap:6px; padding:6px 14px; background:#ecfdf5; border-radius:20px; font-size:13px; color:#059669; }
</style>
