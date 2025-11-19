<template>
  <div class="config-panel">
    <div class="panel-header">
      <h3>连接配置</h3>
    </div>

    <div class="config-scroll-area">
      <el-scrollbar>
        <div class="form-content">
          <el-form :model="form" label-position="top" size="default">
            <el-card shadow="never" class="config-card">
              <el-form-item label="服务器地址 (完整格式)">
                <el-input
                  v-model="fullAddress"
                  placeholder="例: ws://localhost:18080"
                  @blur="handleAddressBlur"
                  clearable
                >
                  <template #prepend>
                    <el-select v-model="form.protocol" style="width: 85px" @change="updateFullAddress">
                      <el-option label="WS" value="ws" />
                      <el-option label="WSS" value="wss" />
                      <el-option label="TCP" value="tcp" />
                      <el-option label="UDP" value="udp" disabled />
                      <el-option label="MQTT" value="mqtt" disabled />
                      <el-option label="HTTP" value="http" disabled />
                    </el-select>
                  </template>
                </el-input>
                <div class="url-preview" v-if="previewUrl">
                  <small>预览: {{ previewUrl }}</small>
                </div>
              </el-form-item>

              <div class="host-port-row">
                <el-form-item label="主机" style="flex: 2; margin-right: 10px; margin-bottom: 0;">
                  <el-input v-model="form.host" @input="updateFullAddress" />
                </el-form-item>
                <el-form-item label="端口" style="flex: 1; margin-bottom: 0;">
                  <el-input-number
                    v-model="form.port"
                    :min="1"
                    :max="65535"
                    style="width: 100%"
                    :controls="false"
                    @change="updateFullAddress"
                  />
                </el-form-item>
              </div>

              <el-form-item label="设备序列号 (SN)" style="margin-top: 16px;">
                <el-input v-model="form.sn" placeholder="唯一标识">
                  <template #append>
                    <el-button @click="generateSN"><el-icon><Refresh /></el-icon></el-button>
                  </template>
                </el-input>
              </el-form-item>
            </el-card>

            <el-card shadow="never" class="config-card">
              <template #header>
                <div class="card-header-row">
                  <span>登录/注册包 (连接后发送一次)</span>
                  <el-switch v-model="form.login.enabled" size="small" :disabled="isConnectionActive" @change="onLoginToggle" />
                </div>
              </template>

              <div v-if="form.login.enabled && !isConnectionActive" class="login-options">
                <el-form-item label="数据格式">
                  <el-radio-group v-model="form.login.format" size="small" @change="handleLoginFormatChange">
                    <el-radio-button label="string">字符串</el-radio-button>
                    <el-radio-button label="hex">十六进制</el-radio-button>
                  </el-radio-group>
                </el-form-item>

                <el-form-item label="发送内容">
                  <el-input
                    v-model="loginDisplayContent"
                    type="textarea"
                    :rows="2"
                    resize="none"
                    placeholder="连接成功后立即发送此数据，常用于设备鉴权"
                    @input="handleLoginInput"
                  />
                </el-form-item>
              </div>
              <div v-else-if="form.login.enabled" class="login-status">
                <el-tag size="small" type="info">{{ form.login.format === 'hex' ? 'HEX' : 'STR' }}</el-tag>
                <span class="content-preview">{{ loginDisplayContent }}</span>
              </div>
            </el-card>

            <el-card shadow="never" class="config-card">
              <template #header>
                <div class="card-header-row">
                  <span>心跳包</span>
                  <el-switch v-model="form.heartbeat.enabled" size="small" :disabled="isHeartbeatDisabled" @change="onHeartbeatToggle" />
                </div>
              </template>

              <!-- 连接前显示心跳包详细配置 -->
              <div v-if="form.heartbeat.enabled && !isHeartbeatDisabled" class="heartbeat-options">
                <el-form-item label="间隔 (秒)">
                  <el-input-number
                    v-model="form.heartbeat.interval"
                    :min="1"
                    size="small"
                    style="width: 100%"
                    @change="handleIntervalChange"
                  />
                </el-form-item>

                <el-form-item label="格式">
                  <el-radio-group
                    v-model="form.heartbeat.format"
                    size="small"
                    @change="handleFormatChange"
                  >
                    <el-radio-button label="string">STR</el-radio-button>
                    <el-radio-button label="hex">HEX</el-radio-button>
                  </el-radio-group>
                </el-form-item>

                <el-form-item label="内容">
                  <el-input
                    v-model="heartbeatDisplayContent"
                    type="textarea"
                    :rows="2"
                    resize="none"
                    spellcheck="false"
                    @input="handleHeartbeatInput"
                  />
                </el-form-item>
              </div>

              <!-- 连接后显示心跳包状态 -->
              <div v-else-if="form.heartbeat.enabled && isHeartbeatDisabled" class="heartbeat-status">
                <el-descriptions :column="1" size="small" border>
                  <el-descriptions-item label="状态">
                    <el-tag size="small" type="success">已启用</el-tag>
                  </el-descriptions-item>
                  <el-descriptions-item label="间隔">{{ form.heartbeat.interval }} 秒</el-descriptions-item>
                  <el-descriptions-item label="格式">{{ form.heartbeat.format === 'string' ? '字符串' : '十六进制' }}</el-descriptions-item>
                  <el-descriptions-item label="内容">
                    <span class="heartbeat-content-display">{{ heartbeatDisplayContent || form.heartbeat.content }}</span>
                  </el-descriptions-item>
                </el-descriptions>
              </div>
            </el-card>
          </el-form>
        </div>
      </el-scrollbar>
    </div>

    <div class="panel-footer">
      <el-button
        v-if="connectionStatus !== 'connected'"
        type="primary"
        size="large"
        class="action-btn"
        :loading="isConnecting"
        :disabled="!canConnect"
        @click="handleConnect"
      >
        {{ isConnecting ? '连接中...' : '连接服务器' }}
      </el-button>

      <el-button
        v-else
        type="danger"
        size="large"
        class="action-btn"
        @click="handleDisconnect"
      >
        断开连接
      </el-button>

      <div class="status-bar" :class="connectionStatus">
        <div class="status-dot"></div>
        <span>{{ statusText }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useConnectionStore } from '@/store/connection'
