<script setup>
import { ref, computed, watch, onMounted, onUnmounted, inject } from 'vue'
import SummaryCard from '../components/SummaryCard.vue'
import IconUsers from '../components/icons/IconUsers.vue'
import IconFilter from '../components/icons/IconFilter.vue'
import IconChevronRight from '../components/icons/IconChevronRight.vue'
import IconCalendar from '../components/icons/IconCalendar.vue'
import IconChart from '../components/icons/IconChart.vue'
import IconTrendUp from '../components/icons/IconTrendUp.vue'
import IconClock from '../components/icons/IconClock.vue'
import IconFileText from '../components/icons/IconFileText.vue'
import { getCellColor } from '../utils/data'
import { getEmployees, getMonthList, queryReportData } from '../utils/api/modules/report'
const showToast = inject('showToast')

// 部门映射函数
const mapDepartment = (dept) => {
  const departmentMap = {
    'tgfw_test': 'TGFW测试',
    'waf_test': 'WAF测试',
    'usm_test': 'USM测试',
    'trainee_test': '测试实习',
    'other': '其他',
  }
  return departmentMap[dept] || dept
}

// 数据状态
const data = ref([])
const loading = ref(false)
const hasSearched = ref(false) // 是否已执行过查询

// 员工列表
const employeeList = ref([])
const loadingEmployees = ref(false)

// 月份列表
const monthList = ref([])
const loadingMonthList = ref(false)

// 筛选条件
const selectedNames = ref([])
const departmentInput = ref('') // 部门输入框（模糊查询）
const startMonth = ref('')
const endMonth = ref('')

// 工时显示模式切换：true 显示总工时，false 显示平均工时
const showTotalHours = ref(false)

// 从 API 返回的数据格式转换为内部格式
const normalizeData = (apiData) => {
  if (!Array.isArray(apiData) || apiData.length === 0) {
    return []
  }

  // 按员工分组数据
  const employeeMap = {}

  apiData.forEach(item => {
    const employeeId = item.employee_id
    const employee = item.employee || {}

    // 如果该员工还没有记录，创建新记录
    if (!employeeMap[employeeId]) {
      employeeMap[employeeId] = {
        id: item.id || employeeId,
        name: employee.name || '',
        dept: mapDepartment(employee.third_level_dept || ''),
        monthlyHours: {},
        monthlyTotalHours: {},
        stats: {
          missingCard: 0,
          businessTrip: 0,
          compLeave: 0,
          leave: 0,
          late: 0,
          earlyLeave: 0
        },
        hours: 0 // 用于统计总工时
      }
    }

    // 直接使用 period 作为月份键
    const monthKey = item.period
    employeeMap[employeeId].monthlyHours[monthKey] = parseFloat((item.avg_work_hours_no_weekend_exclude_card_fix || 0).toFixed(2))
    employeeMap[employeeId].monthlyTotalHours[monthKey] = parseFloat((item.total_work_hours_with_weekend_exclude_card_fix || 0).toFixed(2))
    // 累计统计数据（补卡、迟到等应该累计）
    const stats = employeeMap[employeeId].stats
    stats.missingCard = parseFloat((stats.missingCard + (item.card_fix_count || 0)).toFixed(2))
    stats.businessTrip = parseFloat((stats.businessTrip + (item.business_trip_days || 0)).toFixed(2))
    stats.compLeave = parseFloat((stats.compLeave + (item.compensatory_leave_days || 0)).toFixed(2))
    stats.leave = parseFloat((stats.leave + (item.leave_days || 0)).toFixed(2))
    stats.late = parseFloat((stats.late + (item.late_count || 0)).toFixed(2))
    stats.earlyLeave = parseFloat((stats.earlyLeave + (item.early_leave_count || 0)).toFixed(2))

    // 累计总工时（使用总工时）
    employeeMap[employeeId].hours = parseFloat((employeeMap[employeeId].hours + (item.total_work_hours_with_weekend_exclude_card_fix || 0)).toFixed(2))
  })

  // 转换为数组并返回
  return Object.values(employeeMap)
}

// 计算选择的月份数量
const selectedMonthCount = computed(() => {
  const startIdx = monthList.value.indexOf(startMonth.value)
  const endIdx = monthList.value.indexOf(endMonth.value)
  if (startIdx === -1 || endIdx === -1 || startIdx > endIdx) {
    return 0
  }
  return endIdx - startIdx + 1
})

