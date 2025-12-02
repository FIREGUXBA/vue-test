<script setup>
import { ref, computed, inject, onMounted, onUnmounted } from 'vue'
import IconClock from '../components/icons/IconClock.vue'
import IconBriefcase from '../components/icons/IconBriefcase.vue'
import IconCalendar from '../components/icons/IconCalendar.vue'
import IconCalendarDays from '../components/icons/IconCalendarDays.vue'
import IconTrendUp from '../components/icons/IconTrendUp.vue'
import IconChevronDown from '../components/icons/IconChevronDown.vue'
import IconChevronRight from '../components/icons/IconChevronRight.vue'
import IconFileText from '../components/icons/IconFileText.vue'
import { allMonthKeys } from '../utils/data'

// 注入全局数据
const data = inject('data')
const currentUser = computed(() => data.value[0] || {})
const currentMonth = ref(allMonthKeys[allMonthKeys.length - 1])

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
  return parseInt(currentMonth.value.split('-')[0])
})

// 获取当前年份的所有月份
const currentYearMonths = computed(() => {
  return allMonthKeys.filter(month => month.startsWith(currentYear.value + '-'))
})

// 切换年份
const changeYear = (direction) => {
  const targetYear = direction === 'prev' ? currentYear.value - 1 : currentYear.value + 1
  const targetYearMonths = allMonthKeys.filter(month => month.startsWith(targetYear + '-'))
  
  if (targetYearMonths.length > 0) {
    // 保持当前月份号，如果目标年份没有该月份，则选择最接近的月份
    const currentMonthNum = parseInt(currentMonth.value.split('-')[1])
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
  return allMonthKeys.some(month => month.startsWith(prevYear + '-'))
})

const canGoNext = computed(() => {
  const nextYear = currentYear.value + 1
  return allMonthKeys.some(month => month.startsWith(nextYear + '-'))
})

// 切换月份
const changeMonth = (direction) => {
  const currentIndex = allMonthKeys.indexOf(currentMonth.value)
  if (currentIndex === -1) return
  
  if (direction === 'prev') {
    // 切换到上一个月
    if (currentIndex > 0) {
      currentMonth.value = allMonthKeys[currentIndex - 1]
    }
  } else if (direction === 'next') {
    // 切换到下一个月
    if (currentIndex < allMonthKeys.length - 1) {
      currentMonth.value = allMonthKeys[currentIndex + 1]
    }
  }
}

// 检查是否可以切换到上一个月/下一个月
const canGoPrevMonth = computed(() => {
  const currentIndex = allMonthKeys.indexOf(currentMonth.value)
  return currentIndex > 0
})

const canGoNextMonth = computed(() => {
  const currentIndex = allMonthKeys.indexOf(currentMonth.value)
  return currentIndex < allMonthKeys.length - 1
})

// 配置常量
const STANDARD_WORK_DAYS = 22
const STANDARD_DAILY_HOURS = 9
const CIRCUMFERENCE = 264 // 圆环周长 (2 * π * 42)

// 动画控制状态
const isMounted = ref(false)

