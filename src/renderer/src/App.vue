<template>
  <div id="app">
    <router-view />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
</script>

<style scoped>
#app {
  width: 100%;
  height: 100vh;
  background: #f5f5f5;
}
</style>
