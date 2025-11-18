/**
 * Electron 主进程启动器
 * 自动检测环境并加载对应的文件
 */

const path = require('path')
const { exec } = require('child_process')

const isDev = process.env.VITE_DEV_SERVER_URL !== undefined

async function start() {
  if (isDev) {
    console.log('[Electron] Starting in development mode...')

    // 开发模式：先编译 TypeScript 再加载
    try {
      await execPromise('npx tsc -p tsconfig.main.json')
      console.log('[Electron] TypeScript compiled successfully')

      // 加载编译后的文件
      const mainPath = path.join(__dirname, 'dist', 'main', 'main.js')
      console.log('[Electron] Loading main process from:', mainPath)
      require(mainPath)
    } catch (error) {
      console.error('[Electron] Failed to compile/start:', error)
      process.exit(1)
    }
  } else {
    console.log('[Electron] Starting in production mode...')
    // 生产模式：直接加载构建输出
    require('./dist/main/main.js')
  }
}

function execPromise(command) {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        reject(error)
      } else {
        resolve(stdout)
      }
    })
  })
}

start()
