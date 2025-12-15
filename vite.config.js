import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // 加载环境变量
  const env = loadEnv(mode, process.cwd(), '')
  
  // 获取 API 目标地址（与前端代码逻辑一致）
  const getProxyTarget = () => {
    const host = env.VITE_API_HOST
    const port = env.VITE_API_PORT
    const baseURL = env.VITE_API_BASE_URL

    // 优先使用 HOST + PORT 组合
    if (host && port) {
      return `http://${host}:${port}`
    }

    // 其次使用完整 baseURL
    if (baseURL) {
      const url = baseURL.replace(/\/api\/?$/, '') // 移除末尾的 /api
      return url
    }

    // 默认配置
    return 'http://localhost:9500'
  }

  const proxyTarget = getProxyTarget()
  
  console.log('[Vite代理配置] 后端服务器:', proxyTarget)
  console.log('[Vite代理配置] 所有 /api/* 请求将转发到:', proxyTarget)
  
  return {
    plugins: [vue()],
    server: {
      host: '0.0.0.0', // 允许所有网络接口访问
      port: 5173, // 默认端口，可根据需要修改
      proxy: {
        '/api': {
          target: proxyTarget,
          changeOrigin: true, // 改变请求源，解决跨域问题
          secure: false, // 如果使用 https，设置为 false 以忽略证书验证
          rewrite: (path) => path, // 保持路径不变
          configure: (proxy, _options) => {
            proxy.on('error', (err, _req, _res) => {
              console.error('代理错误:', err.message)
            })
            proxy.on('proxyReq', (proxyReq, req, _res) => {
              console.log(`[代理请求] ${req.method} ${req.url} -> ${proxyTarget}${req.url}`)
            })
          }
        }
      }
    },
  }
})
