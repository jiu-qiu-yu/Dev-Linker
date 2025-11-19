<template>
  <div class="interaction-container">
    <div class="send-pane">
      <div class="pane-header">
        <span class="title">发送数据</span>
        <el-radio-group v-model="sendFormat" size="small">
          <el-radio-button label="string">String</el-radio-button>
          <el-radio-button label="hex">HEX</el-radio-button>
        </el-radio-group>
      </div>

      <div class="input-area">
        <el-input
          v-model="sendDataDisplay"
          type="textarea"
          :rows="3"
          :placeholder="sendPlaceholder"
          resize="none"
          class="custom-textarea"
          spellcheck="false"
        />
        <div class="send-tools">
          <el-button size="small" text @click="clearSendData">清空</el-button>
          <el-button
            type="primary"
            :disabled="!canSend || !hasSendData"
            :loading="isSending"
            @click="handleSend"
          >
            发送
          </el-button>
        </div>
      </div>
    </div>

    <div class="log-pane">
      <div class="pane-header">
        <span class="title">运行日志</span>
        <div class="controls">
          <el-radio-group v-model="logFormat" size="small">
            <el-radio-button label="string">Str</el-radio-button>
            <el-radio-button label="hex">Hex</el-radio-button>
          </el-radio-group>
          <el-button size="small" circle @click="clearLogs">
            <el-icon><Delete /></el-icon>
          </el-button>
        </div>
      </div>

      <div class="log-scroll-container" ref="logContainer">
        <div v-if="logs.length === 0" class="empty-state">
          暂无日志数据
        </div>
        <div
          v-for="log in logs"
          :key="log.id"
          class="log-row"
          :class="log.type"
        >
          <span class="time">[{{ log.timestamp }}]</span>
          <span class="tag" :class="log.type">{{ getLogTypeLabel(log.type) }}</span>
          <span class="content">{{ log.content }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, watch, onMounted } from 'vue'
import { useConnectionStore } from '@/store/connection'
import type { LogEntry } from '@shared/types'
import { Delete } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { DataFormatter } from '@/utils/data-formatter'

const connectionStore = useConnectionStore()

// 发送数据
const sendData = ref('')
const sendFormat = ref<'string' | 'hex'>('string')
const isSending = ref(false)
const lastSendFormat = ref<'string' | 'hex'>('string')  // 记录上次的格式，用于转换

// HEX模式下的内部数据存储（不包含空格）
const rawSendData = ref('')

// 计算属性：用于 v-model 的显示数据
const sendDataDisplay = computed({
  get: () => {
    if (sendFormat.value === 'hex') {
      // HEX 模式下返回格式化显示
      return DataFormatter.formatHexWithSpaces(rawSendData.value)
    }
    return sendData.value
  },
  set: (value: string) => {
    if (sendFormat.value === 'hex') {
      // HEX 模式下只保留有效字符并更新原始数据
      const cleaned = DataFormatter.sanitizeHexInput(value)
      rawSendData.value = cleaned
    } else {
      // 字符串模式下直接更新
      sendData.value = value
    }
  }
})

// 日志数据
const logContainer = ref<HTMLElement>()
const logs = ref<LogEntry[]>([])

// 计算属性
const canSend = computed(() => connectionStore.connectionStatus === 'connected')

const hasSendData = computed(() => {
  if (sendFormat.value === 'hex') {
    return rawSendData.value.length > 0
  }
  return sendData.value.trim().length > 0
})

const sendPlaceholder = computed(() => {
  return sendFormat.value === 'string'
    ? '请输入要发送的字符串数据'
    : '请输入十六进制数据，例如：48656C6C6F20576F726C64'
})

// 使用独立的数据交互配置，而不是心跳包配置
const logFormat = computed({
  get: () => connectionStore.dataInteractionConfig.logFormat,
  set: (value) => connectionStore.updateDataInteractionConfig({ logFormat: value })
})

