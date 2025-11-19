<template>
  <div class="config-container">
    <div class="config-group">
      <div class="group-title">设备标识</div>
      <el-input v-model="store.deviceConfig.sn" placeholder="Device SN" @change="handleSNChange">
        <template #prepend>SN</template>
        <template #append>
          <el-button @click="generateSN"><el-icon><Refresh /></el-icon></el-button>
        </template>
      </el-input>
    </div>

    <div class="config-group">
      <div class="group-header">
        <div class="group-title">登录/注册包</div>
        <el-switch
          v-model="store.loginConfig.enabled"
          size="small"
          :disabled="isConnectionActive"
          @change="onLoginToggle"
        />
      </div>

      <div v-if="store.loginConfig.enabled && !isConnectionActive" class="compact-form">
        <div class="row">
          <el-radio-group v-model="store.loginConfig.format" size="small" @change="handleLoginFormatChange">
            <el-radio-button label="string">STR</el-radio-button>
            <el-radio-button label="hex">HEX</el-radio-button>
          </el-radio-group>
        </div>
        <el-input
          v-model="loginDisplayContent"
          type="textarea"
          :rows="2"
          placeholder="连接成功后自动发送"
          resize="none"
          @input="handleLoginInput"
        />
      </div>
      <div v-else-if="store.loginConfig.enabled" class="login-status">
        <el-tag size="small" type="info">{{ store.loginConfig.format === 'hex' ? 'HEX' : 'STR' }}</el-tag>
        <span class="content-preview">{{ loginDisplayContent }}</span>
      </div>
    </div>

    <div class="config-group">
      <div class="group-header">
        <div class="group-title">心跳维持</div>
        <el-switch
          v-model="store.heartbeatConfig.enabled"
          size="small"
          :disabled="isHeartbeatDisabled"
          @change="onHeartbeatToggle"
        />
      </div>

      <div v-if="store.heartbeatConfig.enabled && !isHeartbeatDisabled" class="compact-form">
        <div class="row">
          <span class="label">间隔(秒):</span>
          <el-input-number
            v-model="store.heartbeatConfig.interval"
            size="small"
            :min="1"
            controls-position="right"
            style="width: 80px;"
            @change="handleIntervalChange"
          />

          <el-radio-group v-model="store.heartbeatConfig.format" size="small" style="margin-left: auto;" @change="handleFormatChange">
            <el-radio-button label="string">STR</el-radio-button>
            <el-radio-button label="hex">HEX</el-radio-button>
          </el-radio-group>
        </div>
        <el-input
          v-model="heartbeatDisplayContent"
          placeholder="心跳内容"
          size="small"
          @input="handleHeartbeatInput"
        />
      </div>

      <div v-else-if="store.heartbeatConfig.enabled && isHeartbeatDisabled" class="heartbeat-status">
        <el-descriptions :column="1" size="small" border>
          <el-descriptions-item label="状态">
            <el-tag size="small" type="success">已启用</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="间隔">{{ store.heartbeatConfig.interval }} 秒</el-descriptions-item>
          <el-descriptions-item label="格式">{{ store.heartbeatConfig.format === 'string' ? '字符串' : '十六进制' }}</el-descriptions-item>
          <el-descriptions-item label="内容">
            <span class="heartbeat-content-display">{{ heartbeatDisplayContent || store.heartbeatConfig.content }}</span>
          </el-descriptions-item>
        </el-descriptions>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useConnectionStore } from '@/store/connection'
import { DataFormatter } from '@/utils/data-formatter'
import { Refresh } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const store = useConnectionStore()

// HEX模式下的心跳内容原始数据存储（不包含空格）
const rawHeartbeatContent = ref('')

// 心跳内容的显示数据（用于 v-model）
const heartbeatDisplayContent = ref('')

// 登录包相关变量
const rawLoginContent = ref('')
const loginDisplayContent = ref('')

// 连接状态判断
const isConnectionActive = computed(() => {
  return store.connectionStatus === 'connected' || store.connectionStatus === 'connecting'
})

// 连接时锁定心跳包配置
const isHeartbeatDisabled = computed(() => {
  return store.connectionStatus === 'connected' || store.connectionStatus === 'connecting'
})

// 生成新 SN
const generateSN = () => {
  const newSN = 'DEV-' + Math.random().toString(36).substr(2, 6).toUpperCase()
  store.updateDeviceConfig({ sn: newSN })
  ElMessage.success('SN 已生成')
}

