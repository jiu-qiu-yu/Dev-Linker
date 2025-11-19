<template>
  <div class="layout-container">
    <header class="app-header">
      <div class="brand">
        <el-icon :size="20"><Connection /></el-icon>
        <span class="app-name">Dev-Linker</span>
        <el-tag size="small" effect="plain" class="version-tag">v1.2.2</el-tag>
      </div>
      <div class="window-actions">
        <el-button link @click="showAbout = true">
          <el-icon><InfoFilled /></el-icon>
        </el-button>
      </div>
    </header>

    <div class="app-body">
      <aside class="sidebar">
        <ConnectionConfig />
      </aside>

      <main class="content-area">
        <DataInteraction />
      </main>
    </div>

    <el-dialog v-model="showAbout" title="关于 Dev-Linker" width="400px">
      <div class="about-content">
        <p><strong>Dev-Linker</strong></p>
        <p>虚拟4G模块模拟器 - 物联网开发调试工具</p>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Connection, InfoFilled } from '@element-plus/icons-vue'
import ConnectionConfig from '@/components/ConnectionConfig.vue'
import DataInteraction from '@/components/DataInteraction.vue'

const showAbout = ref(false)
</script>

<style scoped>
.layout-container {
  display: flex;
  flex-direction: column;
  height: 100vh; /* 占满视口高度 */
  background-color: #fff;
}

.app-header {
  height: 48px; /* 缩小头部高度，节省空间 */
  background-color: #2b303b; /* 深色专业风格 */
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  flex-shrink: 0; /* 防止头部被压缩 */
  -webkit-app-region: drag; /* 允许拖拽窗口 */
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 600;
}

.version-tag {
  background: rgba(255,255,255,0.1);
  border: none;
  color: #aaa;
}

.window-actions {
  -webkit-app-region: no-drag;
}

.app-body {
  flex: 1; /* 占据剩余高度 */
  display: flex;
  overflow: hidden; /* 防止内部溢出导致整体滚动 */
}

.sidebar {
  width: 320px; /* 固定宽度 */
  background-color: #f8f9fa;
  border-right: 1px solid #e4e7ed;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.content-area {
  flex: 1; /* 占据剩余宽度 */
  background-color: #fff;
  overflow: hidden; /* 内部组件自己处理滚动 */
  display: flex;
  flex-direction: column;
}
</style>
