<template>
  <div class="app-container">
    <div class="top-bar">
      <div class="brand">
        <el-icon :size="20" class="logo-icon"><Connection /></el-icon>
        <span class="app-title">Dev-Linker</span>
        <el-tag size="small" effect="plain" class="version-tag">v1.3.0</el-tag>
      </div>

      <div class="connection-controls">
        <el-select
          v-model="store.serverConfig.protocolType"
          class="protocol-select"
          placeholder="协议"
          @change="handleProtocolTypeChange"
        >
          <el-option label="WebSocket" value="WebSocket" />
          <el-option label="TCP" value="TCP" />
          <el-option label="UDP" value="UDP" disabled />
          <el-option label="MQTT" value="MQTT" disabled />
          <el-option label="HTTP" value="HTTP" disabled />
        </el-select>

        <el-input
          v-model="store.serverConfig.fullAddress"
          class="address-input"
          :placeholder="addressPlaceholder"
          clearable
          @keyup.enter="handleConnectionAction"
        />

        <el-button
          :type="isConnected ? 'danger' : 'primary'"
          :loading="isConnecting"
          class="connect-btn"
          @click="handleConnectionAction"
        >
          {{ isConnected ? '断开' : (isConnecting ? '连接中' : '连接') }}
        </el-button>
      </div>

      <div class="status-indicator" :class="store.connectionStatus">
        <div class="dot"></div>
        <span class="status-text">{{ statusText }}</span>
      </div>

      <div class="window-actions">
        <el-button link @click="showAbout = true">
          <el-icon><InfoFilled /></el-icon>
        </el-button>
      </div>
    </div>

    <div class="main-content">
      <aside class="settings-pane">
        <ConnectionConfig />
      </aside>

      <main class="interaction-pane">
        <DataInteraction ref="dataInteractionRef" />
      </main>
    </div>

    <el-dialog v-model="showAbout" title="关于 Dev-Linker" width="400px">
      <div class="about-content">
        <p><strong>Dev-Linker</strong></p>
        <p>虚拟4G模块模拟器 - 物联网开发调试工具</p>
        <p>版本: v1.3.0</p>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Connection, InfoFilled } from '@element-plus/icons-vue'
import { useConnectionStore } from '@/store/connection'
import ConnectionConfig from '@/components/ConnectionConfig.vue'
import DataInteraction from '@/components/DataInteraction.vue'
import { WebSocketManager } from '@/utils/websocket'
import { TCPSocket } from '@/utils/tcp'
import { DataFormatter } from '@/utils/data-formatter'
import { ElMessage } from 'element-plus'

const store = useConnectionStore()
const showAbout = ref(false)
const dataInteractionRef = ref<InstanceType<typeof DataInteraction> | null>(null)

// 连接管理器实例
const wsManager = new WebSocketManager()
const tcpSocket = new TCPSocket()

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

const addressPlaceholder = computed(() => {
  switch (store.serverConfig.protocolType) {
    case 'WebSocket': return 'ws://localhost:18080 或 wss://remote.com/path'
    case 'TCP': return 'tcp://localhost:18888'
    case 'UDP': return 'udp://localhost:18888'
    case 'MQTT': return 'mqtt://localhost:1883'
    case 'HTTP': return 'http://localhost:8080'
    default: return '请输入服务器地址'
  }
})

