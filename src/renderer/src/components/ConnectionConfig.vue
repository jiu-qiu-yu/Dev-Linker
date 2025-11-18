<template>
  <div class="connection-config">
    <h2 class="panel-title">
      <el-icon><Setting /></el-icon>
      连接配置
    </h2>

    <el-form :model="form" label-width="80px" size="default">
      <!-- 服务器配置 -->
      <el-card shadow="never" class="config-section">
        <template #header>
          <span>服务器配置</span>
        </template>

        <el-form-item label="协议类型">
          <el-select v-model="form.protocol" placeholder="选择协议" @change="onProtocolChange">
            <el-option label="WebSocket (ws://)" value="ws" />
            <el-option label="WebSocket Secure (wss://)" value="wss" />
            <el-option label="TCP" value="tcp" />
          </el-select>
        </el-form-item>

        <el-form-item label="服务器地址">
          <el-input
            v-model="form.host"
            placeholder="localhost 或 IP 地址"
          >
            <template #prepend>
              <el-icon><Location /></el-icon>
            </template>
          </el-input>
        </el-form-item>

        <el-form-item label="端口">
          <el-input-number
            v-model="form.port"
            :min="1"
            :max="65535"
            style="width: 100%"
          />
        </el-form-item>

        <!-- SN 设备标识 -->
        <el-form-item label="设备SN">
          <el-input
            v-model="form.sn"
            placeholder="请输入设备唯一标识"
          >
            <template #append>
              <el-button @click="generateSN" :icon="Refresh">生成</el-button>
            </template>
          </el-input>
        </el-form-item>
      </el-card>

      <!-- 心跳包配置 -->
      <el-card shadow="never" class="config-section">
        <template #header>
          <div class="card-header">
            <span>心跳包配置</span>
            <el-switch v-model="form.heartbeat.enabled" @change="onHeartbeatToggle" />
          </div>
        </template>

        <el-form-item label="发送间隔">
          <div class="heartbeat-controls">
            <el-input-number
              v-model="form.heartbeat.interval"
              :min="5"
              :max="3600"
              :disabled="!form.heartbeat.enabled"
            />
            <span class="unit">秒</span>
          </div>
        </el-form-item>

        <el-form-item label="心跳内容">
          <el-input
            v-model="form.heartbeat.content"
            type="textarea"
            :rows="3"
            placeholder="请输入心跳包内容"
            :disabled="!form.heartbeat.enabled"
            spellcheck="false"
          />
        </el-form-item>

        <el-form-item label="数据格式">
          <el-radio-group v-model="form.heartbeat.format" :disabled="!form.heartbeat.enabled">
            <el-radio label="string">字符串 (String)</el-radio>
            <el-radio label="hex">十六进制 (Hex)</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-card>

      <!-- 连接控制 -->
      <div class="connection-actions">
        <el-button
          type="primary"
          size="large"
          :loading="isConnecting"
          :disabled="!canConnect"
          @click="handleConnect"
          style="width: 100%"
        >
          <template v-if="connectionStatus === 'connected'">
            <el-icon><CircleCheck /></el-icon>
            已连接
          </template>
          <template v-else-if="isConnecting">
            <el-icon class="is-loading"><Loading /></el-icon>
            连接中...
          </template>
          <template v-else>
            <el-icon><Connection /></el-icon>
            连接服务器
          </template>
        </el-button>

        <el-button
          v-if="connectionStatus === 'connected'"
          type="danger"
          size="large"
          @click="handleDisconnect"
          style="width: 100%; margin-top: 10px"
        >
          <el-icon><SwitchButton /></el-icon>
          断开连接
        </el-button>
      </div>

      <!-- 连接状态 -->
      <el-alert
        v-if="connectionStatus !== 'disconnected'"
        :title="statusText"
        :type="statusType"
        show-icon
        :closable="false"
        style="margin-top: 15px"
      />
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useConnectionStore } from '@/store/connection'
import { WebSocketManager } from '@/utils/websocket'
import { TCPSocket } from '@/utils/tcp'
import {
  Setting,
  Location,
  Refresh,
  Connection,
  CircleCheck,
  Loading,
  SwitchButton
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const connectionStore = useConnectionStore()

// 连接管理器实例
const wsManager = new WebSocketManager()
const tcpSocket = new TCPSocket()

const form = ref({
  host: 'localhost',
  port: 18080,
  protocol: 'ws' as 'ws' | 'wss' | 'tcp',
  sn: 'DEV-' + Date.now(),
  heartbeat: {
    enabled: false,
    interval: 30,
    content: '',
    format: 'string' as 'string' | 'hex'
  }
})

const isConnecting = ref(false)

const connectionStatus = computed(() => connectionStore.connectionStatus)

const statusText = computed(() => {
  const statusMap = {
    disconnected: '未连接',
    connecting: '连接中...',
    connected: '已连接',
    failed: '连接失败',
    reconnecting: '重连中...'
  }
  return statusMap[connectionStatus.value]
})

const statusType = computed(() => {
  const typeMap = {
    disconnected: 'info',
    connecting: 'warning',
    connected: 'success',
    failed: 'error',
    reconnecting: 'warning'
  }
  return typeMap[connectionStatus.value]
})

const canConnect = computed(() => {
  return form.value.host && form.value.port && form.value.sn
})

const onProtocolChange = (protocol: 'ws' | 'wss' | 'tcp') => {
  // 根据协议类型调整默认端口
  const defaultPorts = {
    ws: 18080,
    wss: 18443,
    tcp: 18888
  }
  form.value.port = defaultPorts[protocol]
}

const generateSN = () => {
  form.value.sn = 'DEV-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9).toUpperCase()
  ElMessage.success('SN 生成成功')
}

const onHeartbeatToggle = (enabled: boolean) => {
  if (enabled && !form.value.heartbeat.content) {
    form.value.heartbeat.content = 'PING'
  }
}

const handleConnect = async () => {
  if (!canConnect.value) {
    ElMessage.warning('请填写完整的连接信息')
    return
  }

  isConnecting.value = true
  connectionStore.setConnectionStatus('connecting')

  try {
    // 更新配置到 store
    connectionStore.updateServerConfig({
      host: form.value.host,
      port: form.value.port,
      protocol: form.value.protocol
    })

    connectionStore.updateDeviceConfig({
      sn: form.value.sn
    })

    connectionStore.updateHeartbeatConfig({
      enabled: form.value.heartbeat.enabled,
      interval: form.value.heartbeat.interval,
      content: form.value.heartbeat.content,
      format: form.value.heartbeat.format
    })

    // 根据协议类型建立连接
    if (form.value.protocol === 'ws' || form.value.protocol === 'wss') {
      const protocol = form.value.protocol
      const url = `${protocol}://${form.value.host}:${form.value.port}`

      // 设置 WebSocket 事件监听
      wsManager.onOpen = () => {
        console.log('WebSocket connected')
        connectionStore.setConnectionStatus('connected')
        connectionStore.setConnectionManager('ws', wsManager)
        ElMessage.success('WebSocket 连接成功')
      }

      wsManager.onClose = () => {
        console.log('WebSocket disconnected')
        connectionStore.setConnectionStatus('disconnected')
        connectionStore.setConnectionManager('ws', null)
        ElMessage.info('WebSocket 已断开')
      }

      wsManager.onError = (error) => {
        console.error('WebSocket error:', error)
        connectionStore.setConnectionStatus('failed')
        ElMessage.error('WebSocket 连接失败')
      }

      wsManager.onMessage = (data) => {
        console.log('WebSocket message:', data)
        // 将数据传递给 DataInteraction 组件显示
        const dataInteraction = document.querySelector('.data-interaction')
        if (dataInteraction && (dataInteraction as any).__vue__) {
          const instance = (dataInteraction as any).__vue__.exposed
          if (instance && instance.simulateReceiveData) {
            instance.simulateReceiveData(data)
          }
        }
      }

      // 建立连接
      await wsManager.connect(url, form.value.sn)

    } else if (form.value.protocol === 'tcp') {
      // 设置 TCP 事件监听
      tcpSocket.onOpen = () => {
        console.log('TCP connected')
        connectionStore.setConnectionStatus('connected')
        connectionStore.setConnectionManager('tcp', tcpSocket)
        ElMessage.success('TCP 连接成功')
      }

      tcpSocket.onClose = () => {
        console.log('TCP disconnected')
        connectionStore.setConnectionStatus('disconnected')
        connectionStore.setConnectionManager('tcp', null)
        ElMessage.info('TCP 已断开')
      }

      tcpSocket.onError = (error) => {
        console.error('TCP error:', error)
        connectionStore.setConnectionStatus('failed')
        ElMessage.error('TCP 连接失败: ' + error.message)
      }

      tcpSocket.onData = (data) => {
        console.log('TCP data received:', data)
        // TODO: 将数据传递给 DataInteraction 组件显示
      }

      // 建立连接
      await tcpSocket.connect(form.value.host, form.value.port)
    }

  } catch (error) {
    console.error('Connection failed:', error)
    connectionStore.setConnectionStatus('failed')
    ElMessage.error('连接失败: ' + (error as Error).message)
  } finally {
    isConnecting.value = false
  }
}

const handleDisconnect = () => {
  // 根据当前协议断开连接
  if (form.value.protocol === 'ws' || form.value.protocol === 'wss') {
    wsManager.disconnect()
    connectionStore.setConnectionManager('ws', null)
  } else if (form.value.protocol === 'tcp') {
    tcpSocket.disconnect()
    connectionStore.setConnectionManager('tcp', null)
  }

  connectionStore.setConnectionStatus('disconnected')
  ElMessage.info('已断开连接')
}

onMounted(() => {
  // 加载保存的配置
  connectionStore.loadConfig()

  // 同步表单数据（带默认值兜底）
  form.value.host = connectionStore.serverConfig.host || 'localhost'
  form.value.port = connectionStore.serverConfig.port || 18080
  form.value.protocol = connectionStore.serverConfig.protocol || 'ws'
  form.value.sn = connectionStore.deviceConfig.sn || ('DEV-' + Date.now())
  form.value.heartbeat = { ...connectionStore.heartbeatConfig }

  // 确保所有必要字段都有值，防止按钮被禁用
  if (!form.value.host) form.value.host = 'localhost'
  if (!form.value.port) form.value.port = 18080
  if (!form.value.sn || form.value.sn.trim() === '') {
    form.value.sn = 'DEV-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9).toUpperCase()
  }

  console.log('[ConnectionConfig] Form initialized:', form.value)
})
</script>

<style scoped>
.connection-config {
  width: 100%;
  display: flex;
  flex-direction: column;
  height: 100%;
  padding-bottom: 20px; /* 确保底部内容有足够边距 */
}

.panel-title {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.config-section {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.heartbeat-controls {
  display: flex;
  align-items: center;
  gap: 10px;
}

.unit {
  color: #909399;
  font-size: 14px;
}

.connection-actions {
  margin-top: 20px;
}
</style>
