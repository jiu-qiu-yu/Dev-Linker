<template>
  <div class="flex flex-col gap-3">

    <!-- 设备SN管理卡片 -->
    <div class="bg-white rounded-xl border border-slate-200 shadow-sm-soft overflow-hidden transition-all duration-200 hover:shadow-card">
      <div class="flex justify-between items-center px-4 py-3 border-b border-slate-100 bg-slate-50/50">
        <div class="flex items-center gap-2">
          <div class="w-1.5 h-1.5 rounded-full bg-brand-500"></div>
          <span class="text-sm font-semibold text-slate-700">设备管理</span>
        </div>
        <el-icon :size="14" class="text-slate-400"><Setting /></el-icon>
      </div>

      <div class="p-4 relative">
        <div v-if="isConnectionActive" class="absolute inset-0 z-10 flex items-center justify-center pointer-events-none rounded-b-xl">
          <div class="flex flex-col items-center gap-2 text-slate-300/50">
            <el-icon :size="40"><Lock /></el-icon>
          </div>
        </div>

        <div>
          <div v-if="isConnectionActive" class="flex justify-between text-sm pb-2">
            <span class="text-slate-500">设备SN</span>
            <span class="font-mono font-medium text-slate-800">{{ store.deviceConfig.sn }}</span>
          </div>
          <el-input
            v-else
            v-model="store.deviceConfig.sn"
            placeholder="Device SN"
            @change="handleSNChange"
            size="default"
          >
            <template #prepend>
              <span class="text-slate-600 font-medium">SN</span>
            </template>
            <template #append>
              <button
                class="px-3 py-1 text-sm text-slate-600 hover:text-brand-600 transition-colors"
                @click="generateSN"
              >
                <el-icon><Refresh /></el-icon>
              </button>
            </template>
          </el-input>
        </div>
      </div>
    </div>

    <!-- 登录/注册包卡片 -->
    <div class="bg-white rounded-xl border border-slate-200 shadow-sm-soft overflow-hidden transition-all duration-200 hover:shadow-card">
      <div class="flex justify-between items-center px-4 py-3 border-b border-slate-100 bg-slate-50/50">
        <div class="flex items-center gap-2">
          <div class="w-1.5 h-1.5 rounded-full bg-brand-500"></div>
          <span class="text-sm font-semibold text-slate-700">登录/注册包</span>
        </div>
        <el-switch
          v-model="store.loginConfig.enabled"
          size="small"
          :disabled="isConnectionActive"
          @change="onLoginToggle"
        />
      </div>

      <div class="p-4 relative">
        <div v-if="isConnectionActive && store.loginConfig.enabled" class="absolute inset-0 z-10 flex items-end justify-end p-3 rounded-b-xl pointer-events-none">
          <el-icon :size="16" class="text-slate-300"><Lock /></el-icon>
        </div>

        <div>
          <div v-if="store.loginConfig.enabled && !isConnectionActive" class="flex flex-col gap-3">
            <div class="flex gap-2">
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

          <div v-else-if="store.loginConfig.enabled && isConnectionActive" class="flex flex-col gap-2">
            <div class="flex justify-between text-sm border-b border-slate-100 pb-2">
              <span class="text-slate-500">格式</span>
              <span class="font-medium text-slate-800">{{ store.loginConfig.format === 'hex' ? 'HEX' : 'STR' }}</span>
            </div>
            <div class="flex flex-col gap-1">
              <span class="text-xs text-slate-400">发送内容</span>
              <div class="bg-slate-100 text-slate-700 font-mono text-sm p-2 rounded border border-slate-200 break-all">
                {{ loginDisplayContent }}
              </div>
            </div>
          </div>

          <div v-else class="text-center text-slate-400 text-sm py-2">
            未启用登录包
          </div>
        </div>
      </div>
    </div>

    <!-- 心跳包卡片 -->
    <div class="bg-white rounded-xl border border-slate-200 shadow-sm-soft overflow-hidden transition-all duration-200 hover:shadow-card">
      <div class="flex justify-between items-center px-4 py-3 border-b border-slate-100 bg-slate-50/50">
        <div class="flex items-center gap-2">
          <div class="w-1.5 h-1.5 rounded-full bg-brand-500"></div>
          <span class="text-sm font-semibold text-slate-700">心跳维持</span>
        </div>
        <el-switch
          v-model="store.heartbeatConfig.enabled"
          size="small"
          :disabled="isHeartbeatDisabled"
          @change="onHeartbeatToggle"
        />
      </div>

      <div class="p-4 relative">
        <div v-if="isHeartbeatDisabled && store.heartbeatConfig.enabled" class="absolute inset-0 z-10 flex items-end justify-end p-3 rounded-b-xl pointer-events-none">
          <el-icon :size="16" class="text-slate-300"><Lock /></el-icon>
        </div>

        <div>
          <div v-if="store.heartbeatConfig.enabled && !isHeartbeatDisabled" class="flex flex-col gap-3">
            <div class="flex items-center justify-between gap-2">
              <div class="flex items-center gap-2">
                <span class="text-sm text-slate-600">间隔(秒):</span>
                <el-input-number
                  v-model="store.heartbeatConfig.interval"
                  size="small"
                  :min="1"
                  controls-position="right"
                  style="width: 80px;"
                  @change="handleIntervalChange"
                />
              </div>

              <el-radio-group v-model="store.heartbeatConfig.format" size="small" @change="handleFormatChange">
                <el-radio-button label="string">STR</el-radio-button>
                <el-radio-button label="hex">HEX</el-radio-button>
              </el-radio-group>
            </div>
            <el-input
              v-model="heartbeatDisplayContent"
              placeholder="心跳内容"
              size="default"
              @input="handleHeartbeatInput"
            />
          </div>

          <div v-else-if="store.heartbeatConfig.enabled && isHeartbeatDisabled" class="flex flex-col gap-2">
            <div class="flex justify-between text-sm border-b border-slate-100 pb-2">
              <span class="text-slate-500">间隔</span>
              <span class="font-medium text-slate-800">{{ store.heartbeatConfig.interval }} 秒</span>
            </div>
            <div class="flex justify-between text-sm border-b border-slate-100 pb-2">
              <span class="text-slate-500">格式</span>
              <span class="font-medium text-slate-800">{{ store.heartbeatConfig.format === 'hex' ? 'HEX' : 'STR' }}</span>
            </div>
            <div class="flex flex-col gap-1">
              <span class="text-xs text-slate-400">发送内容</span>
              <div class="bg-slate-100 text-slate-700 font-mono text-sm p-2 rounded border border-slate-200 break-all">
                {{ heartbeatDisplayContent || store.heartbeatConfig.content }}
              </div>
            </div>
          </div>

          <div v-else class="text-center text-slate-400 text-sm py-2">
            未启用心跳包
          </div>
        </div>
      </div>
    </div>

    <!-- HTTP 配置卡片 -->
    <div v-if="store.serverConfig.protocolType === 'HTTP'" class="bg-white rounded-xl border border-slate-200 shadow-sm-soft overflow-hidden transition-all duration-200 hover:shadow-card">
      <div class="flex justify-between items-center px-4 py-3 border-b border-slate-100 bg-slate-50/50">
        <div class="flex items-center gap-2">
          <div class="w-1.5 h-1.5 rounded-full bg-brand-500"></div>
          <span class="text-sm font-semibold text-slate-700">HTTP 请求配置</span>
        </div>
        <el-icon :size="14" class="text-slate-400"><Setting /></el-icon>
      </div>

      <div class="p-4 relative">
        <div v-if="isConnectionActive" class="absolute inset-0 z-10 flex items-end justify-end p-3 rounded-b-xl pointer-events-none">
          <el-icon :size="16" class="text-slate-300"><Lock /></el-icon>
        </div>

        <div class="flex flex-col gap-4">
          <!-- 第一部分：请求方式选择 -->
          <div>
            <label class="text-xs text-slate-500 mb-1.5 block font-medium">请求方式</label>
            <el-select
              v-model="store.httpConfig.method"
              size="default"
              :disabled="isConnectionActive"
              @change="handleMethodChange"
              class="w-full"
            >
              <el-option label="GET" value="GET" />
              <el-option label="POST" value="POST" />
            </el-select>
          </div>

          <!-- 第二部分：自定义请求头 -->
          <div>
            <label class="text-xs text-slate-500 mb-1.5 block font-medium">自定义请求头（可选）</label>
            <div class="bg-slate-50 border border-slate-200 rounded-lg p-3 max-h-40 overflow-y-auto">
              <div v-if="!isConnectionActive" class="flex flex-col gap-2">
                <div v-for="(value, key) in store.httpConfig.headers" :key="key" class="flex gap-2 items-center">
                  <el-input
                    v-model="headerKeys[key]"
                    placeholder="Header 键"
                    size="small"
                    class="flex-1"
                    readonly
                  />
                  <el-input
                    v-model="store.httpConfig.headers[key]"
                    placeholder="Header 值"
                    size="small"
                    class="flex-1"
                    @change="handleHeaderChange"
                  />
                  <el-button size="small" type="danger" text @click="removeHeader(key)">
                    <el-icon><Close /></el-icon>
                  </el-button>
                </div>
                <el-button
                  v-if="Object.keys(store.httpConfig.headers || {}).length === 0"
                  size="small"
                  type="primary"
                  plain
                  @click="addHeader"
                  class="w-full"
                >
                  <el-icon><Plus /></el-icon>
                  <span class="ml-1">添加请求头</span>
                </el-button>
                <el-button
                  v-else
                  size="small"
                  type="primary"
                  text
                  @click="addHeader"
                >
                  <el-icon><Plus /></el-icon>
                  <span class="ml-1">继续添加</span>
                </el-button>
              </div>
              <div v-else class="text-sm text-slate-600">
                <div v-if="Object.keys(store.httpConfig.headers || {}).length === 0" class="text-slate-400 text-center py-2">
                  无自定义请求头
                </div>
                <div v-else class="space-y-1">
                  <div v-for="(value, key) in store.httpConfig.headers" :key="key" class="flex justify-between items-center py-1.5 border-b border-slate-100 last:border-0">
                    <span class="font-mono text-xs text-slate-500 font-medium">{{ key }}</span>
                    <span class="font-mono text-xs text-slate-700">{{ value }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 第三部分：URL 解析结果 -->
          <div>
            <label class="text-xs text-slate-500 mb-1.5 block font-medium">URL 解析结果</label>
            <div v-if="store.httpConfig.parsedScheme" class="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div class="grid grid-cols-2 gap-x-4 gap-y-2.5 text-sm">
                <div class="flex items-center justify-between">
                  <span class="text-slate-600 font-medium">协议</span>
                  <span class="font-semibold text-blue-700 uppercase">{{ store.httpConfig.parsedScheme }}</span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-slate-600 font-medium">端口</span>
                  <span class="font-mono font-semibold text-blue-700">{{ store.httpConfig.parsedPort }}</span>
                </div>
                <div class="col-span-2 flex items-center justify-between">
                  <span class="text-slate-600 font-medium">主机</span>
                  <span class="font-mono text-xs text-blue-700 font-semibold">{{ store.httpConfig.parsedHost }}</span>
                </div>
                <div class="col-span-2 flex items-start justify-between gap-2">
                  <span class="text-slate-600 font-medium flex-shrink-0">路径</span>
                  <span class="font-mono text-xs text-blue-700 break-all text-right font-semibold">{{ store.httpConfig.parsedPath || '/' }}</span>
                </div>
              </div>
            </div>
            <div v-else class="bg-slate-50 border border-slate-200 rounded-lg p-3 text-center">
              <span class="text-xs text-slate-400">请在顶部地址栏输入完整 HTTP URL</span>
            </div>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useConnectionStore } from '@/store/connection'
