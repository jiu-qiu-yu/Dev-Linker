<template>
  <div class="flex flex-col h-screen bg-white overflow-hidden">

    <!-- 顶部指令台 -->
    <header class="h-16 border-b border-slate-200 flex items-center px-4 justify-between bg-white shadow-sm z-10">
      <div class="flex items-center gap-4">
        <div class="font-bold text-xl tracking-tight text-brand-600 flex items-center gap-2">
          <el-icon :size="20"><Connection /></el-icon>
          <span>Dev-Linker</span>
        </div>
        <div class="h-6 w-px bg-slate-200 mx-2"></div>

        <div class="flex gap-2">
          <el-select v-model="store.serverConfig.protocolType" class="w-32" size="default" @change="handleProtocolTypeChange">
            <el-option label="WebSocket" value="WebSocket" />
            <el-option label="TCP" value="TCP" />
            <el-option label="UDP" value="UDP" />
            <el-option label="MQTT" value="MQTT" disabled />
            <el-option label="HTTP" value="HTTP" disabled />
          </el-select>
          <el-input
            v-model="store.serverConfig.fullAddress"
            class="w-64 font-mono"
            :placeholder="addressPlaceholder"
            clearable
            @keyup.enter="handleConnectionAction"
          />

          <button
            class="px-6 py-1.5 rounded-md text-sm font-medium transition-all shadow-sm-soft"
            :class="isConnected ? 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100' : 'bg-brand-600 text-white hover:bg-brand-700 shadow-blue-200'"
            :disabled="isConnecting"
            @click="handleConnectionAction"
          >
            {{ isConnected ? '断开' : (isConnecting ? '连接中' : '连接') }}
          </button>
        </div>
      </div>

      <div class="flex items-center gap-6">
        <!-- 状态指示器 -->
        <div class="flex items-center gap-2">
          <div
            class="w-2 h-2 rounded-full transition-all"
            :class="{
              'bg-slate-300': store.connectionStatus === 'disconnected',
              'bg-green-500 shadow-lg shadow-green-200': store.connectionStatus === 'connected',
              'bg-yellow-500 animate-pulse': store.connectionStatus === 'connecting',
              'bg-red-500': store.connectionStatus === 'failed'
            }"
          ></div>
          <span class="text-sm font-medium" :class="{
            'text-slate-400': store.connectionStatus === 'disconnected',
            'text-green-600': store.connectionStatus === 'connected',
            'text-yellow-600': store.connectionStatus === 'connecting',
            'text-red-600': store.connectionStatus === 'failed'
          }">{{ statusText }}</span>
        </div>

        <button
          class="p-2 rounded-md hover:bg-slate-100 transition-colors text-slate-400 hover:text-brand-600"
          @click="showAbout = true"
        >
          <el-icon><InfoFilled /></el-icon>
        </button>
      </div>
    </header>

    <div class="flex flex-1 overflow-hidden">

      <!-- 左侧配置面板 -->
      <aside class="w-80 bg-slate-50 border-r border-slate-200 flex flex-col overflow-y-auto p-4 gap-4">
        <ConnectionConfig />
      </aside>

      <!-- 右侧主内容区 -->
      <main class="flex-1 flex flex-col min-w-0 bg-white">
        <DataInteraction ref="dataInteractionRef" />
      </main>

    </div>

    <el-dialog v-model="showAbout" title="关于 Dev-Linker" width="400px">
      <div class="about-content">
        <p><strong>Dev-Linker</strong></p>
        <p>虚拟4G模块模拟器 - 物联网开发调试工具</p>
        <p>版本: v1.4.1</p>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Connection, InfoFilled, Cpu, DocumentCopy } from '@element-plus/icons-vue'
import { useConnectionStore } from '@/store/connection'
import ConnectionConfig from '@/components/ConnectionConfig.vue'
import DataInteraction from '@/components/DataInteraction.vue'
import { WebSocketManager } from '@/utils/websocket'
import { TCPSocket } from '@/utils/tcp'
import { UDPSocket } from '@/utils/udp'
import { DataFormatter } from '@/utils/data-formatter'
import { ElMessage } from 'element-plus'

