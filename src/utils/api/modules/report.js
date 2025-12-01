import { get, post, put, del } from '../request'

/**
 * 获取报表数据
 * @param {string} startMonth - 起始月份
 * @param {string} endMonth - 结束月份
 * @returns {Promise}
 */
export const getReportData = (startMonth, endMonth) => {
  return get('/report/data', { startMonth, endMonth })
}