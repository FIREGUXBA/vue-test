import { get, post, put, del } from '../request'

/**
 * 获取文件列表
 * @param {string} kind - 文件类型：'daily' | 'monthly'
 * @returns {Promise}
 */
export const getConfigFiles = (kind) => {
  return get('/config/files', { kind })
}
/**
 * 获取当前配置
 * @returns {Promise}
 */
export const getConfig = () => {
  return get('/config/config')
}
/**
 * 保存配置
 * @param {Object} configData - 配置数据
 * @param {string} configData.DAILY_STATS_FILE - 每日统计文件路径
 * @param {string} configData.MONTHLY_SUMMARY_FILE - 月度汇总文件路径
 * @param {string} configData.OUTPUT_FILE - 输出文件路径
 * @param {number} configData.WORK_DAYS - 工作天数
 * @param {boolean} configData.SAVE_TO_DATABASE - 是否保存到数据库
 * @returns {Promise}
 */
export const saveConfig = (configData) => {
  // 将数据转换为 URLSearchParams 格式（application/x-www-form-urlencoded）
  const params = new URLSearchParams()
  params.append('DAILY_STATS_FILE', configData.DAILY_STATS_FILE)
  params.append('MONTHLY_SUMMARY_FILE', configData.MONTHLY_SUMMARY_FILE)
  params.append('OUTPUT_FILE', configData.OUTPUT_FILE)
  params.append('WORK_DAYS', configData.WORK_DAYS.toString())
  params.append('SAVE_TO_DATABASE', configData.SAVE_TO_DATABASE ? 'true' : 'false')
  
  return post('/config/save', params.toString(), {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  })
}
/**
 * 重置配置
 * @returns {Promise}
 */
export const resetConfig = () => {
  return post('/config/reset')
}

/**
 * 执行处理
 * @returns {Promise}
 */
export const executeProcessExcel = () => {
  return post('/config/run')
}