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
  // 获取 baseURL
  const getBaseURL = () => {
    if (import.meta.env.VITE_API_BASE_URL) {
      return import.meta.env.VITE_API_BASE_URL
    }
    const host = import.meta.env.VITE_API_HOST
    const port = import.meta.env.VITE_API_PORT
    if (host && port) {
      return `http://${host}:${port}/api`
    }
    if (host) {
      return `http://${host}/api`
    }
    return '/api'
  }

  // 构建完整 URL
  const baseURL = getBaseURL()
  let fullUrl
  if (url.startsWith('http')) {
    // 完整的 HTTP URL
    fullUrl = url
  } else if (url.startsWith('/api')) {
    // URL 已经包含 /api 前缀，直接使用（可能是相对路径或绝对路径）
    // 如果 baseURL 是完整 URL，需要拼接；如果是相对路径，直接使用
    if (baseURL.startsWith('http')) {
      // baseURL 是完整 URL，需要提取域名部分
      const urlObj = new URL(baseURL)
      fullUrl = `${urlObj.origin}${url}`
    } else {
      // baseURL 是相对路径，直接使用 url
      fullUrl = url
    }
  } else {
    // 相对路径，需要拼接 baseURL
    fullUrl = `${baseURL}${url}`
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

