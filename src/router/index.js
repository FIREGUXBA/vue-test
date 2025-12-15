import { createRouter, createWebHistory } from 'vue-router'
import Dashboard from '../views/Personal.vue'
import Report from '../views/Report.vue'
import Config from '../views/Config.vue'
import { getUserRole, isSuperAdmin } from '../utils/user'

const routes = [
  {
    path: '/',
    redirect: '/personal'
  },
  {
    path: '/personal',
    name: 'Personal',
    component: Dashboard,
    meta: { requiresAuth: false } // 所有用户都可以访问个人页面
  },
  {
    path: '/report',
    name: 'Report',
    component: Report,
    meta: { requiresSuperAdmin: true } // 需要超级管理员权限
  },
  {
    path: '/config',
    name: 'Config',
    component: Config,
    meta: { requiresSuperAdmin: true } // 需要超级管理员权限
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 全局路由守卫：检查角色权限
router.beforeEach((to, from, next) => {
  const userRole = getUserRole()
  
  // 个人页面：所有用户都可以访问
  if (to.path === '/personal') {
    next()
    return
  }
  
  // 需要超级管理员权限的页面（报表、配置）
  if (to.matched.some(record => record.meta.requiresSuperAdmin)) {
    if (!isSuperAdmin()) {
      // 不是超级管理员，重定向到个人页面并提示
      console.warn('访问被拒绝：需要超级管理员权限', {
        当前角色: userRole || '未设置',
        请求路径: to.path
      })
      alert('您没有权限访问此页面，需要超级管理员权限')
      next({ path: '/personal', replace: true })
    } else {
      // 是超级管理员，允许访问
      next()
    }
    return
  }
  
  // 其他情况：common 和 admin 角色只能访问个人页面
  if (userRole === 'common' || userRole === 'admin') {
    // common 或 admin 角色只能查看自己的数据，只能访问个人页面
    if (to.path !== '/personal') {
      console.warn('访问被拒绝：该角色只能访问个人页面', {
        当前角色: userRole,
        请求路径: to.path
      })
      alert('您只能访问个人页面，查看自己的数据')
      next({ path: '/personal', replace: true })
    } else {
      next()
    }
    return
  }
  
  // 如果没有角色信息，默认只允许访问个人页面
  if (!userRole) {
    if (to.path !== '/personal') {
      console.warn('访问被拒绝：未设置用户角色', {
        请求路径: to.path
      })
      next({ path: '/personal', replace: true })
    } else {
      next()
    }
    return
  }
  
  // 超级管理员可以访问所有页面
  if (isSuperAdmin()) {
    next()
    return
  }
  
  // 默认放行（如果角色检查逻辑没有覆盖到的情况）
  next()
})

export default router

