<template>
  <div class="data-interaction">
    <!-- 数据发送区域 -->
    <el-card shadow="never" class="send-section">
      <template #header>
        <div class="section-header">
          <span>
            <el-icon><Promotion /></el-icon>
            数据发送
          </span>
          <el-radio-group v-model="sendFormat" size="small">
            <el-radio-button label="string">字符串</el-radio-button>
            <el-radio-button label="hex">十六进制</el-radio-button>
          </el-radio-group>
        </div>
      </template>

      <el-input
        v-model="sendData"
        type="textarea"
        :rows="4"
        :placeholder="sendPlaceholder"
        :disabled="!canSend"
      />

      <div class="send-actions">
        <el-button
          type="primary"
          :disabled="!canSend || !sendData.trim()"
          @click="handleSend"
          :loading="isSending"
        >
          <el-icon><Promotion /></el-icon>
          发送数据
        </el-button>
        <el-button @click="clearSendData">
          <el-icon><Delete /></el-icon>
          清空
        </el-button>
      </div>
    </el-card>

    <!-- 数据接收/日志区域 -->
    <el-card shadow="never" class="log-section">
      <template #header>
        <div class="section-header">
          <span>
            <el-icon><Document /></el-icon>
            接收日志
          </span>
          <div class="log-controls">
            <el-radio-group v-model="logFormat" size="small">
              <el-radio-button label="string">字符串</el-radio-button>
              <el-radio-button label="hex">十六进制</el-radio-button>
            </el-radio-group>
            <el-button size="small" @click="clearLogs">
              <el-icon><Delete /></el-icon>
              清空日志
            </el-button>
          </div>
        </div>
      </template>

      <div class="log-container" ref="logContainer">
        <div
          v-for="log in logs"
          :key="log.id"
          class="log-item"
          :class="`log-${log.type}`"
        >
          <span class="log-time">{{ log.timestamp }}</span>
          <span class="log-type">{{ getLogTypeText(log.type) }}</span>
          <span class="log-content">{{ log.content }}</span>
        </div>
        <div v-if="logs.length === 0" class="empty-logs">
          <el-empty description="暂无日志记录" />
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import { useConnectionStore, LogEntry } from '@/store/connection'
import { Promotion, Delete, Document } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const connectionStore = useConnectionStore()

// 发送数据
const sendData = ref('')
const sendFormat = ref<'string' | 'hex'>('string')
const isSending = ref(false)

// 日志数据
const logContainer = ref<HTMLElement>()
const logs = ref<LogEntry[]>([])

// 计算属性
const canSend = computed(() => connectionStore.connectionStatus === 'connected')

const sendPlaceholder = computed(() => {
  return sendFormat.value === 'string'
    ? '请输入要发送的字符串数据'
    : '请输入十六进制数据，例如：48656C6C6F20576F726C64'
})

const logFormat = computed({
  get: () => connectionStore.heartbeatConfig.format,
  set: (value) => connectionStore.updateHeartbeatConfig({ format: value })
})

const getLogTypeText = (type: LogEntry['type']) => {
  const typeMap = {
    connection: '[连接]',
    send: '[发送]',
    receive: '[接收]',
    error: '[错误]'
  }
  return typeMap[type]
}

const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9)
}

const getCurrentTime = () => {
  const now = new Date()
  return now.toLocaleTimeString()
}

const clearSendData = () => {
  sendData.value = ''
}

const clearLogs = () => {
  logs.value = []
}

const addLog = (type: LogEntry['type'], content: string, format: 'string' | 'hex' = 'string') => {
  const log: LogEntry = {
    id: generateId(),
    timestamp: getCurrentTime(),
    type,
    content,
    format
  }
  logs.value.push(log)
  nextTick(() => {
    if (logContainer.value) {
      logContainer.value.scrollTop = logContainer.value.scrollHeight
    }
  })
}

const handleSend = async () => {
  if (!sendData.value.trim()) {
    ElMessage.warning('请输入要发送的数据')
    return
  }

  isSending.value = true

  try {
    // 检查连接状态
    if (connectionStore.connectionStatus !== 'connected') {
      ElMessage.error('未连接到服务器')
      addLog('error', '发送失败: 未连接到服务器')
      return
    }

    // 检查连接管理器
    if (!connectionStore.wsManager && !connectionStore.tcpSocket) {
      ElMessage.error('连接管理器未初始化')
      addLog('error', '发送失败: 连接管理器未初始化')
      return
    }

    // 发送数据 - 根据格式转换数据
    let dataToSend = sendData.value

    if (sendFormat.value === 'hex') {
      // 如果选择HEX格式，验证并转换数据
      const cleanHex = sendData.value.replace(/\s/g, '').replace(/^0x/, '')
      if (cleanHex.length % 2 !== 0) {
        throw new Error('十六进制数据位数必须是偶数')
      }
      if (!/^[0-9A-Fa-f]*$/.test(cleanHex)) {
        throw new Error('请输入有效的十六进制数据')
      }
      // 十六进制数据直接发送（不需要转换，因为用户输入的就是hex）
      dataToSend = cleanHex
    }

    const success = connectionStore.sendData(dataToSend)
    if (success) {
      addLog('send', sendData.value, sendFormat.value)
      ElMessage.success('发送成功')
      sendData.value = ''
    } else {
      throw new Error('发送失败：网络错误或连接已断开')
    }
  } catch (error) {
    const errorMsg = (error as Error).message
    addLog('error', '发送失败: ' + errorMsg)
    ElMessage.error('发送失败: ' + errorMsg)
  } finally {
    isSending.value = false
  }
}

// 模拟接收数据
const simulateReceiveData = (data: string) => {
  addLog('receive', data, 'string')
}

defineExpose({
  simulateReceiveData
})
</script>

<style scoped>
.data-interaction {
  display: flex;
  flex-direction: column;
  gap: 20px;
  height: 100%;
}

.send-section {
  flex-shrink: 0;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.send-actions {
  margin-top: 15px;
  display: flex;
  gap: 10px;
}

.log-section {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.log-controls {
  display: flex;
  align-items: center;
  gap: 15px;
}

.log-container {
  flex: 1;
  overflow-y: auto;
  background: #1e1e1e;
  color: #d4d4d4;
  padding: 15px;
  border-radius: 4px;
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 13px;
  line-height: 1.5;
  max-height: 400px;
  min-height: 300px;
}

.log-item {
  padding: 4px 8px;
  margin-bottom: 2px;
  white-space: pre-wrap;
  word-break: break-all;
}

.log-connection {
  color: #4fc3f7;
}

.log-send {
  color: #81c784;
}

.log-receive {
  color: #ffd54f;
}

.log-error {
  color: #e57373;
}

.log-time {
  color: #78909c;
  margin-right: 10px;
}

.log-type {
  font-weight: 600;
  margin-right: 10px;
  min-width: 60px;
  display: inline-block;
}

.log-content {
  color: inherit;
}

.empty-logs {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
}
</style>
