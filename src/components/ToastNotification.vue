<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  show: Boolean,
  message: String,
  type: {
    type: String,
    default: 'success' // 'success' | 'error' | 'info'
  }
})

// Toast 队列
const toastQueue = ref([])
let toastIdCounter = 0

// 获取样式配置
const getStyles = (type) => {
  const map = {
    success: {
      iconBg: 'bg-[#34C759]', 
      iconColor: 'text-white',
      iconPath: 'M20 6L9 17l-5-5'
    },
    error: {
      iconBg: 'bg-[#FF3B30]',
      iconColor: 'text-white',
      iconPath: 'M18 6L6 18M6 6l12 12'
    },
    info: {
      iconBg: 'bg-[#007AFF]',
      iconColor: 'text-white',
      iconPath: 'M12 16v-4m0-4h.01'
    }
  }
  return map[type] || map.success
}

// 添加 toast 到队列
const addToast = (message, type = 'success', duration = 3000) => {
  const id = ++toastIdCounter
  const toast = {
    id,
    message,
    type,
    show: true
  }
  
  toastQueue.value.push(toast)
  
  // 自动移除
  setTimeout(() => {
    removeToast(id)
  }, duration)
}

// 移除 toast
const removeToast = (id) => {
  const index = toastQueue.value.findIndex(t => t.id === id)
  if (index !== -1) {
    toastQueue.value[index].show = false
    // 等待动画完成后再从数组中移除
    setTimeout(() => {
      toastQueue.value = toastQueue.value.filter(t => t.id !== id)
    }, 300) // 与 leave-active 动画时间一致
  }
}

// 监听 props 变化，添加新的 toast
// 使用一个时间戳来追踪每次调用，确保每次都能添加新的 toast
let lastTriggerTime = 0
watch([() => props.show, () => props.message, () => props.type], ([show, message, type]) => {
  if (show && message) {
    const now = Date.now()
    // 如果距离上次触发超过 50ms，则添加新的 toast（避免快速重复）
    if (now - lastTriggerTime > 50) {
      lastTriggerTime = now
      addToast(message, type)
    }
  }
})

// 暴露方法供外部调用（如果需要）
defineExpose({
  addToast,
  removeToast
})
</script>

<template>
  <Teleport to="body">
    <div class="fixed top-6 right-6 z-[100] pointer-events-none">
      <TransitionGroup name="toast" tag="div" class="flex flex-col gap-2">
        <div
          v-for="toast in toastQueue"
          :key="toast.id"
          v-show="toast.show"
          class="flex items-center gap-3 px-4 py-3 
                 bg-white 
                 border border-gray-200/80 shadow-[0_4px_24px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] 
                 rounded-[12px] select-none min-w-[300px] pointer-events-auto"
        >
          <div :class="['w-6 h-6 rounded-md flex items-center justify-center shadow-sm shrink-0', getStyles(toast.type).iconBg]">
            <svg class="w-3.5 h-3.5" :class="getStyles(toast.type).iconColor" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
              <path :d="getStyles(toast.type).iconPath"></path>
            </svg>
          </div>
          
          <div class="flex flex-col justify-center">
            <span class="text-[13px] font-medium text-gray-900 leading-snug font-sf-display">{{ toast.message }}</span>
          </div>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<style scoped>
/* Toast 进入动画 */
.toast-enter-active {
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

/* Toast 离开动画 */
.toast-leave-active {
  transition: all 0.3s cubic-bezier(0.33, 1, 0.68, 1);
  position: absolute;
  right: 0;
}

/* 进入前和离开后的状态 */
.toast-enter-from {
  opacity: 0;
  transform: translateX(100%) scale(0.96);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(100%) scale(0.96);
}

/* 移动动画 - 当其他 toast 消失时，剩余的 toast 平滑上移 */
.toast-move {
  transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

/* Apple 系统字体栈 */
.font-sf-display {
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", Arial, sans-serif;
}
</style>
