# VoicePaint Frontend

Vue 3 前端应用，提供语音控制 AI 绘图的用户界面。

## 技术栈

- **框架**: Vue 3 + TypeScript + Composition API
- **构建**: Vite
- **样式**: UnoCSS（原子化 CSS）
- **状态管理**: Pinia
- **路由**: Vue Router 4
- **HTTP**: Axios（含 Token 自动刷新）

## 启动

```bash
npm install
npm run dev
# http://localhost:5173
```

## 页面

| 路径 | 说明 |
|------|------|
| `/login` | 登录页 |
| `/register` | 注册页 |
| `/` | 主绘图页面（三栏布局） |

## 核心功能

- **按住说话**: 录音 → 上传 → 识别 → 绘图，全流程自动
- **ASR 切换**: 腾讯云（火山引擎）语音识别引擎切换
- **图片迭代**: 基于当前图片进行图生图迭代
- **历史画廊**: 本次会话所有生成图片的缩略图列表
- **Token 自动刷新**: 401 时静默刷新，无需重新登录

## 组件

```
src/components/
├── VoiceRecorder.vue     # 按住说话按钮 + 音量可视化
├── AsrSwitch.vue        # ASR 提供商切换
├── StatusIndicator.vue   # 当前状态指示
├── ImageCanvas.vue       # 当前图片展示
├── ImageGallery.vue      # 历史画廊
├── AppHeader.vue         # 顶部导航
└── ToastContainer.vue    # Toast 通知

src/composables/
├── useRecorder.ts        # 录音逻辑（MediaRecorder + AnalyserNode）
└── useToast.ts           # Toast 通知

src/stores/
├── authStore.ts          # 用户状态 + Token
└── drawStore.ts          # 绘图状态 + 历史记录
```
