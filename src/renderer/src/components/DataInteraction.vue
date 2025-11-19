<template>
  <div class="flex flex-col h-full bg-white">

    <!-- 日志区 -->
    <div class="flex-1 overflow-y-auto bg-white log-container" ref="logContainer">
      <div v-if="logs.length === 0" class="flex items-center justify-center h-full text-slate-400 text-sm italic">
        暂无日志数据
      </div>
      <div v-else class="font-mono text-sm">
        <div
          v-for="log in logs"
          :key="log.id"
          class="flex gap-3 px-4 py-2 border-b border-slate-100 hover:bg-slate-50/50 transition-colors"
        >
          <span class="text-xs text-slate-400 flex-shrink-0 font-normal">{{ log.timestamp }}</span>
          <span
            class="text-xs font-semibold flex-shrink-0 min-w-[42px]"
            :class="{
              'text-blue-600': log.type === 'send',
              'text-emerald-600': log.type === 'receive',
              'text-slate-400': log.type === 'connection',
              'text-red-600': log.type === 'error'
            }"
          >
            {{ getLogTypeLabel(log.type) }}
          </span>
          <span class="flex-1 text-slate-800 break-all">{{ log.content }}</span>
        </div>
      </div>
    </div>

    <!-- 发送区 - 固定底部 -->
    <div class="flex-shrink-0 border-t border-slate-200 bg-white shadow-[0_-2px_8px_rgba(0,0,0,0.04)]">
      <!-- 工具栏 -->
      <div class="flex items-center justify-between px-4 py-2 border-b border-slate-100">
        <div class="flex items-center gap-3">
          <span class="text-sm font-medium text-slate-600">发送数据</span>
          <el-radio-group v-model="sendFormat" size="small">
            <el-radio-button label="string">String</el-radio-button>
            <el-radio-button label="hex">HEX</el-radio-button>
          </el-radio-group>
        </div>

        <div class="flex items-center gap-2">
          <span class="text-xs text-slate-400">日志格式:</span>
          <el-radio-group v-model="logFormat" size="small">
            <el-radio-button label="string">Str</el-radio-button>
            <el-radio-button label="hex">Hex</el-radio-button>
          </el-radio-group>
          <button
            class="ml-2 p-1.5 rounded-md hover:bg-slate-100 text-slate-400 hover:text-red-600 transition-colors"
            @click="clearLogs"
            title="清空日志"
          >
            <el-icon :size="16"><Delete /></el-icon>
          </button>
        </div>
      </div>

      <!-- 输入区 -->
      <div class="p-4">
        <div class="relative">
          <textarea
            v-model="sendDataDisplay"
            class="w-full px-3 py-2 text-sm font-mono border-0 border-b-2 border-slate-200 focus:border-brand-600 focus:outline-none resize-none transition-colors bg-transparent text-slate-800 placeholder:text-slate-400"
            :placeholder="sendPlaceholder"
            rows="2"
            spellcheck="false"
          ></textarea>
        </div>

        <div class="flex justify-between items-center mt-3">
          <button
            class="text-sm text-slate-400 hover:text-slate-600 transition-colors"
            @click="clearSendData"
          >
            清空
          </button>

          <button
            class="px-6 py-1.5 rounded-md text-sm font-medium transition-all"
            :class="canSend && hasSendData
              ? 'bg-brand-600 text-white hover:bg-brand-700 shadow-sm-soft'
              : 'bg-slate-100 text-slate-400 cursor-not-allowed'"
            :disabled="!canSend || !hasSendData || isSending"
            @click="handleSend"
          >
            {{ isSending ? '发送中...' : '发送' }}
          </button>
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
    ElMessage.warning({ message: '请输入要发送的数据', duration: 2000 })
    return
  }

  isSending.value = true

  try {
    // 检查连接状态
    if (connectionStore.connectionStatus !== 'connected') {
      ElMessage.error({ message: '未连接到服务器', duration: 2000 })
      addLog('error', '发送失败: 未连接到服务器')
      return
    }

    // 检查连接管理器
    if (!connectionStore.wsManager && !connectionStore.tcpSocket) {
      ElMessage.error({ message: '连接管理器未初始化', duration: 2000 })
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
      ElMessage.success({ message: '发送成功', duration: 2000 })
      // 清空数据
      sendData.value = ''
      rawSendData.value = ''
    } else {
      throw new Error('发送失败：网络错误或连接已断开')
    }
  } catch (error) {
    const errorMsg = (error as Error).message
    addLog('error', '发送失败: ' + errorMsg)
    ElMessage.error({ message: '发送失败: ' + errorMsg, duration: 2000 })
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
})
</script>

<style scoped>
/* 自定义滚动条样式 */
.log-container::-webkit-scrollbar {
  width: 8px;
}

.log-container::-webkit-scrollbar-track {
  background: #f1f5f9; /* slate-100 */
  border-radius: 4px;
}

.log-container::-webkit-scrollbar-thumb {
  background: #cbd5e1; /* slate-300 */
  border-radius: 4px;
  transition: background 0.2s;
}

.log-container::-webkit-scrollbar-thumb:hover {
  background: #94a3b8; /* slate-400 */
}
</style>
