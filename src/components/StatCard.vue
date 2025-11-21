<script setup>
defineProps({
  label: String,
  value: [String, Number],
  icon: Object,
  trend: String,
  trendLabel: String,
  index: Number
})
</script>

<template>
  <div 
    class="flex flex-col p-5 rounded-3xl bg-white/70 backdrop-blur-2xl border border-white/60 shadow-[0_8px_40px_rgba(0,0,0,0.03)] hover:bg-white/80 transition-colors duration-500 card-enter-from"
    :style="{ animation: 'fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards', animationDelay: index * 0.1 + 's' }"
  >
    <div class="flex items-center gap-3 mb-3">
      <div class="p-2.5 bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-2xl text-blue-600 shadow-sm">
        <component :is="icon" class="w-4 h-4" />
      </div>
      <span class="text-xs font-semibold text-gray-400 uppercase tracking-wide">{{ label }}</span>
    </div>
    <div class="flex items-end justify-between">
      <span class="text-3xl font-bold text-gray-900 tracking-tight">{{ value }}</span>
      <div v-if="trend" class="px-2 py-1 rounded-lg text-[10px] font-bold" :class="trend === 'up' ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500'">
        {{ trendLabel }}
      </div>
    </div>
  </div>
</template>

