<script setup>
import { ref, computed } from 'vue'
import StatCard from './components/StatCard.vue'
import ReportFooterCard from './components/ReportFooterCard.vue'
import IconSearch from './components/icons/IconSearch.vue'
import IconClock from './components/icons/IconClock.vue'
import IconUsers from './components/icons/IconUsers.vue'
import IconFilter from './components/icons/IconFilter.vue'
import IconChevronRight from './components/icons/IconChevronRight.vue'
import IconChart from './components/icons/IconChart.vue'
import IconTable from './components/icons/IconTable.vue'
import IconCalendar from './components/icons/IconCalendar.vue'

const generateData = () => {
  const depts = ['TGFW测试组', 'USM测试组', '前端架构组', '后端服务组']
  const names = ['苟鸿林', '侯佳林', '刘凯', '邱宇', '巫静波', '肖洋', '赵燕子', '陈泉有', '刘广航', '刘爽', '刘潇', '郑一博', '李明', '王强']
  const months = ['25.01', '25.02', '25.03', '25.04', '25.05', '25.06']

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
const monthKeys = ['25.01', '25.02', '25.03', '25.04', '25.05', '25.06']

const departments = computed(() => ['全部', ...new Set(data.value.map(i => i.dept))])

const filteredData = computed(() => {
  return data.value.filter(item => {
    const matchesDept = filterDept.value === '全部' || item.dept === filterDept.value
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.value.toLowerCase())
    return matchesDept && matchesSearch
  })
})

const stats = computed(() => {
  const totalHours = filteredData.value.reduce((acc, curr) => acc + curr.hours, 0)
  const avgLoad = filteredData.value.length ? Math.round(totalHours / filteredData.value.length) : 0
  return { totalHours, avgLoad, count: filteredData.value.length }
})

const columnValues = computed(() => {
  const map = {}
  monthKeys.forEach(m => map[m] = data.value.map(row => row.monthlyHours[m]))
  return map
})

const footerStats = computed(() => {
  if (data.value.length === 0) return {}
  const maxMissing = [...data.value].sort((a, b) => b.stats.missingCard - a.stats.missingCard)[0]
  const maxLeave = [...data.value].sort((a, b) => b.stats.leave - a.stats.leave)[0]
  const maxLate = [...data.value].sort((a, b) => b.stats.late - a.stats.late)[0]
  
  let totalSum = 0, totalCount = 0
  data.value.forEach(d => monthKeys.forEach(m => { totalSum += d.monthlyHours[m]; totalCount++ }))
  
  return { 
    maxMissingUser: maxMissing, 
    maxLeaveUser: maxLeave, 
    maxLateUser: maxLate, 
    avgAll: (totalSum / totalCount).toFixed(2) 
  }
})

