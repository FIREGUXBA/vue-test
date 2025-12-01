import { post } from '../request'

/**
 * 查询报表数据
 * @param {Object} params - 查询参数
 * @param {string} params.start_month - 统计的开始月份，格式 YYYY-MM (例如: 2025-01)
 * @param {string} params.end_month - 统计的结束月份，格式 YYYY-MM (例如: 2025-03)
 * @param {Array<string>} [params.names] - 要查询的员工姓名列表（可选）
 * @param {string} [params.department] - 按部门模糊查询（可选）
 * @returns {Promise}
 */
export const queryReportData = (params) => {
  const requestBody = {
    start_month: params.start_month,
    end_month: params.end_month
  }
  
  // 可选参数：姓名列表
  if (params.names && params.names.length > 0) {
    requestBody.names = params.names
  }
  
  // 可选参数：部门模糊查询
  if (params.department && params.department.trim()) {
    requestBody.department = params.department.trim()
  }
  
  return post('/attendance/query', requestBody)
}