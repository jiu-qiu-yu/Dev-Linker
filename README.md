# Dev-Linker 虚拟4G模块模拟器

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Electron](https://img.shields.io/badge/Electron-28.0-blue.svg)](https://electronjs.org)
[![Vue](https://img.shields.io/badge/Vue-3.4-green.svg)](https://vuejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-3.4-cyan.svg)](https://tailwindcss.com)
[![Version](https://img.shields.io/badge/Version-1.4.1-brightgreen.svg)](https://github.com/jiu-qiu-yu/Dev-Linker)

> 🚀 **最新版本 v1.4.1**：四大协议完整支持 + 清爽浅色主题 + 专业级交互体验！

## 📖 项目简介

Dev-Linker 是一款专为物联网开发者设计的**轻量级桌面端调试工具**。它通过模拟4G模块的网络通信能力，帮助开发者在本地环境中进行实时数据收发测试，解决真实硬件设备开发阶段的调试痛点。

### 为什么选择 Dev-Linker？

- 💡 **解决痛点**：无需真实4G模块，本地即可测试物联网设备通信
- 🌐 **多协议支持**：WebSocket、TCP、UDP、HTTP 四大协议完整实现
- 🎨 **清爽界面**：简洁的浅色主题设计，护眼且专业
- 🔧 **开发友好**：完整的日志记录、格式转换、配置持久化
- ⚡ **轻量高效**：Electron + Vue3 技术栈，启动快速，性能优异
- 🎯 **功能完备**：登录包、心跳包、数据收发、格式转换一应俱全

## ✨ 核心功能

### 🌐 网络连接

#### 支持的协议（4/5 已实现）
- ✅ **WebSocket** (ws://, wss://) - 持久连接，实时双向通信
- ✅ **TCP** - 可靠传输，主进程实现，适用于大部分物联网场景
- ✅ **UDP** - 无连接协议，带连接验证机制，防止伪连接成功
- ✅ **HTTP/HTTPS** - 无状态请求，支持 GET/POST，云服务器/本地服务器通用
- ⏳ **MQTT** - 发布/订阅模式（规划中）

#### 连接特性
- 🌐 **智能地址解析**：支持完整URL输入，自动补全协议头和默认端口
- 🔄 **协议切换保护**：连接时自动禁用协议切换，防止误操作
- 📊 **连接状态指示**：实时显示连接状态（未连接/连接中/已连接/失败）
- 🎯 **SN参数拼接**：自动将设备SN作为URL查询参数发送
- 📏 **弹性地址栏**：自适应长地址显示，最大限度避免遮挡

### 🏷️ 设备管理
- **设备标识**：完整显示设备SN，支持一键复制
- 🔒 **智能锁定**：连接后自动锁定SN，防止误操作
- 🎲 **随机生成**：一键生成符合规范的设备SN（格式：`DEV-XXXXXX`）
- 💾 **配置持久化**：自动保存设备配置，下次启动自动加载

### 📡 数据交互

#### 数据发送
- 📤 **灵活格式**：支持字符串（String）和十六进制（HEX）两种格式
- 🔀 **智能转换**：切换格式时自动转换数据内容
- 📝 **格式化显示**：HEX数据自动空格分隔，提高可读性
- 🎯 **发送校验**：发送前检查连接状态和数据有效性

#### 数据接收
- 📥 **实时显示**：即时显示接收到的数据
- 🎨 **可视化日志**：不同类型日志用不同颜色标识
  - 🔵 **发送**：蓝色
  - 🟢 **接收**：绿色
  - 🔴 **错误**：红色
  - ⚪ **系统**：灰色
- 🔄 **格式切换**：日志支持 String/HEX 格式实时切换
- 📜 **自动滚动**：智能跟随最新日志，支持手动浏览历史

### ⚙️ 高级功能

#### 登录/注册包
- 🔐 **自动发送**：连接成功后立即发送登录包
- 🔀 **格式支持**：String/HEX 格式可选
- 🔒 **配置锁定**：连接后锁定配置，断开后解锁
- 💾 **持久化**：配置自动保存，下次启动自动加载

#### 心跳维持
- ❤️ **定时发送**：可配置间隔时间（秒）
- 🔀 **格式支持**：String/HEX 格式可选
- 🌐 **全协议支持**：WebSocket、TCP、UDP、HTTP 均支持心跳包
- 🔒 **配置锁定**：连接后锁定配置，断开后解锁

#### HTTP 特色功能
- 🌐 **单一 URL 输入**：浏览器式地址栏，支持完整 HTTP URL
- 🔍 **自动解析**：失焦或回车自动解析协议/主机/端口/路径
- 📊 **解析结果显示**：左下角实时显示 URL 解析详情
- 🔧 **请求方式**：GET/POST 两种常用方式
- 📝 **自定义请求头**：支持添加/删除任意请求头键值对

### 🎨 UI/UX 优化

#### 界面设计
- 🌞 **清爽浅色主题**：白色背景配合蓝色品牌色，护眼舒适
- 💳 **卡片式布局**：圆角卡片设计，层次分明
- ✨ **流畅动画**：所有交互都有平滑过渡效果
- 🎯 **焦点管理**：输入框聚焦时有蓝色边框高亮
- 🖱️ **Hover反馈**：所有可交互元素都有明显的视觉反馈

#### 交互优化
- 📏 **弹性地址栏**：地址输入框自适应长地址（使用 flexbox 布局）
- 💬 **提示框优化**：所有提示框下移100px，避免遮挡操作按钮
- 🔒 **协议切换保护**：连接时禁用协议下拉框，防止误操作
- 📜 **智能滚动**：日志区域支持智能跟随和手动浏览
- 💡 **状态提示**：锁定状态、格式要求等都有清晰提示

## 🏗️ 技术架构

### 前端技术栈

| 技术 | 版本 | 说明 |
|------|------|------|
| **框架** | Electron 28+ | 跨平台桌面应用框架 |
| **UI 框架** | Vue 3 | 使用 Composition API |
| **语言** | TypeScript 5.3 | 类型安全，开发体验好 |
| **UI 组件库** | Element Plus 2.5 | Vue 3 生态组件库 |
| **样式框架** | Tailwind CSS 3.4 | 实用优先的 CSS 框架 |
| **状态管理** | Pinia 2.1 | Vue 官方推荐状态管理 |
| **构建工具** | Vite 5.0 | 极速的前端构建工具 |

### 核心模块结构

```
src/
├── main/                  # Electron 主进程
│   ├── main.ts            # 主进程入口（窗口管理、IPC通信）
│   ├── preload.ts         # 预加载脚本（安全IPC桥接）
│   ├── tcp-socket.ts      # TCP 连接管理器（Node.js net）
│   └── udp-socket.ts      # UDP Socket 管理器（Node.js dgram）
│
├── renderer/              # 渲染进程（Vue 应用）
│   └── src/
│       ├── components/           # Vue 组件
│       │   ├── ConnectionConfig.vue   # 左侧配置面板
│       │   └── DataInteraction.vue    # 右侧数据交互区
│       │
│       ├── views/                 # 视图页面
│       │   └── MainView.vue       # 主界面（顶部栏+布局）
│       │
│       ├── router/                # 路由配置
│       │   └── index.ts           # Vue Router 配置
│       │
│       ├── store/                 # Pinia 状态管理
│       │   └── connection.ts      # 连接状态Store（核心状态管理）
│       │
│       ├── utils/                 # 工具类
│       │   ├── websocket.ts       # WebSocket 管理器
│       │   ├── tcp.ts             # TCP 客户端封装（IPC调用）
│       │   ├── udp.ts             # UDP 客户端封装（IPC调用）
│       │   ├── http.ts            # HTTP 客户端（fetch API）
│       │   ├── mqtt.ts            # MQTT 客户端（mqtt.js）
│       │   ├── data-formatter.ts  # 数据格式转换工具
│       │   └── config-manager.ts  # 配置管理工具
│       │
│       ├── assets/
│       │   └── main.css           # 全局样式（Tailwind）
│       │
│       └── App.vue                # 根组件
│
├── shared/                # 共享类型定义
│   └── types.ts           # TypeScript 类型定义
│
└── test-server/           # 测试服务器（开发用）
    ├── start-all.js       # 统一启动脚本
    ├── ws-server.js       # WebSocket 测试服务器（端口 18080）
    ├── tcp-server.js      # TCP 测试服务器（端口 18888）
    ├── udp-server.js      # UDP 测试服务器（端口 19000）
    ├── http-server.js     # HTTP 测试服务器（端口 18081）
    └── mqtt-server.js     # MQTT 测试服务器（端口 1883）
```

### 协议实现方式

| 协议 | 实现位置 | 实现方式 | 说明 |
|------|---------|---------|------|
| **WebSocket** | 渲染进程 | 浏览器原生 WebSocket API | 纯前端实现 |
| **TCP** | 主进程 | Node.js `net` 模块 | 通过 IPC 通信 |
| **UDP** | 主进程 | Node.js `dgram` 模块 | 通过 IPC 通信 |
| **HTTP** | 渲染进程 | 浏览器原生 `fetch` API | 纯前端实现 |
| **MQTT** | 渲染进程 | `mqtt.js` 库 | 纯前端实现（规划中） |

## 🚀 快速开始

### 环境要求

- **Node.js** >= 18.0.0
- **npm** >= 9.0.0
- **操作系统**：Windows 10/11, macOS 10.15+, Linux

### 安装依赖

```bash
# 克隆项目
git clone https://github.com/jiu-qiu-yu/Dev-Linker.git
cd Dev-Linker

# 安装依赖
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

# 打包应用（生成安装包）
npm run package
```

### 测试服务器

```bash
# 启动所有测试服务器（并行启动，端口占用不阻塞）
npm run test:servers

# 单独启动某个测试服务器
npm run test:ws     # WebSocket - 18080
npm run test:tcp    # TCP - 18888
npm run test:udp    # UDP - 19000
npm run test:http   # HTTP - 18081
npm run test:mqtt   # MQTT - 1883
```

## 🔧 使用说明

### 基础连接

#### 1. 选择协议
在顶部下拉框选择协议类型：
- **WebSocket** - 适用于实时双向通信
- **TCP** - 适用于可靠数据传输
- **UDP** - 适用于快速数据传输（无连接）
- **HTTP** - 适用于云服务器 API 调用

#### 2. 输入服务器地址

**简化输入**（自动补全协议）：
```
localhost:18080
```

**完整 URL 输入**：
```
ws://localhost:18080/path
tcp://192.168.1.100:18888
udp://localhost:19000
http://localhost:18081/api/data
https://api.example.com/api/report
```

**HTTP 特殊说明**：
- 支持云服务器：`https://api.example.com/api/report`
- 支持本地服务器：`http://localhost:18081/api/data`
- 失焦或按回车自动解析 URL
- 左下角显示解析结果（协议/主机/端口/路径）

#### 3. 配置设备 SN
- 输入设备 SN 或点击刷新按钮生成
- 格式：`DEV-XXXXXX`（自动生成）
- 连接后 SN 会自动锁定

#### 4. 配置登录包（可选）
1. 启用"登录/注册包"开关
2. 选择格式（String / HEX）
3. 输入登录包内容
4. 连接成功后自动发送

#### 5. 配置心跳包（可选）
1. 启用"心跳维持"开关
2. 设置发送间隔（秒）
3. 选择格式（String / HEX）
4. 输入心跳内容
5. 连接成功后定时自动发送

#### 6. HTTP 特殊配置（仅 HTTP 协议）
1. 选择请求方式（GET / POST）
2. 添加自定义请求头（可选）
3. 查看 URL 解析结果

#### 7. 点击连接
- 点击顶部"连接"按钮
- 等待状态指示灯变绿
- 连接成功后配置自动锁定

### 数据收发

#### 发送数据
1. 在底部发送区域输入内容
2. 选择数据格式（String / HEX）
   - **String**：直接输入文本，如 `Hello World`
   - **HEX**：输入十六进制，如 `48656C6C6F`（自动空格分隔显示）
3. 点击"发送"按钮

#### 查看日志
- 所有收发数据在日志区域实时显示
- 支持切换显示格式（Str / Hex）
- 日志颜色标识：
  - 🔵 发送：蓝色
  - 🟢 接收：绿色
  - 🔴 错误：红色
  - ⚪ 系统：灰色

#### 清空操作
- **清空发送框**：点击发送区域的"清空"按钮
- **清空日志**：点击日志区域右上角的垃圾桶图标

### 格式转换说明

#### String ↔ HEX 自动转换
- 切换格式时自动转换数据内容
- 双向转换无损（支持中文）
- HEX 格式自动空格分隔显示

#### 示例
```
String → HEX:
"Hello" → "48 65 6C 6C 6F"

HEX → String:
"48656C6C6F" → "Hello"
```

### 配置管理

#### 自动保存
所有配置修改后自动保存到本地，包括：
- 服务器地址和协议
- 设备 SN
- 登录包配置
- 心跳包配置
- HTTP 配置（请求方式、请求头）

#### 自动加载
- 应用启动时自动加载上次保存的配置
- 无需重复配置，开箱即用

#### 配置锁定
- 连接后，设备 SN、登录包、心跳包配置自动锁定
- 防止连接过程中误操作
- 断开连接后自动解锁

## 📊 协议对比

| 特性 | WebSocket | TCP | UDP | HTTP |
|------|-----------|-----|-----|------|
| **连接类型** | 持久连接 | 持久连接 | 无连接 | 无连接 |
| **可靠性** | 可靠 | 可靠 | 不可靠 | 可靠 |
| **实现位置** | 渲染进程 | 主进程 | 主进程 | 渲染进程 |
| **双向通信** | ✅ | ✅ | ✅ | ❌ |
| **心跳包** | ✅ | ✅ | ✅ | ✅ |
| **登录包** | ✅ | ✅ | ✅ | ✅ |
| **适用场景** | 实时通信 | 可靠传输 | 快速传输 | API 调用 |
| **默认端口** | 18080 | 18888 | 19000 | 18081 |

## 📋 更新日志

### v1.4.1 (2025-11-21)

**🚀 协议完善**
- ✨ **HTTP 协议完整优化**
  - 修复默认地址不完整问题（添加 `/api/data` 路径）
  - 修复请求方式混乱问题（GET/POST 正确传递）
  - 修复数据发送失败问题（添加 httpClient 检查）
  - 启用登录包和心跳包支持（与其他协议一致）

**🎨 UI/UX 交互优化**
- ✨ **地址输入框弹性布局**：真正自适应长地址显示
- ✨ **提示框位置优化**：所有提示框下移100px，避免遮挡按钮
- ✨ **协议切换保护**：连接时自动禁用协议下拉框，防止误操作
- ✨ **自动 URL 解析**：HTTP 协议切换时自动解析默认 URL

**🐛 Bug 修复**
- 🔧 修复 HTTP 请求方式混乱（多次 GET / 和 POST）
- 🔧 修复发送数据时"连接管理器未初始化"错误
- 🔧 修复 HTTP 默认地址缺少路径部分

### v1.4.0 (2025-01-19)

**🎨 UI/UX 全面优化**
- ✨ 采用清爽浅色主题设计
- ✨ 设备标识完整显示并支持一键复制
- ✨ 左侧配置面板优化（320px宽度）
- ✨ 所有交互元素添加平滑过渡动画

**🔒 配置锁定机制**
- ✨ 连接后自动锁定关键配置
- ✨ 添加锁定状态提示

**💾 配置持久化完善**
- ✨ 自动保存所有配置
- ✨ 应用启动时自动加载
- ✨ 配置验证和自动修复

### v1.3.0 (2025-01-15)

**核心功能**
- ✨ WebSocket 连接支持
- ✨ TCP 连接支持
- ✨ UDP 连接支持
- ✨ 字符串/HEX 格式切换
- ✨ 心跳包定时发送
- ✨ 登录/注册包自动发送

## 📝 开发规范

### 代码规范
- 使用 TypeScript 严格模式
- 组件采用 `<script setup>` 语法
- 遵循 ESLint 配置的代码风格
- 所有 API 必须有类型定义
- 使用 Tailwind CSS 进行样式开发
- 遵循 KISS、DRY、SOLID 设计原则

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
git commit -m "feat: 添加HTTP协议登录包和心跳包支持"
git commit -m "fix: 修复HTTP请求方式混乱问题"
git commit -m "docs: 更新README文档"
git commit -m "style: 优化地址输入框弹性布局"
```

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

### 如何贡献
1. Fork 本项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'feat: Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 提交 Pull Request

### 下一步开发计划
- [ ] MQTT 协议集成（预计 3-4 小时）
- [ ] 快捷键支持
- [ ] 发送历史记录
- [ ] 数据统计面板
- [ ] 日志搜索和导出
- [ ] 配置方案管理

### 贡献者
- **九秋** - 项目作者和维护者
- **幽浮喵（浮浮酱）** - 专业工程师，负责架构设计和代码优化

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 📧 联系方式

- **GitHub**: [@jiu-qiu-yu](https://github.com/jiu-qiu-yu)
- **项目地址**: [https://github.com/jiu-qiu-yu/Dev-Linker](https://github.com/jiu-qiu-yu/Dev-Linker)
- **Issue 反馈**: [https://github.com/jiu-qiu-yu/Dev-Linker/issues](https://github.com/jiu-qiu-yu/Dev-Linker/issues)

## 🙏 致谢

感谢以下开源项目的支持：

- [Electron](https://electronjs.org) - 跨平台桌面应用框架
- [Vue.js](https://vuejs.org) - 渐进式JavaScript框架
- [Element Plus](https://element-plus.org) - Vue 3 组件库
- [Vite](https://vitejs.dev) - 新一代前端构建工具
- [Pinia](https://pinia.vuejs.org) - Vue 状态管理库
- [Tailwind CSS](https://tailwindcss.com) - 实用优先的CSS框架
- [MQTT.js](https://github.com/mqttjs/MQTT.js) - MQTT 客户端库

---

**感谢使用 Dev-Linker！** 🎉

如果这个项目对您有帮助，欢迎给个 ⭐️ Star！

_文档维护：浮浮酱 & Claude Code_