const getCellColor = (val, allValuesInColumn) => {
  if (val < 9) return 'bg-[#FEF2F2] text-[#B91C1C] border border-[#FECACA]/50 font-medium shadow-[0_1px_2px_rgba(220,38,38,0.05)]'
  
  const sorted = [...allValuesInColumn].sort((a, b) => b - a)
  const top3 = sorted.slice(0, 3)
  const bottom3 = sorted.slice(-3)

  if (top3.includes(val)) return 'bg-[#F0FDF4] text-[#15803D] border border-[#BBF7D0]/50 font-medium shadow-[0_1px_2px_rgba(22,163,74,0.05)]'
  if (bottom3.includes(val)) return 'bg-[#FEFCE8] text-[#A16207] border border-[#FEF08A]/50 font-medium shadow-[0_1px_2px_rgba(202,138,4,0.05)]'

  return 'text-gray-600'
}
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
            :style="{ left: viewMode === 'dashboard' ? '4px' : '50%', width: 'calc(50% - 4px)' }"
          ></div>
          <button @click="viewMode = 'dashboard'" class="relative z-10 px-4 py-1.5 rounded-md text-xs font-semibold transition-colors flex items-center gap-2 w-24 justify-center" :class="viewMode === 'dashboard' ? 'text-gray-800' : 'text-gray-500 hover:text-gray-600'">
            <IconChart class="w-3.5 h-3.5"></IconChart> 概览
          </button>
          <button @click="viewMode = 'report'" class="relative z-10 px-4 py-1.5 rounded-md text-xs font-semibold transition-colors flex items-center gap-2 w-24 justify-center" :class="viewMode === 'report' ? 'text-gray-800' : 'text-gray-500 hover:text-gray-600'">
            <IconTable class="w-3.5 h-3.5"></IconTable> 报表
          </button>
        </div>

        <!-- 部门筛选 -->
        <div class="flex items-center gap-2 overflow-x-auto no-scrollbar w-full md:w-auto pb-2 md:pb-0 px-1">
          <button
            v-for="dept in departments" 
            :key="dept"
            @click="filterDept = dept"
            class="px-5 py-1.5 text-xs font-semibold rounded-full whitespace-nowrap transition-all duration-300 border"
            :class="filterDept === dept 
              ? 'bg-gray-800 text-white border-gray-800 shadow-lg shadow-gray-800/20 scale-105' 
              : 'bg-white/80 text-gray-500 border-transparent hover:bg-white hover:shadow-sm backdrop-blur-sm'"
          >
            {{ dept }}
          </button>
        </div>

        <!-- 搜索框 -->
        <div class="relative w-full md:w-72 group">
          <div class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors duration-300">
            <IconSearch class="w-4 h-4"></IconSearch>
          </div>
          <input
            type="text"
            placeholder="搜索员工姓名..."
            v-model="searchTerm"
            class="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm border border-transparent focus:border-blue-500/30 bg-gray-100/60 hover:bg-gray-200/60 transition-all duration-300 focus:bg-white focus:ring-2 focus:ring-blue-500/20 outline-none backdrop-blur-sm"
          />
        </div>
      </div>

      <!-- 视图内容 -->
      <transition name="page" mode="out-in">
        <!-- Dashboard View -->
        <div v-if="viewMode === 'dashboard'" key="dashboard" class="space-y-8">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard label="当前团队人数" :value="stats.count" :icon="IconUsers" :index="0"></StatCard>
            <StatCard label="本月总工时" :value="stats.totalHours + 'h'" :icon="IconClock" trend="up" trend-label="+2.4%" :index="1"></StatCard>
            <StatCard label="平均工时负荷" :value="stats.avgLoad + 'h'" :icon="IconFilter" trend="neutral" trend-label="正常" :index="2"></StatCard>
          </div>

          <div class="rounded-3xl overflow-hidden bg-white/40 border border-white/50 shadow-sm backdrop-blur-xl">
            <div class="grid grid-cols-12 gap-4 px-8 py-4 border-b border-gray-200/50 bg-gray-50/50 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              <div class="col-span-4 sm:col-span-3 pl-2">员工信息</div>
              <div class="col-span-3 sm:col-span-2 hidden sm:block">部门 / 职位</div>
              <div class="col-span-4 sm:col-span-3 text-right sm:text-left">本月总工时</div>
              <div class="col-span-4 sm:col-span-3 hidden sm:block">负荷率</div>
              <div class="col-span-4 sm:col-span-1 text-right">状态</div>
            </div>

            <div class="p-2">
              <transition-group name="list" tag="div" class="relative space-y-1" appear>
                <div 
                  v-for="(item, index) in filteredData" 
                  :key="item.id"
                  @mouseenter="hoveredRow = item.id"
                  @mouseleave="hoveredRow = null"
                  class="relative grid grid-cols-12 gap-4 px-6 py-4 rounded-2xl items-center cursor-pointer transition-all duration-300 ease-out group w-full"
                  :class="hoveredRow === item.id ? 'bg-white shadow-md scale-[1.01] z-10' : 'hover:bg-white/40'"
                  :style="{ '--i': index }"
                >
                  <div class="col-span-4 sm:col-span-3 flex items-center gap-4">
                    <div class="relative">
                      <img :src="item.avatar" :alt="item.name" class="w-10 h-10 rounded-full bg-gray-100 shadow-sm object-cover ring-2 ring-white" />
                    </div>
                    <div class="flex flex-col">
                      <span class="text-sm font-bold text-gray-800">{{ item.name }}</span>
                      <span class="text-xs text-gray-400 sm:hidden">{{ item.role }}</span>
                    </div>
                  </div>
                  <div class="col-span-3 sm:col-span-2 hidden sm:flex flex-col justify-center">
                    <span class="text-xs font-medium text-gray-600 bg-gray-100/80 px-2.5 py-1 rounded-lg w-fit mb-1 border border-gray-200/50">{{ item.dept }}</span>
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
                      <div 
                        class="h-full rounded-full shadow-[0_0_10px_rgba(59,130,246,0.3)] progress-bar"
                        :class="item.status === 'overtime' ? 'bg-orange-400' : 'bg-blue-500'"
                        :style="{ width: item.percentage + '%' }"
                      ></div>
                    </div>
                    <span class="text-xs font-semibold text-gray-400 w-8 text-right ml-2">{{ item.percentage }}%</span>
                  </div>
                  <div class="col-span-4 sm:col-span-1 flex justify-end items-center text-gray-300 transition-transform duration-300" :class="hoveredRow === item.id ? 'translate-x-1 text-blue-500' : ''">
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
          <div class="p-2 pl-4 pr-2 rounded-2xl flex flex-wrap gap-4 items-center justify-between bg-white/70 backdrop-blur-2xl border border-white/60 shadow-[0_8px_40px_rgba(0,0,0,0.03)]">
            <div class="flex items-center gap-6">
              <div class="flex items-center gap-2">
                <div class="bg-gray-100/80 p-1.5 rounded-lg text-gray-500"><IconUsers class="w-4 h-4"></IconUsers></div>
                <div class="flex flex-col">
                  <span class="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Selected</span>
                  <span class="text-sm font-semibold text-gray-800">{{ filteredData.length }} People</span>
                </div>
              </div>
              <div class="h-8 w-px bg-gray-200/60"></div>
              <div class="flex items-center gap-2">
                <div class="bg-gray-100/80 p-1.5 rounded-lg text-gray-500"><IconCalendar class="w-4 h-4"></IconCalendar></div>
                <div class="flex flex-col">
                  <span class="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Period</span>
                  <span class="text-sm font-semibold text-gray-800">25.01 - 25.06</span>
                </div>
              </div>
            </div>
            <div class="flex items-center gap-3 bg-gray-50/50 px-3 py-2 rounded-xl border border-gray-100/50">
              <div class="flex items-center gap-1.5 text-[10px] font-medium text-gray-600"><span class="w-2 h-2 rounded-full bg-green-400 shadow-[0_0_6px_rgba(74,222,128,0.4)]"></span> Top 3</div>
              <div class="flex items-center gap-1.5 text-[10px] font-medium text-gray-600"><span class="w-2 h-2 rounded-full bg-yellow-400 shadow-[0_0_6px_rgba(250,204,21,0.4)]"></span> Bottom 3</div>
              <div class="flex items-center gap-1.5 text-[10px] font-medium text-gray-600"><span class="w-2 h-2 rounded-full bg-red-400 shadow-[0_0_6px_rgba(248,113,113,0.4)]"></span> &lt;9h</div>
            </div>
          </div>

          <div class="rounded-3xl overflow-hidden bg-white/40 border border-white/50 shadow-sm backdrop-blur-xl">
            <div class="overflow-x-auto custom-scrollbar">
              <table class="min-w-full border-collapse">
                <thead>
                  <tr>
                    <th class="px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50/80 border-b border-gray-200/60 backdrop-blur-md sticky top-0 z-20 w-28 text-left sticky left-0 shadow-[4px_0_12px_rgba(0,0,0,0.02)] bg-white/95">姓名</th>
                    <th class="px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50/80 border-b border-gray-200/60 backdrop-blur-md sticky top-0 z-20 w-32 text-left">所属团队</th>
                    <th v-for="m in monthKeys" :key="m" class="px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50/80 border-b border-gray-200/60 backdrop-blur-md sticky top-0 z-20 text-center min-w-[90px]">
                      <div class="flex flex-col">
                        <span class="text-gray-800">{{ m }}</span>
                        <span class="text-[9px] font-normal text-gray-400 mt-0.5">平均工时</span>
                      </div>
                    </th>
                    <th class="px-4 py-3.5 text-xs font-semibold text-blue-900/60 uppercase tracking-wider bg-blue-50/30 border-b border-gray-200/60 backdrop-blur-md sticky top-0 z-20 text-center">补卡</th>
                    <th class="px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50/80 border-b border-gray-200/60 backdrop-blur-md sticky top-0 z-20 text-center">出差</th>
                    <th class="px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50/80 border-b border-gray-200/60 backdrop-blur-md sticky top-0 z-20 text-center">调休</th>
                    <th class="px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50/80 border-b border-gray-200/60 backdrop-blur-md sticky top-0 z-20 text-center">请假</th>
                    <th class="px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50/80 border-b border-gray-200/60 backdrop-blur-md sticky top-0 z-20 text-center">迟到</th>
                  </tr>
                </thead>
                <tbody class="relative">
                  <tr v-for="row in filteredData" :key="row.id" class="group hover:bg-blue-100/80 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 ease-out cursor-pointer relative z-0 hover:z-20">
                    <td class="px-4 py-3.5 text-sm text-gray-900 border-b border-gray-100/80 whitespace-nowrap font-semibold sticky left-0 bg-white/90 group-hover:bg-blue-100/90 backdrop-blur-lg border-r border-gray-200/60 group-hover:border-blue-300/80 group-hover:shadow-[4px_0_16px_rgba(59,130,246,0.15)] z-10 shadow-[4px_0_12px_rgba(0,0,0,0.02)] transition-all duration-300">{{ row.name }}</td>
                    <td class="px-4 py-3.5 text-sm text-gray-700 border-b border-gray-100/80 whitespace-nowrap">
                      <span class="px-2 py-0.5 rounded-md bg-gray-100/50 text-gray-500 text-xs border border-gray-200/50">{{ row.dept }}</span>
                    </td>
                    <td v-for="m in monthKeys" :key="m" class="px-4 py-3.5 text-sm text-gray-700 border-b border-gray-100/80 whitespace-nowrap text-center p-2">
                      <div class="py-1.5 rounded-lg text-xs transition-transform hover:scale-105" :class="getCellColor(row.monthlyHours[m], columnValues[m])">{{ row.monthlyHours[m].toFixed(2) }}</div>
                    </td>
                    <td class="px-4 py-3.5 text-sm text-gray-600 border-b border-gray-100/80 whitespace-nowrap text-center bg-blue-50/10 font-medium">{{ row.stats.missingCard }}</td>
                    <td class="px-4 py-3.5 text-sm text-gray-400 border-b border-gray-100/80 whitespace-nowrap text-center">{{ row.stats.businessTrip || '-' }}</td>
                    <td class="px-4 py-3.5 text-sm text-gray-400 border-b border-gray-100/80 whitespace-nowrap text-center">{{ row.stats.compLeave || '-' }}</td>
                    <td class="px-4 py-3.5 text-sm text-gray-400 border-b border-gray-100/80 whitespace-nowrap text-center">{{ row.stats.leave || '-' }}</td>
                    <td class="px-4 py-3.5 text-sm text-gray-400 border-b border-gray-100/80 whitespace-nowrap text-center">{{ row.stats.late || '-' }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <ReportFooterCard color="green" label="平均工时" :val="footerStats.avgAll" unit="h" desc="健康水平"></ReportFooterCard>
            <ReportFooterCard color="orange" label="补卡最多" :val="footerStats.maxMissingUser?.stats.missingCard" unit="次" :user="footerStats.maxMissingUser?.name"></ReportFooterCard>
            <ReportFooterCard color="blue" label="请假最多" :val="footerStats.maxLeaveUser?.stats.leave" unit="天" :user="footerStats.maxLeaveUser?.name"></ReportFooterCard>
            <ReportFooterCard color="red" label="迟到最多" :val="footerStats.maxLateUser?.stats.late" unit="次" :user="footerStats.maxLateUser?.name"></ReportFooterCard>
          </div>
        </div>
      </transition>
    </main>
  </div>
</template>
