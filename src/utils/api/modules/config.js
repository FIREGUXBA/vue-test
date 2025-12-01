import { get, post, put, del } from '../request'

/**
 * 获取配置文件列表
 * @param {string} kind - 文件类型：'daily' | 'monthly'
 * @returns {Promise}
 */
export const getConfigFiles = (kind) => {
  return get('/config/files', { kind })
}

