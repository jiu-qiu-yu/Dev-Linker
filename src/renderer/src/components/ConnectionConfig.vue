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
            <el-switch v-model="form.heartbeat.enabled" @change="onHeartbeatToggle" :disabled="isHeartbeatDisabled" />
          </div>
        </template>

        <el-form-item label="发送间隔">
          <div class="heartbeat-controls">
            <el-input-number
              v-model="form.heartbeat.interval"
              :min="5"
              :max="3600"
              :disabled="!form.heartbeat.enabled || isHeartbeatDisabled"
            />
            <span class="unit">秒</span>
          </div>
        </el-form-item>

        <el-form-item label="心跳内容">
          <el-input
            v-model="heartbeatDisplayContent"
            type="textarea"
            :rows="3"
            placeholder="请输入心跳包内容"
            :disabled="!form.heartbeat.enabled || isHeartbeatDisabled"
            spellcheck="false"
            @input="handleHeartbeatInput"
          />
        </el-form-item>

        <el-form-item label="数据格式">
          <el-radio-group v-model="form.heartbeat.format" :disabled="!form.heartbeat.enabled || isHeartbeatDisabled">
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
import { ref, computed, onMounted, watch } from 'vue'
import { useConnectionStore } from '@/store/connection'
import { WebSocketManager } from '@/utils/websocket'
import { TCPSocket } from '@/utils/tcp'
import { DataFormatter, DataFormat } from '@/utils/data-formatter'
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
const lastHeartbeatFormat = ref<'string' | 'hex'>('string')  // 记录心跳包上次的格式

// HEX模式下的心跳内容原始数据存储（不包含空格）
const rawHeartbeatContent = ref('')

// 心跳内容的显示数据（用于 v-model）
const heartbeatDisplayContent = ref('')

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

// 连接时锁定心跳包配置
const isHeartbeatDisabled = computed(() => {
  return connectionStatus.value === 'connected' || connectionStatus.value === 'connecting'
})

const canConnect = computed(() => {
  return form.value.host && form.value.port && form.value.sn && !isHeartbeatDisabled.value
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

// 处理心跳包数据输入（HEX模式下过滤并格式化非HEX字符）
const handleHeartbeatInput = (value: string) => {
  if (form.value.heartbeat.format === 'hex') {
    // 在HEX模式下，只保留有效的HEX字符
    const cleaned = DataFormatter.sanitizeHexInput(value)
    // 更新原始数据
    rawHeartbeatContent.value = cleaned
    // 立即格式化显示（每两个字符加一个空格）
    const formatted = DataFormatter.formatHexWithSpaces(cleaned)
    heartbeatDisplayContent.value = formatted
    // 同步更新form中的content字段，使用纯字符串（不带空格）进行存储
    // 这样localStorage中存储的是标准格式，避免混淆
    form.value.heartbeat.content = cleaned
  } else {
    // 字符串模式下直接更新显示内容
    heartbeatDisplayContent.value = value
    // 同步更新form中的content字段
    form.value.heartbeat.content = value
  }
}

// 监听心跳包格式变化，自动转换内容
watch(() => form.value.heartbeat.format, (newFormat, oldFormat) => {
  // **重要修复：只在oldFormat存在且确实变化时才转换**
  // 避免在组件初始化时触发（此时oldFormat可能是undefined或默认值）
  if (newFormat !== oldFormat && oldFormat && oldFormat !== 'string') {
    try {
      if (newFormat === 'hex') {
        // 字符串转HEX：使用form.value.heartbeat.content作为源数据
        const currentData = form.value.heartbeat.content
        if (currentData) {
          const converted = DataFormatter.stringToHex(currentData)
          // 更新原始数据和显示数据
          rawHeartbeatContent.value = DataFormatter.sanitizeHexInput(converted)
          heartbeatDisplayContent.value = DataFormatter.formatHexWithSpaces(rawHeartbeatContent.value)
          // 存储纯字符串（不带空格）
          form.value.heartbeat.content = DataFormatter.sanitizeHexInput(converted)
        }
      } else {
        // HEX转字符串：使用rawHeartbeatContent作为源数据
        const hexData = rawHeartbeatContent.value
        if (hexData) {
          const converted = DataFormatter.hexToString(hexData)
          heartbeatDisplayContent.value = converted
          rawHeartbeatContent.value = ''
          // 同步更新form中的content字段
          form.value.heartbeat.content = converted
        }
      }

      lastHeartbeatFormat.value = newFormat
    } catch (error) {
      console.error('Heartbeat format conversion error:', error)
      // 转换失败时清空内容
      heartbeatDisplayContent.value = ''
      rawHeartbeatContent.value = ''
      form.value.heartbeat.content = ''
    }
  }
})

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

  // 获取保存的心跳配置
  const savedHeartbeat = connectionStore.heartbeatConfig

  // **关键修复：先保存旧格式，避免watch监听器在设置过程中意外触发**
  const oldFormat = form.value.heartbeat.format

  // 分别设置心跳包字段，避免整体覆盖导致显示数据丢失
  form.value.heartbeat.enabled = savedHeartbeat.enabled ?? false
  form.value.heartbeat.interval = savedHeartbeat.interval ?? 30
  form.value.heartbeat.content = savedHeartbeat.content || ''
  form.value.heartbeat.format = savedHeartbeat.format || 'string'

  // **最后设置format，避免触发watch监听器**
  // 如果format变化了，需要手动处理显示数据
  if (form.value.heartbeat.format !== oldFormat) {
    // 根据格式初始化显示数据和原始数据
    if (form.value.heartbeat.format === 'hex' && form.value.heartbeat.content) {
      // HEX模式：content是纯字符串（不带空格）
      rawHeartbeatContent.value = form.value.heartbeat.content
      heartbeatDisplayContent.value = DataFormatter.formatHexWithSpaces(rawHeartbeatContent.value)
    } else {
      // 字符串模式：content就是显示内容
      heartbeatDisplayContent.value = form.value.heartbeat.content || ''
      rawHeartbeatContent.value = ''
    }
  } else {
    // format未变化，正常初始化
    if (form.value.heartbeat.format === 'hex' && form.value.heartbeat.content) {
      rawHeartbeatContent.value = form.value.heartbeat.content
      heartbeatDisplayContent.value = DataFormatter.formatHexWithSpaces(rawHeartbeatContent.value)
    } else {
      heartbeatDisplayContent.value = form.value.heartbeat.content || ''
      rawHeartbeatContent.value = ''
    }
  }

  // 确保所有必要字段都有值，防止按钮被禁用
  if (!form.value.host) form.value.host = 'localhost'
  if (!form.value.port) form.value.port = 18080
  if (!form.value.sn || form.value.sn.trim() === '') {
    form.value.sn = 'DEV-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9).toUpperCase()
  }
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
