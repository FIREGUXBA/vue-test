<script setup>
import { ref, computed, inject, onMounted, onUnmounted, watch, nextTick } from 'vue'
import IconClock from '../components/icons/IconClock.vue'
import IconBriefcase from '../components/icons/IconBriefcase.vue'
import IconCalendar from '../components/icons/IconCalendar.vue'
import IconCalendarDays from '../components/icons/IconCalendarDays.vue'
import IconTrendUp from '../components/icons/IconTrendUp.vue'
import IconChevronRight from '../components/icons/IconChevronRight.vue'
import IconFileText from '../components/icons/IconFileText.vue'
import { queryPersonalData } from '../utils/api/modules/personal'
import { getUserInfo, getUserInfoField } from '../utils/user'

// 注入全局数据和方法

const showToast = inject('showToast', () => { })

// 当前用户数据（从API获取）
const personalData = ref({})
const loading = ref(false)

// 当前月份（初始化为空，等待数据加载后设置）
const currentMonth = ref('')

// 获取员工ID（从用户信息中获取）
const getEmployeeId = () => {
  // 优先从用户信息中获取 jobNo（员工工号）
  const jobNo = getUserInfoField('jobNo')
  if (jobNo) {
    console.log(jobNo)
    return jobNo
  }
  // 如果都没有，返回null
  console.warn('未找到员工ID，请检查URL参数或用户信息')
  return null
}

// 将API返回的数组数据转换为页面需要的格式
const transformApiData = (apiDataArray) => {
  const result = {
    monthlyHours: {},
    stats: {},
    employee: null
  }

  if (!Array.isArray(apiDataArray)) {
    return result
  }

  // 遍历API返回的数据，按月份组织
  apiDataArray.forEach(item => {
    const month = item.period // 格式: "2025-08"

    // 存储日均工时
    result.monthlyHours[month] = item.avg_work_hours || 0

    // 存储该月的统计数据
    result.stats[month] = {
      missingCard: item.card_fix_count || 0,
      businessTrip: item.business_trip_days || 0,
      compLeave: 0, // API中没有调休字段，设为0
      leave: item.leave_days_total || 0,
      late: item.late_count || 0,
      totalHours: item.total_work_hours || 0,
      workDays: item.work_days || 0
    }

    // 保存员工信息（取第一条）
    if (!result.employee && item.employee) {
      result.employee = item.employee
    }
  })

  return result
}

// 已加载的年份集合（用于避免重复请求）
const loadedYears = ref(new Set())

// 检查某年份的数据是否已加载
const hasYearData = (year) => {
  return loadedYears.value.has(year)
}

// 获取个人数据（按年份获取）
const fetchPersonalData = async (year = null) => {
  const employeeId = getEmployeeId()
  if (!employeeId) {
    showToast('未找到员工ID，请先登录', 'error')
    return
  }

  // 如果没有指定年份，使用当前年份
  const targetYear = year || currentYear.value

  // 如果该年份的数据已加载，则跳过
  if (hasYearData(targetYear)) {
    return
  }

  // 获取该年份的所有月份
  // 如果 allMonthKeys 中已有该年份的月份，使用这些月份；否则生成该年份的所有月份（1-12月）
  let yearMonths = allMonthKeys.value.filter(month => month.startsWith(targetYear + '-'))
  
  // 如果 allMonthKeys 中没有该年份的月份（首次加载），生成该年份的所有月份
  if (yearMonths.length === 0) {
    yearMonths = []
    for (let month = 1; month <= 12; month++) {
      const monthStr = month.toString().padStart(2, '0')
      yearMonths.push(`${targetYear}-${monthStr}`)
    }
  }

  // 该年份的第一个月和最后一个月
  const startMonth = yearMonths[0]
  const endMonth = yearMonths[yearMonths.length - 1]

  loading.value = true
  try {
    const result = await queryPersonalData({
      start_month: startMonth,
      end_month: endMonth,
      employee_id: employeeId
    })

    // 转换数据格式（合并到现有数据中，而不是替换）
    const newData = transformApiData(result)

    // 合并数据：保留其他年份的数据，更新当前年份的数据
    personalData.value = {
      monthlyHours: {
        ...personalData.value.monthlyHours,
        ...newData.monthlyHours
      },
      stats: {
        ...personalData.value.stats,
        ...newData.stats
      },
      employee: newData.employee || personalData.value.employee
    }

    // 标记该年份已加载
    loadedYears.value.add(targetYear)
  } catch (error) {
    console.error('获取个人数据失败:', error)
    showToast('获取个人数据失败', 'error')
    // 如果还没有任何数据，初始化空数据
    if (!personalData.value.monthlyHours || Object.keys(personalData.value.monthlyHours).length === 0) {
      personalData.value = {
        monthlyHours: {},
        stats: {},
        employee: null
      }
    }
  } finally {
    loading.value = false
    console.log(personalData.value)
  }
}

