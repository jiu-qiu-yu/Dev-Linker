<template>
  <div id="app">
    <router-view />
  </div>
</template>

<script setup lang="ts">
</script>

<style>
/* 全局样式重置 */
html, body {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
  overflow: hidden; /* 禁止 body 滚动 */
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

#app {
  width: 100%;
  height: 100%;
  background-color: #0d1117; /* GitHub深色主题背景 */
}

/* 滚动条美化 (Webkit) - GitHub风格 */
::-webkit-scrollbar {
  width: 10px;
  height: 10px;
}

::-webkit-scrollbar-thumb {
  background: #30363d;
  border-radius: 5px;
  border: 2px solid #0d1117;
  transition: background 0.2s;
}

::-webkit-scrollbar-thumb:hover {
  background: #484f58;
}

::-webkit-scrollbar-track {
  background: #0d1117;
}

/* Firefox滚动条 */
* {
  scrollbar-width: thin;
  scrollbar-color: #30363d #0d1117;
}

/* 全局文本选择颜色 */
::selection {
  background: rgba(88, 166, 255, 0.3);
  color: #e6edf3;
}

/* 禁用拖拽选择 */
.no-select {
  -webkit-user-select: none;
  user-select: none;
}
</style>
