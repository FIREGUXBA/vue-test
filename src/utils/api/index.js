import axios from 'axios'

// API 请求前缀，统一使用相对路径，通过代理转发到后端
// 开发环境通过 Vite 代理，生产环境通过 Nginx 代理
const API_BASE_URL = '/api'

// 创建 axios 实例
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器
api.interceptors.request.use(
  config => {
    // 强制使用统一的相对路径前缀，无论什么环境
    config.baseURL = API_BASE_URL
    
    // 确保 URL 是相对路径，不是完整 URL
    if (config.url && config.url.startsWith('http')) {
      console.warn('[API警告] URL 不能是完整路径，已修复:', config.url)
      try {
        const urlObj = new URL(config.url)
        config.url = urlObj.pathname + urlObj.search
      } catch (e) {
        console.error('[API错误] 无法解析URL:', config.url)
      }
    }
    
    // 添加 token
    const token = localStorage.getItem('token') || sessionStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    // GET 请求添加时间戳防止缓存
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
      const requestURL = error.config?.url || '未知URL'
      const requestBaseURL = error.config?.baseURL || API_BASE_URL
      const fullURL = `${requestBaseURL}${requestURL}`
      
      console.error('[网络连接错误]', {
        message: error.message,
        code: error.code,
        请求URL: fullURL,
        提示: '请检查：1) 服务器是否运行 2) 网络连接是否正常 3) 代理配置是否正确'
      })
      
      let errorMessage = '网络连接错误'
      if (error.code === 'ERR_NETWORK' || error.code === 'ECONNREFUSED') {
        errorMessage = '无法连接到服务器，请检查服务器是否运行'
      } else if (error.message.includes('ERR_CONNECTION_REFUSED')) {
        errorMessage = '连接被拒绝，请检查服务器状态和防火墙设置'
      }
      
      return Promise.reject({
        code: -1,
        message: errorMessage,
        requestURL: fullURL
      })
    } else {
      // 其他错误
      console.error('[请求错误]', error)
      return Promise.reject(error)
    }
  }
)

export default api
