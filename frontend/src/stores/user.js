import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useUserStore = defineStore('user', () => {
  const token = ref(localStorage.getItem('token') || '')
  const userInfo = ref(JSON.parse(localStorage.getItem('userInfo') || 'null'))

  const isLoggedIn = ref(!!token.value)

  function setAuth(data) {
    token.value = data.token
    userInfo.value = data.user
    isLoggedIn.value = true
    localStorage.setItem('token', data.token)
    localStorage.setItem('userInfo', JSON.stringify(data.user))
  }

  function logout() {
    token.value = ''
    userInfo.value = null
    isLoggedIn.value = false
    localStorage.removeItem('token')
    localStorage.removeItem('userInfo')
  }

  /**
   * 检查当前用户是否有指定模块的权限
   * @param {string} moduleCode - 模块代码
   * @param {string} requiredLevel - 所需权限级别: 'read' 或 'full'
   * @returns {boolean}
   */
  function hasPermission(moduleCode, requiredLevel = 'read') {
    const perms = userInfo.value?.permissions || {}
    const myLevel = perms[moduleCode] || 'none'

    if (myLevel === 'none') return false
    if (myLevel === 'full') return true
    if (myLevel === 'read' && requiredLevel === 'read') return true
    return false
  }

  /**
   * 获取模块权限级别
   */
  function getPermissionLevel(moduleCode) {
    const perms = userInfo.value?.permissions || {}
    return perms[moduleCode] || 'none'
  }

  /**
   * 是否是管理员
   */
  const isAdmin = ref(false)

  function refreshIsAdmin() {
    const roleCode = userInfo.value?.roleCode || ''
    isAdmin.value = ['super_admin', 'owner'].includes(roleCode)
  }

  // 初始化时刷新
  if (isLoggedIn.value && userInfo.value) {
    refreshIsAdmin()
  }

  return {
    token, userInfo, isLoggedIn, isAdmin,
    setAuth, logout, hasPermission, getPermissionLevel, refreshIsAdmin
  }
})
