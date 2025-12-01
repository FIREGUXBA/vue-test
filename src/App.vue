<script setup>
import { ref, computed, provide } from 'vue'
import { useRoute } from 'vue-router'
import IconSearch from './components/icons/IconSearch.vue'
import IconChart from './components/icons/IconChart.vue'
import IconTable from './components/icons/IconTable.vue'
import IconSave from './components/icons/IconSave.vue'
import { generateData } from './utils/data'
import ToastNotification from './components/ToastNotification.vue'
const currentRoute = useRoute()

const data = ref(generateData())
const filterDept = ref('全部')
const searchTerm = ref('')
const toastState = ref({
  show: false,
  message: '',
  type: 'success'
})

let toastTimer = null

const showToast = (message, type = 'success') => {
  // 如果已有 Toast，先快速关闭再显示新的（可选，这里直接覆盖）
  if (toastTimer) clearTimeout(toastTimer)
  
  toastState.value = {
    show: true,
    message,
    type
  }

  // 3秒后自动消失
  toastTimer = setTimeout(() => {
    toastState.value.show = false
  }, 3000)
}

// [新增] 提供给子组件使用
provide('showToast', showToast)
// 通过 provide 共享数据给子组件
provide('filterDept', filterDept)
provide('searchTerm', searchTerm)
provide('data', data)

const departments = computed(() => ['全部', ...new Set(data.value.map(i => i.dept))])

const currentView = computed(() => {
  if (currentRoute.path === '/dashboard') return 'dashboard'
  if (currentRoute.path === '/report') return 'report'
  if (currentRoute.path === '/config') return 'config'
  return 'dashboard'
})
</script>

<template>
  <div class="min-h-screen pb-20 text-slate-800 selection:bg-blue-100 selection:text-blue-900">
    <ToastNotification 
      :show="toastState.show" 
      :message="toastState.message" 
      :type="toastState.type" 
    />
    <main class="max-w-7xl mx-auto px-6 pt-8">
      <!-- 控制栏 -->
      <div class="flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
        <!-- 视图切换器 -->
        <nav class="bg-gray-200/50 p-1 rounded-lg flex items-center border border-white/20 shadow-inner relative">
          <div
            class="absolute inset-y-1 bg-white rounded-md shadow-[0_2px_8px_rgba(0,0,0,0.08)] border border-gray-100 tab-bg z-0 transition-all duration-300"
            :style="{ 
              left: currentView === 'dashboard' ? '4px' : currentView === 'report' ? 'calc(0% + 2px)' : 'calc(50% + 2px)', 
              width: 'calc(50% - 4px)' 
            }"></div>
          <!-- <router-link to="/dashboard"
            class="relative z-10 px-4 py-1.5 rounded-md text-xs font-semibold transition-colors flex items-center gap-2 w-24 justify-center"
            :class="currentView === 'dashboard' ? 'text-gray-800' : 'text-gray-500 hover:text-gray-600'">
            <IconChart class="w-3.5 h-3.5"></IconChart> 概览
          </router-link> -->
          <router-link to="/report"
            class="relative z-10 px-4 py-1.5 rounded-md text-xs font-semibold transition-colors flex items-center gap-2 w-24 justify-center"
            :class="currentView === 'report' ? 'text-gray-800' : 'text-gray-500 hover:text-gray-600'">
            <IconTable class="w-3.5 h-3.5"></IconTable> 报表
          </router-link>
          <router-link to="/config"
            class="relative z-10 px-4 py-1.5 rounded-md text-xs font-semibold transition-colors flex items-center gap-2 w-24 justify-center"
            :class="currentView === 'config' ? 'text-gray-800' : 'text-gray-500 hover:text-gray-600'">
            <IconSave class="w-3.5 h-3.5"></IconSave> 配置
          </router-link>
        </nav>

        <!-- 部门筛选 (仅在 Dashboard 页面显示) -->
        <div v-if="currentView === 'dashboard'" class="flex items-center gap-2 overflow-x-auto no-scrollbar w-full md:w-auto pb-2 md:pb-0 px-1">
          <button v-for="dept in departments" :key="dept" @click="filterDept = dept"
            class="px-5 py-1.5 text-xs font-semibold rounded-full whitespace-nowrap transition-all duration-300 border"
            :class="filterDept === dept
              ? 'bg-gray-800 text-white border-gray-800 shadow-lg shadow-gray-800/20 scale-105'
              : 'bg-white/80 text-gray-500 border-transparent hover:bg-white hover:shadow-sm backdrop-blur-sm'">
            {{ dept }}
          </button>
        </div>

        <!-- 搜索框 (仅在 Dashboard 页面显示) -->
        <div v-if="currentView === 'dashboard'" class="relative w-full md:w-72 group">
          <div
            class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors duration-300">
            <IconSearch class="w-4 h-4"></IconSearch>
          </div>
          <input type="text" placeholder="搜索员工姓名..." v-model="searchTerm"
            class="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm border border-transparent focus:border-blue-500/30 bg-gray-100/60 hover:bg-gray-200/60 transition-all duration-300 focus:bg-white focus:ring-2 focus:ring-blue-500/20 outline-none backdrop-blur-sm" />
        </div>
      </div>

      <!-- 路由视图 -->
      <transition name="page" mode="out-in">
        <router-view></router-view>
      </transition>
    </main>
  </div>
</template>
