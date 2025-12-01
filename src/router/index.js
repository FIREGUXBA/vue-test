import { createRouter, createWebHistory } from 'vue-router'
import Dashboard from '../views/Dashboard.vue'
import Report from '../views/Report.vue'
import Config from '../views/Config.vue'

const routes = [
  {
    path: '/',
    redirect: '/report'
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: Dashboard
  },
  {
    path: '/report',
    name: 'Report',
    component: Report
  },
  {
    path: '/config',
    name: 'Config',
    component: Config
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router

