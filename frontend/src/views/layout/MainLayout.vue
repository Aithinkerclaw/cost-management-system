<template>
  <div class="layout-container">
    <!-- 侧边栏 -->
    <aside class="sidebar" :class="{ collapsed: isCollapsed }">
      <div class="sidebar-logo">
        <span class="logo-icon">📊</span>
        <span v-show="!isCollapsed" class="logo-text">精益成本管理</span>
      </div>

      <el-menu
        :default-active="currentRoute"
        :collapse="isCollapsed"
        background-color="#1a237e"
        text-color="rgba(255,255,255,0.75)"
        active-text-color="#fff"
        router
        class="sidebar-menu"
      >
        <el-menu-item v-if="hasPerm('dashboard')" index="/dashboard">
          <el-icon><DataAnalysis /></el-icon>
          <template #title>🏠 成本驾驶舱</template>
        </el-menu-item>

        <el-menu-item v-if="hasPerm('ai')" index="/ai/diagnosis">
          <el-icon><Cpu /></el-icon>
          <template #title>🤖 AI成本诊断</template>
        </el-menu-item>

        <el-sub-menu v-if="hasPerm('cost')" index="cost-group">
          <template #title><el-icon><Coin /></el-icon><span>💰 成本核算</span></template>
          <el-menu-item index="/cost/overview">核算总览</el-menu-item>
          <el-menu-item index="/cost/material">材料成本</el-menu-item>
          <el-menu-item index="/cost/order-trace">订单追溯</el-menu-item>
        </el-sub-menu>

        <el-sub-menu v-if="hasPerm('procurement')" index="procurement-group">
          <template #title><el-icon><ShoppingCart /></el-icon><span>🛒 采购管理</span></template>
          <el-menu-item index="/procurement/suppliers">供应商管理</el-menu-item>
          <el-menu-item index="/procurement/tco">TCO分析</el-menu-item>
          <el-menu-item index="/procurement/price-trend">价格趋势</el-menu-item>
        </el-sub-menu>

        <el-sub-menu v-if="hasPerm('inventory')" index="inventory-group">
          <template #title><el-icon><Goods /></el-icon><span>📦 库存控制</span></template>
          <el-menu-item index="/inventory/materials">库存概览(ABC)</el-menu-item>
          <el-menu-item index="/inventory/safety-stock">安全库存</el-menu-item>
          <el-menu-item index="/inventory/obsolete-alerts">呆滞预警</el-menu-item>
        </el-sub-menu>

        <el-sub-menu v-if="hasPerm('production')" index="production-group">
          <template #title><el-icon><Cpu /></el-icon><span>⚙️ 生产精益</span></template>
          <el-menu-item index="/production/oee">OEE计算</el-menu-item>
          <el-menu-item index="/production/vsm">价值流图VSM</el-menu-item>
          <el-menu-item index="/production/smed">SMED换模</el-menu-item>
        </el-sub-menu>

        <el-sub-menu v-if="hasPerm('quality')" index="quality-group">
          <template #title><el-icon><CircleCheck /></el-icon><span>✅ 质量成本</span></template>
          <el-menu-item index="/quality/overview">质量成本总览</el-menu-item>
          <el-menu-item index="/quality/paf">PAF分析</el-menu-item>
          <el-menu-item index="/quality/spc">SPC控制图</el-menu-item>
        </el-sub-menu>

        <el-sub-menu v-if="hasPerm('incentive')" index="incentive-group">
          <template #title><el-icon><Trophy /></el-icon><span>🏆 激励中心</span></template>
          <el-menu-item v-if="hasPerm('incentive', 'full')" index="/incentive/calculator">分享计算器</el-menu-item>
          <el-menu-item index="/incentive/proposals">改善提案</el-menu-item>
          <el-menu-item index="/incentive/leaderboard">积分排行榜</el-menu-item>
        </el-sub-menu>

        <el-sub-menu v-if="hasPerm('system')" index="system-group">
          <template #title><el-icon><Setting /></el-icon><span>🔧 系统管理</span></template>
          <el-menu-item index="/system/users">用户管理</el-menu-item>
        </el-sub-menu>
      </el-menu>
    </aside>

    <!-- 主内容区 -->
    <div class="main-area">
      <!-- 顶栏 -->
      <header class="header">
        <div class="header-left">
          <el-icon class="collapse-btn" @click="isCollapsed = !isCollapsed"><Fold v-if="!isCollapsed" /><Expand v-else /></el-icon>
          <el-breadcrumb separator="/">
            <el-breadcrumb-item>精益成本管理平台</el-breadcrumb-item>
            <el-breadcrumb-item>{{ currentTitle }}</el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        <div class="header-right">
          <el-badge :value="unreadCount" :max="99" :hidden="unreadCount === 0">
            <el-button :icon="Bell" circle @click="showNotifications" />
          </el-badge>
          <el-dropdown trigger="click" v-if="showNotifPanel" @command="handleNotifCommand">
            <span></span>
            <template #dropdown>
              <el-dropdown-menu class="notif-panel">
                <el-dropdown-item v-for="n in notifications" :key="n.id" :command="n.id">
                  <div class="notif-item" :class="{ unread: n.is_read === 0 }">
                    <el-tag :type="n.type === 'danger' ? 'danger' : n.type === 'warning' ? 'warning' : 'info'" size="small">
                      {{ n.type === 'diagnosis' ? '诊断' : n.type === 'alert' ? '预警' : '系统' }}
                    </el-tag>
                    <span class="notif-title">{{ n.title }}</span>
                    <span class="notif-time">{{ formatNotifTime(n.created_at) }}</span>
                  </div>
                </el-dropdown-item>
                <el-dropdown-item v-if="notifications.length > 0" command="readAll" divided>
                  <el-button type="primary" link size="small">全部标记已读</el-button>
                </el-dropdown-item>
                <el-dropdown-item v-if="notifications.length === 0" disabled>
                  <span class="no-notif">暂无通知</span>
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
          <el-dropdown trigger="click">
            <span class="user-info">
              <el-avatar :size="32" style="background:#1A73E8">{{ userInfo.realName?.[0] || 'U' }}</el-avatar>
              <span class="user-name">{{ userInfo.realName || '用户' }}</span>
              <el-tag v-if="userInfo.roleName" size="small" type="warning" style="margin-left:4px">{{ userInfo.roleName }}</el-tag>
              <el-icon><ArrowDown /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item @click="showChangePassword">修改密码</el-dropdown-item>
                <el-dropdown-item divided @click="handleLogout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </header>

      <!-- 内容区 -->
      <main class="content-area">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </main>
    </div>

    <!-- 修改密码弹窗 -->
    <el-dialog v-model="changePwdVisible" title="修改密码" width="400px">
      <el-form :model="changePwdForm" label-width="80px">
        <el-form-item label="旧密码">
          <el-input v-model="changePwdForm.oldPassword" type="password" show-password />
        </el-form-item>
        <el-form-item label="新密码">
          <el-input v-model="changePwdForm.newPassword" type="password" show-password placeholder="至少6位" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="changePwdVisible = false">取消</el-button>
        <el-button type="primary" @click="submitChangePassword">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '../../stores/user'