import { WebSocketManager } from '@/utils/websocket'
import { TCPSocket } from '@/utils/tcp'
import { DataFormatter } from '@/utils/data-formatter'
import { Refresh } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const connectionStore = useConnectionStore()

// 连接管理器实例
const wsManager = new WebSocketManager()
const tcpSocket = new TCPSocket()

const form = ref({
  host: 'localhost',
  port: 18080,
  protocol: 'ws' as 'ws' | 'wss' | 'tcp' | 'udp' | 'mqtt' | 'http',
  sn: 'DEV-' + Date.now(),
  heartbeat: {
    enabled: false,
    interval: 30,
    content: '',
    format: 'string' as 'string' | 'hex'
  },
  login: {
    enabled: false,
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

// 地址栏相关逻辑
const fullAddress = ref('ws://localhost:18080')

// 预览最终连接地址（带SN）
const previewUrl = computed(() => {
  const base = `${form.value.protocol}://${form.value.host}:${form.value.port}`
  return `${base}?sn=${form.value.sn}`
})

// 登录包相关变量
const rawLoginContent = ref('')
const loginDisplayContent = ref('')
const lastLoginFormat = ref<'string' | 'hex'>('string')

// 连接状态判断
const isConnectionActive = computed(() => {
  return connectionStatus.value === 'connected' || connectionStatus.value === 'connecting'
})

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

const onProtocolChange = (protocol: 'ws' | 'wss' | 'tcp' | 'udp' | 'mqtt' | 'http') => {
  // 根据协议类型调整默认端口
  const defaultPorts = {
    ws: 18080,
    wss: 18443,
    tcp: 18888,
    udp: 18888,
    mqtt: 18883,
    http: 8080
  }
  form.value.port = defaultPorts[protocol]
  // 实时保存服务器配置
  connectionStore.updateServerConfig({
    protocol,
    port: form.value.port
  })
  updateFullAddress()
}

// 地址输入框失焦处理
const handleAddressBlur = () => {
  connectionStore.parseConnectionString(fullAddress.value)
  // 从 store 同步回 form
  form.value.host = connectionStore.serverConfig.host
  form.value.port = connectionStore.serverConfig.port
  form.value.protocol = connectionStore.serverConfig.protocol
  // 如果 URL 里没 sn，保持原有的 sn 不变
}

// 手动修改协议/主机/端口时，反向更新 fullAddress
const updateFullAddress = () => {
  fullAddress.value = `${form.value.protocol}://${form.value.host}:${form.value.port}`
}

const generateSN = () => {
  form.value.sn = 'DEV-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9).toUpperCase()
  ElMessage.success('SN 生成成功')
}

const onHeartbeatToggle = (enabled: boolean) => {
  if (enabled && !form.value.heartbeat.content) {
    form.value.heartbeat.content = 'PING'
    heartbeatDisplayContent.value = 'PING'
  }
  // 保存配置
  connectionStore.updateHeartbeatConfig({
    enabled,
    content: form.value.heartbeat.content,
    interval: form.value.heartbeat.interval,
    format: form.value.heartbeat.format
  })
}

// 登录包 Toggle
const onLoginToggle = (enabled: boolean) => {
  if (enabled && !form.value.login.content) {
    form.value.login.content = 'LOGIN'
    loginDisplayContent.value = 'LOGIN'
  }
  // 保存配置
  connectionStore.updateLoginConfig({
    enabled,
    content: form.value.login.content,
    format: form.value.login.format
  })
}

// 登录包输入处理
const handleLoginInput = (value: string) => {
  if (form.value.login.format === 'hex') {
    const cleaned = DataFormatter.sanitizeHexInput(value)
    rawLoginContent.value = cleaned
    loginDisplayContent.value = DataFormatter.formatHexWithSpaces(cleaned)
    form.value.login.content = cleaned
  } else {
    loginDisplayContent.value = value
    form.value.login.content = value
  }
  connectionStore.updateLoginConfig({
    content: form.value.login.content,
    format: form.value.login.format
  })
}

// 登录包格式转换
const handleLoginFormatChange = (newFormat: 'string' | 'hex') => {
  try {
    const oldFormat = form.value.login.format

    if (newFormat === 'hex') {
      // 字符串转HEX
      const currentData = loginDisplayContent.value || form.value.login.content || ''
      if (currentData.trim() || currentData.length > 0) {
        const converted = DataFormatter.stringToHex(currentData)
        rawLoginContent.value = DataFormatter.sanitizeHexInput(converted)
        loginDisplayContent.value = DataFormatter.formatHexWithSpaces(rawLoginContent.value)
        form.value.login.content = DataFormatter.sanitizeHexInput(converted)
      } else {
        rawLoginContent.value = ''
        loginDisplayContent.value = ''
        form.value.login.content = ''
      }
    } else {
      // HEX转字符串
      const hexData = rawLoginContent.value || form.value.login.content || ''
      if (hexData) {
        const converted = DataFormatter.hexToString(hexData)
        loginDisplayContent.value = converted
        rawLoginContent.value = ''
        form.value.login.content = converted
      } else {
        loginDisplayContent.value = ''
        rawLoginContent.value = ''
        form.value.login.content = ''
      }
    }

    // 更新格式并保存配置
    form.value.login.format = newFormat
    lastLoginFormat.value = newFormat
    connectionStore.updateLoginConfig({
      format: newFormat,
      content: form.value.login.content
    })
  } catch (error) {
    console.error('Login format conversion error:', error)
    ElMessage.error('格式转换失败：' + (error as Error).message)
  }
}

const handleIntervalChange = (value: number) => {
  // 保存间隔配置
  connectionStore.updateHeartbeatConfig({
    interval: value
  })
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
    // 实时保存配置
    connectionStore.updateHeartbeatConfig({
      content: cleaned,
      format: 'hex'
    })
  } else {
    // 字符串模式下直接更新显示内容
    heartbeatDisplayContent.value = value
    // 同步更新form中的content字段
    form.value.heartbeat.content = value
    // 实时保存配置
    connectionStore.updateHeartbeatConfig({
      content: value,
      format: 'string'
    })
  }
}

// 处理心跳包格式变化 - 用户手动触发
const handleFormatChange = (newFormat: 'string' | 'hex') => {
  try {
    const oldFormat = form.value.heartbeat.format

    if (newFormat === 'hex') {
      // 字符串转HEX：使用当前显示内容作为源数据
      const currentData = heartbeatDisplayContent.value || form.value.heartbeat.content || ''
      if (currentData.trim() || currentData.length > 0) {
        const converted = DataFormatter.stringToHex(currentData)
        // 更新原始数据和显示数据
        rawHeartbeatContent.value = DataFormatter.sanitizeHexInput(converted)
        heartbeatDisplayContent.value = DataFormatter.formatHexWithSpaces(rawHeartbeatContent.value)
        // 存储纯字符串（不带空格）
        form.value.heartbeat.content = DataFormatter.sanitizeHexInput(converted)
      } else {
        // 如果没有数据，初始化为空
        rawHeartbeatContent.value = ''
        heartbeatDisplayContent.value = ''
        form.value.heartbeat.content = ''
      }
    } else {
      // HEX转字符串：使用rawHeartbeatContent作为源数据
      const hexData = rawHeartbeatContent.value || form.value.heartbeat.content || ''
      if (hexData) {
        const converted = DataFormatter.hexToString(hexData)
        heartbeatDisplayContent.value = converted
        rawHeartbeatContent.value = ''
        // 同步更新form中的content字段
        form.value.heartbeat.content = converted
      } else {
        // 如果没有数据，初始化为空
        heartbeatDisplayContent.value = ''
        rawHeartbeatContent.value = ''
        form.value.heartbeat.content = ''
      }
    }

    // 更新格式并保存配置
    form.value.heartbeat.format = newFormat
    lastHeartbeatFormat.value = newFormat
    connectionStore.updateHeartbeatConfig({
      format: newFormat,
      content: form.value.heartbeat.content
    })
  } catch (error) {
    console.error('Heartbeat format conversion error:', error)
    ElMessage.error('格式转换失败：' + (error as Error).message)
    // 转换失败时保持原有数据，不清空
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

  // 初始化地址栏
  updateFullAddress()

  // 获取保存的心跳配置
  const savedHeartbeat = connectionStore.heartbeatConfig

  // 分别设置心跳包字段
  form.value.heartbeat.enabled = savedHeartbeat.enabled ?? false
  form.value.heartbeat.interval = savedHeartbeat.interval ?? 30
  form.value.heartbeat.content = savedHeartbeat.content || ''
  form.value.heartbeat.format = savedHeartbeat.format || 'string'

  // **设置显示数据和原始数据**
  if (form.value.heartbeat.format === 'hex' && form.value.heartbeat.content) {
    // HEX模式：content是纯字符串（不带空格）
    rawHeartbeatContent.value = form.value.heartbeat.content
    heartbeatDisplayContent.value = DataFormatter.formatHexWithSpaces(rawHeartbeatContent.value)
  } else {
    // 字符串模式：content就是显示内容
    heartbeatDisplayContent.value = form.value.heartbeat.content || ''
    rawHeartbeatContent.value = ''
  }

  // 设置lastHeartbeatFormat
  lastHeartbeatFormat.value = form.value.heartbeat.format

  // 获取保存的登录包配置
  const savedLogin = connectionStore.loginConfig

  // 分别设置登录包字段
  form.value.login.enabled = savedLogin.enabled ?? false
  form.value.login.content = savedLogin.content || ''
  form.value.login.format = savedLogin.format || 'string'

  // 初始化登录包显示
  if (form.value.login.format === 'hex' && form.value.login.content) {
    rawLoginContent.value = form.value.login.content
    loginDisplayContent.value = DataFormatter.formatHexWithSpaces(rawLoginContent.value)
  } else {
    loginDisplayContent.value = form.value.login.content
    rawLoginContent.value = ''
  }

  // 设置lastLoginFormat
  lastLoginFormat.value = form.value.login.format

  // 确保所有必要字段都有值，防止按钮被禁用
  if (!form.value.host) form.value.host = 'localhost'
  if (!form.value.port) form.value.port = 18080
  if (!form.value.sn || form.value.sn.trim() === '') {
    form.value.sn = 'DEV-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9).toUpperCase()
  }

  console.log('[ConnectionConfig] Config loaded:', {
    heartbeat: savedHeartbeat,
    login: savedLogin,
    displayContent: heartbeatDisplayContent.value,
    rawContent: rawHeartbeatContent.value
  })
})

// 监听表单字段变化，实时保存配置
watch(() => form.value.host, (newValue) => {
  if (newValue) {
    connectionStore.updateServerConfig({ host: newValue })
  }
})

watch(() => form.value.port, (newValue) => {
  if (newValue) {
    connectionStore.updateServerConfig({ port: newValue })
  }
})

watch(() => form.value.sn, (newValue) => {
  if (newValue && newValue.trim()) {
    connectionStore.updateDeviceConfig({ sn: newValue })
  }
})
</script>

<style scoped>
.config-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #f9f9f9;
}

.panel-header {
  padding: 16px;
  border-bottom: 1px solid #e4e7ed;
  background: #fff;
}

.panel-header h3 {
  margin: 0;
  font-size: 16px;
  color: #303133;
}

.config-scroll-area {
  flex: 1;
  overflow: hidden; /* 内部 scrollbar 滚动 */
}

.form-content {
  padding: 16px;
}

.config-card {
  margin-bottom: 16px;
  border: 1px solid #ebeef5;
}

/* 压缩 Form Item 间距，让界面更紧凑 */
:deep(.el-form-item) {
  margin-bottom: 16px;
}
:deep(.el-card__header) {
  padding: 10px 15px;
  background: #fafafa;
}
:deep(.el-card__body) {
  padding: 15px;
}

.card-header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
  font-weight: 500;
}

.host-port-row {
  display: flex;
  gap: 10px;
  margin-top: 10px;
  padding: 0 5px;
}

.url-preview {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
  word-break: break-all;
}

.content-preview {
  font-family: 'Consolas', monospace;
  color: #606266;
  margin-left: 8px;
  word-break: break-all;
}

.heartbeat-options {
  /* 保持原有样式 */
}

.heartbeat-status {
  padding: 10px 0;
}

.login-options {
  /* 登录包配置样式 */
}

.login-status {
  padding: 10px 0;
}

.heartbeat-content-display {
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 12px;
  color: #606266;
  word-break: break-all;
}

.panel-footer {
  padding: 16px;
  background: #fff;
  border-top: 1px solid #e4e7ed;
  box-shadow: 0 -2px 10px rgba(0,0,0,0.05);
  z-index: 10;
}

.action-btn {
  width: 100%;
  font-weight: 600;
}

.status-bar {
  margin-top: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 12px;
  color: #909399;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #909399;
}

.status-bar.connected .status-dot { background: #67c23a; }
.status-bar.connected { color: #67c23a; }
.status-bar.connecting .status-dot { background: #e6a23c; }
.status-bar.failed .status-dot { background: #f56c6c; }
</style>
