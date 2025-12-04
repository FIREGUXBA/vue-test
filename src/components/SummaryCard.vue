<script setup>
import { computed } from 'vue'

const props = defineProps({
  title: { type: String, required: true },
  // 类型: 'single' (大数字) | 'list' (排行榜)
  type: { type: String, default: 'single' }, 
  // 数据: Array | Object
  data: { type: [Object, Array], required: true },
  icon: { type: Object }, 
  color: { type: String, default: 'blue' }, // blue, red, orange, green, purple
  limit: { type: Number, default: 5 } // 列表默认展示5-6人
})

const theme = computed(() => {
  const colors = {
    blue:   { 
      bg: 'bg-blue-500',   
      light: 'bg-blue-50',   
      text: 'text-blue-600',
      badge1: 'from-blue-600 to-blue-500', 
      badge2: 'from-blue-500 to-blue-400', 
      badge3: 'from-blue-400 to-blue-300',
      shadow1: 'shadow-blue-600/30',
      shadow2: 'shadow-blue-500/20',
      shadow3: 'shadow-blue-400/15'
    },
    red:    { 
      bg: 'bg-red-500',    
      light: 'bg-red-50',    
      text: 'text-red-600',
      badge1: 'from-red-600 to-red-500', 
      badge2: 'from-red-500 to-red-400', 
      badge3: 'from-red-400 to-red-300',
      shadow1: 'shadow-red-600/30',
      shadow2: 'shadow-red-500/20',
      shadow3: 'shadow-red-400/15'
    },
    orange: { 
      bg: 'bg-orange-500', 
      light: 'bg-orange-50', 
      text: 'text-orange-600',
      badge1: 'from-orange-600 to-orange-500', 
      badge2: 'from-orange-500 to-orange-400', 
      badge3: 'from-orange-400 to-orange-300',
      shadow1: 'shadow-orange-600/30',
      shadow2: 'shadow-orange-500/20',
      shadow3: 'shadow-orange-400/15'
    },
    green:  { 
      bg: 'bg-emerald-500', 
      light: 'bg-emerald-50', 
      text: 'text-emerald-600',
      badge1: 'from-emerald-600 to-emerald-500', 
      badge2: 'from-emerald-500 to-emerald-400', 
      badge3: 'from-emerald-400 to-emerald-300',
      shadow1: 'shadow-emerald-600/30',
      shadow2: 'shadow-emerald-500/20',
      shadow3: 'shadow-emerald-400/15'
    },
    purple: { 
      bg: 'bg-purple-500', 
      light: 'bg-purple-50', 
      text: 'text-purple-600',
      badge1: 'from-purple-600 to-purple-500', 
      badge2: 'from-purple-500 to-purple-400', 
      badge3: 'from-purple-400 to-purple-300',
      shadow1: 'shadow-purple-600/30',
      shadow2: 'shadow-purple-500/20',
      shadow3: 'shadow-purple-400/15'
    },
  }
  return colors[props.color] || colors.blue
})

// 根据排名获取徽章样式
const getBadgeStyle = (idx) => {
  if (idx === 0) {
    return {
      badge: theme.value.badge1,
      shadow: theme.value.shadow1
    }
  } else if (idx === 1) {
    return {
      badge: theme.value.badge2,
      shadow: theme.value.shadow2
    }
  } else if (idx === 2) {
    return {
      badge: theme.value.badge3,
      shadow: theme.value.shadow3
    }
  }
  return null
}

// 格式化数值，保留2位小数（仅对工时单位 'h' 格式化）
const formatValue = (value, unit = '') => {
  if (typeof value === 'number') {
    // 如果是工时单位（'h' 或 '小时'），格式化为2位小数字符串
    if (unit === 'h' || unit === '小时') {
      return value.toFixed(2)
    }
    // 其他单位保持原样
    return value
  }
  return value
}

// 处理列表数据，截取前 N 名
const listData = computed(() => {
  if (Array.isArray(props.data)) {
    return props.data.slice(0, props.limit)
  }
  return []
})
</script>

<template>
  <div 
    class="relative flex flex-col p-4 rounded-xl bg-white/80 border border-gray-200 shadow-sm transition-all duration-300 hover:shadow-md group overflow-hidden h-full"
  >
    <div class="flex items-center gap-3 mb-2 relative z-10 pl-1">
      <div :class="['w-8 h-8 rounded-[10px] flex items-center justify-center shadow-sm text-white shadow-black/5', theme.bg]">
        <component :is="icon" class="w-4 h-4 stroke-[2]" />
      </div>
      <div class="flex flex-col leading-none">
        <span class="text-[13px] font-semibold text-slate-700 tracking-tight">{{ title }}</span>
        <span class="text-[10px] text-gray-400 mt-1 font-medium" v-if="type === 'list'">Top {{ limit }}</span>
      </div>
    </div>

    <div class="flex-1 relative z-10">
      
      <div v-if="type === 'single'" class="flex flex-col h-full justify-center pb-2 pl-1">
        <div class="flex items-baseline gap-1.5">
          <span class="text-[44px] font-bold text-slate-800 tracking-tight font-sf-display leading-none">
            {{ formatValue(data.value, data.unit) }}
          </span>
          <span class="text-sm font-medium text-gray-400 uppercase tracking-wide">{{ data.unit }}</span>
        </div>
        <div class="mt-3 flex items-center gap-2">
          <div :class="['px-2.5 py-1 rounded-full text-[11px] font-semibold bg-opacity-50 border border-opacity-10', theme.light, theme.text, 'border-gray-400']">
            {{ data.subtitle }}
          </div>
        </div>
      </div>

      <div v-else class="mt-1 flex flex-col">
        <div class="flex flex-col divide-y divide-gray-100/60">
          <div 
            v-for="(item, idx) in listData" 
            :key="idx" 
            class="flex items-center justify-between py-2 px-2 -mx-2 rounded-lg hover:bg-white/60 transition-colors duration-200 group/row cursor-default"
          >
            <div class="flex items-center gap-3 overflow-hidden">
              <div 
                class="w-5 h-5 flex-shrink-0 flex items-center justify-center rounded-md text-[10px] font-bold"
                :class="idx < 3 
                  ? `bg-gradient-to-br ${getBadgeStyle(idx).badge} text-white ${getBadgeStyle(idx).shadow}` 
                  : 'bg-gray-100 text-gray-400 shadow-sm'"
              >
                {{ idx + 1 }}
              </div>
              
              <div class="flex flex-col min-w-0">
                <span class="text-[13px] font-semibold text-slate-700 truncate leading-snug">{{ item.name }}</span>
              </div>
            </div>

            <div class="flex items-center gap-1 pl-2">
              <span 
                class="text-[13px] font-bold font-mono tracking-tight tabular-nums text-right"
                :class="idx < 3 ? 'text-slate-800' : 'text-slate-500'"
              >
                {{ formatValue(item.value, item.unit) }}
              </span>
              <span class="text-[10px] text-gray-400 scale-90 origin-left">{{ item.unit }}</span>
            </div>
          </div>
        </div>

        <div v-if="!listData.length" class="flex flex-col items-center justify-center py-8 text-gray-300">
          <div class="w-8 h-8 rounded-full bg-gray-50 border border-gray-100 mb-2"></div>
          <span class="text-xs">暂无数据</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.font-sf-display {
  font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
}
</style>