// 当前用户数据（兼容原有代码结构）
const currentUser = computed(() => {
  const monthStats = personalData.value.stats?.[currentMonth.value] || {}

  return {
    monthlyHours: personalData.value.monthlyHours || {},
    stats: {
      missingCard: monthStats.missingCard || 0,
      businessTrip: monthStats.businessTrip || 0,
      compLeave: monthStats.compLeave || 0,
      leave: monthStats.leave || 0,
      late: monthStats.late || 0
    },
    employee: personalData.value.employee || {}
  }
})

const allMonthKeys = computed(() => {
  if (!personalData.value.stats || Object.keys(personalData.value.stats).length === 0) {
    return []
  }
  // 从 stats 的键中获取所有月份，并按时间排序
  return Object.keys(personalData.value.stats).sort((a, b) => {
    // 格式: "2025-08"，按字符串比较即可（因为格式固定）
    return a.localeCompare(b)
  })
})
// 容器宽度和月份显示数量
const trendContainerRef = ref(null)
const containerWidth = ref(0)
const MONTH_ITEM_WIDTH = 72 // 每个月份项的宽度（px）
const MONTH_ITEM_GAP = 4 // 月份项之间的间距（px）
const BUTTON_WIDTH = 40 // 左右按钮的总宽度（包括间距）

// 计算月份项的样式
const monthItemStyle = computed(() => {
  const count = monthlyTrend.value.length
  if (count === 0) return {}
  const totalGap = (count - 1) * MONTH_ITEM_GAP
  const itemWidth = `calc((100% - ${totalGap}px) / ${count})`
  return {
    width: itemWidth,
    minWidth: `${MONTH_ITEM_WIDTH}px`
  }
})

// 当前年份
const currentYear = computed(() => {
  if (!currentMonth.value) {
    // 如果没有当前月份，返回当前系统年份
    return new Date().getFullYear()
  }
  return parseInt(currentMonth.value.split('-')[0])
})

// 获取当前年份的所有月份
const currentYearMonths = computed(() => {
  return allMonthKeys.value.filter(month => month.startsWith(currentYear.value + '-'))
})

// 切换年份
const changeYear = async (direction) => {
  const targetYear = direction === 'prev' ? currentYear.value - 1 : currentYear.value + 1
  
  // 如果目标年份的数据未加载，先获取数据
  if (!hasYearData(targetYear)) {
    await fetchPersonalData(targetYear)
  }
  
  // 获取该年份的所有月份
  const targetYearMonths = allMonthKeys.value.filter(month => month.startsWith(targetYear + '-'))
  
  if (targetYearMonths.length > 0) {
    // 保持当前月份号，如果目标年份没有该月份，则选择最接近的月份
    const currentMonthNum = currentMonth.value ? parseInt(currentMonth.value.split('-')[1]) : 1
    let targetMonth = targetYearMonths.find(m => parseInt(m.split('-')[1]) === currentMonthNum)

    // 如果目标年份没有对应的月份，选择最接近的月份
    if (!targetMonth) {
      // 优先选择相同或更小的月份号
      targetMonth = targetYearMonths.filter(m => parseInt(m.split('-')[1]) <= currentMonthNum).pop()
      // 如果没有更小的，选择最小的月份
      if (!targetMonth) {
        targetMonth = targetYearMonths[0]
      }
    }

    currentMonth.value = targetMonth
  }
}

// 检查是否可以切换到上一年/下一年
const canGoPrev = computed(() => {
  const prevYear = currentYear.value - 1
  return allMonthKeys.value.some(month => month.startsWith(prevYear + '-'))
})

const canGoNext = computed(() => {
  const nextYear = currentYear.value + 1
  return allMonthKeys.value.some(month => month.startsWith(nextYear + '-'))
})