// 处理协议类型变化
const handleProtocolTypeChange = (type: string) => {
  // 根据协议类型更新默认地址
  const defaultAddresses: Record<string, string> = {
    'WebSocket': 'ws://localhost:18080',
    'TCP': 'tcp://localhost:18888',
    'UDP': 'udp://localhost:18888',
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
    ElMessage.error('地址格式错误，请检查输入')
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
        ElMessage.success('WebSocket 连接成功')

        // 发送登录包
        sendLoginPacket()
      }

      wsManager.onClose = () => {
        console.log('WebSocket disconnected')
        store.setConnectionStatus('disconnected')
        store.setConnectionManager('ws', null)
        ElMessage.info('WebSocket 已断开')
      }

      wsManager.onError = (error) => {
        console.error('WebSocket error:', error)
        store.setConnectionStatus('failed')
        ElMessage.error('WebSocket 连接失败')
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
        ElMessage.success('TCP 连接成功')

        // 发送登录包
        sendLoginPacket()
      }

      tcpSocket.onClose = () => {
        console.log('TCP disconnected')
        store.setConnectionStatus('disconnected')
        store.setConnectionManager('tcp', null)
        ElMessage.info('TCP 已断开')
      }

      tcpSocket.onError = (error) => {
        console.error('TCP error:', error)
        store.setConnectionStatus('failed')
        ElMessage.error('TCP 连接失败: ' + error.message)
      }

      tcpSocket.onData = (data) => {
        console.log('TCP data received:', data)
        if (dataInteractionRef.value) {
          dataInteractionRef.value.simulateReceiveData(data)
        }
      }

      // 建立连接
      await tcpSocket.connect(parsedHost, parsedPort)
    }

  } catch (error) {
    console.error('Connection failed:', error)
    store.setConnectionStatus('failed')
    ElMessage.error('连接失败: ' + (error as Error).message)
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
  }

  store.setConnectionStatus('disconnected')
  ElMessage.info('已断开连接')
}

onMounted(() => {
  // 加载保存的配置
  store.loadConfig()
})
</script>

<style scoped>
.app-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #1e1e1e;
  color: #fff;
}

.top-bar {
  height: 56px;
  background: #252526;
  border-bottom: 1px solid #333;
  display: flex;
  align-items: center;
  padding: 0 16px;
  gap: 16px;
  flex-shrink: 0;
  -webkit-app-region: drag;
}

.brand {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: bold;
  color: #409eff;
  min-width: 140px;
}

.logo-icon {
  color: #409eff;
}

.app-title {
  font-size: 14px;
}

.version-tag {
  background: rgba(255,255,255,0.1);
  border: none;
  color: #888;
  font-size: 10px;
}

.connection-controls {
  flex: 1;
  display: flex;
  gap: 10px;
  -webkit-app-region: no-drag;
}

.protocol-select {
  width: 130px;
}

.address-input {
  flex: 1;
}

.connect-btn {
  width: 100px;
  font-weight: bold;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0 12px;
  -webkit-app-region: no-drag;
}

.status-indicator .dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #666;
}

.status-indicator .status-text {
  font-size: 12px;
  color: #888;
}

.status-indicator.connected .dot {
  background: #67c23a;
  box-shadow: 0 0 8px #67c23a;
}

.status-indicator.connected .status-text {
  color: #67c23a;
}

.status-indicator.connecting .dot {
  background: #e6a23c;
  animation: pulse 1.5s infinite;
}

.status-indicator.failed .dot {
  background: #f56c6c;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.window-actions {
  -webkit-app-region: no-drag;
}

.window-actions .el-button {
  color: #888;
}

.window-actions .el-button:hover {
  color: #fff;
}

.main-content {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.settings-pane {
  width: 300px;
  background: #2d2d2d;
  border-right: 1px solid #333;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.interaction-pane {
  flex: 1;
  background: #1e1e1e;
  overflow: hidden;
}

/* 深色主题覆盖 Element Plus 默认样式 */
:deep(.el-input__wrapper) {
  background-color: #3c3c3c;
  box-shadow: none;
  border: 1px solid #555;
}

:deep(.el-input__wrapper:hover) {
  border-color: #409eff;
}

:deep(.el-input__inner) {
  color: #fff;
}

:deep(.el-input__inner::placeholder) {
  color: #888;
}

:deep(.el-select .el-input__wrapper) {
  background-color: #3c3c3c;
}

:deep(.el-button--primary) {
  background-color: #409eff;
  border-color: #409eff;
}

:deep(.el-button--danger) {
  background-color: #f56c6c;
  border-color: #f56c6c;
}

.about-content {
  text-align: center;
  padding: 20px;
}

.about-content p {
  margin: 8px 0;
  color: #606266;
}
</style>