const store = useConnectionStore()
const showAbout = ref(false)
const dataInteractionRef = ref<InstanceType<typeof DataInteraction> | null>(null)

// 连接管理器实例
const wsManager = new WebSocketManager()
const tcpSocket = new TCPSocket()
const udpSocket = new UDPSocket()

const isConnected = computed(() => store.connectionStatus === 'connected')
const isConnecting = computed(() => store.connectionStatus === 'connecting')

const statusText = computed(() => {
  const statusMap: Record<string, string> = {
    disconnected: '未连接',
    connecting: '连接中...',
    connected: '已连接',
    failed: '连接失败',
    reconnecting: '重连中...'
  }
  return statusMap[store.connectionStatus] || '未知状态'
})

const protocolPrefix = computed(() => {
  const prefixMap: Record<string, string> = {
    'WebSocket': 'ws://',
    'TCP': 'tcp://',
    'UDP': 'udp://',
    'MQTT': 'mqtt://',
    'HTTP': 'http://'
  }
  return prefixMap[store.serverConfig.protocolType] || ''
})

const addressPlaceholder = computed(() => {
  switch (store.serverConfig.protocolType) {
    case 'WebSocket': return 'localhost:18080 或 remote.com/path'
    case 'TCP': return 'localhost:18888'
    case 'UDP': return 'localhost:19000'
    case 'MQTT': return 'localhost:1883'
    case 'HTTP': return 'localhost:8080'
    default: return '请输入服务器地址'
  }
})

// 处理协议类型变化
const handleProtocolTypeChange = (type: string) => {
  // 根据协议类型更新默认地址
  const defaultAddresses: Record<string, string> = {
    'WebSocket': 'ws://localhost:18080',
    'TCP': 'tcp://localhost:18888',
    'UDP': 'udp://localhost:19000',
    'MQTT': 'mqtt://localhost:1883',
    'HTTP': 'http://localhost:8080'
  }

  store.updateServerConfig({
    protocolType: type as any,
    fullAddress: defaultAddresses[type] || 'ws://localhost:18080'
  })
}

// 处理连接/断开操作
const handleConnectionAction = async () => {
  if (isConnected.value) {
    // 执行断开逻辑
    handleDisconnect()
  } else {
    // 执行连接逻辑
    await handleConnect()
  }
}