const getLogTypeLabel = (type: string) => {
  const map: any = { connection: '系统', send: '发送', receive: '接收', error: '错误' }
  return map[type] || 'INFO'
}

const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9)
}

const getCurrentTime = () => {
  const now = new Date()
  return now.toLocaleTimeString()
}

// 清除数据时同时清理原始数据
const clearSendData = () => {
  sendData.value = ''
  rawSendData.value = ''
}

// 监听发送格式变化，自动转换数据
watch(sendFormat, (newFormat, oldFormat) => {
  if (newFormat !== oldFormat) {
    try {
      if (newFormat === 'hex') {
        // 字符串转HEX
        const currentData = sendData.value
        const converted = DataFormatter.stringToHex(currentData)
        // 清理并更新原始数据（显示通过计算属性自动处理）
        rawSendData.value = DataFormatter.sanitizeHexInput(converted)
        // 清空字符串数据
        sendData.value = ''
      } else {
        // HEX转字符串
        const hexData = rawSendData.value
        const converted = DataFormatter.hexToString(hexData)
        // 更新字符串数据
        sendData.value = converted
        // 清空HEX原始数据
        rawSendData.value = ''
      }

      lastSendFormat.value = newFormat
    } catch (error) {
      console.error('Format conversion error:', error)
      // 转换失败时清空数据
      sendData.value = ''
      rawSendData.value = ''
    }
  }
})

// 监听日志格式变化，重新转换所有日志显示
watch(logFormat, (newFormat, oldFormat) => {
  if (newFormat !== oldFormat && logs.value.length > 0) {
    logs.value = logs.value.map(log => {
      try {
        // 重新转换日志内容
        const converted = DataFormatter.convert(log.content, oldFormat, newFormat)
        return {
          ...log,
          content: converted,
          format: newFormat
        }
      } catch (error) {
        // 转换失败时保持原样
        return {
          ...log,
          format: newFormat
        }
      }
    })
  }
})

const clearLogs = () => {
  logs.value = []
}

const addLog = (type: LogEntry['type'], content: string, originalFormat: 'string' | 'hex' = 'string') => {
  // 根据当前日志格式转换显示内容
  let displayContent = content
  if (logFormat.value !== originalFormat) {
    try {
      displayContent = DataFormatter.convert(content, originalFormat, logFormat.value)
    } catch (error) {
      // 转换失败时显示原始内容
      displayContent = content
    }
  }

  const log: LogEntry = {
    id: generateId(),
    timestamp: getCurrentTime(),
    type,
    content: displayContent,  // 使用转换后的显示内容
    format: logFormat.value
  }
  logs.value.push(log)
  nextTick(() => {
    if (logContainer.value) {
      logContainer.value.scrollTop = logContainer.value.scrollHeight
    }
  })
}

