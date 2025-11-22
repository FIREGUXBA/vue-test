<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import StatCard from './components/StatCard.vue'
import ReportFooterCard from './components/ReportFooterCard.vue'
import SummaryCard from './components/SummaryCard.vue'
import IconSearch from './components/icons/IconSearch.vue'
import IconClock from './components/icons/IconClock.vue'
import IconUsers from './components/icons/IconUsers.vue'
import IconFilter from './components/icons/IconFilter.vue'
import IconChevronRight from './components/icons/IconChevronRight.vue'
import IconChart from './components/icons/IconChart.vue'
import IconTable from './components/icons/IconTable.vue'
import IconCalendar from './components/icons/IconCalendar.vue'
import IconTrendUp from './components/icons/IconTrendUp.vue'
import IconTrendDown from './components/icons/IconTrendDown.vue'

const generateData = () => {
  const depts = ['TGFW测试组', 'USM测试组', '前端架构组', '后端服务组']
  const names = ['苟鸿林', '侯佳林', '刘凯', '邱宇', '巫静波', '肖洋', '赵燕子', '陈泉有', '刘广航', '刘爽', '刘潇', '郑一博', '李明', '王强']
  const months = ['25.01', '25.02', '25.03', '25.04', '25.05', '25.06', '25.07', '25.08', '25.09', '25.10', '25.11', '25.12']

  return names.map((name, i) => {
    const dept = depts[i % depts.length]
    const monthlyHours = {}
    months.forEach(m => {
      monthlyHours[m] = parseFloat((Math.random() * 3 + 8.5).toFixed(2))
    })

    return {
      id: `u-${i}`,
      name: name,
      dept,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}&backgroundColor=b6e3f4`,
      monthlyHours,
      stats: {
        missingCard: Math.floor(Math.random() * 5),
        businessTrip: Math.floor(Math.random() * 3),
        compLeave: Math.floor(Math.random() * 2),
        leave: Math.floor(Math.random() * 4),
        late: Math.floor(Math.random() * 6),
      },
      role: '高级工程师',
      hours: Math.floor(monthlyHours['25.06'] * 22),
      standard: 176,
      percentage: Math.min(100, Math.round((monthlyHours['25.06'] * 22 / 176) * 100)),
      status: monthlyHours['25.06'] > 10 ? 'overtime' : (monthlyHours['25.06'] < 9 ? 'under' : 'normal')
    }
  })
}

const data = ref(generateData())
const viewMode = ref('dashboard')
const filterDept = ref('全部')
const searchTerm = ref('')
const hoveredRow = ref(null)
const allMonthKeys = ['25.01', '25.02', '25.03', '25.04', '25.05', '25.06', '25.07', '25.08', '25.09', '25.10', '25.11', '25.12']

// 报表视图的筛选状态
const selectedNames = ref([])
const selectedDepts = ref([])
const startMonth = ref('25.01')
const endMonth = ref('25.06')

// 计算选择的月份数量
const selectedMonthCount = computed(() => {
  const startIdx = allMonthKeys.indexOf(startMonth.value)
  const endIdx = allMonthKeys.indexOf(endMonth.value)
  if (startIdx === -1 || endIdx === -1 || startIdx > endIdx) {
    return 0
  }
  return endIdx - startIdx + 1
})

// 验证月份范围是否满足至少6个月的要求
const isMonthRangeValid = computed(() => {
  return selectedMonthCount.value >= 6
})
const showNameDropdown = ref(false)
const showDeptDropdown = ref(false)
const showMonthDropdown = ref(false)

const departments = computed(() => ['全部', ...new Set(data.value.map(i => i.dept))])
const allNames = computed(() => [...new Set(data.value.map(i => i.name))].sort())
const allDepts = computed(() => [...new Set(data.value.map(i => i.dept))].sort())

// 根据选择的月份范围生成月份列表
const monthKeys = computed(() => {
  const startIdx = allMonthKeys.indexOf(startMonth.value)
  const endIdx = allMonthKeys.indexOf(endMonth.value)
  if (startIdx === -1 || endIdx === -1 || startIdx > endIdx) {
    return allMonthKeys
  }
  return allMonthKeys.slice(startIdx, endIdx + 1)
})

const filteredData = computed(() => {
  if (viewMode.value === 'report') {
    // 报表视图：使用多选筛选
    return data.value.filter(item => {
      const matchesName = selectedNames.value.length === 0 || selectedNames.value.includes(item.name)
      const matchesDept = selectedDepts.value.length === 0 || selectedDepts.value.includes(item.dept)
      return matchesName && matchesDept
    })
  } else {
    // 概览视图：使用原有筛选
    return data.value.filter(item => {
      const matchesDept = filterDept.value === '全部' || item.dept === filterDept.value
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.value.toLowerCase())
      return matchesDept && matchesSearch
    })
  }
})

const stats = computed(() => {
  const totalHours = filteredData.value.reduce((acc, curr) => acc + curr.hours, 0)
  const avgLoad = filteredData.value.length ? Math.round(totalHours / filteredData.value.length) : 0
  return { totalHours, avgLoad, count: filteredData.value.length }
})

const columnValues = computed(() => {
  const map = {}
  monthKeys.value.forEach(m => map[m] = filteredData.value.map(row => row.monthlyHours[m]))
  return map
})

const footerStats = computed(() => {
  if (filteredData.value.length === 0) return {
    avgAll: 0,
    topHours: [],
    bottomHours: [],
    topMissing: [],
    topLeave: [],
    topLate: []
  }

  const currentData = [...filteredData.value]
  
  // 辅助函数：标准排序并格式化
  // limit 设为 5 以展示更多人
  const getRanking = (sortFn, valKey, unit, limit = 5) => {
    return [...currentData]
      .sort(sortFn)
      .slice(0, limit)
      // 过滤掉值为 0 的项 (可选，看需求，这里保留是为了看到谁最少)
      .map(i => {
        // 处理嵌套属性，如 stats.late
        const val = valKey.split('.').reduce((o, k) => (o || {})[k], i)
        return {
          name: i.name,
          dept: i.dept, // 保留部门信息用于展示
          value: val,
          unit: unit
        }
      })
  }

  // 1. 平均工时
  let totalSum = 0, totalCount = 0
  currentData.forEach(d => monthKeys.value.forEach(m => { 
    totalSum += d.monthlyHours[m]; 
    totalCount++ 
  }))
  const avgAll = totalCount > 0 ? (totalSum / totalCount).toFixed(2) : '0.00'

  // 2. 各类排行 (取 Top 5)
  // 工时最多
  const topHours = getRanking((a, b) => b.hours - a.hours, 'hours', 'h')
  
  // 工时最少 (排在最后的5个)
  const bottomHours = getRanking((a, b) => a.hours - b.hours, 'hours', 'h')

  // 补卡最多 (过滤掉0)
  const topMissing = [...currentData]
    .sort((a, b) => b.stats.missingCard - a.stats.missingCard)
    .filter(i => i.stats.missingCard > 0)
    .slice(0, 5)
    .map(i => ({ name: i.name, dept: i.dept, value: i.stats.missingCard, unit: '次' }))

  // 迟到最多
  const topLate = [...currentData]
    .sort((a, b) => b.stats.late - a.stats.late)
    .filter(i => i.stats.late > 0)
    .slice(0, 5)
    .map(i => ({ name: i.name, dept: i.dept, value: i.stats.late, unit: '次' }))

  // 请假最多
  const topLeave = [...currentData]
    .sort((a, b) => b.stats.leave - a.stats.leave)
    .filter(i => i.stats.leave > 0)
    .slice(0, 5)
    .map(i => ({ name: i.name, dept: i.dept, value: i.stats.leave, unit: '天' }))

  return { 
    avgAll,
    topHours,
    bottomHours,
    topMissing,
    topLeave,
    topLate
  }
})

const getCellColor = (val, allValuesInColumn) => {
  // 小于9小时
  if (val < 9) return 'bg-[#FEF2F2] text-[#B91C1C] border border-[#FECACA]/50 font-medium shadow-[0_1px_2px_rgba(220,38,38,0.05)]'

  const sorted = [...allValuesInColumn].sort((a, b) => b - a)
  // 前3
  const top3 = sorted.slice(0, 3)
  // 后3
  const bottom3 = sorted.slice(-3)

  if (top3.includes(val)) return 'bg-[#F0FDF4] text-[#15803D] border border-[#BBF7D0]/50 font-medium shadow-[0_1px_2px_rgba(22,163,74,0.05)]'
  if (bottom3.includes(val)) return 'bg-[#FEFCE8] text-[#A16207] border border-[#FEF08A]/50 font-medium shadow-[0_1px_2px_rgba(202,138,4,0.05)]'

  return 'text-gray-600'
}

// 月份选择验证：确保起始月份不大于结束月份，且至少选择6个月
watch([startMonth, endMonth], ([start, end]) => {
  const startIdx = allMonthKeys.indexOf(start)
  const endIdx = allMonthKeys.indexOf(end)
  if (startIdx > endIdx) {
    endMonth.value = start
    return
  }
  
  // 如果选择的月份少于6个月，自动调整结束月份
  const monthCount = endIdx - startIdx + 1
  if (monthCount < 6) {
    const newEndIdx = Math.min(startIdx + 5, allMonthKeys.length - 1)
    endMonth.value = allMonthKeys[newEndIdx]
  }
})

// 切换下拉菜单的方法，确保每次只打开一个
const toggleNameDropdown = () => {
  const wasOpen = showNameDropdown.value
  showNameDropdown.value = false
  showDeptDropdown.value = false
  showMonthDropdown.value = false
  showNameDropdown.value = !wasOpen
}

const toggleDeptDropdown = () => {
  const wasOpen = showDeptDropdown.value
  showNameDropdown.value = false
  showDeptDropdown.value = false
  showMonthDropdown.value = false
  showDeptDropdown.value = !wasOpen
}

const toggleMonthDropdown = () => {
  const wasOpen = showMonthDropdown.value
  showNameDropdown.value = false
  showDeptDropdown.value = false
  showMonthDropdown.value = false
  showMonthDropdown.value = !wasOpen
}

// 点击外部关闭下拉菜单
const handleClickOutside = (event) => {
  if (!event.target.closest('.dropdown-container')) {
    showNameDropdown.value = false
    showDeptDropdown.value = false
    showMonthDropdown.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<template>
  <div class="min-h-screen pb-20 text-slate-800 selection:bg-blue-100 selection:text-blue-900">
    <main class="max-w-7xl mx-auto px-6 pt-8">
      <!-- 控制栏 -->
      <div class="flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
        <!-- 视图切换器 -->
        <div class="bg-gray-200/50 p-1 rounded-lg flex items-center border border-white/20 shadow-inner relative">
          <div
            class="absolute inset-y-1 bg-white rounded-md shadow-[0_2px_8px_rgba(0,0,0,0.08)] border border-gray-100 tab-bg z-0"
            :style="{ left: viewMode === 'dashboard' ? '4px' : '50%', width: 'calc(50% - 4px)' }"></div>
          <button @click="viewMode = 'dashboard'"
            class="relative z-10 px-4 py-1.5 rounded-md text-xs font-semibold transition-colors flex items-center gap-2 w-24 justify-center"
            :class="viewMode === 'dashboard' ? 'text-gray-800' : 'text-gray-500 hover:text-gray-600'">
            <IconChart class="w-3.5 h-3.5"></IconChart> 概览
          </button>
          <button @click="viewMode = 'report'"
            class="relative z-10 px-4 py-1.5 rounded-md text-xs font-semibold transition-colors flex items-center gap-2 w-24 justify-center"
            :class="viewMode === 'report' ? 'text-gray-800' : 'text-gray-500 hover:text-gray-600'">
            <IconTable class="w-3.5 h-3.5"></IconTable> 报表
          </button>
        </div>

        <!-- 部门筛选 -->
        <div class="flex items-center gap-2 overflow-x-auto no-scrollbar w-full md:w-auto pb-2 md:pb-0 px-1">
          <button v-for="dept in departments" :key="dept" @click="filterDept = dept"
            class="px-5 py-1.5 text-xs font-semibold rounded-full whitespace-nowrap transition-all duration-300 border"
            :class="filterDept === dept
              ? 'bg-gray-800 text-white border-gray-800 shadow-lg shadow-gray-800/20 scale-105'
              : 'bg-white/80 text-gray-500 border-transparent hover:bg-white hover:shadow-sm backdrop-blur-sm'">
            {{ dept }}
          </button>
        </div>

        <!-- 搜索框 -->
        <div class="relative w-full md:w-72 group">
          <div
            class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors duration-300">
            <IconSearch class="w-4 h-4"></IconSearch>
          </div>
          <input type="text" placeholder="搜索员工姓名..." v-model="searchTerm"
            class="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm border border-transparent focus:border-blue-500/30 bg-gray-100/60 hover:bg-gray-200/60 transition-all duration-300 focus:bg-white focus:ring-2 focus:ring-blue-500/20 outline-none backdrop-blur-sm" />
        </div>
      </div>

      <!-- 视图内容 -->
      <transition name="page" mode="out-in">
        <!-- Dashboard View -->
        <div v-if="viewMode === 'dashboard'" key="dashboard" class="space-y-8">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard label="当前团队人数" :value="stats.count" :icon="IconUsers" :index="0"></StatCard>
            <StatCard label="本月总工时" :value="stats.totalHours + 'h'" :icon="IconClock" trend="up" trend-label="+2.4%"
              :index="1"></StatCard>
            <StatCard label="平均工时负荷" :value="stats.avgLoad + 'h'" :icon="IconFilter" trend="neutral" trend-label="正常"
              :index="2"></StatCard>
          </div>

          <div class="rounded-3xl overflow-hidden bg-white/40 border border-white/50 shadow-sm backdrop-blur-xl">
            <div
              class="grid grid-cols-12 gap-4 px-8 py-4 border-b border-gray-200/50 bg-gray-50/50 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              <div class="col-span-4 sm:col-span-3 pl-2">员工信息</div>
              <div class="col-span-3 sm:col-span-2 hidden sm:block">部门 / 职位</div>
              <div class="col-span-4 sm:col-span-3 text-right sm:text-left">本月总工时</div>
              <div class="col-span-4 sm:col-span-3 hidden sm:block">负荷率</div>
              <div class="col-span-4 sm:col-span-1 text-right">状态</div>
            </div>

            <div class="p-2">
              <transition-group name="list" tag="div" class="relative space-y-1" appear>
                <div v-for="(item, index) in filteredData" :key="item.id" @mouseenter="hoveredRow = item.id"
                  @mouseleave="hoveredRow = null"
                  class="relative grid grid-cols-12 gap-4 px-6 py-4 rounded-2xl items-center cursor-pointer transition-all duration-300 ease-out group w-full"
                  :class="hoveredRow === item.id ? 'bg-white shadow-md scale-[1.01] z-10' : 'hover:bg-white/40'"
                  :style="{ '--i': index }">
                  <div class="col-span-4 sm:col-span-3 flex items-center gap-4">
                    <div class="relative">
                      <img :src="item.avatar" :alt="item.name"
                        class="w-10 h-10 rounded-full bg-gray-100 shadow-sm object-cover ring-2 ring-white" />
                    </div>
                    <div class="flex flex-col">
                      <span class="text-sm font-bold text-gray-800">{{ item.name }}</span>
                      <span class="text-xs text-gray-400 sm:hidden">{{ item.role }}</span>
                    </div>
                  </div>
                  <div class="col-span-3 sm:col-span-2 hidden sm:flex flex-col justify-center">
                    <span
                      class="text-xs font-medium text-gray-600 bg-gray-100/80 px-2.5 py-1 rounded-lg w-fit mb-1 border border-gray-200/50">{{
                      item.dept }}</span>
                    <span class="text-[10px] text-gray-400">{{ item.role }}</span>
                  </div>
                  <div class="col-span-4 sm:col-span-3 flex flex-col justify-center items-end sm:items-start">
                    <div class="flex items-baseline gap-1">
                      <span class="text-lg font-bold text-gray-800 font-mono tracking-tight">{{ item.hours }}</span>
                      <span class="text-xs text-gray-400 font-medium">/ {{ item.standard }}h</span>
                    </div>
                  </div>
                  <div class="col-span-4 sm:col-span-3 hidden sm:flex items-center">
                    <div class="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden max-w-[140px] shadow-inner">
                      <div class="h-full rounded-full shadow-[0_0_10px_rgba(59,130,246,0.3)] progress-bar"
                        :class="item.status === 'overtime' ? 'bg-orange-400' : 'bg-blue-500'"
                        :style="{ width: item.percentage + '%' }"></div>
                    </div>
                    <span class="text-xs font-semibold text-gray-400 w-8 text-right ml-2">{{ item.percentage }}%</span>
                  </div>
                  <div
                    class="col-span-4 sm:col-span-1 flex justify-end items-center text-gray-300 transition-transform duration-300"
                    :class="hoveredRow === item.id ? 'translate-x-1 text-blue-500' : ''">
                    <IconChevronRight class="w-4 h-4"></IconChevronRight>
                  </div>
                </div>
              </transition-group>

              <div v-if="filteredData.length === 0" class="text-center py-10 text-gray-400 text-sm">
                没有找到匹配的员工
              </div>
            </div>
          </div>
        </div>

        <!-- Report View -->
        <div v-else key="report" class="space-y-6">

          <div
            class="p-2 pl-4 pr-2 rounded-2xl flex flex-wrap gap-4 items-center justify-between bg-white/70 backdrop-blur-2xl border border-white/60 shadow-[0_8px_40px_rgba(0,0,0,0.03)] relative z-40">
            <div class="flex items-center gap-6 flex-wrap">
              <!-- 选择姓名 -->
              <div class="relative dropdown-container">
                <button @click.stop="toggleNameDropdown"
                  class="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 border relative overflow-hidden group"
                  :class="showNameDropdown || selectedNames.length > 0
                    ? 'bg-blue-50/90 hover:bg-blue-50 text-blue-700 border-blue-300/50 shadow-md shadow-blue-500/10 backdrop-blur-sm'
                    : 'bg-white/80 hover:bg-white text-gray-700 border-gray-200/60 hover:border-blue-500/30 hover:shadow-sm backdrop-blur-sm'">
                  <IconUsers class="w-4 h-4 transition-colors duration-300"
                    :class="showNameDropdown || selectedNames.length > 0 ? 'text-blue-600' : 'text-gray-500'">
                  </IconUsers>
                  <span>姓名</span>
                  <IconChevronRight class="w-3 h-3 transition-all duration-300"
                    :class="showNameDropdown ? 'rotate-90 text-blue-600' : 'text-gray-400'"></IconChevronRight>
                </button>
                <transition name="dropdown">
                  <div v-if="showNameDropdown" @click.stop
                    class="absolute top-full left-0 mt-2 w-64 bg-white/95 backdrop-blur-xl rounded-xl border border-gray-200/60 shadow-[0_8px_40px_rgba(0,0,0,0.12)] z-[100] max-h-80 overflow-y-auto custom-scrollbar">
                    <div class="p-2">
                      <div class="flex items-center justify-between p-2 border-b border-gray-100">
                        <span class="text-xs font-semibold text-gray-500">选择姓名</span>
                        <button @click.stop="selectedNames = []"
                          class="text-xs text-blue-500 hover:text-blue-600 font-medium transition-colors duration-200 px-2 py-1 rounded-md hover:bg-blue-50">清空</button>
                      </div>
                      <div class="p-2 space-y-1">
                        <label v-for="name in allNames" :key="name"
                          class="flex items-center gap-2 p-2 rounded-lg hover:bg-blue-50/50 cursor-pointer transition-all duration-200 group/item">
                          <input type="checkbox" :value="name" v-model="selectedNames" @click.stop
                            class="w-4 h-4 rounded border-gray-300 text-blue-500 focus:ring-2 focus:ring-blue-500/30 focus:ring-offset-0 transition-all duration-200 cursor-pointer" />
                          <span
                            class="text-sm text-gray-700 group-hover/item:text-blue-700 transition-colors duration-200">{{
                            name }}</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </transition>
              </div>

              <!-- 选择所属团队 -->
              <div class="relative dropdown-container">
                <button @click.stop="toggleDeptDropdown"
                  class="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 border relative overflow-hidden group"
                  :class="showDeptDropdown || selectedDepts.length > 0
                    ? 'bg-blue-50/90 hover:bg-blue-50 text-blue-700 border-blue-300/50 shadow-md shadow-blue-500/10 backdrop-blur-sm'
                    : 'bg-white/80 hover:bg-white text-gray-700 border-gray-200/60 hover:border-blue-500/30 hover:shadow-sm backdrop-blur-sm'">
                  <IconFilter class="w-4 h-4 transition-colors duration-300"
                    :class="showDeptDropdown || selectedDepts.length > 0 ? 'text-blue-600' : 'text-gray-500'">
                  </IconFilter>
                  <span>所属团队</span>
                  <IconChevronRight class="w-3 h-3 transition-all duration-300"
                    :class="showDeptDropdown ? 'rotate-90 text-blue-600' : 'text-gray-400'"></IconChevronRight>
                </button>
                <transition name="dropdown">
                  <div v-if="showDeptDropdown" @click.stop
                    class="absolute top-full left-0 mt-2 w-48 bg-white/95 backdrop-blur-xl rounded-xl border border-gray-200/60 shadow-[0_8px_40px_rgba(0,0,0,0.12)] z-[100] max-h-80 overflow-y-auto custom-scrollbar">
                    <div class="p-2">
                      <div class="flex items-center justify-between p-2 border-b border-gray-100">
                        <span class="text-xs font-semibold text-gray-500">选择团队</span>
                        <button @click.stop="selectedDepts = []"
                          class="text-xs text-blue-500 hover:text-blue-600 font-medium transition-colors duration-200 px-2 py-1 rounded-md hover:bg-blue-50">清空</button>
                      </div>
                      <div class="p-2 space-y-1">
                        <label v-for="dept in allDepts" :key="dept"
                          class="flex items-center gap-2 p-2 rounded-lg hover:bg-blue-50/50 cursor-pointer transition-all duration-200 group/item">
                          <input type="checkbox" :value="dept" v-model="selectedDepts" @click.stop
                            class="w-4 h-4 rounded border-gray-300 text-blue-500 focus:ring-2 focus:ring-blue-500/30 focus:ring-offset-0 transition-all duration-200 cursor-pointer" />
                          <span
                            class="text-sm text-gray-700 group-hover/item:text-blue-700 transition-colors duration-200">{{
                            dept }}</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </transition>
              </div>

              <!-- 选择月份范围 -->
              <div class="relative dropdown-container">
                <button @click.stop="toggleMonthDropdown"
                  class="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 border relative overflow-hidden group"
                  :class="showMonthDropdown
                    ? 'bg-blue-50/90 hover:bg-blue-50 text-blue-700 border-blue-300/50 shadow-md shadow-blue-500/10 backdrop-blur-sm'
                    : 'bg-white/80 hover:bg-white text-gray-700 border-gray-200/60 hover:border-blue-500/30 hover:shadow-sm backdrop-blur-sm'">
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
                    class="absolute top-full left-0 mt-2 w-64 bg-white/95 backdrop-blur-xl rounded-xl border border-gray-200/60 shadow-[0_8px_40px_rgba(0,0,0,0.12)] z-[100]">
                    <div class="p-4">
                      <div class="space-y-4">
                        <div>
                          <label class="block text-xs font-semibold text-gray-500 mb-2">起始月份</label>
                          <select v-model="startMonth" @change.stop
                            class="w-full px-3 py-2 rounded-lg text-sm border border-gray-200/60 bg-white focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all duration-200 hover:border-blue-300/50 cursor-pointer">
                            <option v-for="month in allMonthKeys" :key="month" :value="month">{{ month }}</option>
                          </select>
                        </div>
                        <div>
                          <label class="block text-xs font-semibold text-gray-500 mb-2">结束月份</label>
                          <select v-model="endMonth" @change.stop
                            class="w-full px-3 py-2 rounded-lg text-sm border border-gray-200/60 bg-white focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all duration-200 hover:border-blue-300/50 cursor-pointer">
                            <option v-for="month in allMonthKeys" :key="month" :value="month">{{ month }}</option>
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
                          <div class="mt-2 text-xs"
                            :class="isMonthRangeValid ? 'text-green-600' : 'text-orange-600'">
                            <span v-if="isMonthRangeValid" class="flex items-center gap-1">
                              <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                              </svg>
                              满足要求（至少6个月）
                            </span>
                            <span v-else class="flex items-center gap-1">
                              <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
                              </svg>
                              至少需要选择6个月
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </transition>
              </div>

              <div class="h-8 w-px bg-gray-200/60 transition-opacity duration-300"></div>

              <div
                class="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-50/50 border border-gray-100/50 hover:bg-gray-50 transition-all duration-300 group">
                <div
                  class="bg-gray-100/80 p-1.5 rounded-lg text-gray-500 group-hover:bg-blue-100 group-hover:text-blue-600 transition-all duration-300">
                  <IconUsers class="w-4 h-4"></IconUsers>
                </div>
                <div class="flex flex-col">
                  <span class="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">已选人数</span>
                  <span
                    class="text-sm font-semibold text-gray-800 group-hover:text-blue-700 transition-colors duration-300">{{
                    filteredData.length }} 人</span>
                </div>
              </div>

            </div>
            <div
              class="flex items-center gap-3 bg-gray-50/50 px-3 py-2 rounded-xl border border-gray-100/50 hover:bg-gray-50/80 transition-all duration-300">
              <div
                class="flex items-center gap-1.5 text-[10px] font-medium text-gray-600 transition-all duration-300 hover:scale-105">
                <span
                  class="w-2 h-2 rounded-full bg-green-400 shadow-[0_0_6px_rgba(74,222,128,0.4)] animate-pulse"></span>
                前三名</div>
              <div
                class="flex items-center gap-1.5 text-[10px] font-medium text-gray-600 transition-all duration-300 hover:scale-105">
                <span
                  class="w-2 h-2 rounded-full bg-yellow-400 shadow-[0_0_6px_rgba(250,204,21,0.4)] animate-pulse"></span>
                后三名</div>
              <div
                class="flex items-center gap-1.5 text-[10px] font-medium text-gray-600 transition-all duration-300 hover:scale-105">
                <span
                  class="w-2 h-2 rounded-full bg-red-400 shadow-[0_0_6px_rgba(248,113,113,0.4)] animate-pulse"></span>
                &lt;9h</div>
            </div>
          </div>

          <div
            class="rounded-3xl overflow-hidden bg-white/40 border border-white/50 shadow-[0_8px_32px_rgba(0,0,0,0.12)] backdrop-blur-xl">
            <div class="overflow-x-auto custom-scrollbar">
              <table class="min-w-full border-collapse">
                <thead>
                  <tr>
                    <th
                      class="px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50/80 border-b border-gray-200/60 backdrop-blur-md sticky top-0 z-30 min-w-[100px] text-left sticky left-0 shadow-[4px_0_12px_rgba(0,0,0,0.02)] bg-white/95">
                      姓名</th>
                    <th
                      class="px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50/80 border-b border-gray-200/60 backdrop-blur-md sticky top-0 z-30 min-w-[100px] text-left sticky left-[100px] shadow-[4px_0_12px_rgba(0,0,0,0.02)] bg-white/95">
                      所属团队</th>
                    <th v-for="m in monthKeys" :key="m"
                      class="px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50/80 border-b border-gray-200/60 backdrop-blur-md sticky top-0 z-20 text-center min-w-[90px]">
                      <div class="flex flex-col">
                        <span class="text-gray-800">{{ m }}</span>
                        <span class="text-[9px] font-normal text-gray-400 mt-0.5">平均工时</span>
                      </div>
                    </th>
                    <th
                      class="px-4 py-3.5 text-xs font-semibold text-blue-900/60 uppercase tracking-wider bg-blue-50/30 border-b border-gray-200/60 backdrop-blur-md sticky top-0 z-20 text-center">
                      补卡</th>
                    <th
                      class="px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50/80 border-b border-gray-200/60 backdrop-blur-md sticky top-0 z-20 text-center">
                      出差</th>
                    <th
                      class="px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50/80 border-b border-gray-200/60 backdrop-blur-md sticky top-0 z-20 text-center">
                      调休</th>
                    <th
                      class="px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50/80 border-b border-gray-200/60 backdrop-blur-md sticky top-0 z-20 text-center">
                      请假</th>
                    <th
                      class="px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50/80 border-b border-gray-200/60 backdrop-blur-md sticky top-0 z-20 text-center">
                      迟到</th>
                  </tr>
                </thead>
                <tbody class="relative">
                  <!-- 表格行 -->
                  <tr v-for="row in filteredData" :key="row.id"
                    class="group hover:bg-blue-100/80 transition-all duration-300 ease-out cursor-pointer relative z-0">
                    <td
                      class="px-4 py-3.5 text-sm text-gray-900 border-b border-gray-100/80 whitespace-nowrap font-semibold sticky left-0 bg-white/90 group-hover:bg-blue-100/90 backdrop-blur-lg border-r border-gray-200/60 group-hover:border-blue-300/80 group-hover:shadow-[4px_0_16px_rgba(59,130,246,0.15)] z-30 shadow-[4px_0_12px_rgba(0,0,0,0.02)] transition-all duration-300 ease-out min-w-[100px]">
                      {{ row.name }}</td>
                    <td
                      class="px-4 py-3.5 text-sm text-gray-700 border-b border-gray-100/80 whitespace-nowrap sticky left-[100px] bg-white/90 group-hover:bg-blue-100/90 backdrop-blur-lg border-r border-gray-200/60 group-hover:border-blue-300/80 group-hover:shadow-[4px_0_16px_rgba(59,130,246,0.15)] z-30 shadow-[4px_0_12px_rgba(0,0,0,0.02)] transition-all duration-300 ease-out min-w-[100px]">
                      <span
                        class="px-2 py-0.5 rounded-md bg-gray-100/50 text-gray-500 text-xs border border-gray-200/50">{{
                        row.dept }}</span>
                    </td>
                    <td v-for="m in monthKeys" :key="m"
                      class="px-4 py-3.5 text-sm text-gray-700 border-b border-gray-100/80 whitespace-nowrap text-center p-2 relative z-0">
                      <div class="py-1.5 rounded-lg text-xs transition-transform hover:scale-105"
                        :class="getCellColor(row.monthlyHours[m], columnValues[m])">{{ row.monthlyHours[m].toFixed(2) }}
                      </div>
                    </td>
                    <td
                      class="px-4 py-3.5 text-sm text-gray-600 border-b border-gray-100/80 whitespace-nowrap text-center bg-blue-50/10 font-medium relative z-0">
                      {{ row.stats.missingCard }}</td>
                    <td
                      class="px-4 py-3.5 text-sm text-gray-400 border-b border-gray-100/80 whitespace-nowrap text-center relative z-0">
                      {{ row.stats.businessTrip || '-' }}</td>
                    <td
                      class="px-4 py-3.5 text-sm text-gray-400 border-b border-gray-100/80 whitespace-nowrap text-center relative z-0">
                      {{ row.stats.compLeave || '-' }}</td>
                    <td
                      class="px-4 py-3.5 text-sm text-gray-400 border-b border-gray-100/80 whitespace-nowrap text-center relative z-0">
                      {{ row.stats.leave || '-' }}</td>
                    <td
                      class="px-4 py-3.5 text-sm text-gray-400 border-b border-gray-100/80 whitespace-nowrap text-center relative z-0">
                      {{ row.stats.late || '-' }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-5 pb-12">
            
            <SummaryCard 
              title="平均工时" 
              type="single"
              color="green"
              :icon="IconChart"
              :data="{ value: footerStats.avgAll, unit: '小时', subtitle: '' }" 
            />

            <SummaryCard 
              title="工时投入榜" 
              type="list"
              color="blue"
              :limit="5"
              :icon="IconTrendUp" 
              :data="footerStats.topHours"
            />

            <SummaryCard 
              title="工时不足榜" 
              type="list"
              color="orange"
              :limit="5"
              :icon="IconTrendDown" 
              :data="footerStats.bottomHours"
            />

            <SummaryCard 
              title="迟到次数榜" 
              type="list"
              color="red"
              :limit="5"
              :icon="IconClock" 
              :data="footerStats.topLate"
            />
            
            <SummaryCard 
              title="请假天数榜" 
              type="list"
              color="purple"
              :limit="5"
              :icon="IconCalendar" 
              :data="footerStats.topLeave"
            />

          </div>
        </div>
      </transition>
    </main>
  </div>
</template>
