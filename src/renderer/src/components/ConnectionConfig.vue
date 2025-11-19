<template>
  <div class="config-container">
    <div class="config-group">
      <div class="group-header">
        <div class="group-title">
          <el-icon :size="14"><User /></el-icon>
          <span>登录/注册包</span>
        </div>
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
        <div class="group-title">
          <el-icon :size="14"><Timer /></el-icon>
          <span>心跳维持</span>
        </div>
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

    <!-- 设备SN管理区域 - 新增 -->
    <div class="config-group">
      <div class="group-header">
        <div class="group-title">
          <el-icon :size="14"><Setting /></el-icon>
          <span>设备管理</span>
        </div>
      </div>
      <div class="device-management">
        <el-input
          v-model="store.deviceConfig.sn"
          placeholder="Device SN"
          @change="handleSNChange"
          size="small"
          :disabled="isConnectionActive"
        >
          <template #prepend>SN</template>
          <template #append>
            <el-button @click="generateSN" size="small" :disabled="isConnectionActive">
              <el-icon><Refresh /></el-icon>
            </el-button>
          </template>
        </el-input>
        <div v-if="isConnectionActive" class="lock-hint">
          <el-icon :size="12"><Lock /></el-icon>
          <span>连接中，SN已锁定</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useConnectionStore } from '@/store/connection'
import { DataFormatter } from '@/utils/data-formatter'
import { Refresh, User, Timer, Setting, Lock } from '@element-plus/icons-vue'
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
  padding: 12px;
  color: #e6edf3;
  height: 100%;
  overflow-y: auto;
}

.config-group {
  margin-bottom: 12px;
  background: #1c2128;
  padding: 12px;
  border-radius: 6px;
  border: 1px solid #30363d;
  transition: all 0.2s;
}

.config-group:hover {
  border-color: #58a6ff;
  box-shadow: 0 0 0 1px rgba(88, 166, 255, 0.1);
}

.group-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.group-title {
  font-size: 13px;
  font-weight: 600;
  color: #e6edf3;
  display: flex;
  align-items: center;
  gap: 6px;
}

.group-title .el-icon {
  color: #58a6ff;
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
  color: #7d8590;
  font-weight: 500;
}

.login-status {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 0;
}

.content-preview {
  font-family: 'Consolas', monospace;
  color: #7d8590;
  font-size: 12px;
  word-break: break-all;
}

.heartbeat-status {
  padding: 8px 0;
}

.heartbeat-content-display {
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 12px;
  color: #7d8590;
  word-break: break-all;
}

.device-management {
  margin-top: 8px;
}

.lock-hint {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 6px;
  font-size: 11px;
  color: #7d8590;
  font-style: italic;
}

.lock-hint .el-icon {
  color: #d29922;
}

/* 深色主题覆盖 Element Plus 样式 */
:deep(.el-input__wrapper),
:deep(.el-textarea__inner) {
  background-color: #0d1117;
  box-shadow: none;
  border: 1px solid #30363d;
  color: #e6edf3;
  transition: all 0.2s;
}

:deep(.el-input__wrapper:hover),
:deep(.el-textarea__inner:hover) {
  border-color: #58a6ff;
}

:deep(.el-input__wrapper.is-focus),
:deep(.el-textarea__inner:focus) {
  border-color: #58a6ff;
  box-shadow: 0 0 0 3px rgba(88, 166, 255, 0.1);
}

:deep(.el-input__inner) {
  color: #e6edf3;
}

:deep(.el-input__inner::placeholder),
:deep(.el-textarea__inner::placeholder) {
  color: #484f58;
}

:deep(.el-input-group__prepend) {
  background-color: #21262d;
  border-color: #30363d;
  color: #7d8590;
}

:deep(.el-input-group__append) {
  background-color: #21262d;
  border-color: #30363d;
}

:deep(.el-input-group__append .el-button) {
  color: #7d8590;
  background: transparent;
  border: none;
}

:deep(.el-input-group__append .el-button:hover) {
  color: #58a6ff;
}

:deep(.el-radio-button__inner) {
  background-color: #21262d;
  border-color: #30363d;
  color: #7d8590;
  transition: all 0.2s;
}

:deep(.el-radio-button__inner:hover) {
  color: #58a6ff;
}

:deep(.el-radio-button__original-radio:checked + .el-radio-button__inner) {
  background-color: #238636;
  border-color: #238636;
  color: #fff;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

:deep(.el-input-number) {
  --el-input-bg-color: #0d1117;
  --el-input-border-color: #30363d;
  --el-input-text-color: #e6edf3;
  --el-input-hover-border-color: #58a6ff;
}

:deep(.el-switch) {
  --el-switch-off-color: #30363d;
  --el-switch-on-color: #238636;
  --el-switch-border-color: #30363d;
}

:deep(.el-switch.is-checked) {
  --el-switch-on-color: #238636;
}

:deep(.el-descriptions) {
  --el-descriptions-table-border: 1px solid #30363d;
}

:deep(.el-descriptions__label) {
  background-color: #21262d;
  color: #7d8590;
  font-weight: 500;
}

:deep(.el-descriptions__content) {
  background-color: #0d1117;
  color: #e6edf3;
}

:deep(.el-tag--info) {
  background-color: rgba(88, 166, 255, 0.15);
  border-color: rgba(88, 166, 255, 0.3);
  color: #58a6ff;
}

:deep(.el-tag--success) {
  background-color: rgba(63, 185, 80, 0.15);
  border-color: rgba(63, 185, 80, 0.3);
  color: #3fb950;
}
</style>