// 切换月份（只切换到有数据的月份）
const changeMonth = (direction) => {
  const currentIndex = allMonthKeys.value.indexOf(currentMonth.value)
  if (currentIndex === -1) return

  if (direction === 'prev') {
    // 切换到上一个月（有数据的）
    if (currentIndex > 0) {
      currentMonth.value = allMonthKeys.value[currentIndex - 1]
    }
  } else if (direction === 'next') {
    // 切换到下一个月（有数据的）
    if (currentIndex < allMonthKeys.value.length - 1) {
      currentMonth.value = allMonthKeys.value[currentIndex + 1]
    }
  }
}

// 检查是否可以切换到上一个月/下一个月
const canGoPrevMonth = computed(() => {
  const currentIndex = allMonthKeys.value.indexOf(currentMonth.value)
  return currentIndex > 0
})

const canGoNextMonth = computed(() => {
  const currentIndex = allMonthKeys.value.indexOf(currentMonth.value)
  return currentIndex < allMonthKeys.value.length - 1
})

// 配置常量
const STANDARD_DAILY_HOURS = 9

// 动画控制状态
const isMounted = ref(false)

// 计算核心数据
const monthData = computed(() => {
  // 从API数据中获取当前月份的数据
  const monthStats = personalData.value.stats?.[currentMonth.value] || {}
  const avgDaily = currentUser.value.monthlyHours?.[currentMonth.value] || 0
  // API返回的total_work_hours已经是总工时，不需要再乘以天数
  const totalHours = monthStats.totalHours 
  const standardTotalHours = STANDARD_DAILY_HOURS * monthStats.workDays

  // 日均工时进度
  const dailyPercent = Math.min(100, (avgDaily / 12) * 100)
  const animatedDailyPercent = isMounted.value ? dailyPercent : 0
  const standardDailyPercent = (STANDARD_DAILY_HOURS / 12) * 100

  // 月总工时进度（最大值设为标准工时的1.5倍）
  const maxTotalHours = standardTotalHours * 1.5
  const totalPercent = Math.min(100, (totalHours / maxTotalHours) * 100)
  const animatedTotalPercent = isMounted.value ? totalPercent : 0
  const standardTotalPercent = (standardTotalHours / maxTotalHours) * 100

  // 计算加班时长（总工时 - 标准工时，如果为负则显示0）
  const overtimeHours = Math.max(0, totalHours - standardTotalHours)

  return {
    avgDaily: avgDaily.toFixed(2),
    totalHours: totalHours,
    overtimeHours: overtimeHours.toFixed(1), // 加班时长，保留一位小数
    standardDays: monthStats.workDays,
    standardTotalHours: standardTotalHours,
    maxTotalHours: maxTotalHours,
    stats: currentUser.value.stats || {},
    animatedDailyPercent,
    standardDailyPercent,
    animatedTotalPercent,
    standardTotalPercent
  }
})

// 计算可以显示的月份数量
const visibleMonthCount = computed(() => {
  if (containerWidth.value === 0) return 12 // 默认显示12个月

  // 计算可用宽度（容器宽度 - 左右按钮宽度 - 内边距）
  const availableWidth = containerWidth.value - BUTTON_WIDTH - 16 // 16px 是容器的 padding
  // 计算可以显示的月份数量
  const count = Math.floor(availableWidth / (MONTH_ITEM_WIDTH + MONTH_ITEM_GAP))
  // 至少显示1个月，最多显示12个月
  return Math.max(1, Math.min(12, count))
})

// 生成当前年份的所有12个月
const generateYearMonths = (year) => {
  const months = []
  for (let month = 1; month <= 12; month++) {
    const monthStr = month.toString().padStart(2, '0')
    months.push(`${year}-${monthStr}`)
  }
  return months
}

