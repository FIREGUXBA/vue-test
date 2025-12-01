import api from './index'

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
  const response = await api.get(url, {
    params,
    responseType: 'blob'
  })
  
  const blob = new Blob([response])
  const link = document.createElement('a')
  link.href = window.URL.createObjectURL(blob)
  link.download = filename
  link.click()
  window.URL.revokeObjectURL(link.href)
}

