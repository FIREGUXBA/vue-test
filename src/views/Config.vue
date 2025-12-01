<script setup>
import { ref, onMounted, watch, inject } from 'vue'
import IconFileText from '../components/icons/IconFileText.vue'
import IconBriefcase from '../components/icons/IconBriefcase.vue'
import IconSave from '../components/icons/IconSave.vue'
import IconCalendarDays from '../components/icons/IconCalendarDays.vue'
import IconChevronDown from '../components/icons/IconChevronDown.vue'
import IconSparkles from '../components/icons/IconSparkles.vue'
import { getConfigFiles, saveConfig, getConfig } from '../utils/api/modules/config'
const showToast = inject('showToast')
//当前选中的月份
const currentMonth = ref('')

// 文件列表数据
const dailyFiles = ref([])
const monthlyFiles = ref([])

// 选中的文件
const selectedDailyFile = ref('')
const selectedMonthlyFile = ref('')

//输出设置
const outputFile = ref('90001.xlsx')
const workDays = ref(22)
const SAVE_TO_DATABASE = ref(false) // 是否保存到数据库，默认false

//获取当前配置
const getCurrentConfig = async () => {
  try {
    const config = await getConfig()
    selectedDailyFile.value = config.DAILY_STATS_FILE
    selectedMonthlyFile.value = config.MONTHLY_SUMMARY_FILE
    outputFile.value = config.OUTPUT_FILE
    workDays.value = config.WORK_DAYS
    SAVE_TO_DATABASE.value = config.SAVE_TO_DATABASE
  } catch (error) {
    console.error('获取当前配置失败:', error)
  }
}

// 加载文件列表
const loadFiles = async () => {
  try {
    // 加载每日统计文件
    const dailyData = await getConfigFiles('daily')
    dailyFiles.value = Array.isArray(dailyData) ? dailyData : (dailyData?.files || [])
    if (dailyFiles.value.length > 0 && !selectedDailyFile.value) {
      selectedDailyFile.value = dailyFiles.value[0]
    }

    // 加载月度汇总文件
    const monthlyData = await getConfigFiles('monthly')
    monthlyFiles.value = Array.isArray(monthlyData) ? monthlyData : (monthlyData?.files || [])
    if (monthlyFiles.value.length > 0 && !selectedMonthlyFile.value) {
      selectedMonthlyFile.value = monthlyFiles.value[0]
    }
    
    // 加载完成后检查月份
    checkMonth()
  } catch (error) {
    console.error('加载文件列表失败:', error)
  }
}

//检查月份是否一致并设置当前月份
const checkMonth = () => {
  if (selectedDailyFile.value && selectedMonthlyFile.value) {
    // 从文件名中提取日期部分：杭州安恒信息技术股份有限公司_每日统计_20251001-20251031.xlsx
    const dailyDatePart = selectedDailyFile.value.split('_')[2]?.replace('.xlsx', '') || ''
    const monthlyDatePart = selectedMonthlyFile.value.split('_')[2]?.replace('.xlsx', '') || ''
    
    // 从日期范围中提取月份（格式：20251001-20251031，月份在第5-6位）
    const dailyMonth = dailyDatePart.substring(4, 6)
    const monthlyMonth = monthlyDatePart.substring(4, 6)
    
    if (dailyMonth && monthlyMonth && dailyMonth === monthlyMonth) {
      // 去掉前导零，如 "10" 而不是 "10"，"09" 转为 "9"
      currentMonth.value = parseInt(dailyMonth, 10).toString()
      return true
    }
  }
  currentMonth.value = ''
  return false
}

// 保存配置函数
const saveConfigFunction = async () => {
  try{
    await saveConfig({
      DAILY_STATS_FILE: selectedDailyFile.value,
      MONTHLY_SUMMARY_FILE: selectedMonthlyFile.value,
      OUTPUT_FILE: outputFile.value,
      WORK_DAYS: workDays.value,
      SAVE_TO_DATABASE: SAVE_TO_DATABASE.value
    })
    // [新增] 调用弹窗
    showToast('配置保存成功') 
  } catch (error) {
    console.error('配置保存失败:', error)
    // [新增] 失败也可以调用
    showToast('配置保存失败，请重试', 'error')
  }
}

// 监听文件选择变化，自动检查月份
watch([selectedDailyFile, selectedMonthlyFile], () => {
  checkMonth()
})

// 组件挂载时加载文件列表
onMounted(() => {
  getCurrentConfig()
  loadFiles()
})
</script>

