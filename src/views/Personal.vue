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

  </div>
</template>