// 计算核心数据
const monthData = computed(() => {
  const avgDaily = currentUser.value.monthlyHours?.[currentMonth.value] || 0
  const totalHours = avgDaily * STANDARD_WORK_DAYS
  const standardTotalHours = STANDARD_WORK_DAYS * STANDARD_DAILY_HOURS
  
  // 达成率百分比
  const percent = Math.min(100, (totalHours / standardTotalHours) * 100)
  
  // 动画逻辑：未挂载时 offset 为周长（即空），挂载后计算实际 offset
  const targetOffset = CIRCUMFERENCE - (percent / 100) * CIRCUMFERENCE
  const strokeDashoffset = isMounted.value ? targetOffset : CIRCUMFERENCE

  // 日均工时进度
  const dailyPercent = Math.min(100, (avgDaily / 12) * 100)
  const animatedDailyPercent = isMounted.value ? dailyPercent : 0
  const standardDailyPercent = (STANDARD_DAILY_HOURS / 12) * 100

  // 月总工时进度（最大值设为标准工时的1.5倍）
  const maxTotalHours = standardTotalHours * 1.5
  const totalPercent = Math.min(100, (totalHours / maxTotalHours) * 100)
  const animatedTotalPercent = isMounted.value ? totalPercent : 0
  const standardTotalPercent = (standardTotalHours / maxTotalHours) * 100

  return {
    avgDaily: avgDaily.toFixed(1),
    totalHours: totalHours.toFixed(1),
    standardDays: STANDARD_WORK_DAYS,
    standardTotalHours: standardTotalHours,
    maxTotalHours: maxTotalHours,
    stats: currentUser.value.stats || {},
    percent,
    strokeDashoffset,
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

// 月份趋势数据（根据容器宽度动态显示）
const monthlyTrend = computed(() => {
  // 只获取当前年份的月份
  const yearMonths = currentYearMonths.value
  const count = visibleMonthCount.value
  
  // 如果显示的月份数量等于或大于当前年份的月份数量，直接返回所有月份
  if (count >= yearMonths.length) {
    return yearMonths.map(month => {
      const hours = currentUser.value.monthlyHours?.[month] || 0
      const monthNum = parseInt(month.split('-')[1])
      const labels = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']
      
      return {
        month,
        label: labels[monthNum - 1],
        hours,
        isCurrent: month === currentMonth.value
      }
    })
  }
  
  // 需要均匀分布：找到当前月份在数组中的位置
  const currentIndex = yearMonths.findIndex(m => m === currentMonth.value)
  const currentPos = currentIndex >= 0 ? currentIndex : yearMonths.length - 1
  
  // 计算起始索引，使当前月份尽量居中
  let startIndex = Math.max(0, Math.min(
    currentPos - Math.floor(count / 2),
    yearMonths.length - count
  ))
  
  // 如果当前月份在最后几个，从末尾开始显示
  if (currentPos >= yearMonths.length - Math.ceil(count / 2)) {
    startIndex = yearMonths.length - count
  }
  
  // 获取要显示的月份
  const visibleMonths = yearMonths.slice(startIndex, startIndex + count)
  
  return visibleMonths.map(month => {
    const hours = currentUser.value.monthlyHours?.[month] || 0
    const monthNum = parseInt(month.split('-')[1])
    const labels = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']
    
    return {
      month,
      label: labels[monthNum - 1],
      hours,
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
    blue:   { bg: 'bg-blue-50',   text: 'text-blue-600',   iconBg: 'bg-blue-100/50',   ring: 'ring-blue-500/20' },
    purple: { bg: 'bg-purple-50', text: 'text-purple-600', iconBg: 'bg-purple-100/50', iconText: 'text-purple-600', ring: 'ring-purple-500/20' },
    cyan:   { bg: 'bg-cyan-50',   text: 'text-cyan-600',   iconBg: 'bg-cyan-100/50',   ring: 'ring-cyan-500/20' },
    red:    { bg: 'bg-red-50',    text: 'text-red-600',    iconBg: 'bg-red-100/50',    ring: 'ring-red-500/20' },
  }
  return map[color] || map.blue
}

// ResizeObserver 实例
let resizeObserver = null

onMounted(() => {
  // 稍微延迟触发动画，确保 DOM 渲染完成
  setTimeout(() => {
    isMounted.value = true
  }, 100)
  
  // 延迟初始化容器宽度监听，确保 DOM 完全渲染
  setTimeout(() => {
    if (trendContainerRef.value) {
      // 初始化宽度
      containerWidth.value = trendContainerRef.value.offsetWidth
      
      // 使用 ResizeObserver 监听宽度变化
      if (typeof ResizeObserver !== 'undefined') {
        resizeObserver = new ResizeObserver(entries => {
          for (const entry of entries) {
            containerWidth.value = entry.contentRect.width
          }
        })
        resizeObserver.observe(trendContainerRef.value)
      } else {
        // 降级方案：使用 window resize 事件
        const handleResize = () => {
          if (trendContainerRef.value) {
            containerWidth.value = trendContainerRef.value.offsetWidth
          }
        }
        window.addEventListener('resize', handleResize)
        onUnmounted(() => {
          window.removeEventListener('resize', handleResize)
        })
      }
    }
  }, 150)
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
    
    <div class="flex justify-between items-end mb-8 px-1 animate-enter" style="--stagger: 0">
      <div>
        <h2 class="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
          工时看板
        </h2>
        <p class="text-[13px] text-gray-500 mt-1 font-medium">实时追踪您的工时投入与考勤状况</p>
      </div>
      
      <div class="flex items-center gap-2 z-20">
        <button
          @click="changeYear('prev')"
          :disabled="!canGoPrev"
          class="flex items-center justify-center w-9 h-9 rounded-xl bg-white/70 hover:bg-white/90 backdrop-blur-xl border border-gray-200/80 hover:border-blue-300/50 shadow-sm hover:shadow-md transition-all duration-300 outline-none focus:ring-4 focus:ring-blue-500/10 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white/70 disabled:hover:shadow-sm"
          :class="canGoPrev ? 'cursor-pointer' : 'cursor-not-allowed'"
        >
          <IconChevronRight class="w-4 h-4 text-gray-600 rotate-180" />
        </button>
        
        <div class="flex items-center gap-2 px-4 py-2 bg-white/70 hover:bg-white/90 backdrop-blur-xl border border-gray-200/80 hover:border-blue-300/50 rounded-xl shadow-sm min-w-[100px] justify-center">
          <IconCalendar class="w-3.5 h-3.5 text-gray-400" />
          <span class="text-[13px] font-semibold text-gray-700">{{ currentYear }}年</span>
        </div>
        
        <button
          @click="changeYear('next')"
          :disabled="!canGoNext"
          class="flex items-center justify-center w-9 h-9 rounded-xl bg-white/70 hover:bg-white/90 backdrop-blur-xl border border-gray-200/80 hover:border-blue-300/50 shadow-sm hover:shadow-md transition-all duration-300 outline-none focus:ring-4 focus:ring-blue-500/10 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white/70 disabled:hover:shadow-sm"
          :class="canGoNext ? 'cursor-pointer' : 'cursor-not-allowed'"
        >
          <IconChevronRight class="w-4 h-4 text-gray-600" />
        </button>
      </div>
    </div>

    <div class="bg-white/60 backdrop-blur-xl border border-white/60 rounded-[20px] p-1.5 shadow-sm mb-5 animate-enter" style="--stagger: 0.5" ref="trendContainerRef">
      <div class="flex items-center gap-2">
        <button
          @click="changeMonth('prev')"
          :disabled="!canGoPrevMonth"
          class="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-lg bg-white/70 hover:bg-white/90 backdrop-blur-xl border border-gray-200/80 hover:border-blue-300/50 shadow-sm hover:shadow-md transition-all duration-300 outline-none focus:ring-2 focus:ring-blue-500/10 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white/70 disabled:hover:shadow-sm"
          :class="canGoPrevMonth ? 'cursor-pointer' : 'cursor-not-allowed'"
        >
          <IconChevronRight class="w-4 h-4 text-gray-600 rotate-180" />
        </button>
        
        <div class="flex items-center gap-1 py-1 px-1 flex-1" :style="{ gap: `${MONTH_ITEM_GAP}px` }">
          <button v-for="item in monthlyTrend" :key="item.month" @click="currentMonth = item.month"
            class="flex-shrink-0 flex flex-col items-center justify-center gap-1.5 py-3 rounded-xl transition-all duration-300 group relative overflow-hidden"
            :style="monthItemStyle"
            :class="item.isCurrent 
              ? 'bg-transparent shadow-lg shadow-blue-200/50 text-blue-700 ring-2 ring-blue-400/50 border border-blue-300/30 scale-105' 
              : 'bg-transparent hover:bg-blue-50/60 hover:shadow-md hover:shadow-blue-200/30 hover:ring-1 hover:ring-blue-300/40 hover:scale-105 text-gray-600 hover:text-blue-600'">
            <div v-if="item.isCurrent"
              class="absolute bottom-0 left-1/2 -translate-x-1/2 w-10 h-1.5 bg-blue-500 rounded-t-full shadow-sm"></div>
            <span class="text-xs font-bold transition-colors duration-300" :class="item.isCurrent ? 'text-blue-700' : 'group-hover:text-blue-600'">{{ item.label }}</span>
            <div class="h-8 w-1.5 bg-gray-200 rounded-full flex items-end overflow-hidden shadow-inner">
              <div class="w-full rounded-full transition-all duration-500"
                :class="item.isCurrent ? 'bg-gradient-to-t from-blue-600 to-blue-400 shadow-sm' : 'bg-gradient-to-t from-blue-400 to-blue-300 group-hover:from-blue-500 group-hover:to-blue-400'"
                :style="{ height: Math.min(100, (item.hours / 12) * 100) + '%' }"></div>
            </div>
            <span class="text-[10px] font-mono transition-colors duration-300" :class="item.isCurrent ? 'text-blue-600 opacity-90' : 'opacity-70 group-hover:text-blue-500 group-hover:opacity-90'">{{ item.hours.toFixed(1) }}</span>
          </button>
        </div>
        
        <button
          @click="changeMonth('next')"
          :disabled="!canGoNextMonth"
          class="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-lg bg-white/70 hover:bg-white/90 backdrop-blur-xl border border-gray-200/80 hover:border-blue-300/50 shadow-sm hover:shadow-md transition-all duration-300 outline-none focus:ring-2 focus:ring-blue-500/10 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white/70 disabled:hover:shadow-sm"
          :class="canGoNextMonth ? 'cursor-pointer' : 'cursor-not-allowed'"
        >
          <IconChevronRight class="w-4 h-4 text-gray-600" />
        </button>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-5 mb-10 animate-enter font-sans" style="--stagger: 1">
      
      <div class="group relative overflow-hidden rounded-[32px] bg-white border border-gray-100 shadow-[0_8px_30px_rgba(0,0,0,0.04)] p-8 flex flex-col justify-between transition-all duration-500 hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)] hover:-translate-y-1 hover:border-gray-200">
        <div class="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-blue-50/50 to-indigo-50/50 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none -ml-16 -mb-16"></div>

        <div class="flex justify-between items-start mb-8 z-10">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 shadow-sm shadow-blue-100">
              <IconClock class="w-5 h-5" />
            </div>
            <span class="text-[13px] font-bold text-gray-400 uppercase tracking-wider">月总时长</span>
          </div>
          
          <div class="px-3 py-1 bg-gray-50 rounded-full border border-gray-100 flex items-center gap-2">
             <div class="w-1.5 h-1.5 rounded-full bg-gray-300"></div>
             <span class="text-xs font-semibold text-gray-500">标准 {{ monthData.standardTotalHours }} h</span>
          </div>
        </div>

        <div class="mb-8 z-10">
           <div class="flex items-baseline gap-2">
             <span class="text-5xl font-bold text-gray-900 tracking-tight font-sf-display">
               {{ monthData.totalHours }}
             </span>
             <span class="text-lg text-gray-400 font-medium">h</span>
          </div>
        </div>

        <div class="relative w-full z-10">
          <div 
            class="absolute -top-7 transform -translate-x-1/2 flex flex-col items-center transition-all duration-500"
            :style="{ left: monthData.standardTotalPercent + '%' }"
          >
            <span class="text-[10px] font-bold text-gray-400 bg-white border border-gray-100 px-1.5 py-0.5 rounded shadow-sm">{{ monthData.standardTotalHours }}h</span>
            <div class="w-px h-2 bg-gray-200 mt-0.5"></div>
          </div>

          <div class="h-4 w-full bg-gray-100 rounded-full overflow-hidden shadow-inner ring-1 ring-gray-900/5">
            <div 
              class="h-full rounded-full transition-all duration-[1500ms] ease-[cubic-bezier(0.25,1,0.5,1)] relative"
              :class="monthData.animatedTotalPercent >= monthData.standardTotalPercent ? 'bg-gradient-to-r from-blue-400 to-blue-500' : 'bg-gradient-to-r from-blue-300 to-blue-400'"
              :style="{ width: monthData.animatedTotalPercent + '%' }"
            >
              <div class="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/25 to-transparent -translate-x-full animate-[shimmer_2s_infinite]"></div>
            </div>
          </div>
          
          <div class="flex justify-between mt-2 px-1">
            <span class="text-[10px] font-medium text-gray-300">0h</span>
            <span class="text-[10px] font-medium text-gray-300">{{ Math.round(monthData.maxTotalHours) }}h+</span>
          </div>
        </div>
      </div>

      <div class="group relative overflow-hidden rounded-[32px] bg-white border border-gray-100 shadow-[0_8px_30px_rgba(0,0,0,0.04)] p-8 flex flex-col justify-between transition-all duration-500 hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)] hover:-translate-y-1 hover:border-gray-200">
        <div class="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-emerald-50/50 to-teal-50/50 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none -ml-16 -mb-16"></div>

        <div class="flex justify-between items-start mb-8 z-10">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 shadow-sm shadow-emerald-100">
              <IconTrendUp class="w-5 h-5" />
            </div>
            <span class="text-[13px] font-bold text-gray-400 uppercase tracking-wider">日均时长</span>
          </div>
          
          <div class="px-3 py-1 bg-gray-50 rounded-full border border-gray-100 flex items-center gap-2">
             <div class="w-1.5 h-1.5 rounded-full bg-gray-300"></div>
             <span class="text-xs font-semibold text-gray-500">标准 {{ monthData.standardDays }} 天</span>
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
            :style="{ left: monthData.standardDailyPercent + '%' }"
          >
            <span class="text-[10px] font-bold text-gray-400 bg-white border border-gray-100 px-1.5 py-0.5 rounded shadow-sm">9h</span>
            <div class="w-px h-2 bg-gray-200 mt-0.5"></div>
          </div>

          <div class="h-4 w-full bg-gray-100 rounded-full overflow-hidden shadow-inner ring-1 ring-gray-900/5">
            <div 
              class="h-full rounded-full transition-all duration-[1500ms] ease-[cubic-bezier(0.25,1,0.5,1)] relative"
              :class="monthData.avgDaily >= 9 ? 'bg-gradient-to-r from-emerald-400 to-emerald-500' : 'bg-gradient-to-r from-orange-300 to-orange-400'"
              :style="{ width: monthData.animatedDailyPercent + '%' }"
            >
              <div class="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/25 to-transparent -translate-x-full animate-[shimmer_2s_infinite]"></div>
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
        <div 
          v-for="(item, index) in abnormalStats" 
          :key="index"
          class="relative overflow-hidden bg-white/70 backdrop-blur-xl border rounded-[22px] p-4 transition-all duration-300 hover:bg-white hover:scale-[1.03] hover:shadow-[0_12px_24px_-8px_rgba(0,0,0,0.08)] flex flex-col justify-between min-h-[120px] group cursor-default"
          :class="[
            item.value > 0 ? getColorClass(item.color).text + ' ' + 'border-gray-100' : 'border-gray-100/50 text-gray-300',
            item.value > 0 ? 'hover:border-' + item.color + '-200' : ''
          ]"
        >
          <div v-if="item.value > 0" class="absolute -right-4 -top-4 w-16 h-16 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" :class="getColorClass(item.color).bg"></div>

          <div class="flex justify-between items-start relative z-10">
            <div 
              class="w-9 h-9 rounded-[12px] flex items-center justify-center transition-all duration-300"
              :class="item.value > 0 ? getColorClass(item.color).iconBg : 'bg-gray-100/50'"
            >
              <component 
                :is="item.icon === 'IconClock' ? IconClock : 
                     item.icon === 'IconCalendar' ? IconCalendar :
                     item.icon === 'IconBriefcase' ? IconBriefcase :
                     item.icon === 'IconFileText' ? IconFileText :
                     IconCalendarDays" 
                class="w-4 h-4 transition-transform duration-300 group-hover:scale-110"
                :class="item.value > 0 ? 'text-current' : 'text-gray-400'"
              />
            </div>
          </div>

          <div class="mt-3 relative z-10">
            <div class="flex items-baseline gap-1">
              <span class="text-3xl font-bold font-sf-display tracking-tight transition-all duration-300"
                :class="item.value > 0 ? 'scale-100' : 'scale-95 origin-left'"
              >
                {{ item.value }}
              </span>
              <span class="text-[11px] font-medium opacity-60" v-if="item.value > 0">{{ item.unit }}</span>
            </div>
            <div class="text-[11px] font-semibold mt-1 transition-colors duration-300" :class="item.value > 0 ? 'text-gray-500' : 'text-gray-400'">{{ item.label }}</div>
          </div>
        </div>
      </div>
    </div>

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
    filter: blur(4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
    filter: blur(0);
  }
}

.animate-enter {
  opacity: 0; /* 初始隐藏 */
  animation: fadeInUp 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
  animation-delay: calc(var(--stagger) * 120ms); /* 根据变量延迟 */
}

/* 进度条扫光动画 */
@keyframes shimmer {
  100% {
    transform: translateX(100%);
  }
}
</style>