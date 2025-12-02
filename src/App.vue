<script setup>
import { ref, computed, provide } from 'vue'
import { useRoute } from 'vue-router'
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
  
  // 先设置为 false，然后立即设置为 true，确保 watch 能够触发
  toastState.value.show = false
  // 使用 nextTick 确保在下一个 tick 设置，触发 watch
  setTimeout(() => {
    toastState.value = {
      show: true,
      message,
      type
    }
  }, 10)

  // 3秒后自动消失（这个时间现在由组件内部管理，但保留以防需要）
  toastTimer = setTimeout(() => {
    toastState.value.show = false
  }, 3000)
}

provide('showToast', showToast)
// 通过 provide 共享数据给子组件
provide('filterDept', filterDept)
provide('searchTerm', searchTerm)
provide('data', data)

const departments = computed(() => ['全部', ...new Set(data.value.map(i => i.dept))])

const currentView = computed(() => {
  if (currentRoute.path === '/personal') return 'personal'
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
              left: currentView === 'personal' ? '4px' : currentView === 'report' ? 'calc(33.33% + 2px)' : 'calc(66.66% + 2px)', 
              width: 'calc(33.33% - 4px)' 
            }"></div>
          <router-link to="/personal"
            class="relative z-10 px-4 py-1.5 rounded-md text-xs font-semibold transition-colors flex items-center gap-2 w-24 justify-center"
            :class="currentView === 'personal' ? 'text-gray-800' : 'text-gray-500 hover:text-gray-600'">
            <IconChart class="w-3.5 h-3.5"></IconChart> 个人
          </router-link>
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
      </div>

      <!-- 路由视图 -->
      <transition name="page" mode="out-in">
        <router-view></router-view>
      </transition>
    </main>
  </div>
</template>
