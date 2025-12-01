<script setup>
import { computed } from 'vue'

const props = defineProps({
  show: Boolean,
  message: String,
  type: {
    type: String,
    default: 'success' // 'success' | 'error' | 'info'
  }
})

const styles = computed(() => {
  const map = {
    success: {
      // 更加柔和、类似 macOS 系统图标的绿色
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
  return map[props.type] || map.success
})
</script>

<template>
  <Transition name="toast">
    <div v-if="show" 
      class="fixed top-6 right-6 z-[100] flex items-center gap-3 px-4 py-3 
             bg-white 
             border border-gray-200/80 shadow-[0_4px_24px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] 
             rounded-[12px] select-none min-w-[300px]"
    >
      <div :class="['w-6 h-6 rounded-md flex items-center justify-center shadow-sm shrink-0', styles.iconBg]">
        <svg class="w-3.5 h-3.5" :class="styles.iconColor" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
          <path :d="styles.iconPath"></path>
        </svg>
      </div>
      
      <div class="flex flex-col justify-center">
        <span class="text-[13px] font-medium text-gray-900 leading-snug font-sf-display">{{ message }}</span>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
/* 调整动画为稍快一点的弹窗，符合桌面端的操作反馈 */
.toast-enter-active {
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.toast-leave-active {
  transition: all 0.2s cubic-bezier(0.33, 1, 0.68, 1);
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  /* 位移稍微减小 */
  transform: translateY(-12px) scale(0.96);
}

/* Apple 系统字体栈 */
.font-sf-display {
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", Arial, sans-serif;
}
</style>