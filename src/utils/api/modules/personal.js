import { post, get } from '../request'

/**
 * 查询个人数据
 * @param {Object} params - 查询参数
 * @param {string} params.start_month - 统计的开始月份，格式 YYYY-MM (例如: 2025-01)
 * @param {string} params.end_month - 统计的结束月份，格式 YYYY-MM (例如: 2025-03)
 * @param {string} params.employee_id - 工号
 * @returns {Promise}
 */
export const queryPersonalData = (params) => {
    const requestBody = {
        start_month: params.start_month,
        end_month: params.end_month,
        employee_id: params.employee_id
    }
    
    return post('/attendance/query', requestBody)
  }

/**
 * 查询指定月份员工总工作时长的平均值
 * @param {string} period - 月份期间，格式 YYYY-MM (例如: 2025-01)
 * @returns {Promise}
 */
export const getAvgTotalWorkHoursByMonth = (period) => {
  return get(`/attendance/avg-total-work-hours/${period}`)
}

/**
 * 查询指定月份员工日均工作时长（排除周末）的平均值
 * @param {string} period - 月份期间，格式 YYYY-MM (例如: 2025-01)
 * @returns {Promise}
 */
export const getAvgWorkHoursNoWeekendByMonth = (period) => {
  return get(`/attendance/avg-work-hours-no-weekend/${period}`)
}