// 验证月份范围是否满足至少2个月的要求
const isMonthRangeValid = computed(() => {
  return selectedMonthCount.value >= 2
})
const showNameDropdown = ref(false)
const showMonthDropdown = ref(false)

// 从员工列表中获取所有姓名列表（用于下拉选择）
const allNames = computed(() => {
  if (employeeList.value.length === 0) {
    return []
  }
  return [...new Set(employeeList.value.map(emp => emp.name))].sort()
})

// 从查询返回的数据中提取所有月份键
const monthKeys = computed(() => {
  if (!data.value || data.value.length === 0) {
    return []
  }
  const monthSet = new Set()
  data.value.forEach(row => {
    Object.keys(row.monthlyHours || {}).forEach(month => {
      monthSet.add(month)
    })
  })
  // 按时间顺序排序
  return Array.from(monthSet).sort()
})

// 查询报表数据
const handleQuery = async () => {
  loading.value = true

  try {
    const params = {
      start_month: startMonth.value,
      end_month: endMonth.value
    }

    // 添加可选参数：姓名列表
    if (selectedNames.value.length > 0) {
      params.names = selectedNames.value
    }

    // 添加可选参数：部门模糊查询
    if (departmentInput.value.trim()) {
      params.department = departmentInput.value.trim()
    }
    // showToast('查询中...', 'pending')
    const result = await queryReportData(params)
    data.value = normalizeData(result)
    hasSearched.value = true
    showToast('查询成功', 'success')
  } catch (err) {
    showToast('查询失败，请稍后重试', 'error')
  } finally {
    loading.value = false
  }
}

// 根据切换状态获取当前使用的工时数据字段
const currentHoursField = computed(() => {
  return showTotalHours.value ? 'monthlyTotalHours' : 'monthlyHours'
})

const columnValues = computed(() => {
  if (!hasSearched.value || !data.value || data.value.length === 0) {
    return {}
  }
  const map = {}
  const field = currentHoursField.value
  monthKeys.value.forEach(m => {
    map[m] = data.value
      .map(row => row[field][m])
      .filter(val => val !== undefined && val !== null)
  })
  return map
})

