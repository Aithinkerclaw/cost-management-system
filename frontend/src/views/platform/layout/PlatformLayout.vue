<template>
  <el-container class="platform-layout">
    <!-- 侧边栏 -->
    <el-aside :width="isCollapse ? '64px' : '220px'" class="platform-sidebar">
      <div class="platform-logo">
        <span v-if="!isCollapse" class="logo-text">精益管控 SaaS</span>
        <span v-else class="logo-icon">S</span>
      </div>

      <el-menu
        :default-active="currentRoute"
        :collapse="isCollapse"
        background-color="#1a0a2e"
        text-color="#c4b5fd"
        active-text-color="#fff"
        router
      >
        <el-menu-item index="/platform/dashboard">
          <el-icon><DataAnalysis /></el-icon>
          <template #title>数据驾驶舱</template>
        </el-menu-item>

        <el-menu-item index="/platform/tenants">
          <el-icon><OfficeBuilding /></el-icon>
          <template #title>租户管理</template>
        </el-menu-item>

        <el-menu-item index="/platform/plans">
          <el-icon><Wallet /></el-icon>
          <template #title>套餐管理</template>
        </el-menu-item>

        <el-menu-item index="/platform/users">
          <el-icon><UserFilled /></el-icon>
          <template #title>平台用户</template>
        </el-menu-item>

        <el-menu-item index="/platform/analytics">
          <el-icon><TrendCharts /></el-icon>
          <template #title>运营分析</template>
        </el-menu-item>

        <el-menu-item index="/platform/settings">
          <el-icon><Setting /></el-icon>
          <template #title>系统设置</template>
        </el-menu-item>

        <el-menu-item index="/platform/audit-log">
          <el-icon><Document /></el-icon>
          <template #title>操作日志</template>
        </el-menu-item>
      </el-menu>
    </el-aside>

    <!-- 主区域 -->
    <el-container>
      <!-- 顶部导航 -->
      <el-header class="platform-header">
        <div class="header-left">
          <el-icon class="collapse-btn" @click="isCollapse = !isCollapse">
            <Fold v-if="!isCollapse" />
            <Expand v-else />
          </el-icon>
          <el-breadcrumb separator="/">
            <el-breadcrumb-item>平台总后台</el-breadcrumb-item>
            <el-breadcrumb-item>{{ currentPageTitle }}</el-breadcrumb-item>
          </el-breadcrumb>
        </div>

        <div class="header-right">
          <el-tag type="warning" size="small">平台管理员</el-tag>
          <el-dropdown trigger="click">
            <span class="user-info">
              {{ platformStore.userInfo?.realName || '管理员' }}
              <el-icon><ArrowDown /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item disabled>账号: {{ platformStore.userInfo?.username }}</el-dropdown-item>
                <el-dropdown-item divided @click="handleLogout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>

      <!-- 内容区 -->
      <el-main class="platform-main">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { usePlatformStore } from '../../../stores/platform'

const router = useRouter()
const route = useRoute()
const platformStore = usePlatformStore()

const isCollapse = ref(false)
const currentRoute = computed(() => route.path)

const pageTitles = {
  '/platform/dashboard': '数据驾驶舱',
  '/platform/tenants': '租户管理',
  '/platform/plans': '套餐管理',
  '/platform/users': '平台用户',
  '/platform/analytics': '运营分析',
  '/platform/settings': '系统设置',
  '/platform/audit-log': '操作日志'
}

const pageTitle = computed(() => pageTitles[route.path] || '')

function handleLogout() {
  platformStore.logout()
  router.push('/platform/login')
}
</script>

<style scoped>
.platform-layout {
  height: 100vh;
}
.platform-sidebar {
  background-color: #1a0a2e;
  overflow: hidden;
  transition: width 0.3s;
}
.platform-logo {
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #130621;
  border-bottom: 1px solid #2d1854;
}
.logo-text {
  font-size: 16px;
  font-weight: 600;
  color: #c4b5fd;
  white-space: nowrap;
}
.logo-icon {
  font-size: 20px;
  font-weight: 700;
  color: #a78bfa;
}
.platform-header {
  background: #faf8ff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #e9e0ff;
  padding: 0 20px;
  box-shadow: 0 1px 3px rgba(124, 58, 237, 0.06);
}
.collapse-btn {
  font-size: 18px;
  cursor: pointer;
  margin-right: 16px;
  color: #7c3aed;
}
.user-info {
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  color: #5b21b6;
  font-size: 14px;
}
.platform-main {
  background: #f8f5ff;
  overflow-y: auto;
}
:deep(.el-menu) {
  border-right: none;
}
:deep(.el-menu-item.is-active) {
  background: linear-gradient(90deg, #7c3aed22, transparent) !important;
  border-left: 3px solid #7c3aed;
}
:deep(.el-menu-item:hover) {
  background: rgba(124, 58, 237, 0.08);
}
</style>
