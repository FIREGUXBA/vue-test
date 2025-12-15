import api from './index'
import axios from 'axios'

/**
 * GET 请求
 * @param {string} url - 请求地址
 * @param {object} params - 查询参数
 * @param {object} config - axios 配置
 */
export const get = (url, params = {}, config = {}) => {
  return api.get(url, { params, ...config })
}

/**
 * POST 请求
 * @param {string} url - 请求地址
 * @param {object} data - 请求体数据
 * @param {object} config - axios 配置
 */
export const post = (url, data = {}, config = {}) => {
  return api.post(url, data, config)
}

/**
 * PUT 请求
 * @param {string} url - 请求地址
 * @param {object} data - 请求体数据
 * @param {object} config - axios 配置
 */
export const put = (url, data = {}, config = {}) => {
  return api.put(url, data, config)
}

/**
 * DELETE 请求
 * @param {string} url - 请求地址
 * @param {object} config - axios 配置
 */
export const del = (url, config = {}) => {
  return api.delete(url, config)
}

/**
 * PATCH 请求
 * @param {string} url - 请求地址
 * @param {object} data - 请求体数据
 * @param {object} config - axios 配置
 */
export const patch = (url, data = {}, config = {}) => {
  return api.patch(url, data, config)
}

/**
 * 文件上传
 * @param {string} url - 上传地址
 * @param {FormData} formData - 表单数据
 * @param {object} config - axios 配置（可配置上传进度）
 */
export const upload = (url, formData, config = {}) => {
  return api.post(url, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    },
    ...config
  })
}

/**
 * 文件下载
 * @param {string} url - 下载地址
 * @param {string} filename - 文件名
 * @param {object} params - 查询参数
 */
export const download = async (url, filename, params = {}) => {
  const isDev = import.meta.env.DEV || import.meta.env.MODE === 'development'
  
  // 开发环境：使用相对路径，通过 Vite 代理转发
  // 生产环境：使用完整 URL
  let fullUrl
  if (isDev) {
    // 开发环境：确保使用相对路径
    if (url.startsWith('http')) {
      // 如果传入的是完整 URL，提取路径部分
      try {
        const urlObj = new URL(url)
        fullUrl = urlObj.pathname + urlObj.search
      } catch (e) {
        fullUrl = url.startsWith('/api') ? url : `/api${url}`
      }
    } else {
      // 相对路径
      fullUrl = url.startsWith('/api') ? url : `/api${url}`
    }
  } else {
    // 生产环境：构建完整 URL
    const host = import.meta.env.VITE_API_HOST
    const port = import.meta.env.VITE_API_PORT
    const baseURL = import.meta.env.VITE_API_BASE_URL
    
    let serverUrl = ''
    if (host && port) {
      serverUrl = `http://${host}:${port}`
    } else if (baseURL) {
      serverUrl = baseURL.replace(/\/api\/?$/, '')
    } else {
      serverUrl = 'http://localhost:9500'
    }
    
    if (url.startsWith('http')) {
      fullUrl = url
    } else if (url.startsWith('/api')) {
      fullUrl = `${serverUrl}${url}`
    } else {
      fullUrl = `${serverUrl}/api${url}`
    }
  }
  
  // 获取 token
  const token = localStorage.getItem('token') || sessionStorage.getItem('token')
  
  // 使用原生 axios 请求，避免拦截器处理 blob 响应
  const response = await axios.get(fullUrl, {
    params,
    responseType: 'blob',
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  })
  
  // response.data 是 blob 数据
  const blob = response.data
  const link = document.createElement('a')
  link.href = window.URL.createObjectURL(blob)
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(link.href)
}

