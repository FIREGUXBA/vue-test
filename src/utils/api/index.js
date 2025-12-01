import axios from 'axios'

// 从环境变量构建 API baseURL
const getBaseURL = () => {
  // 优先使用完整的 baseURL
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL
  }
  
  // 如果提供了主机和端口，则组合构建
  const host = import.meta.env.VITE_API_HOST
  const port = import.meta.env.VITE_API_PORT
  
  if (host && port) {
    return `http://${host}:${port}/api`
  }
  
  if (host) {
    return `http://${host}/api`
  }
  
  // 默认使用相对路径
  return '/api'
}

// 创建 axios 实例
const api = axios.create({
  baseURL: getBaseURL(),
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器
api.interceptors.request.use(
  config => {
    // 添加 token
    const token = localStorage.getItem('token') || sessionStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    // 添加请求时间戳（防止缓存）
    if (config.method === 'get') {
      config.params = {
        ...config.params,
        _t: Date.now()
      }
    }
    
    return config
  },
  error => {
    return Promise.reject(error)
  }
)

// 响应拦截器
api.interceptors.response.use(
  response => {
    // 根据后端返回的数据结构处理
    const { code, data, message } = response.data
    
    // 如果后端统一返回格式为 { code, data, message }
    if (code !== undefined) {
      if (code === 200 || code === 0) {
        return data
      } else {
        // 业务错误
        const error = new Error(message || '请求失败')
        error.code = code
        return Promise.reject(error)
      }
    }
    
    // 如果后端直接返回数据
    return response.data
  },
  error => {
    // HTTP 错误处理
    if (error.response) {
      const { status, data } = error.response
      
      switch (status) {
        case 401:
          // 未授权，清除 token 并跳转登录
          localStorage.removeItem('token')
          sessionStorage.removeItem('token')
          console.error('未授权，请重新登录')
          break
        case 403:
          console.error('没有权限访问')
          break
        case 404:
          console.error('请求的资源不存在')
          break
        case 500:
          console.error('服务器错误')
          break
        default:
          console.error(`请求错误: ${status}`)
      }
      
      return Promise.reject({
        code: status,
        message: data?.message || error.message,
        data: data
      })
    } else if (error.request) {
      // 请求已发出但没有收到响应
      console.error('网络错误，请检查网络连接')
      return Promise.reject({
        code: -1,
        message: '网络错误，请检查网络连接'
      })
    } else {
      // 其他错误
      return Promise.reject(error)
    }
  }
)

export default api