const footerStats = computed(() => {
  if (!hasSearched.value || !data.value || data.value.length === 0) {
    return {
      avgTotalHours: 0,
      avgTotalHoursAvgByMonth: [],
      avgDailyHours: 0,
      avgDailyHoursAvgByMonth: [],
      topTotalHours: [],
      topTotalHoursAvgByMonth: [],
      bottomTotalHours: [],
      bottomTotalHoursAvgByMonth: [],
      topDailyHours: [],
      bottomDailyHours: [],
      topDailyHoursAvgByMonth: [],
      bottomDailyHoursAvgByMonth: [],
      topMissing: [],
      topLeave: [],
      topLate: []
    }
  }

  const currentData = [...data.value]

  // 各类排行
  const getTotalHoursSum = (employee) => {
    return monthKeys.value.reduce((sum, m) => {
      const val = employee.monthlyTotalHours[m]
      return sum + (val !== undefined && val !== null ? val : 0)
    }, 0)
  }

  const getAvgTotalHours = (employees) => {
    if (!employees || employees.length === 0) return 0
    const totalSum = employees.reduce((total, employee) => {
      const employeeSum = monthKeys.value.reduce((sum, m) => {
        const val = employee.monthlyTotalHours[m]
        return sum + (val !== undefined && val !== null ? val : 0)
      }, 0)
      return total + employeeSum
    }, 0)
    return parseFloat((totalSum / employees.length).toFixed(2))
  }

  // 所有员工总工时的月度平均值
  const avgTotalHoursAvgByMonth = monthKeys.value.map(month => {
    const monthValues = currentData
      .map(emp => emp.monthlyTotalHours[month])
      .filter(val => val !== undefined && val !== null)
    
    if (monthValues.length === 0) return { month, value: 0, unit: 'h' }
    
    const avg = monthValues.reduce((sum, val) => sum + val, 0) / monthValues.length
    return {
      month,
      value: parseFloat(avg.toFixed(2)),
      unit: 'h'
    }
  })

  const topTotalHours = [...currentData]
    .map(d => ({ ...d, totalHoursSum: getTotalHoursSum(d) }))
    .sort((a, b) => b.totalHoursSum - a.totalHoursSum)
    .slice(0, 6)
    .map(i => ({
      name: i.name,
      dept: i.dept,
      value: parseFloat(i.totalHoursSum.toFixed(2)),
      unit: 'h'
    }))

  const bottomTotalHours = [...currentData]
    .map(d => ({ ...d, totalHoursSum: getTotalHoursSum(d) }))
    .sort((a, b) => a.totalHoursSum - b.totalHoursSum)
    .slice(0, 6)
    .map(i => ({
      name: i.name,
      dept: i.dept,
      value: parseFloat(i.totalHoursSum.toFixed(2)),
      unit: 'h'
    }))

  // 总工时前6名的月度平均值
  const topTotalHoursAvgByMonth = monthKeys.value.map(month => {
    const topEmployees = [...currentData]
      .map(d => ({ ...d, totalHoursSum: getTotalHoursSum(d) }))
      .sort((a, b) => b.totalHoursSum - a.totalHoursSum)
      .slice(0, 6)
    
    const monthValues = topEmployees
      .map(emp => emp.monthlyTotalHours[month])
      .filter(val => val !== undefined && val !== null)
    
    if (monthValues.length === 0) return { month, value: 0, unit: 'h' }
    
    const avg = monthValues.reduce((sum, val) => sum + val, 0) / monthValues.length
    return {
      month,
      value: parseFloat(avg.toFixed(2)),
      unit: 'h'
    }
  })

  // 总工时后6名的月度平均值
  const bottomTotalHoursAvgByMonth = monthKeys.value.map(month => {
    const bottomEmployees = [...currentData]
      .map(d => ({ ...d, totalHoursSum: getTotalHoursSum(d) }))
      .sort((a, b) => a.totalHoursSum - b.totalHoursSum)
      .slice(0, 6)
    
    const monthValues = bottomEmployees
      .map(emp => emp.monthlyTotalHours[month])
      .filter(val => val !== undefined && val !== null)
    
    if (monthValues.length === 0) return { month, value: 0, unit: 'h' }
    
    const avg = monthValues.reduce((sum, val) => sum + val, 0) / monthValues.length
    return {
      month,
      value: parseFloat(avg.toFixed(2)),
      unit: 'h'
    }
  })

  const getDailyHoursSum = (employee) => {
    return monthKeys.value.reduce((sum, m) => {
      const val = employee.monthlyHours[m]
      return sum + (val !== undefined && val !== null ? val : 0)
    }, 0)
  }
  const getAvgDailyHours = (employees) => {
    if (!employees || employees.length === 0) return 0
    const totalSum = employees.reduce((total, employee) => {
      const employeeSum = monthKeys.value.reduce((sum, m) => {
        const val = employee.monthlyHours[m]
        return sum + (val !== undefined && val !== null ? val : 0)
      }, 0)
      return total + employeeSum
    }, 0)
    return parseFloat((totalSum / employees.length).toFixed(2))
  }

  // 所有员工日均工时的月度平均值
  const avgDailyHoursAvgByMonth = monthKeys.value.map(month => {
    const monthValues = currentData
      .map(emp => emp.monthlyHours[month])
      .filter(val => val !== undefined && val !== null)
    
    if (monthValues.length === 0) return { month, value: 0, unit: 'h' }
    
    const avg = monthValues.reduce((sum, val) => sum + val, 0) / monthValues.length
    return {
      month,
      value: parseFloat(avg.toFixed(2)),
      unit: 'h'
    }
  })

  const topDailyHours = [...currentData]
    .map(d => ({ ...d, dailyHoursSum: getDailyHoursSum(d) }))
    .sort((a, b) => b.dailyHoursSum - a.dailyHoursSum)
    .slice(0, 6)
    .map(i => ({
      name: i.name,
      dept: i.dept,
      value: parseFloat(i.dailyHoursSum.toFixed(2)),
      unit: 'h'
    }))

  const bottomDailyHours = [...currentData]
    .map(d => ({ ...d, dailyHoursSum: getDailyHoursSum(d) }))
    .sort((a, b) => a.dailyHoursSum - b.dailyHoursSum)
    .slice(0, 6)
    .map(i => ({
      name: i.name,
      dept: i.dept,
      value: parseFloat(i.dailyHoursSum.toFixed(2)),
      unit: 'h'
    }))

  // 日均工时前6名的月度平均值
  const topDailyHoursAvgByMonth = monthKeys.value.map(month => {
    const topEmployees = [...currentData]
      .map(d => ({ ...d, dailyHoursSum: getDailyHoursSum(d) }))
      .sort((a, b) => b.dailyHoursSum - a.dailyHoursSum)
      .slice(0, 6)
    
    const monthValues = topEmployees
      .map(emp => emp.monthlyHours[month])
      .filter(val => val !== undefined && val !== null)
    
    if (monthValues.length === 0) return { month, value: 0, unit: 'h' }
    
    const avg = monthValues.reduce((sum, val) => sum + val, 0) / monthValues.length
    return {
      month,
      value: parseFloat(avg.toFixed(2)),
      unit: 'h'
    }
  })

  // 日均工时后6名的月度平均值
  const bottomDailyHoursAvgByMonth = monthKeys.value.map(month => {
    const bottomEmployees = [...currentData]
      .map(d => ({ ...d, dailyHoursSum: getDailyHoursSum(d) }))
      .sort((a, b) => a.dailyHoursSum - b.dailyHoursSum)
      .slice(0, 6)
    
    const monthValues = bottomEmployees
      .map(emp => emp.monthlyHours[month])
      .filter(val => val !== undefined && val !== null)
    
    if (monthValues.length === 0) return { month, value: 0, unit: 'h' }
    
    const avg = monthValues.reduce((sum, val) => sum + val, 0) / monthValues.length
    return {
      month,
      value: parseFloat(avg.toFixed(2)),
      unit: 'h'
    }
  })


  const topMissing = [...currentData]
    .sort((a, b) => b.stats.missingCard - a.stats.missingCard)
    .filter(i => i.stats.missingCard > 0)
    .slice(0, 6)
    .map(i => ({ name: i.name, dept: i.dept, value: i.stats.missingCard, unit: '次' }))

  const topLate = [...currentData]
    .sort((a, b) => b.stats.late - a.stats.late)
    .filter(i => i.stats.late > 0)
    .slice(0, 6)
    .map(i => ({ name: i.name, dept: i.dept, value: i.stats.late, unit: '次' }))

  const topLeave = [...currentData]
    .sort((a, b) => b.stats.leave - a.stats.leave)
    .filter(i => i.stats.leave > 0)
    .slice(0, 6)
    .map(i => ({ name: i.name, dept: i.dept, value: i.stats.leave, unit: '天' }))

  return {
    avgTotalHours: getAvgTotalHours(currentData),
    avgTotalHoursAvgByMonth: avgTotalHoursAvgByMonth,
    avgDailyHours: getAvgDailyHours(currentData),
    avgDailyHoursAvgByMonth: avgDailyHoursAvgByMonth,
    topTotalHours: topTotalHours,
    topTotalHoursAvgByMonth: topTotalHoursAvgByMonth,
    bottomTotalHours: bottomTotalHours,
    bottomTotalHoursAvgByMonth: bottomTotalHoursAvgByMonth,
    topDailyHours: topDailyHours,
    bottomDailyHours: bottomDailyHours,
    topDailyHoursAvgByMonth: topDailyHoursAvgByMonth,
    bottomDailyHoursAvgByMonth: bottomDailyHoursAvgByMonth,
    topMissing: topMissing,
    topLeave: topLeave,
    topLate: topLate
  }
})

