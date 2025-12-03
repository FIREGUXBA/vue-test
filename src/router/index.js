import { createRouter, createWebHistory } from 'vue-router'
import Dashboard from '../views/Personal.vue'
import Report from '../views/Report.vue'
import Config from '../views/Config.vue'
import { initUserInfoFromURL, isAdmin } from '../utils/user'

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
    component: Report,
    meta: { requiresAdmin: true }
  },
  {
    path: '/config',
    name: 'Config',
    component: Config,
    meta: { requiresAdmin: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 全局路由守卫：检查管理员权限
router.beforeEach((to, from, next) => {
  // 检查路由是否需要管理员权限
  if (to.matched.some(record => record.meta.requiresAdmin)) {
    // 检查用户是否是管理员
    if (!isAdmin()) {
      // 如果不是管理员，重定向到个人页面并提示
      console.warn('访问被拒绝：需要管理员权限')
      alert('您没有权限访问此页面，需要管理员权限')
      next({ path: '/personal', replace: true })
    } else {
      // 是管理员，允许访问
      next()
    }
  } else {
    // 不需要管理员权限的路由，直接放行
    next()
  }
})

export default router

