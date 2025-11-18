<template>
  <div class="main-container">
    <el-container>
      <!-- 顶部导航 -->
      <el-header class="app-header">
        <div class="header-content">
          <h1 class="app-title">
            <el-icon><Connection /></el-icon>
            Dev-Linker 虚拟4G模块模拟器
          </h1>
          <div class="header-actions">
            <el-button-group>
              <el-button type="primary" @click="showAbout = true">
                <el-icon><InfoFilled /></el-icon>
                关于
              </el-button>
            </el-button-group>
          </div>
        </div>
      </el-header>

      <!-- 主内容区域 -->
      <el-container>
        <!-- 连接配置面板 -->
        <el-aside width="350px" class="config-panel">
          <ConnectionConfig />
        </el-aside>

        <!-- 数据交互面板 -->
        <el-main class="data-panel">
          <DataInteraction />
        </el-main>
      </el-container>
    </el-container>

    <!-- 关于对话框 -->
    <el-dialog
      v-model="showAbout"
      title="关于 Dev-Linker"
      width="500px"
    >
      <div class="about-content">
        <p><strong>版本：</strong> 1.0.0</p>
        <p><strong>描述：</strong> 虚拟4G模块模拟器 - 物联网开发调试工具</p>
        <p><strong>功能：</strong></p>
        <ul>
          <li>支持 WebSocket 和 TCP 协议连接</li>
          <li>模拟4G模块网络通信</li>
          <li>实时数据收发测试</li>
          <li>本地开发环境调试</li>
        </ul>
      </div>
      <template #footer>
        <el-button @click="showAbout = false">确定</el-button>
      </template>
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
.main-container {
  width: 100%;
  height: 100vh;
}

.app-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 100%;
  padding: 0 20px;
}

.app-title {
  font-size: 20px;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 10px;
}

.config-panel {
  background: white;
  border-right: 1px solid #e4e7ed;
  padding: 20px;
  overflow-y: auto;
  overflow-x: hidden;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.data-panel {
  background: #f5f5f5;
  padding: 20px;
  overflow-y: auto;
}

.about-content {
  line-height: 1.8;
}

.about-content ul {
  margin-left: 20px;
  margin-top: 10px;
}
</style>