// 月份趋势数据（根据容器宽度动态显示）
const monthlyTrend = computed(() => {
  // 生成当前年份的所有12个月
  const allYearMonths = generateYearMonths(currentYear.value)
  // 获取有数据的月份集合
  const yearMonthsWithData = new Set(currentYearMonths.value)
  const count = visibleMonthCount.value

  // 如果显示的月份数量等于或大于12，直接返回所有月份
  if (count >= 12) {
    return allYearMonths.map(month => {
      const hasData = yearMonthsWithData.has(month)
      const hours = hasData ? (currentUser.value.monthlyHours?.[month] || 0) : 0
      const monthNum = parseInt(month.split('-')[1])
      const labels = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']

      return {
        month,
        label: labels[monthNum - 1],
        hours,
        hasData,
        isCurrent: month === currentMonth.value
      }
    })
  }

  // 需要均匀分布：找到当前月份在数组中的位置
  const currentIndex = allYearMonths.findIndex(m => m === currentMonth.value)
  const currentPos = currentIndex >= 0 ? currentIndex : allYearMonths.length - 1

  // 计算起始索引，使当前月份尽量居中
  let startIndex = Math.max(0, Math.min(
    currentPos - Math.floor(count / 2),
    allYearMonths.length - count
  ))

  // 如果当前月份在最后几个，从末尾开始显示
  if (currentPos >= allYearMonths.length - Math.ceil(count / 2)) {
    startIndex = allYearMonths.length - count
  }

  // 获取要显示的月份
  const visibleMonths = allYearMonths.slice(startIndex, startIndex + count)

  return visibleMonths.map(month => {
    const hasData = yearMonthsWithData.has(month)
    const hours = hasData ? (currentUser.value.monthlyHours?.[month] || 0) : 0
    const monthNum = parseInt(month.split('-')[1])
    const labels = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']

    return {
      month,
      label: labels[monthNum - 1],
      hours,
      hasData,
      isCurrent: month === currentMonth.value
    }
  })
})

// 考勤异常统计
const abnormalStats = computed(() => [
  { label: '补卡', value: monthData.value.stats.missingCard, unit: '次', icon: 'IconFileText', color: 'orange', desc: '忘记打卡' },
  { label: '出差', value: monthData.value.stats.businessTrip, unit: '天', icon: 'IconBriefcase', color: 'blue', desc: '外出公干' },
  { label: '调休', value: monthData.value.stats.compLeave, unit: '天', icon: 'IconCalendar', color: 'purple', desc: '加班抵扣' },
  { label: '请假', value: monthData.value.stats.leave, unit: '天', icon: 'IconCalendarDays', color: 'cyan', desc: '事假/病假' },
  { label: '迟到', value: monthData.value.stats.late, unit: '次', icon: 'IconClock', color: 'red', desc: '异常考勤' }
])

const getColorClass = (color) => {
  const map = {
    orange: { bg: 'bg-orange-50', text: 'text-orange-600', iconBg: 'bg-orange-100/50', ring: 'ring-orange-500/20' },
    blue: { bg: 'bg-blue-50', text: 'text-blue-600', iconBg: 'bg-blue-100/50', ring: 'ring-blue-500/20' },
    purple: { bg: 'bg-purple-50', text: 'text-purple-600', iconBg: 'bg-purple-100/50', iconText: 'text-purple-600', ring: 'ring-purple-500/20' },
    cyan: { bg: 'bg-cyan-50', text: 'text-cyan-600', iconBg: 'bg-cyan-100/50', ring: 'ring-cyan-500/20' },
    red: { bg: 'bg-red-50', text: 'text-red-600', iconBg: 'bg-red-100/50', ring: 'ring-red-500/20' },
  }
  return map[color] || map.blue
}

// ResizeObserver 实例
let resizeObserver = null

// 监听 allMonthKeys 变化，初始化 currentMonth
watch(allMonthKeys, (newKeys) => {
  if (newKeys.length > 0 && !currentMonth.value) {
    // 如果 currentMonth 为空，设置为最后一个月份
    currentMonth.value = newKeys[newKeys.length - 1]
  }
}, { immediate: true })

// 监听年份变化，如果切换到新年份且数据未加载，则获取数据
watch(currentYear, async (newYear, oldYear) => {
  if (newYear !== oldYear && !hasYearData(newYear)) {
    await fetchPersonalData(newYear)
  }
})

