<script setup>
import { ref, computed, provide, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import IconChart from './components/icons/IconChart.vue'
import IconTable from './components/icons/IconTable.vue'
import IconSave from './components/icons/IconSave.vue'
import { generateData } from './utils/data'
import { getUserInfo, initUserInfoFromURL, isAdmin } from './utils/user'
import ToastNotification from './components/ToastNotification.vue'
const currentRoute = useRoute()
const userInfo = ref(getUserInfo())
const userIsAdmin = ref(isAdmin())

// 获取或生成随机头像种子（每次登录时生成新的随机种子）
const getRandomAvatarSeed = () => {
  const AVATAR_SEED_KEY = 'avatar_seed'
  // 从sessionStorage获取已存在的种子
  let seed = sessionStorage.getItem(AVATAR_SEED_KEY)
  
  // 如果没有种子，生成一个新的随机种子并存储
  if (!seed) {
    seed = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
    sessionStorage.setItem(AVATAR_SEED_KEY, seed)
  }
  
  return seed
}

// 组件挂载时，尝试从URL获取用户信息
onMounted(() => {
  // 如果当前没有用户信息，尝试从URL获取
  if (!userInfo.value) {
    const urlUserInfo = initUserInfoFromURL()
    if (urlUserInfo) {
      userInfo.value = urlUserInfo
      console.log('已从URL获取用户信息:', urlUserInfo)
    }
  } else {
    console.log('当前用户信息:', userInfo.value)
  }
  
  // 更新管理员状态
  userIsAdmin.value = isAdmin()
  
  // 初始化随机头像种子（每次新会话时生成）
  getRandomAvatarSeed()
})

// 监听用户信息变化，自动更新管理员状态
watch(userInfo, () => {
  userIsAdmin.value = isAdmin()
}, { deep: true })

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

// 头像加载失败时的处理
const handleAvatarError = (event) => {
  // 如果头像加载失败，使用相同的随机种子重新生成
  const seed = getRandomAvatarSeed()
  // 使用 adventurer 风格作为备用（更男性化的风格）
  event.target.src = `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(seed)}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`
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

// 计算导航标签的宽度和位置（根据是否显示管理员菜单动态调整）
const navTabStyle = computed(() => {
  if (userIsAdmin.value) {
    // 管理员：显示三个标签，每个占 33.33%
    return {
      left: currentView.value === 'personal' ? '4px' : currentView.value === 'report' ? 'calc(33.33% + 2px)' : 'calc(66.66% + 2px)',
      width: 'calc(33.33% - 6px)'
    }
  } else {
    // 非管理员：只显示个人标签，占 100%
    return {
      left: '4px',
      width: 'calc(100% - 8px)'
    }
  }
})

// 获取用户姓名
const userName = computed(() => {
  if (!userInfo.value) return '用户'
  return userInfo.value.realName || 
         userInfo.value.userName || 
         userInfo.value.user_name || 
         userInfo.value.name || 
         userInfo.value.username ||
         userInfo.value.userId ||
         '用户'
})

// 生成随机头像URL（每次登录时随机生成）
const avatarUrl = computed(() => {
  // 使用sessionStorage中的随机种子，每次新登录时都会生成新的随机头像
  const seed = getRandomAvatarSeed()
  
  // 使用 DiceBear API 生成头像（adventurer 风格）
  // 使用固定的背景色，确保所有头像风格统一
  return `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(seed)}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`
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
            :style="navTabStyle"></div>
          <router-link to="/personal"
            class="relative z-10 px-4 py-1.5 rounded-md text-xs font-semibold transition-colors flex items-center gap-2 w-24 justify-center"
            :class="currentView === 'personal' ? 'text-gray-800' : 'text-gray-500 hover:text-gray-600'">
            <IconChart class="w-3.5 h-3.5"></IconChart> 个人
          </router-link>
          <router-link v-if="userIsAdmin" to="/report"
            class="relative z-10 px-4 py-1.5 rounded-md text-xs font-semibold transition-colors flex items-center gap-2 w-24 justify-center"
            :class="currentView === 'report' ? 'text-gray-800' : 'text-gray-500 hover:text-gray-600'">
            <IconTable class="w-3.5 h-3.5"></IconTable> 报表
          </router-link>
          <router-link v-if="userIsAdmin" to="/config"
            class="relative z-10 px-4 py-1.5 rounded-md text-xs font-semibold transition-colors flex items-center gap-2 w-24 justify-center"
            :class="currentView === 'config' ? 'text-gray-800' : 'text-gray-500 hover:text-gray-600'">
            <IconSave class="w-3.5 h-3.5"></IconSave> 配置
          </router-link>
        </nav>
        <!-- 头像个人信息 -->
        <div class="flex items-center gap-3 px-4 py-2 bg-white/70 hover:bg-white/90 border border-gray-200/80 rounded-xl shadow-sm transition-all duration-300">
          <div class="relative">
            <img 
              :src="avatarUrl" 
              :alt="userName"
              class="w-10 h-10 rounded-full border-2 border-gray-200 object-cover"
              @error="handleAvatarError"
            />
            <div class="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 border-2 border-white rounded-full"></div>
          </div>
          <div class="flex flex-col">
            <span class="text-sm font-semibold text-gray-800">{{ userName }}</span>
            <span v-if="userInfo?.jobNo" class="text-xs text-gray-500">{{ userInfo.jobNo }}</span>
          </div>
        </div>
      </div>

      <!-- 路由视图 -->
      <transition name="page" mode="out-in">
        <router-view></router-view>
      </transition>
    </main>
  </div>
</template>