import { authApi } from '../../api'
import { notificationApi } from '../../api'
import { ElMessage } from 'element-plus'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const isCollapsed = ref(false)
const userInfo = computed(() => userStore.userInfo || {})
const currentRoute = computed(() => route.path)
const currentTitle = computed(() => route.meta.title || '')

// 权限检查
function hasPerm(moduleCode, requiredLevel = 'read') {
  return userStore.hasPermission(moduleCode, requiredLevel)
}

// 修改密码
const changePwdVisible = ref(false)
const changePwdForm = ref({ oldPassword: '', newPassword: '' })

function showChangePassword() {
  changePwdForm.value = { oldPassword: '', newPassword: '' }
  changePwdVisible.value = true
}

async function submitChangePassword() {
  if (!changePwdForm.value.oldPassword || !changePwdForm.value.newPassword) {
    ElMessage.warning('请输入旧密码和新密码')
    return
  }
  if (changePwdForm.value.newPassword.length < 6) {
    ElMessage.warning('新密码至少6位')
    return
  }
  try {
    const res = await authApi.changePassword(changePwdForm.value)
    if (res.code === 200) {
      ElMessage.success('密码修改成功')
      changePwdVisible.value = false
    } else {
      ElMessage.error(res.message || '修改失败')
    }
  } catch {
    ElMessage.error('操作失败')
  }
}