// 监听 loading 状态，当数据加载完成后初始化容器宽度
watch(loading, (newLoading) => {
  if (!newLoading) {
    // 数据加载完成，等待 DOM 渲染后再初始化
    nextTick(() => {
      setTimeout(() => {
        if (trendContainerRef.value) {
          const width = trendContainerRef.value.offsetWidth
          if (width > 0) {
            containerWidth.value = width

            // 使用 ResizeObserver 监听宽度变化
            if (typeof ResizeObserver !== 'undefined') {
              if (resizeObserver) {
                resizeObserver.disconnect()
              }
              resizeObserver = new ResizeObserver(entries => {
                for (const entry of entries) {
                  const newWidth = entry.contentRect.width
                  if (newWidth > 0) {
                    containerWidth.value = newWidth
                  }
                }
              })
              resizeObserver.observe(trendContainerRef.value)
            } else {
              // 降级方案：使用 window resize 事件
              const handleResize = () => {
                if (trendContainerRef.value) {
                  const newWidth = trendContainerRef.value.offsetWidth
                  if (newWidth > 0) {
                    containerWidth.value = newWidth
                  }
                }
              }
              window.addEventListener('resize', handleResize)
              onUnmounted(() => {
                window.removeEventListener('resize', handleResize)
              })
            }
          }
        }
      }, 100)
    })
  }
}, { immediate: true })

onMounted(() => {
  // 获取当前年份的个人数据
  fetchPersonalData(currentYear.value)

  // 稍微延迟触发动画，确保 DOM 渲染完成
  setTimeout(() => {
    isMounted.value = true
  }, 100)
})

onUnmounted(() => {
  // 清理 ResizeObserver
  if (resizeObserver && trendContainerRef.value) {
    resizeObserver.unobserve(trendContainerRef.value)
    resizeObserver.disconnect()
  }
})
</script>