const handleSend = async () => {
  if (!hasSendData.value) {
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

    // 验证并准备发送数据
    let dataToSend: string | Uint8Array

    // 如果是HEX格式，转换为二进制数据发送
    if (sendFormat.value === 'hex') {
      if (!rawSendData.value || rawSendData.value.length === 0) {
        throw new Error('请输入有效的十六进制数据')
      }
      // 转换为二进制数据
      dataToSend = DataFormatter.hexToUint8Array(rawSendData.value)
    } else {
      // 字符串格式直接发送
      dataToSend = sendData.value
    }

      const success = await connectionStore.sendData(dataToSend)
    if (success) {
      // 记录发送的数据：使用实际发送的原始数据，而不是显示数据
      let logContent: string
      let logFormat: 'string' | 'hex'

      if (sendFormat.value === 'hex') {
        // HEX格式发送时，记录带空格的显示格式
        logContent = DataFormatter.formatHexWithSpaces(rawSendData.value)
        logFormat = 'hex'
      } else {
        // 字符串格式发送时，记录原始字符串
        logContent = sendData.value
        logFormat = 'string'
      }

      addLog('send', logContent, logFormat)
      ElMessage.success('发送成功')
      // 清空数据
      sendData.value = ''
      rawSendData.value = ''
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
const simulateReceiveData = (data: string, format: 'string' | 'hex' = 'string') => {
  addLog('receive', data, format)
}

defineExpose({
  simulateReceiveData
})

// 组件初始化
onMounted(() => {
  // 加载保存的配置
  connectionStore.loadConfig()

  // 如果心跳格式是HEX，需要格式化显示数据
  if (connectionStore.heartbeatConfig.format === 'hex' && connectionStore.heartbeatConfig.content) {
    const cleanHex = DataFormatter.sanitizeHexInput(connectionStore.heartbeatConfig.content)
    // 可以选择将心跳内容预填充到发送框（可选）
    // sendData.value = DataFormatter.formatHexWithSpaces(cleanHex)
    // rawSendData.value = cleanHex
  }
})
</script>

<style scoped>
.interaction-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 0;
}

.send-pane {
  flex-shrink: 0;
  border-bottom: 1px solid #333;
  background: #2d2d2d;
  padding: 12px 16px;
}

.pane-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.title {
  font-size: 14px;
  font-weight: 600;
  color: #ccc;
}

.input-area {
  border: 1px solid #444;
  border-radius: 4px;
  padding: 4px;
  transition: border-color 0.2s;
  background: #1e1e1e;
}

.input-area:focus-within {
  border-color: #409eff;
}

/* 深色主题输入框样式 */
:deep(.custom-textarea .el-textarea__inner) {
  border: none;
  box-shadow: none;
  padding: 8px;
  font-family: 'Consolas', monospace;
  background-color: transparent;
  color: #fff;
}

:deep(.custom-textarea .el-textarea__inner::placeholder) {
  color: #666;
}

.send-tools {
  display: flex;
  justify-content: flex-end;
  padding: 4px 8px 0;
  border-top: 1px dashed #444;
}

.send-tools .el-button--text {
  color: #888;
}

.send-tools .el-button--text:hover {
  color: #409eff;
}

.log-pane {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #1e1e1e;
  min-height: 0;
}

.log-pane .pane-header {
  background: #252526;
  color: #ccc;
  padding: 8px 16px;
  margin-bottom: 0;
  border-bottom: 1px solid #333;
}

.log-pane .title {
  color: #ccc;
}

.controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.controls .el-button {
  color: #888;
  background: transparent;
  border-color: #444;
}

.controls .el-button:hover {
  color: #f56c6c;
  border-color: #f56c6c;
}

.log-scroll-container {
  flex: 1;
  overflow-y: auto;
  padding: 10px;
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 13px;
  line-height: 1.6;
  color: #d4d4d4;
}

.log-row {
  margin-bottom: 4px;
  word-break: break-all;
  display: flex;
  gap: 8px;
}

.log-row .time {
  color: #6a9955;
  flex-shrink: 0;
}

.log-row .tag {
  flex-shrink: 0;
  font-weight: bold;
  min-width: 40px;
  text-align: center;
}

.log-row .tag.send { color: #569cd6; }
.log-row .tag.receive { color: #ce9178; }
.log-row .tag.error { color: #f44747; }
.log-row .tag.connection { color: #c586c0; }

.log-row .content {
  color: #d4d4d4;
}

.empty-state {
  color: #555;
  text-align: center;
  margin-top: 40px;
  font-style: italic;
}

/* 深色主题覆盖 Element Plus 样式 */
:deep(.el-radio-button__inner) {
  background-color: #2a2a2a;
  border-color: #444;
  color: #888;
}

:deep(.el-radio-button__original-radio:checked + .el-radio-button__inner) {
  background-color: #409eff;
  border-color: #409eff;
  color: #fff;
}

:deep(.el-button--primary) {
  background-color: #409eff;
  border-color: #409eff;
}

:deep(.el-button--primary:disabled) {
  background-color: #333;
  border-color: #444;
  color: #666;
}
</style>