// SN 变化处理
const handleSNChange = (value: string) => {
  if (value && value.trim()) {
    store.updateDeviceConfig({ sn: value })
  }
}

// 心跳包 Toggle
const onHeartbeatToggle = (enabled: boolean) => {
  if (enabled && !store.heartbeatConfig.content) {
    store.updateHeartbeatConfig({
      enabled,
      content: 'PING'
    })
    heartbeatDisplayContent.value = 'PING'
  } else {
    store.updateHeartbeatConfig({ enabled })
  }
}

// 登录包 Toggle
const onLoginToggle = (enabled: boolean) => {
  if (enabled && !store.loginConfig.content) {
    store.updateLoginConfig({
      enabled,
      content: 'LOGIN'
    })
    loginDisplayContent.value = 'LOGIN'
  } else {
    store.updateLoginConfig({ enabled })
  }
}

// 登录包输入处理
const handleLoginInput = (value: string) => {
  if (store.loginConfig.format === 'hex') {
    const cleaned = DataFormatter.sanitizeHexInput(value)
    rawLoginContent.value = cleaned
    loginDisplayContent.value = DataFormatter.formatHexWithSpaces(cleaned)
    store.updateLoginConfig({
      content: cleaned
    })
  } else {
    loginDisplayContent.value = value
    store.updateLoginConfig({
      content: value
    })
  }
}

// 登录包格式转换
const handleLoginFormatChange = (newFormat: 'string' | 'hex') => {
  try {
    if (newFormat === 'hex') {
      // 字符串转HEX
      const currentData = loginDisplayContent.value || store.loginConfig.content || ''
      if (currentData.trim() || currentData.length > 0) {
        const converted = DataFormatter.stringToHex(currentData)
        rawLoginContent.value = DataFormatter.sanitizeHexInput(converted)
        loginDisplayContent.value = DataFormatter.formatHexWithSpaces(rawLoginContent.value)
        store.updateLoginConfig({
          format: newFormat,
          content: rawLoginContent.value
        })
      } else {
        rawLoginContent.value = ''
        loginDisplayContent.value = ''
        store.updateLoginConfig({
          format: newFormat,
          content: ''
        })
      }
    } else {
      // HEX转字符串
      const hexData = rawLoginContent.value || store.loginConfig.content || ''
      if (hexData) {
        const converted = DataFormatter.hexToString(hexData)
        loginDisplayContent.value = converted
        rawLoginContent.value = ''
        store.updateLoginConfig({
          format: newFormat,
          content: converted
        })
      } else {
        loginDisplayContent.value = ''
        rawLoginContent.value = ''
        store.updateLoginConfig({
          format: newFormat,
          content: ''
        })
      }
    }
  } catch (error) {
    console.error('Login format conversion error:', error)
    ElMessage.error('格式转换失败：' + (error as Error).message)
  }
}

// 处理心跳间隔变化
const handleIntervalChange = (value: number) => {
  store.updateHeartbeatConfig({
    interval: value
  })
}

// 处理心跳包数据输入
const handleHeartbeatInput = (value: string) => {
  if (store.heartbeatConfig.format === 'hex') {
    const cleaned = DataFormatter.sanitizeHexInput(value)
    rawHeartbeatContent.value = cleaned
    const formatted = DataFormatter.formatHexWithSpaces(cleaned)
    heartbeatDisplayContent.value = formatted
    store.updateHeartbeatConfig({
      content: cleaned
    })
  } else {
    heartbeatDisplayContent.value = value
    store.updateHeartbeatConfig({
      content: value
    })
  }
}