import { DataFormatter } from '@/utils/data-formatter'
import { Refresh, Setting, Lock, Close, Plus } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const store = useConnectionStore()

// HEX模式下的心跳内容原始数据存储（不包含空格）
const rawHeartbeatContent = ref('')

// 心跳内容的显示数据（用于 v-model）
const heartbeatDisplayContent = ref('')

// 登录包相关变量
const rawLoginContent = ref('')
const loginDisplayContent = ref('')

// HTTP 配置相关
const headerKeys = ref<Record<string, string>>({})

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

// HTTP 配置处理方法
const handleMethodChange = (value: 'GET' | 'POST') => {
  store.updateHTTPConfig({ method: value })
}

const handleHeaderChange = () => {
  store.updateHTTPConfig({ headers: { ...store.httpConfig.headers } })
}

const addHeader = () => {
  const key = `Header-${Date.now()}`
  const headers = { ...store.httpConfig.headers }
  headers[key] = ''
  headerKeys.value[key] = key
  store.updateHTTPConfig({ headers })
}

const removeHeader = (key: string) => {
  const headers = { ...store.httpConfig.headers }
  delete headers[key]
  delete headerKeys.value[key]
  store.updateHTTPConfig({ headers })
}

// [新增] 监听 Store 变化以处理持久化数据的延迟加载
watch(() => store.loginConfig, (newConfig) => {
  // 仅当本地显示为空且 Store 有值时同步，避免覆盖用户正在输入的内容
  if (!loginDisplayContent.value && newConfig.content) {
    if (newConfig.format === 'hex') {
       rawLoginContent.value = newConfig.content
       loginDisplayContent.value = DataFormatter.formatHexWithSpaces(newConfig.content)
    } else {
       loginDisplayContent.value = newConfig.content
    }
  }
}, { deep: true, immediate: true }) // immediate 确保组件挂载时如果有值也能执行

watch(() => store.heartbeatConfig, (newConfig) => {
  if (!heartbeatDisplayContent.value && newConfig.content) {
    if (newConfig.format === 'hex') {
      rawHeartbeatContent.value = newConfig.content
      heartbeatDisplayContent.value = DataFormatter.formatHexWithSpaces(newConfig.content)
    } else {
      heartbeatDisplayContent.value = newConfig.content
    }
  }
}, { deep: true, immediate: true })

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

  // 初始化 HTTP 请求头键值映射
  if (store.httpConfig.headers) {
    Object.keys(store.httpConfig.headers).forEach(key => {
      headerKeys.value[key] = key
    })
  }
})
</script>
