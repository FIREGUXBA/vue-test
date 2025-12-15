<script setup>
import { ref, watch, onMounted } from 'vue'
import * as XLSX from 'xlsx'
import axios from 'axios'

const props = defineProps({
  fileUrl: {
    type: String,
    default: ''
  }
})

const isLoading = ref(false)
const error = ref('')
const sheets = ref([])
const currentSheetIndex = ref(0)
const tableData = ref([])
const headers = ref([])

// 获取文件URL（统一使用相对路径）
const getFullUrl = () => {
  if (!props.fileUrl) return ''
  
  // 统一使用相对路径，通过代理转发
  // 如果已经是完整URL，则直接使用（用于外部链接）
  if (props.fileUrl.startsWith('http')) {
    return props.fileUrl
  }
  
  // 如果已经以 /api 开头，直接使用
  if (props.fileUrl.startsWith('/api')) {
    return props.fileUrl
  }
  
  // 否则添加 /api 前缀
  return `/api${props.fileUrl.startsWith('/') ? '' : '/'}${props.fileUrl}`
}

// 加载并解析Excel文件
const loadExcelFile = async () => {
  if (!props.fileUrl) {
    sheets.value = []
    tableData.value = []
    headers.value = []
    return
  }

  try {
    isLoading.value = true
    error.value = ''
    
    const fullUrl = getFullUrl()
    const token = localStorage.getItem('token') || sessionStorage.getItem('token')
    
    // 获取文件
    const response = await axios.get(fullUrl, {
      responseType: 'arraybuffer',
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    })
    
    // 解析Excel文件
    const workbook = XLSX.read(response.data, { type: 'array' })
    
    // 获取所有工作表名称
    sheets.value = workbook.SheetNames
    
    // 加载第一个工作表
    if (sheets.value.length > 0) {
      currentSheetIndex.value = 0
      loadSheet(workbook, sheets.value[0])
    }
  } catch (err) {
    console.error('加载Excel文件失败:', err)
    error.value = '加载报表失败，请重试'
    sheets.value = []
    tableData.value = []
    headers.value = []
  } finally {
    isLoading.value = false
  }
}

// 加载指定工作表
const loadSheet = (workbook, sheetName) => {
  const worksheet = workbook.Sheets[sheetName]
  
  // 转换为JSON格式（保留原始格式）
  const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
    header: 1,
    defval: '',
    raw: false
  })
  
  if (jsonData.length === 0) {
    headers.value = []
    tableData.value = []
    return
  }
  
  // 第一行作为表头
  headers.value = jsonData[0] || []
  
  // 其余行作为数据
  tableData.value = jsonData.slice(1)
}

// 切换工作表
const switchSheet = async (index) => {
  if (index === currentSheetIndex.value) return
  
  try {
    isLoading.value = true
    const fullUrl = getFullUrl()
    const token = localStorage.getItem('token') || sessionStorage.getItem('token')
    
    const response = await axios.get(fullUrl, {
      responseType: 'arraybuffer',
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    })
    
    const workbook = XLSX.read(response.data, { type: 'array' })
    currentSheetIndex.value = index
    loadSheet(workbook, sheets.value[index])
  } catch (err) {
    console.error('切换工作表失败:', err)
    error.value = '切换工作表失败'
  } finally {
    isLoading.value = false
  }
}

// 监听fileUrl变化
watch(() => props.fileUrl, () => {
  if (props.fileUrl) {
    loadExcelFile()
  } else {
    sheets.value = []
    tableData.value = []
    headers.value = []
  }
}, { immediate: true })

onMounted(() => {
  if (props.fileUrl) {
    loadExcelFile()
  }
})
</script>

<template>
  <div v-if="fileUrl" class="bg-white border border-gray-200 shadow-sm rounded-xl overflow-hidden mt-6">
    <!-- Header -->
    <div class="px-4 py-3 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="w-8 h-8 rounded-lg bg-[#007AFF] flex items-center justify-center text-white shadow-sm">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <div>
          <h3 class="text-[14px] font-semibold text-gray-900">报表预览</h3>
          <p class="text-[11px] text-gray-500">{{ fileUrl.split('/').pop() }}</p>
        </div>
      </div>
      
      <!-- 工作表切换 -->
      <div v-if="sheets.length > 1" class="flex items-center gap-2">
        <span class="text-[11px] text-gray-500">工作表:</span>
        <div class="flex gap-1">
          <button
            v-for="(sheet, index) in sheets"
            :key="index"
            @click="switchSheet(index)"
            :class="[
              'px-2.5 py-1 text-[11px] font-medium rounded-md transition-all',
              currentSheetIndex === index
                ? 'bg-[#007AFF] text-white shadow-sm'
                : 'bg-gray-200/50 text-gray-600 hover:bg-gray-200'
            ]"
          >
            {{ sheet }}
          </button>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="flex items-center justify-center py-12">
      <div class="flex flex-col items-center gap-3">
        <svg class="w-8 h-8 animate-spin text-[#007AFF]" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p class="text-[12px] text-gray-500">正在加载报表...</p>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="px-4 py-8 text-center">
      <div class="inline-flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-200 rounded-lg">
        <svg class="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span class="text-[13px] text-red-600">{{ error }}</span>
      </div>
    </div>

    <!-- Table Preview -->
    <div v-else-if="tableData.length > 0" class="overflow-x-auto max-h-[600px]">
      <table class="w-full border-collapse table-fixed">
        <thead class="bg-gray-50 sticky top-0 z-10">
          <tr>
            <th
              v-for="(header, index) in headers"
              :key="index"
              class="px-2 pt-1 text-left text-[12px] font-semibold text-gray-700 border-b border-gray-200 break-words"
              style="width: 80px; max-width: 80px; word-break: break-word; overflow-wrap: break-word;"
            >
              {{ header || `列 ${index + 1}` }}
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
          <tr
            v-for="(row, rowIndex) in tableData"
            :key="rowIndex"
            class="hover:bg-gray-50/50 transition-colors"
          >
            <td
              v-for="(cell, cellIndex) in row"
              :key="cellIndex"
              class="px-2 py-2 text-[12px] text-gray-700 whitespace-nowrap overflow-hidden text-ellipsis"
              :class="{'sticky': cellIndex == 0 }"
            >
              {{ cell }}
            </td>
            <!-- 如果行数据少于表头，填充空单元格 -->
            <td
              v-for="n in Math.max(0, headers.length - row.length)"
              :key="`empty-${n}`"
              class="px-4 py-2 text-[12px] text-gray-400 whitespace-nowrap overflow-hidden text-ellipsis"
            >
              —
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Empty State -->
    <div v-else class="px-4 py-12 text-center">
      <div class="inline-flex flex-col items-center gap-2">
        <svg class="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p class="text-[12px] text-gray-400">暂无数据</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 自定义滚动条样式 */
:deep(.overflow-x-auto) {
  scrollbar-width: thin;
  scrollbar-color: rgba(156, 163, 175, 0.5) transparent;
}

:deep(.overflow-x-auto)::-webkit-scrollbar {
  height: 8px;
  width: 8px;
}

:deep(.overflow-x-auto)::-webkit-scrollbar-track {
  background: transparent;
}

:deep(.overflow-x-auto)::-webkit-scrollbar-thumb {
  background-color: rgba(156, 163, 175, 0.5);
  border-radius: 4px;
}

:deep(.overflow-x-auto)::-webkit-scrollbar-thumb:hover {
  background-color: rgba(156, 163, 175, 0.7);
}
</style>

