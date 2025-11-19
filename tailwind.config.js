/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // 定义品牌色：清爽的科技蓝
        brand: {
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#3b82f6',
          600: '#2563eb', // 主色
          700: '#1d4ed8',
        },
        // 定义中性色：用于边框和背景，避免死灰
        slate: {
          50: '#f8fafc', // 侧边栏背景
          100: '#f1f5f9', // 锁定状态背景
          200: '#e2e8f0', // 边框
          400: '#94a3b8', // 提示文字
          800: '#1e293b', // 主文字
        }
      },
      boxShadow: {
        'sm-soft': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'card': '0 4px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px -1px rgba(0, 0, 0, 0.02)',
      }
    },
  },
  plugins: [],
}
