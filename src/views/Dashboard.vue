<script setup>
import { ref, computed, inject } from 'vue'
import StatCard from '../components/StatCard.vue'
import IconClock from '../components/icons/IconClock.vue'
import IconUsers from '../components/icons/IconUsers.vue'
import IconFilter from '../components/icons/IconFilter.vue'
import IconChevronRight from '../components/icons/IconChevronRight.vue'

const data = inject('data')
const filterDept = inject('filterDept')
const searchTerm = inject('searchTerm')
const hoveredRow = ref(null)

const filteredData = computed(() => {
  return data.value.filter(item => {
    const matchesDept = filterDept.value === '全部' || item.dept === filterDept.value
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.value.toLowerCase())
    return matchesDept && matchesSearch
  })
})

const stats = computed(() => {
  const totalHours = filteredData.value.reduce((acc, curr) => acc + curr.hours, 0)
  const avgLoad = filteredData.value.length ? Math.round(totalHours / filteredData.value.length) : 0
  return { totalHours, avgLoad, count: filteredData.value.length }
})
</script>

<template>
  <div class="space-y-8">
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <StatCard label="当前团队人数" :value="stats.count" :icon="IconUsers" :index="0"></StatCard>
      <StatCard label="本月总工时" :value="stats.totalHours + 'h'" :icon="IconClock" trend="up" trend-label="+2.4%"
        :index="1"></StatCard>
      <StatCard label="平均工时负荷" :value="stats.avgLoad + 'h'" :icon="IconFilter" trend="neutral" trend-label="正常"
        :index="2"></StatCard>
    </div>

    <div class="rounded-3xl overflow-hidden bg-white/40 border border-white/50 shadow-sm backdrop-blur-xl">
      <div
        class="grid grid-cols-12 gap-4 px-8 py-4 border-b border-gray-200/50 bg-gray-50/50 text-xs font-semibold text-gray-400 uppercase tracking-wider">
        <div class="col-span-4 sm:col-span-3 pl-2">员工信息</div>
        <div class="col-span-3 sm:col-span-2 hidden sm:block">部门 / 职位</div>
        <div class="col-span-4 sm:col-span-3 text-right sm:text-left">本月总工时</div>
        <div class="col-span-4 sm:col-span-3 hidden sm:block">负荷率</div>
        <div class="col-span-4 sm:col-span-1 text-right">状态</div>
      </div>

      <div class="p-2">
        <transition-group name="list" tag="div" class="relative space-y-1" appear>
          <div v-for="(item, index) in filteredData" :key="item.id" @mouseenter="hoveredRow = item.id"
            @mouseleave="hoveredRow = null"
            class="relative grid grid-cols-12 gap-4 px-6 py-4 rounded-2xl items-center cursor-pointer transition-all duration-300 ease-out group w-full"
            :class="hoveredRow === item.id ? 'bg-white shadow-md scale-[1.01] z-10' : 'hover:bg-white/40'"
            :style="{ '--i': index }">
            <div class="col-span-4 sm:col-span-3 flex items-center gap-4">
              <div class="relative">
                <img :src="item.avatar" :alt="item.name"
                  class="w-10 h-10 rounded-full bg-gray-100 shadow-sm object-cover ring-2 ring-white" />
              </div>
              <div class="flex flex-col">
                <span class="text-sm font-bold text-gray-800">{{ item.name }}</span>
                <span class="text-xs text-gray-400 sm:hidden">{{ item.role }}</span>
              </div>
            </div>
            <div class="col-span-3 sm:col-span-2 hidden sm:flex flex-col justify-center">
              <span
                class="text-xs font-medium text-gray-600 bg-gray-100/80 px-2.5 py-1 rounded-lg w-fit mb-1 border border-gray-200/50">{{
                item.dept }}</span>
              <span class="text-[10px] text-gray-400">{{ item.role }}</span>
            </div>
            <div class="col-span-4 sm:col-span-3 flex flex-col justify-center items-end sm:items-start">
              <div class="flex items-baseline gap-1">
                <span class="text-lg font-bold text-gray-800 font-mono tracking-tight">{{ item.hours }}</span>
                <span class="text-xs text-gray-400 font-medium">/ {{ item.standard }}h</span>
              </div>
            </div>
            <div class="col-span-4 sm:col-span-3 hidden sm:flex items-center">
              <div class="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden max-w-[140px] shadow-inner">
                <div class="h-full rounded-full shadow-[0_0_10px_rgba(59,130,246,0.3)] progress-bar"
                  :class="item.status === 'overtime' ? 'bg-orange-400' : 'bg-blue-500'"
                  :style="{ width: item.percentage + '%' }"></div>
              </div>
              <span class="text-xs font-semibold text-gray-400 w-8 text-right ml-2">{{ item.percentage }}%</span>
            </div>
            <div
              class="col-span-4 sm:col-span-1 flex justify-end items-center text-gray-300 transition-transform duration-300"
              :class="hoveredRow === item.id ? 'translate-x-1 text-blue-500' : ''">
              <IconChevronRight class="w-4 h-4"></IconChevronRight>
            </div>
          </div>
        </transition-group>

        <div v-if="filteredData.length === 0" class="text-center py-10 text-gray-400 text-sm">
          没有找到匹配的员工
        </div>
      </div>
    </div>
  </div>
</template>