// 月份选择验证
watch([startMonth, endMonth], ([start, end]) => {
  const startIdx = monthList.value.indexOf(start)
  const endIdx = monthList.value.indexOf(end)
  if (startIdx > endIdx) {
    endMonth.value = start
    return
  }

  const monthCount = endIdx - startIdx + 1
  if (monthCount < 2) {
    const newEndIdx = Math.min(startIdx + 1, monthList.value.length - 1)
    endMonth.value = monthList.value[newEndIdx]
  }
})

const toggleNameDropdown = () => {
  const wasOpen = showNameDropdown.value
  showNameDropdown.value = false
  showMonthDropdown.value = false
  showNameDropdown.value = !wasOpen
}

const toggleMonthDropdown = () => {
  const wasOpen = showMonthDropdown.value
  showNameDropdown.value = false
  showMonthDropdown.value = false
  showMonthDropdown.value = !wasOpen
}

const handleClickOutside = (event) => {
  if (!event.target.closest('.dropdown-container')) {
    showNameDropdown.value = false
    showMonthDropdown.value = false
  }
}

// 获取员工列表
const fetchEmployeeList = async () => {
  loadingEmployees.value = true
  try {
    const result = await getEmployees({ skip: 0, limit: 100 })
    // 后端返回的数据格式为数组，包含 employee_id, name, second_level_dept, third_level_dept 等字段
    employeeList.value = Array.isArray(result) ? result : []
  } catch (err) {
    console.error('获取员工列表失败:', err)
    showToast('获取员工列表失败', 'error')
    employeeList.value = []
  } finally {
    loadingEmployees.value = false
  }
}

