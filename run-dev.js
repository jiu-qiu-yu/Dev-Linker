#!/usr/bin/env node

/**
 * 开发模式启动脚本
 * 使用编译后的 JavaScript 文件避免 tsx 的问题
 */

const { spawn } = require('child_process')

console.log('启动 Vite 开发服务器...')
const vite = spawn('npm', ['run', 'dev:renderer'], {
  stdio: 'inherit',
  shell: true
})

setTimeout(() => {
  console.log('启动 Electron...')
  const electron = spawn('npx', ['electron', '.'], {
    stdio: 'inherit',
    shell: true
  })

  process.on('SIGINT', () => {
    electron.kill('SIGINT')
    vite.kill('SIGINT')
    process.exit()
  })
}, 3000)

vite.on('exit', (code) => {
  console.log('Vite 退出:', code)
  process.exit(code)
})
