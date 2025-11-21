<script setup>
defineProps({
  label: String,
  val: [String, Number],
  unit: String,
  color: String,
  user: String,
  desc: String
})

const colorClasses = {
  green: 'bg-green-400',
  orange: 'bg-orange-400',
  blue: 'bg-blue-400',
  red: 'bg-red-400'
}

const colorHoverClasses = {
  green: 'group-hover:bg-green-400/20',
  orange: 'group-hover:bg-orange-400/20',
  blue: 'group-hover:bg-blue-400/20',
  red: 'group-hover:bg-red-400/20'
}

const colorBgClasses = {
  green: 'bg-green-400/10',
  orange: 'bg-orange-400/10',
  blue: 'bg-blue-400/10',
  red: 'bg-red-400/10'
}
</script>

<template>
  <div 
    class="p-4 rounded-2xl bg-white/60 backdrop-blur-xl border border-white/60 shadow-sm relative overflow-hidden group card-enter-from"
    style="animation: fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; animation-delay: 0.2s;"
  >
    <div :class="['absolute top-0 left-0 w-1 h-full', colorClasses[color] || 'bg-gray-400']"></div>
    <div class="relative z-10">
      <div class="text-[10px] text-gray-400 uppercase tracking-wider mb-1">{{ label }}</div>
      <div class="flex justify-between items-end">
        <div class="flex flex-col">
          <span v-if="user" class="text-sm font-semibold text-gray-700 mb-0.5">{{ user }}</span>
          <span class="text-xs text-gray-400">{{ desc || 'Top 1' }}</span>
        </div>
        <div class="text-xl font-bold text-gray-800 font-mono">
          {{ val }} <span class="text-xs font-normal text-gray-400">{{ unit }}</span>
        </div>
      </div>
    </div>
    <div :class="['absolute -right-6 -bottom-6 w-24 h-24 rounded-full blur-2xl transition-colors duration-700', colorBgClasses[color] || 'bg-gray-400/10', colorHoverClasses[color] || 'group-hover:bg-gray-400/20']"></div>
  </div>
</template>