// 获取月份列表
const fetchMonthList = async () => {
  loadingMonthList.value = true
  try {
    const result = await getMonthList()
    monthList.value = Array.isArray(result) ? result : []
    startMonth.value = monthList.value[0]
    endMonth.value = monthList.value[monthList.value.length - 1]
  } catch (err) {
    console.error('获取月份列表失败:', err)
    showToast('获取月份列表失败', 'error')
    monthList.value = []
  } finally {
    loadingMonthList.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  fetchMonthList()
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<template>
  <div class="space-y-6">
    <div
      class="px-4 py-3  rounded-xl flex flex-wrap gap-4 items-center justify-between bg-white/80 border border-gray-200 shadow-sm relative z-40">
      <div class="flex items-center gap-6 flex-wrap">
        <!-- 选择姓名 -->
        <div class="relative dropdown-container">
          <button @click.stop="toggleNameDropdown(); fetchEmployeeList()"
            class="flex items-center gap-2 px-3 h-[34px] rounded-lg text-[13px] font-medium transition-all duration-300 border relative overflow-hidden group"
            :class="showNameDropdown || selectedNames.length > 0
              ? 'bg-blue-50 hover:bg-blue-50 text-blue-700 border-blue-300 shadow-sm'
              : 'bg-gray-200/50 hover:bg-gray-200 text-gray-700 border-transparent hover:border-blue-500/30 hover:shadow-sm'">
            <IconUsers class="w-4 h-4 transition-colors duration-300"
              :class="showNameDropdown || selectedNames.length > 0 ? 'text-blue-600' : 'text-gray-500'">
            </IconUsers>
            <span>姓名</span>
            <IconChevronRight class="w-3 h-3 transition-all duration-300"
              :class="showNameDropdown ? 'rotate-90 text-blue-600' : 'text-gray-400'"></IconChevronRight>
          </button>
          <transition name="dropdown">
            <div v-if="showNameDropdown" @click.stop
              class="absolute top-full left-0 mt-2 w-64 bg-white rounded-xl border border-gray-200 shadow-lg z-[100] max-h-80 overflow-y-auto custom-scrollbar">
              <div class="p-2">
                <div class="flex items-center justify-between p-2 border-b border-gray-100">
                  <span class="text-xs font-semibold text-gray-500">选择姓名</span>
                  <button @click.stop="selectedNames = []"
                    class="text-xs text-blue-500 hover:text-blue-600 font-medium transition-colors duration-200 px-2 py-1 rounded-md hover:bg-blue-50">清空</button>
                </div>
                <div class="p-2 space-y-1">
                  <div v-if="loadingEmployees" class="p-4 text-center text-xs text-gray-400">
                    正在加载员工列表...
                  </div>
                  <div v-else-if="allNames.length === 0" class="p-4 text-center text-xs text-gray-400">
                    暂无员工数据
                  </div>
                  <label v-for="name in allNames" :key="name"
                    class="flex items-center gap-2 p-2 rounded-lg hover:bg-blue-50/50 cursor-pointer transition-all duration-200 group/item">
                    <input type="checkbox" :value="name" v-model="selectedNames" @click.stop
                      class="w-4 h-4 rounded border-gray-300 text-blue-500 focus:ring-2 focus:ring-blue-500/30 focus:ring-offset-0 transition-all duration-200 cursor-pointer" />
                    <span class="text-sm text-gray-700 group-hover/item:text-blue-700 transition-colors duration-200">{{
                      name }}</span>
                  </label>
                </div>
              </div>
            </div>
          </transition>
        </div>

        <!-- 部门输入框（模糊查询） -->
        <div class="relative">
          <div
            class="flex items-center gap-2 px-3 h-[34px] rounded-lg text-[13px] font-medium transition-all duration-300 border bg-gray-200/50 hover:bg-gray-200 text-gray-700 border-transparent hover:border-blue-500/30 hover:shadow-sm">
            <IconFilter class="w-4 h-4 text-gray-500"></IconFilter>
            <input v-model="departmentInput" type="text" placeholder="部门（模糊查询）"
              class="flex-1 outline-none bg-transparent text-[13px] text-gray-700 placeholder-gray-400 min-w-[120px]"
              @keyup.enter="handleQuery" />
          </div>
        </div>

        <!-- 选择月份范围 -->
        <div class="relative dropdown-container">
          <button @click.stop="toggleMonthDropdown(); fetchMonthList()"
            class="flex items-center gap-2 px-3 h-[34px] rounded-lg text-[13px] font-medium transition-all duration-300 border relative overflow-hidden group"
            :class="showMonthDropdown
              ? 'bg-blue-50 hover:bg-blue-50 text-blue-700 border-blue-300 shadow-sm'
              : 'bg-gray-200/50 hover:bg-gray-200 text-gray-700 border-transparent hover:border-blue-500/30 hover:shadow-sm'">
            <IconCalendar class="w-4 h-4 transition-colors duration-300"
              :class="showMonthDropdown ? 'text-blue-600' : 'text-gray-500'"></IconCalendar>
            <span>月份范围</span>
            <span
              class="text-xs px-2 py-0.5 rounded-md bg-gray-100/80 text-gray-600 font-medium transition-colors duration-300"
              :class="showMonthDropdown ? 'bg-blue-100 text-blue-700' : ''">{{ startMonth }} - {{ endMonth
              }}</span>
            <IconChevronRight class="w-3 h-3 transition-all duration-300"
              :class="showMonthDropdown ? 'rotate-90 text-blue-600' : 'text-gray-400'"></IconChevronRight>
          </button>
          <transition name="dropdown">
            <div v-if="showMonthDropdown" @click.stop
              class="absolute top-full left-0 mt-2 w-64 bg-white rounded-xl border border-gray-200 shadow-lg z-[100]">
              <div class="p-4">
                <div class="space-y-4">
                  <div>
                    <label class="block text-xs font-semibold text-gray-500 mb-2">起始月份</label>
                    <select v-model="startMonth" @change.stop
                      class="w-full px-3 py-2 rounded-lg text-sm border border-gray-200 bg-gray-200/50 hover:bg-gray-200 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 focus:bg-white outline-none transition-all duration-200 cursor-pointer">
                      <option v-for="month in monthList" :key="month" :value="month">{{ month }}</option>
                    </select>
                  </div>
                  <div>
                    <label class="block text-xs font-semibold text-gray-500 mb-2">结束月份</label>
                    <select v-model="endMonth" @change.stop
                      class="w-full px-3 py-2 rounded-lg text-sm border border-gray-200 bg-gray-200/50 hover:bg-gray-200 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 focus:bg-white outline-none transition-all duration-200 cursor-pointer">
                      <option v-for="month in monthList" :key="month" :value="month">{{ month }}</option>
                    </select>
                  </div>
                  <div class="pt-2 border-t border-gray-100">
                    <div class="flex items-center justify-between">
                      <span class="text-xs text-gray-500">已选择月份数</span>
                      <span class="text-xs font-semibold"
                        :class="isMonthRangeValid ? 'text-green-600' : 'text-orange-600'">
                        {{ selectedMonthCount }} 个月
                      </span>
                    </div>
                    <div class="mt-2 text-xs" :class="isMonthRangeValid ? 'text-green-600' : 'text-orange-600'">
                      <span v-if="isMonthRangeValid" class="flex items-center gap-1">
                        <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fill-rule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clip-rule="evenodd" />
                        </svg>
                        满足要求（至少2个月）
                      </span>
                      <span v-else class="flex items-center gap-1">
                        <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fill-rule="evenodd"
                            d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                            clip-rule="evenodd" />
                        </svg>
                        至少需要选择2个月
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </transition>
        </div>



        <div class="h-[34px] w-px bg-gray-200 transition-opacity duration-300"></div>

        <!-- 查询按钮 -->
        <button @click="handleQuery" :disabled="loading || !isMonthRangeValid"
          class="flex items-center px-5 h-[34px] rounded-lg text-[13px] font-medium transition-all duration-300 border relative overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          :class="loading || !isMonthRangeValid
            ? 'bg-gray-100 text-gray-400 border-gray-200'
            : 'bg-blue-500 hover:bg-blue-600 text-white border-blue-500 hover:shadow-md'">
          <svg v-if="loading" class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none"
            viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
            </path>
          </svg>
          <span v-else>查询</span>
        </button>

        <!-- 工时显示模式切换 -->
        <div class="flex items-center h-[34px]">
          <button @click="showTotalHours = !showTotalHours"
            class="relative inline-flex items-center justify-between h-[34px] w-[88px] px-1 rounded-full transition-colors duration-300 focus:outline-none "
            :class="showTotalHours ? 'bg-violet-500' : 'bg-blue-500'">
            <span class="absolute left-3 text-[12px] font-medium transition-colors duration-300 z-10"
              :class="showTotalHours ? 'text-white' : 'text-gray-700/0'">
              总工时
            </span>
            <span
              class="absolute inline-block h-[26px] w-[26px] bg-white rounded-full shadow-md transform transition-transform duration-300 z-20"
              :class="showTotalHours ? 'translate-x-[54px]' : 'translate-x-[0px]'" </span>
              <span class="absolute right-1.5 text-[12px] font-medium transition-colors duration-300 z-10"
                :class="showTotalHours ? 'text-white/0' : 'text-white'">
                平均工时
              </span>
          </button>
        </div>
      </div>
      <div class="flex items-center gap-3 px-3 h-[34px]">
        <div
          class="flex items-center gap-1.5 text-[10px] font-medium text-gray-600 transition-all duration-300 hover:scale-105">
          <span class="w-2 h-2 rounded-full bg-green-400 shadow-[0_0_6px_rgba(74,222,128,0.4)] "></span>
          前三名
        </div>
        <div
          class="flex items-center gap-1.5 text-[10px] font-medium text-gray-600 transition-all duration-300 hover:scale-105">
          <span class="w-2 h-2 rounded-full bg-yellow-400 shadow-[0_0_6px_rgba(250,204,21,0.4)] "></span>
          后三名
        </div>
        <div
          class="flex items-center gap-1.5 text-[10px] font-medium text-gray-600 transition-all duration-300 hover:scale-105">
          <span class="w-2 h-2 rounded-full bg-red-400 shadow-[0_0_6px_rgba(248,113,113,0.4)] "></span>
          &lt;9h
        </div>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="flex flex-col items-center justify-center py-20">
      <svg class="animate-spin h-12 w-12 text-blue-500 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none"
        viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
        </path>
      </svg>
      <p class="text-gray-500 text-sm">正在查询数据...</p>
    </div>

    <!-- 数据表格（仅在查询后且有数据时显示） -->
    <div v-if="hasSearched && !loading && data.length > 0"
      class="rounded-xl overflow-hidden bg-white/80 border border-gray-200 shadow-sm">
      <div class="overflow-x-auto custom-scrollbar">
        <table class="min-w-full border-collapse">
          <thead>
            <tr>
              <th
                class="px-4 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider bg-gray-50/80 backdrop-blur-sm border-b border-gray-200 w-28 text-left sticky left-0 shadow-[4px_0_12px_rgba(0,0,0,0.02)] z-20">
                姓名</th>
              <th
                class="px-4 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider bg-gray-50/50 border-b border-gray-200 w-32 text-left">
                所属团队</th>
              <th v-for="m in monthKeys" :key="m"
                class="px-4 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider bg-gray-50/50 border-b border-gray-200 text-center min-w-[90px]">
                <div class="flex flex-col">
                  <span class="text-gray-800">{{ m }}</span>
                  <span class="text-[9px] font-normal text-gray-400 mt-0.5">{{ showTotalHours ? '总工时' : '平均工时' }}</span>
                </div>
              </th>
              <th
                class="px-4 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider bg-gray-50/50 border-b border-gray-200 text-center">
                补卡</th>
              <th
                class="px-4 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider bg-gray-50/50 border-b border-gray-200 text-center">
                出差</th>
              <th
                class="px-4 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider bg-gray-50/50 border-b border-gray-200 text-center">
                调休</th>
              <th
                class="px-4 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider bg-gray-50/50 border-b border-gray-200 text-center">
                请假</th>
              <th
                class="px-4 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider bg-gray-50/50 border-b border-gray-200 text-center">
                迟到</th>
            </tr>
          </thead>
          <tbody class="relative">
            <tr v-for="row in data" :key="row.id" class="group hover:bg-gray-50/50 transition-colors duration-150">
              <td
                class="px-4 py-3 text-[13px] text-gray-900 border-b border-r border-gray-100 whitespace-nowrap font-medium sticky left-0 bg-white group-hover:bg-gray-50 border-r border-gray-200 z-10">
                {{ row.name }}</td>
              <td class="px-4 py-3 text-[13px] text-gray-600 border-b border-gray-100 whitespace-nowrap">
                <span class="px-2 py-0.5 rounded bg-gray-100 text-[11px] border border-gray-200">{{ row.dept }}</span>
              </td>
              <td v-for="m in monthKeys" :key="m"
                class="px-4 py-3 text-[13px] text-gray-700 border-b border-gray-100 whitespace-nowrap text-center">
                <div v-if="row[currentHoursField][m] !== undefined && row[currentHoursField][m] !== null"
                  class="py-1 rounded text-[12px]" :class="getCellColor(row[currentHoursField][m], columnValues[m])">{{
                    row[currentHoursField][m].toFixed(2) }}</div>
                <div v-else class="py-1 rounded text-[12px] text-gray-400">-</div>
              </td>
              <td class="px-4 py-3 text-[13px] text-gray-600 border-b border-gray-100 whitespace-nowrap text-center">{{
                row.stats.missingCard }}</td>
              <td class="px-4 py-3 text-[13px] text-gray-600 border-b border-gray-100 whitespace-nowrap text-center">{{
                row.stats.businessTrip || '-' }}</td>
              <td class="px-4 py-3 text-[13px] text-gray-600 border-b border-gray-100 whitespace-nowrap text-center">{{
                row.stats.compLeave || '-' }}</td>
              <td class="px-4 py-3 text-[13px] text-gray-600 border-b border-gray-100 whitespace-nowrap text-center">{{
                row.stats.leave || '-' }}</td>
              <td class="px-4 py-3 text-[13px] text-gray-600 border-b border-gray-100 whitespace-nowrap text-center">{{
                row.stats.late || '-' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- 空状态提示 -->
    <div v-if="!loading && (!hasSearched || data.length === 0)"
      class="flex flex-col items-center justify-center py-20 bg-white/80 rounded-xl border border-gray-200 shadow-sm">
      <svg class="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      <p class="text-gray-500 text-sm">
        {{ !hasSearched ? '请先查询数据' : '暂无数据，请调整查询条件后重试' }}
      </p>
    </div>

    <!-- 统计卡片（仅在查询后显示） -->
    <div v-if="hasSearched && !loading && data.length > 0"
      class="summary-cards-grid gap-5 pb-12">

      <!-- <SummaryCard :title="showTotalHours ? '平均总工时' : '平均工时'" type="single" color="green" :icon="IconChart"
        :data="{ value: footerStats.avgAll, unit: '小时', subtitle: '' }" /> -->

      <SummaryCard title="总工时投入" type="double-list" :limit="6" color="green" :icon="IconChart"
        :data="{ top: footerStats.topTotalHours, bottom: footerStats.bottomTotalHours, avg: footerStats.avgTotalHours, monthCount: monthKeys.length }" />

      <SummaryCard title="日均工时投入" type="double-list" color="blue" :limit="6" :icon="IconTrendUp"
        :data="{ top: footerStats.topDailyHours, bottom: footerStats.bottomDailyHours, avg: footerStats.avgDailyHours, monthCount: monthKeys.length }" />

      <SummaryCard title="补卡次数" type="list" color="orange" :limit="6" :icon="IconFileText"
        :data="footerStats.topMissing" />

      <SummaryCard title="迟到次数" type="list" color="red" :limit="6" :icon="IconClock" :data="footerStats.topLate" />

      <SummaryCard title="请假天数" type="list" color="purple" :limit="6" :icon="IconCalendar"
        :data="footerStats.topLeave" />

    </div>
  </div>
</template>

<style scoped>
.summary-cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
}
</style>
