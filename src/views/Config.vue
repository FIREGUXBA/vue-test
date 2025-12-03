<script setup>
import { ref, onMounted, watch, inject, computed } from 'vue'
import IconFileText from '../components/icons/IconFileText.vue'
import IconBriefcase from '../components/icons/IconBriefcase.vue'
import IconSave from '../components/icons/IconSave.vue'
import IconCalendarDays from '../components/icons/IconCalendarDays.vue'
import IconChevronDown from '../components/icons/IconChevronDown.vue'
import IconSparkles from '../components/icons/IconSparkles.vue'
import IconDownload from '../components/icons/IconDownload.vue'
import { getConfigFiles, saveConfig, getConfig, resetConfig, executeProcessExcel, uploadFiles, downloadReportFile } from '../utils/api/modules/config'
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
const workDays = ref(22)
const SAVE_TO_DATABASE = ref(false) // 是否保存到数据库，默认false
const OVER_WRITE = ref(false) // 是否覆盖已有数据，默认false

// 是否已经生成报表，默认false
const hasGeneratedReport = ref(false)
// 最近生成的文件下载URL
const latestReportFileUrl = ref('')

// 已保存的配置快照（用于判断是否有未保存的更改）
const savedConfig = ref({
  DAILY_STATS_FILE: '',
  MONTHLY_SUMMARY_FILE: '',
  WORK_DAYS: 22,
  SAVE_TO_DATABASE: false,
  OVER_WRITE: false
})

// 判断是否有未保存的更改
const hasUnsavedChanges = computed(() => {
  return (
    selectedDailyFile.value !== savedConfig.value.DAILY_STATS_FILE ||
    selectedMonthlyFile.value !== savedConfig.value.MONTHLY_SUMMARY_FILE ||
    workDays.value !== savedConfig.value.WORK_DAYS ||
    SAVE_TO_DATABASE.value !== savedConfig.value.SAVE_TO_DATABASE ||
    OVER_WRITE.value !== savedConfig.value.OVER_WRITE
  )
})

// 判断月份是否一致
const isMonthConsistent = computed(() => {
  return !!currentMonth.value
})

// 判断是否可以生成报表
const canGenerateReport = computed(() => {
  return !hasUnsavedChanges.value && isMonthConsistent.value
})

// 判断是否可以下载报表
const canDownloadReport = computed(() => {
  return hasGeneratedReport.value && latestReportFileUrl.value && !isProcessing.value
})

// 获取错误提示信息
const errorMessage = computed(() => {
  if (hasUnsavedChanges.value && !isMonthConsistent.value) {
    return '请先保存配置，并确保月份一致'
  } else if (hasUnsavedChanges.value) {
    return '请先保存配置后再生成报表'
  } else if (!isMonthConsistent.value) {
    return '月份不一致，无法生成报表'
  }
  return ''
})
const downloadMessage = computed(() => {
  if (hasGeneratedReport.value && latestReportFileUrl.value) {
    // 从URL中提取文件名
    const filename = latestReportFileUrl.value.split('/').pop() || 'report.xlsx'
    return filename
  }
  if (!canDownloadReport.value) {
    return '请先生成报表后再下载'
  }
  return ''
})
// 保存按钮错误提示信息
const saveErrorMessage = computed(() => {
  if (!isMonthConsistent.value) {
    return '月份不一致，无法保存'
  }
  return ''
})
// hover状态
const showTooltip = ref(false)
const showTooltip2 = ref(false)
const showTooltip3 = ref(false)
// 处理状态
const isProcessing = ref(false)

// 文件上传相关状态
const isDragging = ref(false)
const isUploading = ref(false)
const fileInputRef = ref(null)

