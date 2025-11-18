# Dev-Linker 虚拟4G模块模拟器

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Electron](https://img.shields.io/badge/Electron-28.0-blue.svg)](https://electronjs.org)
[![Vue](https://img.shields.io/badge/Vue-3.4-green.svg)](https://vuejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org)

> ⚠️ **AI 开发提示**：启动测试程序后必须主动清理后台进程，防止端口占用影响用户使用。详见 `AI-DEVELOPMENT-PROMPTS.md`

## 📖 项目简介

Dev-Linker 是一款专为物联网开发者设计的轻量级桌面端调试工具。它通过模拟4G模块的网络通信能力，帮助开发者在本地环境中进行实时数据收发测试，解决真实硬件设备开发阶段的调试痛点。

## ✨ 核心功能

- 🔌 **多协议支持**：WebSocket (ws://, wss://) 和 TCP 协议
- 🏷️ **设备标识**：自定义 SN/Client ID 配置
- 📊 **数据交互**：支持字符串和十六进制两种数据格式
- ❤️ **心跳包**：可配置定时心跳包发送
- 💾 **配置持久化**：自动保存和加载用户配置
- 📝 **实时日志**：清晰的数据收发日志显示
- 🌍 **地址支持**：支持本地和公网地址连接

## 🏗️ 技术架构

### 前端技术栈

- **框架**：Electron 28+
- **UI 框架**：Vue 3 + Composition API
- **语言**：TypeScript 5.3
- **UI 组件库**：Element Plus
- **状态管理**：Pinia
- **构建工具**：Vite 5
- **路由**：Vue Router 4

### 核心模块

```
src/
├── main/              # Electron 主进程
│   ├── main.ts        # 主进程入口
│   ├── preload.ts     # 预加载脚本
│   └── tcp-socket.ts  # TCP 连接管理器
├── renderer/          # 渲染进程（Vue 应用）
│   └── src/
│       ├── components/        # Vue 组件
│       │   ├── ConnectionConfig.vue
│       │   └── DataInteraction.vue
│       ├── views/            # 视图页面
│       │   └── MainView.vue
│       ├── router/           # 路由配置
│       ├── store/            # Pinia 状态管理
│       └── utils/            # 工具类
│           ├── websocket.ts  # WebSocket 管理器
│           ├── tcp.ts        # TCP 客户端封装
│           ├── data-formatter.ts  # 数据格式转换
│           └── config-manager.ts  # 配置管理
└── shared/            # 共享类型定义
    └── types.ts
```

## 🚀 快速开始

### 环境要求

- Node.js >= 18.0.0
- npm >= 9.0.0

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
# 同时启动 Vue 开发服务器和 Electron
npm run dev
```

### 构建项目

```bash
# 构建渲染进程和主进程
npm run build
```

### 运行应用

```bash
# 开发模式下运行
npm run dev

# 生产模式下运行（需要先构建）
npm run preview
```

## 📋 项目开发计划

### 当前阶段：M1 - 项目启动与基础设施 ✅

**已完成：**
- ✅ 项目骨架创建
- ✅ 开发环境配置
- ✅ 基础架构搭建（主/渲染进程、路由、状态管理）
- ✅ 核心组件开发（连接配置、数据交互面板）
- ✅ 技术预研（WebSocket、TCP 连接实现方案）

### 即将开始：M2 - 核心网络功能开发

**计划任务：**
- [ ] 集成 WebSocketManager 到主应用
- [ ] 集成 TCPSocketManager 到主应用
- [ ] 实现连接错误处理和重连机制
- [ ] 实现数据传输队列管理
- [ ] 实现 SN/Client ID 参数拼接
- [ ] 编写网络层单元测试

## 🔧 使用说明

### 基础连接

1. **选择协议**：在连接配置面板选择 WebSocket 或 TCP
2. **填写服务器信息**：输入服务器地址和端口
3. **设置设备标识**：输入 SN 码（可选）
4. **点击连接**：建立与服务器的连接

### 数据收发

1. **发送数据**：
   - 在数据发送区域输入数据
   - 选择数据格式（字符串或十六进制）
   - 点击发送按钮

2. **查看日志**：
   - 接收的数据会在日志区域实时显示
   - 日志会标记时间戳和类型（发送/接收/连接/错误）
   - 支持清空日志功能

### 心跳包配置

1. **启用心跳包**：在连接配置面板打开心跳包开关
2. **设置内容**：输入心跳包内容（字符串或十六进制）
3. **设置间隔**：配置发送间隔（秒）

## 📊 性能指标

| 指标项 | 目标值 | 说明 |
|--------|--------|------|
| 启动时间 | < 3秒 | 从启动到界面可用的时间 |
| 内存占用 | < 200MB | 空闲状态下的内存使用 |
| CPU 占用 | < 5% | 无数据传输时的 CPU 使用率 |
| 包体积 | < 100MB | 压缩后的安装包大小 |

## 🐛 已知问题

- TCP 连接功能需要主进程 IPC 调用（正在完善中）
- 心跳包定时器尚未集成到主应用（将在 M2 阶段实现）
- 配置导入/导出功能待开发

## 📝 开发规范

### 代码规范

- 使用 TypeScript 严格模式
- 组件采用 `<script setup>` 语法
- 遵循 ESLint 配置的代码风格
- 所有 API 必须有类型定义

### 提交规范

项目采用 Conventional Commits 规范：

- `feat:` 新功能
- `fix:` 修复
- `docs:` 文档更新
- `style:` 代码格式调整
- `refactor:` 重构
- `test:` 测试相关
- `chore:` 构建或辅助工具

### 示例

```bash
git commit -m "feat: 添加 WebSocket 连接状态显示"
git commit -m "fix: 修复配置保存时的类型错误"
git commit -m "docs: 更新 README 使用说明"
```

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📧 联系方式

- 项目作者：九秋
- 制定计划：幽浮喵（专业工程师）

---

**感谢使用 Dev-Linker！** 🎉
