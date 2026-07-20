/**
 * 平台总后台用户状态管理
 * 独立于租户端 user store
 */
import { defineStore } from 'pinia'
import { ref } from 'vue'
import platformRequest from '../api/platformRequest'

export const usePlatformStore = defineStore('platform', () => {
  const token = ref(localStorage.getItem('platformToken') || '')
  const userInfo = ref(JSON.parse(localStorage.getItem('platformUserInfo') || 'null'))

  const isLoggedIn = !!token.value

  function setAuth(data) {
    token.value = data.token
    userInfo.value = data.user
    localStorage.setItem('platformToken', data.token)
    localStorage.setItem('platformUserInfo', JSON.stringify(data.user))
  }

  function logout() {
    token.value = ''
    userInfo.value = null
    localStorage.removeItem('platformToken')
    localStorage.removeItem('platformUserInfo')
  }

  return { token, userInfo, isLoggedIn, setAuth, logout }
})