//获取当前配置
const getCurrentConfig = async () => {
  try {
    const config = await getConfig()
    selectedDailyFile.value = config.DAILY_STATS_FILE
    selectedMonthlyFile.value = config.MONTHLY_SUMMARY_FILE
    workDays.value = config.WORK_DAYS
    SAVE_TO_DATABASE.value = config.SAVE_TO_DATABASE
    OVER_WRITE.value = config.OVER_WRITE
    // 更新已保存的配置快照
    savedConfig.value = {
      DAILY_STATS_FILE: config.DAILY_STATS_FILE,
      MONTHLY_SUMMARY_FILE: config.MONTHLY_SUMMARY_FILE,
      WORK_DAYS: config.WORK_DAYS,
      SAVE_TO_DATABASE: config.SAVE_TO_DATABASE,
      OVER_WRITE: config.OVER_WRITE
    }
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
  try {
    await saveConfig({
      DAILY_STATS_FILE: selectedDailyFile.value,
      MONTHLY_SUMMARY_FILE: selectedMonthlyFile.value,
      WORK_DAYS: workDays.value,
      SAVE_TO_DATABASE: SAVE_TO_DATABASE.value,
      OVER_WRITE: OVER_WRITE.value
    })
    // 更新已保存的配置快照
    savedConfig.value = {
      DAILY_STATS_FILE: selectedDailyFile.value,
      MONTHLY_SUMMARY_FILE: selectedMonthlyFile.value,
      WORK_DAYS: workDays.value,
      SAVE_TO_DATABASE: SAVE_TO_DATABASE.value,
      OVER_WRITE: OVER_WRITE.value
    }
    showToast('配置保存成功')
    await getCurrentConfig()
    await loadFiles()
  } catch (error) {
    console.error('配置保存失败:', error)
    showToast('配置保存失败，请重试', 'error')
  }
}

// 重置配置函数
const resetConfigFunction = async () => {
  try {
    await resetConfig()
    showToast('配置重置成功')
    await getCurrentConfig()
    await loadFiles()
  } catch (error) {
    console.error('配置重置失败:', error)
    showToast('配置重置失败，请重试', 'error')
  }
}

// 执行处理函数
const executeProcessExcelFunction = async () => {
  if (!canGenerateReport.value) {
    showToast(errorMessage.value, 'error')
    return
  }
  if (isProcessing.value) {
    return
  }
  try {
    isProcessing.value = true
    const response = await executeProcessExcel()
    // 保存返回的文件下载URL
    if (response && response.file_url) {
      latestReportFileUrl.value = response.file_url
      hasGeneratedReport.value = true
      showToast('处理成功，可以下载报表')
    } else {
      // 兼容旧版本API，如果没有返回文件URL，仍然标记为已生成
      hasGeneratedReport.value = true
      showToast('处理成功')
    }
    await getCurrentConfig()
    await loadFiles()
  } catch (error) {
    console.error('处理失败:', error)
    showToast('处理失败，请重试', 'error')
    hasGeneratedReport.value = false
    latestReportFileUrl.value = ''
  } finally {
    isProcessing.value = false
  }
}

// 下载报表函数
const downloadReport = async () => {
  if (!latestReportFileUrl.value) {
    showToast('没有可下载的报表文件', 'error')
    return
  }
  try {
    // 从URL中提取文件名
    const filename = latestReportFileUrl.value.split('/').pop() || 'report.xlsx'
    // 直接使用返回的URL下载文件
    await downloadReportFile(latestReportFileUrl.value, filename)
    showToast('报表下载成功')
  } catch (error) {
    console.error('下载失败:', error)
    showToast('报表下载失败，请重试', 'error')
  }
}

// 处理文件上传
const handleFileChange = async (event) => {
  const file = event.target.files?.[0]
  if (!file) return

  // 验证文件类型
  if (!file.name.endsWith('.xlsx')) {
    showToast('请上传 .xlsx 格式的文件', 'error')
    return
  }

  await uploadFileHandler(file)
}

// 文件上传处理函数
const uploadFileHandler = async (files) => {
  try {
    isUploading.value = true
    await uploadFiles(files)
    showToast('文件上传成功')
    // 重新加载文件列表
    await loadFiles()
  } catch (error) {
    console.error('文件上传失败:', error)
    showToast('文件上传失败，请重试', 'error')
  } finally {
    isUploading.value = false
    // 清空 input 值，以便可以重复选择同一文件
    if (fileInputRef.value) {
      fileInputRef.value.value = ''
    }
  }
}

// 处理拖拽事件
const handleDragOver = (event) => {
  event.preventDefault()
  event.stopPropagation()
  isDragging.value = true
}

const handleDragLeave = (event) => {
  event.preventDefault()
  event.stopPropagation()
  isDragging.value = false
}

const handleDrop = async (event) => {
  event.preventDefault()
  event.stopPropagation()
  isDragging.value = false
  const validFiles = Array.from(event.dataTransfer.files).filter(f => f.name.endsWith('.xlsx'))

if (validFiles.length === 0) {
  showToast('请上传 .xlsx 格式的文件', 'error')
  return
}

await uploadFileHandler(validFiles)

}

// 点击上传区域触发文件选择
const handleClickUpload = () => {
  fileInputRef.value?.click()
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
    </div>

    <!-- Upload Section 上传文件区域-->
    <div class="bg-white border border-gray-200/80 shadow-[0_1px_2px_rgba(0,0,0,0.03)] rounded-xl overflow-hidden mb-6">

      <div class="p-1.5">
        <input ref="fileInputRef" id="fileInput" type="file" @change="handleFileChange" class="hidden" accept=".xlsx"
          :disabled="isUploading">
        <div @click="handleClickUpload" @dragover="handleDragOver" @dragleave="handleDragLeave" @drop="handleDrop"
          :class="[
            'relative w-full min-h-[140px] flex flex-col items-center justify-center rounded-lg transition-all duration-300 ease-out cursor-pointer',
            isDragging
              ? 'bg-[#007AFF]/10 border-2 border-[#007AFF] shadow-inner'
              : 'bg-gray-50/50 hover:bg-gray-100/70 border border-gray-200/60 hover:border-gray-300/60',
            isUploading && 'opacity-70 pointer-events-none cursor-not-allowed'
          ]">
          <!-- Content Container -->
          <div class="relative z-10 flex flex-col items-center text-center p-4">

            <!-- Icon -->
            <div :class="[
              'mb-3 transition-transform duration-300',
              isDragging ? 'scale-110' : ''
            ]">
              <svg v-if="isUploading" class="w-10 h-10 animate-spin text-[#007AFF]" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
                </path>
              </svg>
              <!-- macOS style cloud upload icon -->
              <svg v-else class="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"
                stroke-width="1.2">
                <path stroke-linecap="round" stroke-linejoin="round"
                  d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
            </div>

            <!-- Text -->
            <div class="space-y-1">
              <h3 class="text-[14px] font-semibold text-gray-700">
                {{ isUploading ? '正在导入...' : isDragging ? '松开以上传' : '拖拽或点击上传文件' }}
              </h3>
              <p class="text-[12px] text-gray-400 font-medium">
                支持 .xlsx 格式
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Group 1: Data Sources Selection 数据源选择区域-->
    <div class="bg-white/80 border border-gray-200 shadow-sm rounded-xl overflow-hidden mb-6">
      <!-- Section Header -->
      <div class="px-4 py-2 border-b border-gray-100 bg-gray-50/50 flex items-center justify-end gap-2">
        <div class="flex items-center gap-2 px-3 ">
          <div v-if="currentMonth" class="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_6px_rgba(74,222,128,0.4)] ">
          </div>
          <div v-else class="w-2 h-2 rounded-full bg-red-500 "></div>
          <span v-if="currentMonth" class="text-[11px] font-medium text-gray-600">{{ currentMonth }}月 · 月份一致</span>
          <span v-else class="text-[11px] font-medium text-gray-600">月份不一致</span>
        </div>
      </div>

      <!-- Item 1 -->
      <div
        class="group p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
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
          <select v-model="selectedDailyFile"
            class="w-full appearance-none bg-gray-200/50 hover:bg-gray-200 text-gray-700 text-[13px] rounded-lg pl-3 pr-8 py-1.5 border border-transparent focus:bg-white focus:border-blue-500/30 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none cursor-pointer">
            <option v-for="file in dailyFiles" :key="file" :value="file">{{ file }}</option>
            <option v-if="dailyFiles.length === 0" disabled>暂无文件</option>
          </select>
          <div class="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none text-gray-400">
            <IconChevronDown class="w-3.5 h-3.5"></IconChevronDown>
          </div>
        </div>
      </div>

      <!-- Item 2 -->
      <div
        class="group p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-gray-50/50 transition-colors">
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
          <select v-model="selectedMonthlyFile"
            class="w-full appearance-none bg-gray-200/50 hover:bg-gray-200 text-gray-700 text-[13px] rounded-lg pl-3 pr-8 py-1.5 border border-transparent focus:bg-white focus:border-purple-500/30 focus:ring-2 focus:ring-purple-500/20 transition-all outline-none cursor-pointer">
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
    <div class="bg-white/80  border border-gray-200 shadow-sm rounded-xl overflow-hidden mb-1">


      <!-- Item 3 -->
      <!-- <div class="group p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 hover:bg-gray-50 transition-colors">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-lg bg-[#FF9500] flex items-center justify-center text-white shadow-sm">
            <IconSave class="w-4 h-4"></IconSave>
          </div>
          <label class="text-[13px] font-medium text-gray-900">输出文件名</label>
        </div>
        <input type="text" v-model="outputFile" class="w-full sm:w-64 text-right bg-gray-200/50 hover:bg-gray-200 text-gray-700 text-[13px] rounded-lg px-3 py-1.5 border border-transparent focus:bg-white focus:border-orange-500/30 focus:ring-2 focus:ring-orange-500/20 transition-all outline-none placeholder-gray-400" />
      </div> -->

      <!-- Item 4 -->
      <div
        class="group p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-lg bg-[#34C759] flex items-center justify-center text-white shadow-sm">
            <IconCalendarDays class="w-4 h-4"></IconCalendarDays>
          </div>
          <label class="text-[13px] font-medium text-gray-900">标准工作天数</label>
        </div>
        <div class="flex items-center gap-2">
          <input type="number" v-model="workDays"
            class="w-20 text-right bg-gray-200/50 hover:bg-gray-200 text-gray-700 text-[13px] rounded-lg px-3 py-1.5 border border-transparent focus:bg-white focus:border-green-500/30 focus:ring-2 focus:ring-green-500/20 transition-all outline-none" />
          <span class="text-[13px] text-gray-400">天</span>
        </div>
      </div>

      <!-- Item 5: 保存到数据库选项 -->
      <div
        class="group p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-gray-50/50 transition-colors">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-lg bg-[#5856D6] flex items-center justify-center text-white shadow-sm">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round"
                d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
            </svg>
          </div>
          <label class="text-[13px] font-medium text-gray-900">保存到数据库</label>
        </div>
        <label class="relative inline-flex items-center cursor-pointer">
          <input type="checkbox" v-model="SAVE_TO_DATABASE" class="sr-only peer" />
          <div
            class="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#5856D6]">
          </div>
        </label>
      </div>
      <!-- Item 6: 覆盖选项 -->
      <div v-if="SAVE_TO_DATABASE"
        class="group p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-gray-50/50 transition-colors">
        <div class="flex items-center gap-3">
          <div v-if="OVER_WRITE"
            class="w-8 h-8 rounded-lg bg-[#FF3B30] flex items-center justify-center text-white shadow-sm">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
          <div v-else class="w-8 h-8 rounded-lg bg-[#999999] flex items-center justify-center text-white shadow-sm">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
          <label v-if="OVER_WRITE" class="text-[13px] font-medium text-red-600">覆盖已有数据</label>
          <label v-else class="text-[13px] font-medium text-gray-600">覆盖已有数据</label>
        </div>
        <label class="relative inline-flex items-center cursor-pointer">
          <input type="checkbox" v-model="OVER_WRITE" class="sr-only peer" />
          <div
            class="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-red-500/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#FF3B30]">
          </div>
        </label>
      </div>
    </div>

    <!-- Actions -->
    <div class="flex items-center justify-end gap-3 pt-4 ">
      <button @click="resetConfigFunction" :disabled="isProcessing" :class="[
        'px-4 py-1.5 text-[13px] font-medium rounded-lg transition-all shadow-sm',
        isProcessing
          ? 'text-gray-400 bg-gray-100 border border-gray-200 cursor-not-allowed'
          : 'text-gray-600 bg-white border border-gray-300 hover:bg-gray-50 active:scale-95 active:bg-gray-100'
      ]">
        重置
      </button>
      <div class="relative" @mouseenter="showTooltip3 = true" @mouseleave="showTooltip3 = false">
        <button @click="saveConfigFunction" :disabled="isProcessing || !isMonthConsistent" :class="[
          'px-4 py-1.5 text-[13px] font-medium rounded-lg transition-all shadow-sm flex items-center gap-1.5',
          isProcessing || !isMonthConsistent
            ? 'text-gray-400 bg-gray-100 border border-gray-200 cursor-not-allowed'
            : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 hover:text-gray-900 active:scale-95 active:bg-gray-100'
        ]">
          <IconSave class="w-3.5 h-3.5"></IconSave>
          保存配置
        </button>
        <Transition name="tooltip">
          <div v-if="showTooltip3 && !isProcessing && saveErrorMessage"
            class="absolute bottom-full right-0 mb-2 px-3 py-2 bg-gray-900 text-white text-[12px] rounded-lg shadow-lg whitespace-nowrap z-50 pointer-events-none">
            {{ saveErrorMessage }}
            <div
              class="absolute top-full right-6 w-0 h-0 border-l-[6px] border-r-[6px] border-t-[6px] border-transparent border-t-gray-900">
            </div>
          </div>
        </Transition>
      </div>

      <div class="relative" @mouseenter="showTooltip = true" @mouseleave="showTooltip = false">
        <button @click="executeProcessExcelFunction" :disabled="!canGenerateReport || isProcessing" :class="[
          'px-5 py-1.5 text-[13px] font-medium rounded-lg shadow-sm transition-all flex items-center gap-1.5',
          canGenerateReport && !isProcessing
            ? 'text-white bg-[#007AFF] hover:bg-[#0062CC] active:scale-95 active:bg-[#0051A8]'
            : 'text-gray-400 bg-gray-200 cursor-not-allowed'
        ]">
          <IconSparkles :class="['w-3.5 h-3.5', { 'animate-spin': isProcessing }]"></IconSparkles>
          {{ isProcessing ? '处理中....' : '生成报表' }}
        </button>
        <!-- Tooltip -->
        <Transition name="tooltip">
          <div v-if="showTooltip && !canGenerateReport && !isProcessing && errorMessage"
            class="absolute bottom-full right-0 mb-2 px-3 py-2 bg-gray-900 text-white text-[12px] rounded-lg shadow-lg whitespace-nowrap z-50 pointer-events-none">
            {{ errorMessage }}
            <div
              class="absolute top-full right-6 w-0 h-0 border-l-[6px] border-r-[6px] border-t-[6px] border-transparent border-t-gray-900">
            </div>
          </div>
        </Transition>
      </div>
      <div class="relative" @mouseenter="showTooltip2 = true" @mouseleave="showTooltip2 = false">
        <button @click="downloadReport" :disabled="!canDownloadReport" :class="[
          'px-4 py-1.5 text-[13px] font-medium rounded-lg transition-all shadow-sm flex items-center gap-1.5',
          canDownloadReport
            ? 'text-gray-600 bg-white border border-gray-300 hover:bg-gray-50 active:scale-95 active:bg-gray-100'
            : 'text-gray-400 bg-gray-100 border border-gray-200 cursor-not-allowed'
        ]">
          <IconDownload class="w-3.5 h-3.5"></IconDownload>
          下载报表
        </button>
        <Transition name="tooltip">
          <div v-if="showTooltip2 && !isProcessing && downloadMessage"
            class="absolute bottom-full right-0 mb-2 px-3 py-2 bg-gray-900 text-white text-[12px] rounded-lg shadow-lg whitespace-nowrap z-50 pointer-events-none">
            {{ downloadMessage }}
            <div
              class="absolute top-full right-6 w-0 h-0 border-l-[6px] border-r-[6px] border-t-[6px] border-transparent border-t-gray-900">
            </div>
          </div>
        </Transition>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Tooltip 动画 */
.tooltip-enter-active {
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.tooltip-leave-active {
  transition: all 0.15s cubic-bezier(0.33, 1, 0.68, 1);
}

.tooltip-enter-from,
.tooltip-leave-to {
  opacity: 0;
  transform: translateY(4px);
  scale: 0.95;
  transform-origin: right top;
}
</style>