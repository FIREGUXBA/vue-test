<script setup>
import { ref, computed, watch, onMounted, onUnmounted, inject } from 'vue'
import SummaryCard from '../components/SummaryCard.vue'
import IconUsers from '../components/icons/IconUsers.vue'
import IconFilter from '../components/icons/IconFilter.vue'
import IconChevronRight from '../components/icons/IconChevronRight.vue'
import IconCalendar from '../components/icons/IconCalendar.vue'
import IconChart from '../components/icons/IconChart.vue'
import IconTrendUp from '../components/icons/IconTrendUp.vue'
import IconTrendDown from '../components/icons/IconTrendDown.vue'
import IconClock from '../components/icons/IconClock.vue'
import { allMonthKeys, getCellColor } from '../utils/data'

const data = inject('data')
const selectedNames = ref([])
const selectedDepts = ref([])
const startMonth = ref('25.01')
const endMonth = ref('25.03')

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
  return selectedMonthCount.value >= 3
})
const showNameDropdown = ref(false)
const showDeptDropdown = ref(false)
const showMonthDropdown = ref(false)

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
  return data.value.filter(item => {
    const matchesName = selectedNames.value.length === 0 || selectedNames.value.includes(item.name)
    const matchesDept = selectedDepts.value.length === 0 || selectedDepts.value.includes(item.dept)
    return matchesName && matchesDept
  })
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
  const getRanking = (sortFn, valKey, unit, limit = 5) => {
    return [...currentData]
      .sort(sortFn)
      .slice(0, limit)
      .map(i => {
        const val = valKey.split('.').reduce((o, k) => (o || {})[k], i)
        return {
          name: i.name,
          dept: i.dept,
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

  // 2. 各类排行
  const topHours = getRanking((a, b) => b.hours - a.hours, 'hours', 'h')
  const bottomHours = getRanking((a, b) => a.hours - b.hours, 'hours', 'h')

  const topMissing = [...currentData]
    .sort((a, b) => b.stats.missingCard - a.stats.missingCard)
    .filter(i => i.stats.missingCard > 0)
    .slice(0, 5)
    .map(i => ({ name: i.name, dept: i.dept, value: i.stats.missingCard, unit: '次' }))

  const topLate = [...currentData]
    .sort((a, b) => b.stats.late - a.stats.late)
    .filter(i => i.stats.late > 0)
    .slice(0, 5)
    .map(i => ({ name: i.name, dept: i.dept, value: i.stats.late, unit: '次' }))

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

// 月份选择验证
watch([startMonth, endMonth], ([start, end]) => {
  const startIdx = allMonthKeys.indexOf(start)
  const endIdx = allMonthKeys.indexOf(end)
  if (startIdx > endIdx) {
    endMonth.value = start
    return
  }
  
  const monthCount = endIdx - startIdx + 1
  if (monthCount < 3) {
    const newEndIdx = Math.min(startIdx + 2, allMonthKeys.length - 1)
    endMonth.value = allMonthKeys[newEndIdx]
  }
})

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
  <div class="space-y-6">
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
                        满足要求（至少3个月）
                      </span>
                      <span v-else class="flex items-center gap-1">
                        <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
                        </svg>
                        至少需要选择3个月
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

    <div class="rounded-2xl overflow-hidden bg-white border border-gray-200 shadow-sm">
      <div class="overflow-x-auto custom-scrollbar">
        <table class="min-w-full border-collapse">
          <thead>
            <tr>
              <th class="px-4 py-2 text-[11px] font-semibold text-gray-500 uppercase tracking-wider bg-gray-50 border-b border-gray-200 w-28 text-left sticky left-0 shadow-[4px_0_12px_rgba(0,0,0,0.02)] bg-gray-50 z-20">姓名</th>
              <th class="px-4 py-2 text-[11px] font-semibold text-gray-500 uppercase tracking-wider bg-gray-50 border-b border-gray-200 w-32 text-left">所属团队</th>
              <th v-for="m in monthKeys" :key="m" class="px-4 py-2 text-[11px] font-semibold text-gray-500 uppercase tracking-wider bg-gray-50 border-b border-gray-200 text-center min-w-[90px]">
                <div class="flex flex-col">
                  <span class="text-gray-800">{{ m }}</span>
                  <span class="text-[9px] font-normal text-gray-400 mt-0.5">平均工时</span>
                </div>
              </th>
              <th class="px-4 py-2 text-[11px] font-semibold text-gray-500 uppercase tracking-wider bg-gray-50 border-b border-gray-200 text-center">补卡</th>
              <th class="px-4 py-2 text-[11px] font-semibold text-gray-500 uppercase tracking-wider bg-gray-50 border-b border-gray-200 text-center">出差</th>
              <th class="px-4 py-2 text-[11px] font-semibold text-gray-500 uppercase tracking-wider bg-gray-50 border-b border-gray-200 text-center">调休</th>
              <th class="px-4 py-2 text-[11px] font-semibold text-gray-500 uppercase tracking-wider bg-gray-50 border-b border-gray-200 text-center">请假</th>
              <th class="px-4 py-2 text-[11px] font-semibold text-gray-500 uppercase tracking-wider bg-gray-50 border-b border-gray-200 text-center">迟到</th>
            </tr>
          </thead>
          <tbody class="relative">
            <tr v-for="row in filteredData" :key="row.id" class="group hover:bg-gray-50 transition-colors duration-150">
              <td class="px-4 py-2 text-[13px] text-gray-900 border-b border-gray-100 whitespace-nowrap font-medium sticky left-0 bg-white group-hover:bg-gray-50 border-r border-gray-200 z-10">{{ row.name }}</td>
              <td class="px-4 py-2 text-[13px] text-gray-600 border-b border-gray-100 whitespace-nowrap">
                <span class="px-2 py-0.5 rounded bg-gray-100 text-[11px] border border-gray-200">{{ row.dept }}</span>
              </td>
              <td v-for="m in monthKeys" :key="m" class="px-4 py-2 text-[13px] text-gray-700 border-b border-gray-100 whitespace-nowrap text-center">
                <div class="py-1 rounded text-[12px]" :class="getCellColor(row.monthlyHours[m], columnValues[m])">{{ row.monthlyHours[m].toFixed(2) }}</div>
              </td>
              <td class="px-4 py-2 text-[13px] text-gray-600 border-b border-gray-100 whitespace-nowrap text-center">{{ row.stats.missingCard }}</td>
              <td class="px-4 py-2 text-[13px] text-gray-600 border-b border-gray-100 whitespace-nowrap text-center">{{ row.stats.businessTrip || '-' }}</td>
              <td class="px-4 py-2 text-[13px] text-gray-600 border-b border-gray-100 whitespace-nowrap text-center">{{ row.stats.compLeave || '-' }}</td>
              <td class="px-4 py-2 text-[13px] text-gray-600 border-b border-gray-100 whitespace-nowrap text-center">{{ row.stats.leave || '-' }}</td>
              <td class="px-4 py-2 text-[13px] text-gray-600 border-b border-gray-100 whitespace-nowrap text-center">{{ row.stats.late || '-' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-5 pb-12">
      
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
</template>