<template>
  <div class="max-w-3xl mx-auto pb-20">
    <!-- Header -->
    <div class="flex items-end justify-between mb-6 px-1">
      <div>
        <h2 class="text-2xl font-bold text-gray-900 tracking-tight">配置</h2>
        <p class="text-[13px] text-gray-500 mt-1">管理数据源与输出参数</p>
      </div>
      <div class="flex items-center gap-2 px-3 py-1 bg-white/60 border border-gray-200/60 rounded-full shadow-sm backdrop-blur-md">
        <div v-if="currentMonth" class="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
        <div v-else class="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
        <span v-if="currentMonth" class="text-[11px] font-medium text-gray-600">{{currentMonth}}月 · 月份一致</span>
        <span v-else class="text-[11px] font-medium text-gray-600">月份不一致</span>
      </div>
    </div>

    <!-- Group 1: Data Sources -->
    <div class="bg-white/80 backdrop-blur-md border border-gray-200 shadow-sm rounded-xl overflow-hidden mb-6">
      <!-- Section Header -->
      <div class="px-4 py-2 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2">
        <span class="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">数据源</span>
      </div>
      
      <!-- Item 1 -->
      <div class="group p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
        <div class="flex items-center gap-3 min-w-[180px]">
          <div class="w-8 h-8 rounded-lg bg-[#007AFF] flex items-center justify-center text-white shadow-sm">
            <IconFileText class="w-4 h-4"></IconFileText>
          </div>
          <div class="flex flex-col">
            <span class="text-[13px] font-medium text-gray-900">每日统计文件</span>
            <span class="text-[11px] text-gray-500">Excel 源数据</span>
          </div>
        </div>
        <div class="flex-1 w-full sm:w-auto relative">
          <select v-model="selectedDailyFile" class="w-full appearance-none bg-gray-200/50 hover:bg-gray-200 text-gray-700 text-[13px] rounded-lg pl-3 pr-8 py-1.5 border border-transparent focus:bg-white focus:border-blue-500/30 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none cursor-pointer">
            <option v-for="file in dailyFiles" :key="file" :value="file">{{ file }}</option>
            <option v-if="dailyFiles.length === 0" disabled>暂无文件</option>
          </select>
          <div class="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none text-gray-400">
            <IconChevronDown class="w-3.5 h-3.5"></IconChevronDown>
          </div>
        </div>
      </div>

      <!-- Item 2 -->
      <div class="group p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-gray-50/50 transition-colors">
        <div class="flex items-center gap-3 min-w-[180px]">
          <div class="w-8 h-8 rounded-lg bg-[#AF52DE] flex items-center justify-center text-white shadow-sm">
            <IconBriefcase class="w-4 h-4"></IconBriefcase>
          </div>
          <div class="flex flex-col">
            <span class="text-[13px] font-medium text-gray-900">月度汇总</span>
            <span class="text-[11px] text-gray-500">含补卡次数</span>
          </div>
        </div>
        <div class="flex-1 w-full sm:w-auto relative">
          <select v-model="selectedMonthlyFile" class="w-full appearance-none bg-gray-200/50 hover:bg-gray-200 text-gray-700 text-[13px] rounded-lg pl-3 pr-8 py-1.5 border border-transparent focus:bg-white focus:border-purple-500/30 focus:ring-2 focus:ring-purple-500/20 transition-all outline-none cursor-pointer">
            <option v-for="file in monthlyFiles" :key="file" :value="file">{{ file }}</option>
            <option v-if="monthlyFiles.length === 0" disabled>暂无文件</option>
          </select>
          <div class="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none text-gray-400">
            <IconChevronDown class="w-3.5 h-3.5"></IconChevronDown>
          </div>
        </div>
      </div>
    </div>

    <!-- Group 2: Output -->
    <div class="bg-white/80 backdrop-blur-md border border-gray-200 shadow-sm rounded-xl overflow-hidden mb-8">
      <div class="px-4 py-2 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2">
        <span class="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">输出设置</span>
      </div>

      <!-- Item 3 -->
      <div class="group p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 hover:bg-gray-50 transition-colors">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-lg bg-[#FF9500] flex items-center justify-center text-white shadow-sm">
            <IconSave class="w-4 h-4"></IconSave>
          </div>
          <label class="text-[13px] font-medium text-gray-900">输出文件名</label>
        </div>
        <input type="text" v-model="outputFile" class="w-full sm:w-64 text-right bg-gray-200/50 hover:bg-gray-200 text-gray-700 text-[13px] rounded-lg px-3 py-1.5 border border-transparent focus:bg-white focus:border-orange-500/30 focus:ring-2 focus:ring-orange-500/20 transition-all outline-none placeholder-gray-400" />
      </div>

      <!-- Item 4 -->
      <div class="group p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-lg bg-[#34C759] flex items-center justify-center text-white shadow-sm">
            <IconCalendarDays class="w-4 h-4"></IconCalendarDays>
          </div>
          <label class="text-[13px] font-medium text-gray-900">标准工作天数</label>
        </div>
        <div class="flex items-center gap-2">
          <input type="number" v-model="workDays" class="w-20 text-right bg-gray-200/50 hover:bg-gray-200 text-gray-700 text-[13px] rounded-lg px-3 py-1.5 border border-transparent focus:bg-white focus:border-green-500/30 focus:ring-2 focus:ring-green-500/20 transition-all outline-none" />
          <span class="text-[13px] text-gray-400">天</span>
        </div>
      </div>

      <!-- Item 5: 保存到数据库选项 -->
      <div class="group p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-gray-50/50 transition-colors">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-lg bg-[#5856D6] flex items-center justify-center text-white shadow-sm">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
            </svg>
          </div>
          <label class="text-[13px] font-medium text-gray-900">保存到数据库</label>
        </div>
        <label class="relative inline-flex items-center cursor-pointer">
          <input type="checkbox" v-model="SAVE_TO_DATABASE" class="sr-only peer" />
          <div class="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#007AFF]"></div>
        </label>
      </div>
    </div>

    <!-- Actions -->
    <div class="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
      <button class="px-4 py-1.5 text-[13px] font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all shadow-sm active:scale-95 active:bg-gray-100">
        重置
      </button>
      <button @click="saveConfigFunction" class="px-4 py-1.5 text-[13px] font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-900 transition-all shadow-sm active:scale-95 flex items-center gap-1.5 active:bg-gray-100">
        <IconSave class="w-3.5 h-3.5"></IconSave>
        保存配置
      </button>
      <div class="w-px h-5 bg-gray-300 mx-1"></div>
      <button class="px-5 py-1.5 text-[13px] font-medium text-white bg-[#007AFF] rounded-lg hover:bg-[#0062CC] shadow-sm transition-all active:scale-95 flex items-center gap-1.5 active:bg-[#0051A8]">
        <IconSparkles class="w-3.5 h-3.5"></IconSparkles>
        生成报表
      </button>
    </div>
  </div>
</template>

