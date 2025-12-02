import { createRouter, createWebHistory } from 'vue-router'
import Dashboard from '../views/Personal.vue'
import Report from '../views/Report.vue'
import Config from '../views/Config.vue'
import { initUserInfoFromURL } from '../utils/user'

const routes = [
  {
    path: '/',
    redirect: '/personal'
  },
  {
    path: '/personal',
    name: 'Personal',
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

