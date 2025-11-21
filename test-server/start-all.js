/**
 * Dev-Linker 测试服务器启动脚本
 * 简洁输出服务器状态
 */

const { spawn } = require('child_process')
const path = require('path')

// 服务器配置
const servers = [
  {
    name: 'WebSocket',
    file: 'test-server/ws-server.js',
    address: 'ws://localhost:18080',
    port: 18080
  },
  {
    name: 'TCP',
    file: 'test-server/tcp-server.js',
    address: 'tcp://localhost:18888',
    port: 18888
  },
  {
    name: 'UDP',
    file: 'test-server/udp-server.js',
    address: 'udp://localhost:19000',
    port: 19000
  },
  {
    name: 'MQTT',
    file: 'test-server/mqtt-server.js',
    address: 'mqtt://localhost:1883',
    port: 1883
  },
  {
    name: 'HTTP',
    file: 'test-server/http-server.js',
    address: 'http://localhost:18081',
    port: 18081
  }
]

// 服务器状态
const status = {}
servers.forEach(s => {
  status[s.name] = 'pending'
})

// 绘制状态表格
function drawStatusTable() {
  console.log('\n┌──────────────────────────────────────────────────────────────┐')
  console.log('│              Dev-Linker 测试服务器状态                       │')
  console.log('├──────────────┬──────────────────────────────┬────────────────┤')
  console.log('│   协议类型   │         连接地址             │     状态       │')
  console.log('├──────────────┼──────────────────────────────┼────────────────┤')

  servers.forEach(server => {
    const nameCol = server.name.padEnd(12, ' ')
    const addrCol = server.address.padEnd(28, ' ')

    let statusCol
    if (status[server.name] === 'success') {
      statusCol = '  ✓ 运行中    '
    } else if (status[server.name] === 'failed') {
      statusCol = '  × 启动失败  '
    } else {
      statusCol = '  ⋯ 启动中    '
    }

    console.log(`│ ${nameCol} │ ${addrCol} │ ${statusCol} │`)
  })

  console.log('└──────────────┴──────────────────────────────┴────────────────┘')
}

// 启动服务器
const processes = []
let checkedCount = 0

function checkAllStarted() {
  checkedCount++
  if (checkedCount === servers.length) {
    // 所有服务器都检查完毕，显示最终状态
    setTimeout(() => {
      console.clear()
      drawStatusTable()
      console.log('\n所有服务器已启动，日志如下：\n')
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
    }, 1500)
  }
}

function startServers() {
  console.log('\n正在启动测试服务器...\n')
  drawStatusTable()

  servers.forEach((server, index) => {
    setTimeout(() => {
      const child = spawn('node', [server.file], {
        cwd: path.resolve(__dirname, '..'),
        stdio: ['ignore', 'pipe', 'pipe']  // 捕获输出以检测启动状态
      })

      processes.push(child)

      let startupDetected = false
      let hasExited = false

      // 监听标准输出，检测启动成功标志
      child.stdout.on('data', (data) => {
        const output = data.toString()
        process.stdout.write(output)  // 转发到控制台

        // 检测启动成功标志
        if (!startupDetected && (
          output.includes('服务器已启动') ||
          output.includes('Broker已启动') ||
          output.includes('已启动')
        )) {
          startupDetected = true
          status[server.name] = 'success'
          checkAllStarted()
        }
      })

      // 监听标准错误，检测启动失败标志
      child.stderr.on('data', (data) => {
        const output = data.toString()
        process.stderr.write(output)  // 转发到控制台

        // 检测端口占用或其他严重错误
        if (output.includes('EADDRINUSE') || output.includes('服务器错误')) {
          if (!startupDetected) {
            status[server.name] = 'failed'
            checkAllStarted()
          }
        }
      })

      // 超时检测（如果2秒内没有启动成功标志，标记为失败）
      const startupTimeout = setTimeout(() => {
        if (!startupDetected && !hasExited) {
          status[server.name] = 'failed'
          checkAllStarted()
        }
      }, 2000)

      child.on('error', (err) => {
        status[server.name] = 'failed'
        console.error(`[错误] ${server.name} 启动失败: ${err.message}`)
        checkAllStarted()
        clearTimeout(startupTimeout)
      })

      child.on('exit', (code) => {
        hasExited = true
        clearTimeout(startupTimeout)

        // 如果进程异常退出且尚未标记状态，标记为失败
        if (code !== 0 && code !== null) {
          if (status[server.name] !== 'success') {
            status[server.name] = 'failed'
            checkAllStarted()
          }
        }
      })
    }, index * 200)
  })
}

// 优雅关闭
process.on('SIGINT', () => {
  console.log('\n\n正在关闭所有服务器...')
  processes.forEach(child => {
    child.kill('SIGINT')
  })
  setTimeout(() => {
    console.log('所有服务器已关闭\n')
    process.exit(0)
  }, 500)
})

process.on('SIGTERM', () => {
  processes.forEach(child => {
    child.kill('SIGTERM')
  })
  process.exit(0)
})

// 启动
startServers()