// 处理心跳包格式变化
const handleFormatChange = (newFormat: 'string' | 'hex') => {
  try {
    if (newFormat === 'hex') {
      // 字符串转HEX
      const currentData = heartbeatDisplayContent.value || store.heartbeatConfig.content || ''
      if (currentData.trim() || currentData.length > 0) {
        const converted = DataFormatter.stringToHex(currentData)
        rawHeartbeatContent.value = DataFormatter.sanitizeHexInput(converted)
        heartbeatDisplayContent.value = DataFormatter.formatHexWithSpaces(rawHeartbeatContent.value)
        store.updateHeartbeatConfig({
          format: newFormat,
          content: rawHeartbeatContent.value
        })
      } else {
        rawHeartbeatContent.value = ''
        heartbeatDisplayContent.value = ''
        store.updateHeartbeatConfig({
          format: newFormat,
          content: ''
        })
      }
    } else {
      // HEX转字符串
      const hexData = rawHeartbeatContent.value || store.heartbeatConfig.content || ''
      if (hexData) {
        const converted = DataFormatter.hexToString(hexData)
        heartbeatDisplayContent.value = converted
        rawHeartbeatContent.value = ''
        store.updateHeartbeatConfig({
          format: newFormat,
          content: converted
        })
      } else {
        heartbeatDisplayContent.value = ''
        rawHeartbeatContent.value = ''
        store.updateHeartbeatConfig({
          format: newFormat,
          content: ''
        })
      }
    }
  } catch (error) {
    console.error('Heartbeat format conversion error:', error)
    ElMessage.error('格式转换失败：' + (error as Error).message)
  }
}

onMounted(() => {
  // 初始化心跳显示
  if (store.heartbeatConfig.format === 'hex' && store.heartbeatConfig.content) {
    rawHeartbeatContent.value = store.heartbeatConfig.content
    heartbeatDisplayContent.value = DataFormatter.formatHexWithSpaces(rawHeartbeatContent.value)
  } else {
    heartbeatDisplayContent.value = store.heartbeatConfig.content || ''
    rawHeartbeatContent.value = ''
  }

  // 初始化登录包显示
  if (store.loginConfig.format === 'hex' && store.loginConfig.content) {
    rawLoginContent.value = store.loginConfig.content
    loginDisplayContent.value = DataFormatter.formatHexWithSpaces(rawLoginContent.value)
  } else {
    loginDisplayContent.value = store.loginConfig.content || ''
    rawLoginContent.value = ''
  }
})
</script>

<style scoped>
.config-container {
  padding: 16px;
  color: #ccc;
  height: 100%;
  overflow-y: auto;
}

.config-group {
  margin-bottom: 20px;
  background: #333;
  padding: 12px;
  border-radius: 4px;
}

.group-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.group-title {
  font-size: 12px;
  font-weight: bold;
  color: #aaa;
  text-transform: uppercase;
  margin-bottom: 8px;
}

.group-header .group-title {
  margin-bottom: 0;
}

.compact-form {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.label {
  font-size: 12px;
  color: #888;
}

.login-status {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 0;
}

.content-preview {
  font-family: 'Consolas', monospace;
  color: #888;
  font-size: 12px;
  word-break: break-all;
}

.heartbeat-status {
  padding: 8px 0;
}

.heartbeat-content-display {
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 12px;
  color: #888;
  word-break: break-all;
}

/* 深色主题覆盖 Element Plus 样式 */
:deep(.el-input__wrapper),
:deep(.el-textarea__inner) {
  background-color: #1e1e1e;
  box-shadow: none;
  border: 1px solid #444;
  color: #fff;
}

:deep(.el-input__wrapper:hover),
:deep(.el-textarea__inner:hover) {
  border-color: #409eff;
}

:deep(.el-input__inner) {
  color: #fff;
}

:deep(.el-input__inner::placeholder),
:deep(.el-textarea__inner::placeholder) {
  color: #666;
}

:deep(.el-input-group__prepend) {
  background-color: #2a2a2a;
  border-color: #444;
  color: #888;
}

:deep(.el-input-group__append) {
  background-color: #2a2a2a;
  border-color: #444;
}

:deep(.el-input-group__append .el-button) {
  color: #888;
}

:deep(.el-input-group__append .el-button:hover) {
  color: #409eff;
}

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

:deep(.el-input-number) {
  --el-input-bg-color: #1e1e1e;
  --el-input-border-color: #444;
  --el-input-text-color: #fff;
}

:deep(.el-switch) {
  --el-switch-off-color: #444;
}

:deep(.el-descriptions) {
  --el-descriptions-table-border: 1px solid #444;
}

:deep(.el-descriptions__label) {
  background-color: #2a2a2a;
  color: #888;
}

:deep(.el-descriptions__content) {
  background-color: #1e1e1e;
  color: #ccc;
}

:deep(.el-tag--info) {
  background-color: #333;
  border-color: #444;
  color: #888;
}

:deep(.el-tag--success) {
  background-color: rgba(103, 194, 58, 0.2);
  border-color: rgba(103, 194, 58, 0.4);
  color: #67c23a;
}
</style>