<template>
  <div class="max-w-5xl mx-auto pb-12">
    <!-- 加载状态 -->
    <div v-if="loading" class="flex items-center justify-center py-20">
      <div class="flex flex-col items-center gap-3">
        <div class="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <p class="text-sm text-gray-500">正在加载数据...</p>
      </div>
    </div>

    <!-- 主要内容 -->
    <div v-else>
      <div class="flex justify-between items-end mb-8 px-1 animate-enter" style="--stagger: 0">
        <div>
          <h2 class="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            工时看板
          </h2>
          <p class="text-[13px] text-gray-500 mt-1 font-medium">追踪您的月度工时与考勤状况</p>
        </div>

        <div class="flex items-center gap-2 z-20">
          <button @click="changeYear('prev')" :disabled="!canGoPrev"
            class="flex items-center justify-center w-9 h-9 rounded-xl bg-white/70 hover:bg-white/90 border border-gray-200/80 hover:border-blue-300/50 shadow-sm hover:shadow-md transition-all duration-300 outline-none focus:ring-4 focus:ring-blue-500/10 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white/70 disabled:hover:shadow-sm"
            :class="canGoPrev ? 'cursor-pointer' : 'cursor-not-allowed'">
            <IconChevronRight class="w-4 h-4 text-gray-600 rotate-180" />
          </button>

          <div
            class="flex items-center gap-2 px-4 py-2 bg-white/70 hover:bg-white/90 border border-gray-200/80 hover:border-blue-300/50 rounded-xl shadow-sm min-w-[100px] justify-center">
            <IconCalendar class="w-3.5 h-3.5 text-gray-400" />
            <span class="text-[13px] font-semibold text-gray-700">{{ currentYear }}年</span>
          </div>

          <button @click="changeYear('next')" :disabled="!canGoNext"
            class="flex items-center justify-center w-9 h-9 rounded-xl bg-white/70 hover:bg-white/90 border border-gray-200/80 hover:border-blue-300/50 shadow-sm hover:shadow-md transition-all duration-300 outline-none focus:ring-4 focus:ring-blue-500/10 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white/70 disabled:hover:shadow-sm"
            :class="canGoNext ? 'cursor-pointer' : 'cursor-not-allowed'">
            <IconChevronRight class="w-4 h-4 text-gray-600" />
          </button>
        </div>
      </div>

      <div class=" rounded-[20px] p-1.5 mb-5 animate-enter" style="--stagger: 0.5" ref="trendContainerRef">
        <div class="flex items-center gap-2">
          <button @click="changeMonth('prev')" :disabled="!canGoPrevMonth"
            class="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-lg bg-white/70 hover:bg-white/90 border border-gray-200/80 hover:border-blue-300/50 shadow-sm hover:shadow-md transition-all duration-300 outline-none focus:ring-2 focus:ring-blue-500/10 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white/70 disabled:hover:shadow-sm"
            :class="canGoPrevMonth ? 'cursor-pointer' : 'cursor-not-allowed'">
            <IconChevronRight class="w-4 h-4 text-gray-600 rotate-180" />
          </button>

          <div class="flex items-center gap-1 py-1 px-1 flex-1" :style="{ gap: `${MONTH_ITEM_GAP}px` }">
            <button v-for="item in monthlyTrend" :key="item.month" 
              @click="item.hasData && (currentMonth = item.month)"
              :disabled="!item.hasData"
              class="flex-shrink-0 flex flex-col items-center justify-center gap-1.5 py-3 rounded-xl transition-all duration-300 group relative overflow-hidden"
              :style="monthItemStyle"
              :class="[
                item.isCurrent && item.hasData
                  ? 'bg-transparent shadow-lg shadow-blue-200/50 text-blue-700 ring-2 ring-blue-400/50 border border-blue-300/30 scale-105'
                  : item.hasData
                    ? 'bg-transparent hover:bg-blue-50/60 hover:shadow-md hover:shadow-blue-200/30 hover:ring-1 hover:ring-blue-300/40 hover: text-gray-600 hover:text-blue-600 cursor-pointer'
                    : 'bg-transparent text-gray-400 opacity-50 cursor-not-allowed',
                !item.hasData && 'pointer-events-none'
              ]">
              <!-- <div v-if="item.isCurrent"
              class="absolute bottom-0 left-1/2 -translate-x-1/2 w-10 h-1.5 bg-blue-500 rounded-t-full shadow-sm"></div> -->
              <span class="text-xs font-bold transition-colors duration-300"
                :class="[
                  item.isCurrent && item.hasData ? 'text-blue-700' : '',
                  item.hasData && !item.isCurrent ? 'group-hover:text-blue-600' : '',
                  !item.hasData ? 'text-gray-400' : ''
                ]">{{ item.label }}</span>
              <div class="h-8 w-1.5 bg-gray-200 rounded-full flex items-end overflow-hidden shadow-inner">
                <div v-if="item.hasData" class="w-full rounded-full transition-all duration-500"
                  :class="item.isCurrent ? 'bg-gradient-to-t from-blue-600 to-blue-400 shadow-sm' : 'bg-gradient-to-t from-blue-400 to-blue-300 group-hover:from-blue-500 group-hover:to-blue-400'"
                  :style="{ height: Math.min(100, (item.hours / 12) * 100) + '%' }"></div>
              </div>
              <span class="text-[10px] font-mono transition-colors duration-300"
                :class="[
                  item.isCurrent && item.hasData ? 'text-blue-600 opacity-90' : '',
                  item.hasData && !item.isCurrent ? 'opacity-70 group-hover:text-blue-500 group-hover:opacity-90' : '',
                  !item.hasData ? 'text-gray-400 opacity-50' : ''
                ]">{{
                  item.hasData ? item.hours.toFixed(1) : '-' }}</span>
            </button>
          </div>

          <button @click="changeMonth('next')" :disabled="!canGoNextMonth"
            class="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-lg bg-white/70 hover:bg-white/90 border border-gray-200/80 hover:border-blue-300/50 shadow-sm hover:shadow-md transition-all duration-300 outline-none focus:ring-2 focus:ring-blue-500/10 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white/70 disabled:hover:shadow-sm"
            :class="canGoNextMonth ? 'cursor-pointer' : 'cursor-not-allowed'">
            <IconChevronRight class="w-4 h-4 text-gray-600" />
          </button>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-5 mb-10 animate-enter font-sans" style="--stagger: 1">

        <div
          class="group relative overflow-hidden rounded-[32px] bg-white border border-gray-100 shadow-[0_8px_30px_rgba(0,0,0,0.04)] p-8 flex flex-col justify-between transition-all duration-500 hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)]  hover:border-gray-200">
          <div
            class="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-blue-50/50 to-indigo-50/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none -ml-16 -mb-16">
          </div>

          <div class="flex justify-between items-start mb-8 z-10">
            <div class="flex items-center gap-3">
              <div
                class="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 shadow-sm shadow-blue-100">
                <IconClock class="w-5 h-5" />
              </div>
              <span class="text-[13px] font-bold text-gray-400 uppercase tracking-wider">月总工作时长</span>
            </div>

            <div class="px-3 py-1 bg-gray-50 rounded-full border border-gray-100 flex items-center gap-2">
              <div class="w-1.5 h-1.5 rounded-full bg-gray-300"></div>
              <span class="text-xs font-semibold text-gray-500">{{currentMonth.split('-')[1]}} 月标准 {{ monthData.standardTotalHours }} h</span>
            </div>
          </div>

          <div class="mb-8 z-10">
            <div class="flex flex-row justify-between items-baseline">
              <div class="flex flex-row items-baseline gap-2">
              <span class="text-5xl font-bold text-gray-900 tracking-tight font-sf-display">
                {{ monthData.totalHours }}
              </span>
              <span class="text-lg text-gray-400 font-medium">h</span>
              </div>
              <div class="flex flex-row items-baseline gap-2 relative">
                
                <span class="text-[13px] font-semibold text-violet-500 uppercase tracking-wide ">加班</span>
                
                
                <span class="text-5xl font-bold tracking-tight font-sf-display bg-gradient-to-br from-violet-500 to-violet-600 bg-clip-text text-transparent">
                  {{ monthData.overtimeHours }}
                </span>
                <span class="text-lg font-medium bg-gradient-to-br from-violet-500 to-violet-600 bg-clip-text text-transparent">h</span>
              </div>
            </div>
          </div>

          <div class="relative w-full z-10">
            <div
              class="absolute -top-7 transform -translate-x-1/2 flex flex-col items-center transition-all duration-500"
              :style="{ left: monthData.standardTotalPercent + '%' }">
              <span
                class="text-[10px] font-bold text-gray-400 bg-white border border-gray-100 px-1.5 py-0.5 rounded shadow-sm">{{
                  monthData.standardTotalHours }}h</span>
              <div class="w-px h-2 bg-gray-200 mt-0.5"></div>
            </div>

            <div class="h-4 w-full bg-gray-100 rounded-full overflow-hidden shadow-inner ring-1 ring-gray-900/5">
              <div
                class="h-full rounded-full transition-all duration-[1500ms] ease-[cubic-bezier(0.25,1,0.5,1)] relative"
                :class="monthData.animatedTotalPercent >= monthData.standardTotalPercent ? 'bg-gradient-to-r from-blue-400 to-blue-500' : 'bg-gradient-to-r from-blue-300 to-blue-400'"
                :style="{ width: monthData.animatedTotalPercent + '%' }">
                <div
                  class="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/25 to-transparent -translate-x-full animate-[shimmer_2s_infinite]">
                </div>
              </div>
            </div>

            <div class="flex justify-between mt-2 px-1">
              <span class="text-[10px] font-medium text-gray-300">0h</span>
              <span class="text-[10px] font-medium text-gray-300">{{ Math.round(monthData.maxTotalHours) }}h+</span>
            </div>
          </div>
        </div>

        <div
          class="group relative overflow-hidden rounded-[32px] bg-white border border-gray-100 shadow-[0_8px_30px_rgba(0,0,0,0.04)] p-8 flex flex-col justify-between transition-all duration-500 hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)] hover:border-gray-200">
          <div
            class="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-emerald-50/50 to-teal-50/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none -ml-16 -mb-16">
          </div>

          <div class="flex justify-between items-start mb-8 z-10">
            <div class="flex items-center gap-3">
              <div
                class="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 shadow-sm shadow-emerald-100">
                <IconTrendUp class="w-5 h-5" />
              </div>
              <span class="text-[13px] font-bold text-gray-400 uppercase tracking-wider">日均工作时长</span>
            </div>

            <div class="px-3 py-1 bg-gray-50 rounded-full border border-gray-100 flex items-center gap-2">
              <div class="w-1.5 h-1.5 rounded-full bg-gray-300"></div>
              <span class="text-xs font-semibold text-gray-500">{{currentMonth.split('-')[1]}} 月标准 {{ monthData.standardDays }} 天</span>
            </div>
          </div>

          <div class="mb-8 z-10">
            <div class="flex items-baseline gap-2">
              <span class="text-5xl font-bold text-gray-900 tracking-tight font-sf-display">
                {{ monthData.avgDaily }}
              </span>
              <span class="text-lg text-gray-400 font-medium">h / 天</span>
            </div>
          </div>

          <div class="relative w-full z-10">
            <div
              class="absolute -top-7 transform -translate-x-1/2 flex flex-col items-center transition-all duration-500"
              :style="{ left: monthData.standardDailyPercent + '%' }">
              <span
                class="text-[10px] font-bold text-gray-400 bg-white border border-gray-100 px-1.5 py-0.5 rounded shadow-sm">9h</span>
              <div class="w-px h-2 bg-gray-200 mt-0.5"></div>
            </div>

            <div class="h-4 w-full bg-gray-100 rounded-full overflow-hidden shadow-inner ring-1 ring-gray-900/5">
              <div
                class="h-full rounded-full transition-all duration-[1500ms] ease-[cubic-bezier(0.25,1,0.5,1)] relative"
                :class="monthData.avgDaily >= 9 ? 'bg-gradient-to-r from-emerald-400 to-emerald-500' : 'bg-gradient-to-r from-orange-300 to-orange-400'"
                :style="{ width: monthData.animatedDailyPercent + '%' }">
                <div
                  class="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/25 to-transparent -translate-x-full animate-[shimmer_2s_infinite]">
                </div>
              </div>
            </div>

            <div class="flex justify-between mt-2 px-1">
              <span class="text-[10px] font-medium text-gray-300">0h</span>
              <span class="text-[10px] font-medium text-gray-300">12h+</span>
            </div>
          </div>
        </div>
      </div>

      <div class="animate-enter" style="--stagger: 2">
        <div class="mb-5 flex items-center gap-3 px-1">
          <h3 class="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
            <div class="w-1.5 h-1.5 rounded-full bg-gray-300"></div>
            考勤异常统计
          </h3>
          <div class="h-px flex-1 bg-gradient-to-r from-gray-200/80 to-transparent"></div>
        </div>

        <div class="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div v-for="(item, index) in abnormalStats" :key="index"
            class="relative overflow-hidden bg-white/70 border rounded-[22px] p-4 transition-all duration-300 hover:bg-white hover:scale-[1.03] hover:shadow-[0_12px_24px_-8px_rgba(0,0,0,0.08)] flex flex-col justify-between min-h-[120px] group cursor-default"
            :class="[
              item.value > 0 ? getColorClass(item.color).text + ' ' + 'border-gray-100' : 'border-gray-100/50 text-gray-300',
              item.value > 0 ? 'hover:border-' + item.color + '-200' : ''
            ]">
            <div v-if="item.value > 0"
              class="absolute -right-4 -top-4 w-16 h-16 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
              :class="getColorClass(item.color).bg"></div>

            <div class="flex justify-between items-start relative z-10">
              <div class="w-9 h-9 rounded-[12px] flex items-center justify-center transition-all duration-300"
                :class="item.value > 0 ? getColorClass(item.color).iconBg : 'bg-gray-100/50'">
                <component :is="item.icon === 'IconClock' ? IconClock :
                  item.icon === 'IconCalendar' ? IconCalendar :
                    item.icon === 'IconBriefcase' ? IconBriefcase :
                      item.icon === 'IconFileText' ? IconFileText :
                        IconCalendarDays" class="w-4 h-4 transition-transform duration-300 group-hover:scale-110"
                  :class="item.value > 0 ? 'text-current' : 'text-gray-400'" />
              </div>
            </div>

            <div class="mt-3 relative z-10">
              <div class="flex items-baseline gap-1">
                <span class="text-3xl font-bold font-sf-display tracking-tight transition-all duration-300"
                  :class="item.value > 0 ? 'scale-100' : 'scale-95 origin-left'">
                  {{ item.value }}
                </span>
                <span class="text-[11px] font-medium opacity-60" >{{ item.unit }}</span>
              </div>
              <div class="text-[11px] font-semibold mt-1 transition-colors duration-300"
                :class="item.value > 0 ? 'text-gray-500' : 'text-gray-400'">{{ item.label }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <!-- 结束主要内容 -->
  </div>
</template>

<style scoped>
/* 字体设置 */
.font-sf-display {
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", Arial, sans-serif;
}

/* 缓动曲线 */
.ease-out-cubic {
  transition-timing-function: cubic-bezier(0.33, 1, 0.68, 1);
}

/* 进场动画 */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-enter {
  opacity: 0;
  /* 初始隐藏 */
  animation: fadeInUp 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
  animation-delay: calc(var(--stagger) * 120ms);
  /* 根据变量延迟 */
}

/* 进度条扫光动画 */
@keyframes shimmer {
  100% {
    transform: translateX(100%);
  }
}
</style>