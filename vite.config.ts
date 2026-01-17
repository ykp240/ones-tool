import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  // 1. 设置基础路径，必须与你的 GitHub 仓库名一致
  base: '/ones-tool/', 

  plugins: [react()],
  
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },

  // 2. 配置开发服务器，解决你之前遇到的本地跨域 (CORS) 问题
  server: {
    proxy: {
      // 当你在本地请求 /project 开头的地址时，Vite 会自动转发到真实的 ONES 服务器
      '/project': {
        target: 'https://ones.robustel.cn:8008',
        changeOrigin: true,
        secure: false, // 如果服务器证书无效，设为 false 以允许访问
      }
    }
  },

  // 3. 保持你原有的测试配置
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  },
})