function handleLogout() {
  userStore.logout()
  router.push('/login')
}

// 通知相关
const showNotifPanel = ref(false)
const notifications = ref([])
const unreadCount = computed(() => notifications.value.filter(n => n.is_read === 0).length)

const showNotifications = () => {
  showNotifPanel.value = !showNotifPanel.value
  if (showNotifPanel.value) {
    loadNotifications()
  }
}

const loadNotifications = async () => {
  try {
    const res = await notificationApi.getList(1, 20)
    notifications.value = res.data.list || []
  } catch (err) {
    console.error('加载通知失败：', err)
  }
}

const handleNotifCommand = async (command) => {
  if (command === 'readAll') {
    try {
      await notificationApi.readAll()
      ElMessage.success('已全部标记已读')
      loadNotifications()
    } catch (err) {
      ElMessage.error('操作失败')
    }
  } else {
    // 标记单条已读
    try {
      await notificationApi.read(command)
      loadNotifications()
    } catch (err) {
      console.error('标记已读失败：', err)
    }
  }
}

const formatNotifTime = (timeStr) => {
  if (!timeStr) return ''
  const now = new Date()
  const time = new Date(timeStr)
  const diff = (now - time) / 1000 / 60  // 分钟
  if (diff < 60) return `${Math.floor(diff)}分钟前`
  if (diff < 24 * 60) return `${Math.floor(diff / 60)}小时前`
  return time.toLocaleDateString('zh-CN')
}
</script>

<style scoped>
.layout-container { display: flex; height: 100vh; overflow: hidden; }

.sidebar {
  width: var(--sidebar-width);
  min-width: var(--sidebar-width);
  background: linear-gradient(180deg, #1a237e 0%, #0d1642 100%);
  transition: width 0.3s;
  display: flex; flex-direction: column;
  overflow-y: auto; overflow-x: hidden;
  z-index: 10;
}
.sidebar.collapsed { width: 64px; min-width: 64px; }
.sidebar-logo {
  height: var(--header-height); display: flex; align-items: center; padding: 0 16px;
  gap: 10px; border-bottom: 1px solid rgba(255,255,255,0.1);
}
.logo-icon { font-size: 28px; }
.logo-text { font-size: 16px; font-weight: 600; color: #fff; white-space: nowrap; }
.sidebar-menu { border-right: none !important; }
.sidebar-menu .el-menu-item,
.sidebar-menu .el-sub-menu__title { height: 46px; line-height: 46px; }
.sidebar-menu:not(.el-menu--collapse) { width: 100%; }

.main-area { flex: 1; display: flex; flex-direction: column; overflow: hidden; background: var(--bg-color); }

.header {
  height: var(--header-height); background: #fff; display: flex;
  align-items: center; justify-content: space-between;
  padding: 0 20px; box-shadow: 0 1px 4px rgba(0,0,0,0.08);
  z-index: 5;
}
.header-left { display: flex; align-items: center; gap: 12px; }
.collapse-btn { font-size: 18px; cursor: pointer; color: #666; }
.collapse-btn:hover { color: var(--primary-color); }
.header-right { display: flex; align-items: center; gap: 16px; }
.user-info { display: flex; align-items: center; gap: 8px; cursor: pointer; }
.user-name { font-size: 14px; color: #333; }

.content-area {
  flex: 1; overflow-y: auto; padding: 20px;
}

.fade-enter-active, .fade-leave-active { transition: opacity 0.15s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

.notif-panel { min-width: 300px; max-width: 400px; }
.notif-item { display: flex; align-items: center; gap: 8px; padding: 8px 0; min-width: 0; }
.notif-item.unread { background: #f0f9ff; }
.notif-title { flex: 1; font-size: 13px; color: #303133; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.notif-time { font-size: 11px; color: #909399; flex-shrink: 0; }
.no-notif { color: #909399; font-size: 13px; padding: 16px; text-align: center; }
</style>