// 连接逻辑
const handleConnect = async () => {
  // 1. 先解析地址
  if (!store.parseAddress()) {
    ElMessage.error({ message: '地址格式错误，请检查输入（需包含主机名）', duration: 2000 })
    return
  }

  store.setConnectionStatus('connecting')

  try {
    const { parsedProtocol, parsedHost, parsedPort, parsedPath } = store.serverConfig

    if (parsedProtocol === 'ws' || parsedProtocol === 'wss') {
      // WebSocket 连接
      const path = parsedPath || ''
      const url = `${parsedProtocol}://${parsedHost}:${parsedPort}${path}`

      // 设置 WebSocket 事件监听
      wsManager.onOpen = () => {
        console.log('WebSocket connected')
        store.setConnectionStatus('connected')
        store.setConnectionManager('ws', wsManager)
        ElMessage.success({ message: 'WebSocket 连接成功', duration: 2000 })

        // 发送登录包
        sendLoginPacket()
      }

      wsManager.onClose = () => {
        console.log('WebSocket disconnected')
        store.setConnectionStatus('disconnected')
        store.setConnectionManager('ws', null)
        ElMessage.info({ message: 'WebSocket 已断开', duration: 2000 })
      }

      wsManager.onError = (error) => {
        console.error('WebSocket error:', error)
        store.setConnectionStatus('failed')
        ElMessage.error({ message: 'WebSocket 连接失败', duration: 2000 })
      }

      wsManager.onMessage = (data) => {
        console.log('WebSocket message:', data)
        // 将数据传递给 DataInteraction 组件显示
        if (dataInteractionRef.value) {
          dataInteractionRef.value.simulateReceiveData(data)
        }
      }

      // 建立连接
      await wsManager.connect(url, store.deviceConfig.sn)

    } else if (parsedProtocol === 'tcp') {
      // TCP 连接
      tcpSocket.onOpen = () => {
        console.log('TCP connected')
        store.setConnectionStatus('connected')
        store.setConnectionManager('tcp', tcpSocket)
        ElMessage.success({ message: 'TCP 连接成功', duration: 2000 })

        // 发送登录包
        sendLoginPacket()
      }

      tcpSocket.onClose = () => {
        console.log('TCP disconnected')
        store.setConnectionStatus('disconnected')
        store.setConnectionManager('tcp', null)
        ElMessage.info({ message: 'TCP 已断开', duration: 2000 })
      }

      tcpSocket.onError = (error) => {
        console.error('TCP error:', error)
        store.setConnectionStatus('failed')
        ElMessage.error({ message: 'TCP 连接失败: ' + error.message, duration: 2000 })
      }

      tcpSocket.onData = (data) => {
        console.log('TCP data received:', data)
        if (dataInteractionRef.value) {
          dataInteractionRef.value.simulateReceiveData(data)
        }
      }

      // 建立连接
      await tcpSocket.connect(parsedHost, parsedPort)

    } else if (parsedProtocol === 'udp') {
      // UDP 连接
      udpSocket.onOpen = () => {
        console.log('UDP socket ready')
        store.setConnectionStatus('connected')
        store.setConnectionManager('udp', udpSocket)
        ElMessage.success({ message: 'UDP 连接成功', duration: 2000 })

        // 发送登录包
        sendLoginPacket()
      }

      udpSocket.onClose = () => {
        console.log('UDP socket closed')
        store.setConnectionStatus('disconnected')
        store.setConnectionManager('udp', null)
        ElMessage.info({ message: 'UDP 已断开', duration: 2000 })
      }

      udpSocket.onError = (error) => {
        console.error('UDP error:', error)
        store.setConnectionStatus('failed')
        ElMessage.error({ message: 'UDP 错误: ' + error.message, duration: 2000 })
      }

      udpSocket.onData = (data) => {
        console.log('UDP data received:', data)
        if (dataInteractionRef.value) {
          dataInteractionRef.value.simulateReceiveData(data.toString())
        }
      }

      // 建立 UDP Socket（本地端口可选，此处使用默认）
      await udpSocket.connect(parsedHost, parsedPort)
    }

  } catch (error) {
    console.error('Connection failed:', error)
    store.setConnectionStatus('failed')
    ElMessage.error({ message: '连接失败: ' + (error as Error).message, duration: 2000 })
  }
}

// 发送登录包
const sendLoginPacket = () => {
  if (store.loginConfig.enabled && store.loginConfig.content) {
    let dataToSend: string | Uint8Array = store.loginConfig.content

    if (store.loginConfig.format === 'hex') {
      dataToSend = DataFormatter.hexToUint8Array(store.loginConfig.content)
      console.log('[Login] Sending login packet (HEX)')
    } else {
      console.log('[Login] Sending login packet (STRING)')
    }

    store.sendData(dataToSend)
  }
}

// 断开连接
const handleDisconnect = () => {
  const protocol = store.serverConfig.parsedProtocol

  if (protocol === 'ws' || protocol === 'wss') {
    wsManager.disconnect()
    store.setConnectionManager('ws', null)
  } else if (protocol === 'tcp') {
    tcpSocket.disconnect()
    store.setConnectionManager('tcp', null)
  } else if (protocol === 'udp') {
    udpSocket.disconnect()
    store.setConnectionManager('udp', null)
  }

  store.setConnectionStatus('disconnected')
  ElMessage.info({ message: '已断开连接', duration: 2000 })
}

// 复制设备SN
const copyDeviceSN = async () => {
  try {
    await navigator.clipboard.writeText(store.deviceConfig.sn)
    ElMessage.success({ message: '设备SN已复制到剪贴板', duration: 2000 })
  } catch (error) {
    console.error('复制失败:', error)
    ElMessage.error({ message: '复制失败，请手动复制', duration: 2000 })
  }
}

onMounted(() => {
  // 加载保存的配置
  store.loadConfig()
})
</script>

<style scoped>
.about-content {
  text-align: center;
  padding: 20px;
}

.about-content p {
  margin: 8px 0;
  color: #606266;
}
</style>
