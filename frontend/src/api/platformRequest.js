/**
 * 平台总后台 API 请求实例
 * 独立于租户端请求，使用单独的 Token 存储
 */
import axios from 'axios'
import { ElMessage } from 'element-plus'

const platformRequest = axios.create({
  baseURL: '',
  timeout: 15000
})

// 请求拦截器
platformRequest.interceptors.request.use(config => {
  const token = localStorage.getItem('platformToken')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// 响应拦截器
platformRequest.interceptors.response.use(
  response => {
    const res = response.data
    if (res.code !== 200) {
      ElMessage.error(res.message || '请求失败')
      if (res.code === 401) {
        localStorage.removeItem('platformToken')
        localStorage.removeItem('platformUserInfo')
        window.location.href = '/platform/login'
      }
      return Promise.reject(new Error(res.message))
    }
    return res
  },
  error => {
    ElMessage.error(error.message || '网络错误')
    return Promise.reject(error)
  }
)

export default platformRequest
