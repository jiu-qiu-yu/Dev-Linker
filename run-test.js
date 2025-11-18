#!/usr/bin/env node

/**
 * 项目结构验证脚本
 * 验证项目文件结构和基本配置是否正确
 */

const fs = require('fs')
const path = require('path')

console.log('='.repeat(50))
console.log('Dev-Linker 项目结构验证')
console.log('='.repeat(50))
console.log()

const requiredFiles = [
  'package.json',
  'tsconfig.json',
  'tsconfig.main.json',
  'tsconfig.node.json',
  'vite.config.ts',
  'electron.config.ts',
  '.gitignore',
  'README.md',
  'src/main/main.ts',
  'src/main/preload.ts',
  'src/main/tcp-socket.ts',
  'src/renderer/public/index.html',
  'src/renderer/src/main.ts',
  'src/renderer/src/App.vue',
  'src/renderer/src/router/index.ts',
  'src/renderer/src/views/MainView.vue',
  'src/renderer/src/store/connection.ts',
  'src/renderer/src/components/ConnectionConfig.vue',
  'src/renderer/src/components/DataInteraction.vue',
  'src/renderer/src/utils/websocket.ts',
  'src/renderer/src/utils/tcp.ts',
  'src/renderer/src/utils/data-formatter.ts',
  'src/renderer/src/utils/config-manager.ts',
  'src/shared/types.ts',
  'test-server/ws-server.js',
  'test-server/tcp-server.js'
]

let allPassed = true

// 检查文件存在性
console.log('检查必要文件...')
requiredFiles.forEach(file => {
  const filePath = path.join(__dirname, file)
  const exists = fs.existsSync(filePath)

  if (exists) {
    console.log(`  ✅ ${file}`)
  } else {
    console.log(`  ❌ ${file} - 文件不存在`)
    allPassed = false
  }
})

console.log()

// 检查 package.json
console.log('检查 package.json 配置...')
try {
  const packageJson = JSON.parse(
    fs.readFileSync(path.join(__dirname, 'package.json'), 'utf-8')
  )

  const requiredFields = ['name', 'version', 'main', 'scripts', 'dependencies', 'devDependencies']
  requiredFields.forEach(field => {
    if (packageJson[field]) {
      console.log(`  ✅ ${field} 字段存在`)
    } else {
      console.log(`  ❌ ${field} 字段缺失`)
      allPassed = false
    }
  })

  // 检查关键依赖
  const requiredDeps = ['electron', 'vue', 'vite', 'typescript']
  requiredDeps.forEach(dep => {
    const hasDep = packageJson.dependencies?.[dep] || packageJson.devDependencies?.[dep]
    if (hasDep) {
      console.log(`  ✅ ${dep} 依赖存在`)
    } else {
      console.log(`  ❌ ${dep} 依赖缺失`)
      allPassed = false
    }
  })
} catch (error) {
  console.log(`  ❌ package.json 读取失败: ${error.message}`)
  allPassed = false
}

console.log()
console.log('='.repeat(50))

if (allPassed) {
  console.log('✅ 项目结构验证通过！')
  console.log()
  console.log('下一步操作：')
  console.log('  1. 运行: npm install')
  console.log('  2. 启动测试服务器: npm run test:servers')
  console.log('  3. 启动开发模式: npm run dev')
  console.log()
} else {
  console.log('❌ 项目结构验证失败！')
  console.log('请检查上述错误并重新运行此脚本。')
  process.exit(1)
}
