import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router'
import { initUserInfoFromURL, saveAdminJobNoInDevMode } from './utils/user'

// 在dev模式下，将管理员工号保存到localStorage
saveAdminJobNoInDevMode()
// 在应用启动时，从URL获取用户信息并存储到localStorage
initUserInfoFromURL()

createApp(App).use(router).mount('#app')
