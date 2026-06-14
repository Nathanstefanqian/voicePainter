# VoicePaint · 用一句话，让 AI 画出你脑海里的画面

> 🎙️ 纯语音驱动的 AI 绘画助手 · 七牛云 AI 应用创新挑战赛 · 第二赛道「AI 创意应用」参赛作品
>
> 作品链接：[github.com/Nathanstefanqian/voicePainter](https://github.com/Nathanstefanqian/voicePainter)
> 体验地址：[https://paint.nathanq.site](https://paint.nathanq.site)

---

## 一、写在最前：为什么会有 VoicePaint

> 这一节是评委「一分钟读懂项目」用的，可以直接复制到比赛材料里。

### 1.1 一个真实存在的痛点

打开任何一款主流 AI 绘画产品（Midjourney、Stable Diffusion WebUI、即梦、文心一格……），它们的交互入口**几乎清一色是键盘和鼠标**：

- 你要**打字**写一段 Prompt；
- 你要**拖动**滑块改画风、改比例；
- 你要**点击**按钮生成、再点击保存、再点击下载。

而最自然的"想到一个画面"到"说出来"的过程只有不到 1 秒。

**VoicePaint 想做的事情是：把这 1 秒的灵感和 30 秒的"打字-调整-点击"合并成一句完整的话。**

你说「画一只赛博朋克风格的橘猫，霓虹背景，竖屏 9:16」，VoicePaint 会：

1. 自动识别你的语音；
2. 通过大模型把口语化指令结构化、补全细节；
3. 调用 Seedream 5.0 生成 2K 高清图；
4. 实时回显到画布，并加入历史画廊；
5. 继续听你下一句——*「把猫换成英短」*、*「背景再亮一点」*、*「这张删了」*、*「回到上一张」*——它都能听懂。

### 1.2 三个差异化亮点（评审重点）

| # | 亮点 | 工程落地 |
|---|------|----------|
| 🥇 | **真正"全语音"闭环**，支持"边说边改边选" | 录音 → ASR → LLM 意图识别 → 10 种 Action 派发 → Seedream 图像生成 → OSS 持久化 → 前端实时渲染，全链路单次 API 调用即可完成 |
| 🥈 | **带"渐进式引导"的意图理解** | 通过 `draftContext.turnCount` 5 轮机制 + LLM Completeness 评分，让用户在"直接出图"与"细致微调"之间自由切换；硬编码关键词（删除/撤销等）兜底，防止 LLM 把"删掉"误判为"聊天" |
| 🥉 | **生产级工程化** | NestJS + Mongoose + 双 Token 鉴权 + Cookie 持久化 + 阿里云 OSS + PM2 部署，**不只是一个 demo，而是已经能 7×24 跑在公网上的 SaaS 雏形** |

### 1.3 题目契合度

> 七牛云 AI 应用创新挑战赛 · 第二题

- ✅ **使用了 AI 模型**：DeepSeek-V3（意图理解）+ Doubao-Seedream-5.0（图像生成）+ 火山 ASR / 腾讯云 ASR（语音识别）。
- ✅ **解决了真实问题**：把 AI 绘图的入口从"键盘+鼠标"前置到"语音"，覆盖无法/不便打字的场景（驾驶、烹饪、视障、灵感爆发时）。
- ✅ **创意与实用并重**：UI 采用 Glassmorphism 设计语言，移动端/桌面端响应式，支持画廊、撤销/重做、对话压缩、5 轮引导式精修，**不只"能跑"，还"好用"**。
- ✅ **可复现、可部署**：仓库自带 `pm2` 部署脚本，**10 分钟内可以在自己的服务器上完整跑起来**。

---

## 二、产品演示

### 2.1 主要页面

| 桌面端（三栏）| 移动端（单栏）|
|---|---|
| 左侧：ASR 引擎切换 + 全语音模式 + 录音按钮 + 实时对话流 | 顶部：ASR 引擎切换 + 全语音模式 |
| 中间：当前画布（带进度/错误态）| 中部：当前画布 |
| 右侧：历史画廊 | 底部：Tab 切换「画廊 / 对话」|

### 2.2 关键交互流程

#### 🎙️ 流程 A：从 0 到 1 创作（5 轮渐进式引导）

```
👤 录音: "我想画一只猫"
🤖 ASR: 我想画一只猫
🧠 LLM: action=clarify, completeness=0.2
   → question: "您希望这张图是什么画风的？"
   → options:  ["写实风格", "动漫风格", "赛博朋克", "唯美油画"]
👤 录音: "动漫风格"
🧠 LLM: action=clarify, completeness=0.4
   → question: "您对画面的构图比例有要求吗？"
   → options:  ["1:1 正方形", "16:9 宽屏", "9:16 竖屏", "4:3 比例"]
👤 录音: "9:16 竖屏"
🧠 LLM: action=clarify, completeness=0.6
   → question: "画面中需要加入什么样的光影氛围呢？"
   → options:  ["温暖阳光", "神秘月光", "霓虹灯光", "自然柔光"]
👤 录音: "霓虹灯光"
🧠 LLM: action=clarify, completeness=0.8
   → question: "最后，您对主体角色的穿着或细节有什么补充吗？"
   → options:  ["日常休闲", "华丽古风", "科幻机甲", "简约时尚"]
👤 录音: "直接画吧"
🧠 LLM: action=new, completeness=1.0
🎨 Seedream: 生成 1440x2560 高清图
📦 OSS: 持久化到 images/{sessionId}/
🖼️ UI: 画布切换 + 历史画廊新增 + Toast 提示
```

#### 🎙️ 流程 B：迭代修改（基于当前图）

```
👤 录音: "把猫的眼睛改成蓝色"    (iterate)
🧠 LLM: action=iterate, reference_images=[current]
🎨 Seedream: 传入原图作为参考图 (image: [...])
```

#### 🎙️ 流程 C：上下文命令（删除/撤销/选中）

```
👤 录音: "这张不要了"           (硬编码 delete 兜底)
🗑️ 数据库: 软删除当前图（isDeleted=true）
🖼️ UI: 画布清空 + 历史画廊移除
👤 录音: "撤销"                 (undo)
🔙 UI: 切换到历史第二张
👤 录音: "打开第二张"           (select, index=1)
🔀 UI: 切换到历史索引 1
```

> *所有动作通过 LLM Tool Call 输出统一的 `DrawingIntent` schema，在后端 `DrawService.processDrawing()` 统一派发。*

---

## 三、整体架构

```
┌──────────────────────────────────────────────────────────────────────┐
│                          Browser (Vue 3 SPA)                         │
│  ──────────────────────────────────────────────────────────────────  │
│  · MediaRecorder 录音              · Pinia 全局状态                  │
│  · AnalyserNode 实时音量           · Vue Router 路由守卫             │
│  · Axios (自动 Refresh Token)      · UnoCSS 原子化样式               │
└──────────────────┬───────────────────────────────────────────────────┘
                   │ HTTPS / multipart/form-data
                   ▼
┌──────────────────────────────────────────────────────────────────────┐
│              NestJS Backend  (voice-paint-be)                        │
│  ──────────────────────────────────────────────────────────────────  │
│  AuthModule        注册/登录/双 Token 鉴权                            │
│      │                                                               │
│  VoiceModule       上传音频 → ASR (火山/腾讯)                        │
│      │                                                               │
│  LLMModule         DeepSeek-V3 (Tool Call) → DrawingIntent          │
│      │                                                               │
│  DrawModule        Seedream 5.0 图像生成 + 5 轮引导 + 10 种 Action 派发│
│      │                                                               │
│  ImageModule       MongoDB 存储 + 软删除 + 历史查询                   │
│      │                                                               │
│  SessionModule     会话状态/聊天历史/草稿上下文                       │
│      │                                                               │
│  CommonModule      阿里云 OSS 文件上传 (音频/图片)                    │
└──────────────────┬───────────────────────────────────────────────────┘
                   │
       ┌───────────┴───────────┐
       ▼                       ▼
┌─────────────┐         ┌──────────────┐
│  MongoDB    │         │ Aliyun OSS   │
│ (Atlas)     │         │ (Bucket)     │
└─────────────┘         └──────────────┘

外部 API:
  · 火山引擎 ASR           https://openspeech.bytedance.com/api/v3
  · 腾讯云 ASR             asr.tencentcloudapi.com
  · 火山方舟 Seedream 5.0  https://ark.cn-beijing.volces.com/api/v3
  · 硅基流动 DeepSeek-V3   https://api.siliconflow.cn/v1
```

---

## 四、技术选型与理由

| 层 | 选型 | 理由 |
|----|------|------|
| 前端框架 | Vue 3 + Composition API + TypeScript | 组合式 API 让"录音/状态/对话流"这种多任务编排更清晰；`<script setup>` 编译期消除宏 |
| 状态管理 | Pinia | 官方推荐，DevTools 友好，TypeScript 推断完美 |
| 样式方案 | UnoCSS | 原子化 CSS + 按需生成，UnoCSS preset 体系对图标、纯色、响应式非常友好 |
| 构建工具 | Vite 8 | 启动 < 1s，热更新 < 100ms |
| 后端框架 | NestJS 11 | 模块化、AOP（Guard/Interceptor/Pipe）让"鉴权/参数校验"无侵入 |
| 数据库 | MongoDB + Mongoose | Schema 灵活，便于在 `chatHistory` 数组里存 `isArchived`、`archiveGroup` 等动态字段 |
| 鉴权 | JWT 双 Token（Access 15min + Refresh 7d） | Access 放内存，Refresh 存 HttpOnly Cookie，**XSS 偷不到 Refresh Token** |
| 文件存储 | 阿里云 OSS | 国内访问快、便宜；用 SDK 直传避免占用后端带宽 |
| ASR | 火山引擎 seed-asr + 腾讯云 ASR 双引擎 | 火山说话人分离好，腾讯云中文识别准——做成可切换 |
| LLM | 硅基流动 DeepSeek-V3 | 中文语义理解强，Function Call 稳定，硅基流动的免费额度足够做 demo |
| 文生图 | 火山方舟 Doubao-Seedream-5.0 | 支持 2K/3K、image 参考图、size 直出，价格合理 |

---

## 五、核心代码导读

> 评审如果只看 5 个文件，建议看这 5 个：

| # | 文件 | 看点 |
|---|------|------|
| 1 | `voice-paint-be/src/llm/prompts/intent-recognition.ts` | LLM 的 System Prompt 设计：10 种 Action 的语义边界、clarify 评分递增规则、chat 严禁触发追问的硬约束 |
| 2 | `voice-paint-be/src/draw/draw.service.ts` | 核心业务编排：5 轮引导、10 种 Action 派发、硬编码关键词兜底、父子图关联 |
| 3 | `voice-paint-be/src/llm/llm.service.ts` | Function Call 封装、意图识别 + 任务摘要 + 对话压缩 + 备用模型 fallback |
| 4 | `voice-paint-fe/src/composables/useRecorder.ts` | 前端录音核心：MediaRecorder + AnalyserNode + 静音检测（VAD）|
| 5 | `voice-paint-fe/src/views/HomeView.vue` | 状态机：6 状态切换 + 全语音模式自启动 + 错误自愈 |

### 5.1 意图识别的 Prompt 设计（摘录）

```ts
export const INTENT_SYSTEM_PROMPT = `你是 VoicePaint 的智能绘图助手。
任务：将用户的自然语言语音指令精准转换为可执行的绘图参数。

## 核心原则
1. **深度引导**：当用户意图模糊或描述简单（如"画个美女"）时，不要直接绘图，而是通过追问来完善细节。
2. **渐进式完善**：每一轮追问都应基于当前已有的信息，提出 3-4 个具体的选择题。
3. **跳过机制**：如果用户明确表现出不耐烦或要求"直接画"，则立即出图。

## 动作决策规则
- **new**: 启动全新创作。仅当信息完整度评分 >= 0.8，或用户明确要求直接绘图时触发。
- **iterate/adjust**: 基于当前图修改。仅当修改意图明确且信息完整时触发。
- **clarify**: 【重要】当用户想绘图但描述过于笼统时，必须触发此动作进行追问。
                     注意：闲聊（Action: chat）严禁触发追问，直接回答即可。
- **delete**: 删除当前图片。
- **select**: 选择并打开画廊中的图片。
- **chat**: 纯文本聊天。

## 追问策略 (Action: clarify)
当触发 clarify 时，你需要：
1. **评分 (completeness)**：评估当前信息完整度（0.1-0.9）。
   注意：你必须参考历史对话，确保每一轮给出的评分都比上一轮更高，严禁分值倒退。
2. **提问 (clarify_question)**：抛出一个全新的、未询问过的细节问题。
3. **选项 (clarify_options)**：给出 3-4 个针对该问题的极简选项。

## 闲聊策略 (Action: chat)
当用户只是在进行日常对话、问候或询问非绘图相关问题时：
1. **直接回答**：在 user_feedback 中给出自然、友好的回答。
2. **不触发追问**：严禁返回 clarify_question 或 clarify_options。
3. **评分与置信度**：completeness 设为 0，但 confidence 必须设为 1.0。
```

### 5.2 5 轮引导 + Action 派发（核心伪代码）

```ts
// 伪代码（详见 voice-paint-be/src/draw/draw.service.ts）
async processDrawing(userId, asrText, currentImageUrl) {
  const session = await getSession(userId);
  const draft = session.draftContext || { turnCount: 0, completeness: 0 };

  // 1. 硬编码兜底：删除指令
  if (DELETE_KEYWORDS.some(kw => asrText.includes(kw))) {
    return { action: "delete", ... };
  }

  // 2. LLM 意图识别
  const intent = await llm.recognizeIntent(asrText, currentImageUrl, recentContext);

  // 3. 5 轮引导逻辑
  if (intent.action === "new" && !isForceDraw(asrText)) {
    draft.turnCount += 1;
    draft.completeness = Math.min(draft.turnCount * 0.2, 1.0);
    if (draft.turnCount < 5) {
      intent.action = "clarify";
      // 后端兜底追问（LLM 没给问题时）
      if (!intent.clarify_question) intent.clarify_question = FALLBACK_QUESTIONS[draft.turnCount - 1];
    } else {
      draft.turnCount = 0; // 重置
    }
  }

  // 4. Action 派发
  switch (intent.action) {
    case "delete":   return softDeleteCurrentImage();
    case "undo":     return rollbackToPreviousImage();
    case "select":   return openGalleryImage(intent.index);
    case "clarify":  return { action: "clarify", question: intent.clarify_question, options: intent.clarify_options };
    case "chat":     return { action: "chat", message: intent.user_feedback };
    // ... 8 种其他 action
    default:
      // 5. 调 Seedream 出图
      const image = await seedream.generate({ prompt: intent.prompt, image: referenceImages, ... });
      const ossUrl = await oss.uploadFromUrl(image.url, session.sessionId);
      await db.save({ imageUrl: image.url, imageUrlOss: ossUrl, parentImageId: ..., ... });
      return { action: intent.action, imageUrl: ossUrl, ... };
  }
}
```

---

## 六、数据库设计

> 评审如果关心"数据怎么存的"，看这一节。

```
┌────────────────────────────┐
│  users                     │
├────────────────────────────┤
│ _id              ObjectId  │
│ userId           UUID      │  ← 用于 JWT sub
│ username         String    │
│ email            String    │  ← 唯一索引
│ password         String    │  ← bcrypt(12) 哈希
│ role             "user"    │
│ settings.preferredModel?   │  ← 用户偏好的绘图模型
│ usageStats:                 │
│   totalImages, totalTokens │
│   dailyImageCount           │
└──────────────┬─────────────┘
               │ 1:N
               ▼
┌────────────────────────────┐    ┌────────────────────────────┐
│  drawing_sessions          │    │  refresh_tokens             │
├────────────────────────────┤    ├────────────────────────────┤
│ sessionId       UUID       │    │ tokenId          UUID      │
│ userId          FK         │◄───│ userId           FK         │
│ status          active|done│    │ refreshToken     bcrypt     │
│ turnCount       Number     │    │ status           valid|revok│
│ currentImageId  FK→images  │    │ expiresAt        Date       │
│ draftContext:              │    │ userAgent        String     │
│   turnCount                │    └────────────────────────────┘
│   completeness             │
│ imageHistory[] imageId     │
│ chatHistory[]:             │    ┌────────────────────────────┐
│   { role, content, type,   │    │  voice_commands            │
│     imageUrl?, createdAt,  │    ├────────────────────────────┤
│     isArchived?,           │    │ commandId        UUID      │
│     archiveGroup? }        │    │ sessionId        FK         │
└──────────────┬─────────────┘    │ userId           FK         │
               │ 1:N              │ audioUrl         OSS URL    │
               ▼                  │ asrText          String     │
┌────────────────────────────┐    │ intent           pending|ok │
│  generated_images           │   │ params           Object     │
├────────────────────────────┤    │ status           success|fa │
│ imageId          UUID      │    │ errorMessage?   String      │
│ userId           FK        │    └────────────────────────────┘
│ sessionId        FK        │
│ promptCn         String    │  ← 原始中文
│ promptEn         String    │  ← LLM 优化后的英文 prompt
│ imageUrl         URL       │  ← 火山方舟临时 URL
│ imageUrlOss      URL       │  ← 阿里云 OSS 永久 URL
│ model            "seed..5" │
│ size             "2K"|"3K" │
│ aspectRatio      "1:1"     │
│ action           "new"|... │
│ parentImageId?   UUID      │  ← 用于追溯修改链路
│ asrResult: { ... }         │
│ llmResult: { ... }         │
│ isDeleted        Boolean   │  ← 软删除
└────────────────────────────┘
```

---

## 七、本地开发 & 部署

### 7.1 目录结构

```
voicePainter/
├── voice-paint-be/          # NestJS 后端
│   ├── src/
│   │   ├── auth/            # 注册/登录/双 Token
│   │   ├── voice/           # 语音识别 (火山/腾讯)
│   │   ├── llm/             # DeepSeek 意图识别
│   │   ├── draw/            # Seedream 绘图核心
│   │   ├── image/           # 图片管理
│   │   ├── session/         # 会话管理
│   │   ├── common/          # 阿里云 OSS
│   │   └── config/          # 环境变量校验
│   ├── .env.example         # 环境变量模板
│   └── package.json
│
├── voice-paint-fe/          # Vue 3 前端
│   ├── src/
│   │   ├── components/      # VoiceRecorder / ImageCanvas / ChatHistory ...
│   │   ├── composables/     # useRecorder (录音+VAD)
│   │   ├── stores/          # drawStore / authStore
│   │   ├── api/             # Axios 封装 + 自动 Refresh
│   │   ├── views/           # HomeView / LoginView / RegisterView
│   │   └── router/          # Vue Router 4
│   ├── uno.config.ts        # UnoCSS 配置
│   └── package.json
│
├── package.json             # 顶层脚本（一键部署）
└── README.md                # 你正在看
```

### 7.2 前置依赖

- Node.js ≥ 20
- MongoDB ≥ 6.0（本地 or [Atlas](https://www.mongodb.com/atlas) 免费 512MB 即可）
- 一个能访问公网的环境（要调 火山方舟 / 硅基流动 / 阿里云 OSS）

### 7.3 配置环境变量

```bash
cd voice-paint-be
cp .env.example .env
vim .env
```

`.env` 关键项（详见 `.env.example`）：

```env
# —— 服务
NODE_ENV=development
PORT=3000
API_PREFIX=api

# —— 数据库
MONGODB_URI=mongodb://localhost:27017/voicepaint

# —— JWT
JWT_ACCESS_SECRET=请改我_32位以上
JWT_REFRESH_SECRET=请改我_32位以上
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# —— 火山引擎（火山方舟 Seedream + 火山 ASR）
VOLC_APP_ID=xxxxxxxx
VOLC_ACCESS_TOKEN=xxxxxxxx
VOLC_SECRET_KEY=xxxxxxxx
VOLC_ARK_API_KEY=xxxxxxxx
VOLC_ARK_MODEL_ID=doubao-seedream-5-0-260128

# —— 腾讯云 ASR（备用引擎）
TENCENT_CLOUD_SECRET_ID=xxxxxxxx
TENCENT_CLOUD_SECRET_KEY=xxxxxxxx
TENCENT_CLOUD_APP_ID=xxxxxxxx

# —— 硅基流动 DeepSeek-V3
SILICONFLOW_API_KEY=sk-xxxxxxxx

# —— 阿里云 OSS
ALIYUN_OSS_REGION=oss-cn-shanghai
ALIYUN_OSS_ACCESS_KEY_ID=xxxxxxxx
ALIYUN_OSS_ACCESS_KEY_SECRET=xxxxxxxx
ALIYUN_OSS_BUCKET=voicepaint
```

### 7.4 启动后端

```bash
cd voice-paint-be
npm install
npm run start:dev     # 开发模式（热重载）
# 或
npm run build && npm run start:prod   # 生产模式
```

启动后访问 `http://localhost:3000/api` 应看到路由前缀生效。

### 7.5 启动前端

```bash
cd voice-paint-fe
npm install
npm run dev           # http://localhost:5173
```

如需切换后端地址，修改 `voice-paint-fe/src/api/client.ts` 的 `baseURL`。

### 7.6 一键部署（PM2）

仓库根目录 `package.json` 已预置部署脚本：

```bash
# 在本地
npm run deploy:paint:be   # rsync + pm2 restart voice-paint-be
npm run deploy:paint:fe   # rsync 到 nginx 静态目录
```

> 实际地址可在 `package.json` 中按需修改 `lumi` 主机别名（SSH config）。

---

## 八、API 速查

> 所有接口统一前缀 `/api`，除 `register / login / refresh` 外全部需要 `Authorization: Bearer <accessToken>`。

### 8.1 认证 `/auth`

| 方法 | 路径 | 鉴权 | 说明 |
|------|------|------|------|
| POST | `/auth/register` | Public | 注册 `{ username, email, password }` |
| POST | `/auth/login` | Public | 登录，成功后 `Set-Cookie: refreshToken`（HttpOnly）|
| POST | `/auth/refresh` | Cookie | 刷新 Access Token，Refresh Token 也会轮换 |
| POST | `/auth/logout` | JWT | 撤销当前用户所有 Refresh Token |
| GET  | `/auth/profile` | JWT | 获取当前用户信息（含 `settings.preferredModel`） |
| POST | `/auth/settings` | JWT | 更新用户设置 `{ preferredModel }` |

### 8.2 语音 `/voice`

| 方法 | 路径 | 鉴权 | 说明 |
|------|------|------|------|
| POST | `/voice/recognize` | JWT | `multipart/form-data`：字段 `audio`（必填）、`provider`（tencent/volc，可选），Query `sessionId`，Body `audioUrl?` |

返回：

```json
{ "text": "画一只赛博朋克风格的猫", "commandId": "uuid", "provider": "tencent" }
```

### 8.3 绘图 `/draw`

| 方法 | 路径 | 鉴权 | 说明 |
|------|------|------|------|
| POST | `/draw/intent` | JWT | 仅做意图识别（不绘图），返回 `DrawingIntent` |
| POST | `/draw/generate` | JWT | 完整流程：识别 → 派发 → 出图（可传入 `intent` 跳过识别） |
| GET  | `/draw/history` | JWT | 历史图片（`?sessionId=` 可选） |
| GET  | `/draw/:imageId` | JWT | 单张图详情 |
| DELETE | `/draw/:imageId` | JWT | 软删除单张图 |

### 8.4 会话 `/session`

| 方法 | 路径 | 鉴权 | 说明 |
|------|------|------|------|
| GET  | `/session/current` | JWT | 获取当前 active 会话（含 `chatHistory`、`draftContext`）|
| POST | `/session/new` | JWT | 强制新开会话 |
| GET  | `/session/history` | JWT | 用户所有历史会话 |
| DELETE | `/session/chat` | JWT | 清空当前会话的聊天记录 |
| POST | `/session/chat/compress` | JWT | 用 LLM 把长对话压成一段摘要 |

---

## 九、Roadmap（赛后计划）

| 优先级 | 计划 | 价值 |
|--------|------|------|
| P0 | 接入七牛云对象存储 Kodo | 替换阿里云 OSS，降低存储成本 |
| P0 | 接入七牛云智能多媒体 API（如果题目方向契合）| 强化音视频 AI 能力 |
| P1 | 多人协作 session（同一画布多人语音） | B 端创意团队场景 |
| P1 | 模型切换面板（用户自选 doubao-seedream-5.0 / stable-diffusion-3.5）| 风格化扩展 |
| P1 | WebSocket 实时推送 ASR 部分识别结果 | 让"全语音"反馈更跟嘴 |
| P2 | 公开画廊 + 一键 Remix（基于他人作品再创作）| UGC 飞轮 |
| P2 | 微信小程序 / PWA 包 | 移动端体验 |
| P3 | 离线模式（ONNX Runtime Web 本地跑小模型）| 隐私敏感用户 |

---

## 十、写在最后

VoicePaint 的核心是 **"让 AI 绘图的入口消失"**：

- 当你说"画只猫"时，不需要打开 Midjourney Discord；
- 当你看到窗外一只橘猫时，不需要掏出手机、打字、再切回电脑；
- 当你在做饭、开车、哄孩子时，灵感也能被一句话捕获。

我们相信，**AI 绘图的下一个 10 亿用户，是不会/不便打字的那群人。** 语音是离他们最近的入口。

如果你也被这个愿景打动，欢迎：

- ⭐ 给这个仓库点 Star
- 🐛 提 Issue 反馈 bug
- 🚀 提 PR 加入开发
- 📬 在 GitHub Discussions 里聊聊你的想法

> *Made with ❤️ & 🎙️ for the 七牛云 AI 应用创新挑战赛.*

---

## 附录：致谢

- [Vue 3](https://vuejs.org/) / [NestJS](https://nestjs.com/) / [Pinia](https://pinia.vuejs.org/) / [UnoCSS](https://unocss.dev/)
- [DeepSeek-V3](https://www.deepseek.com/) via [硅基流动 SiliconFlow](https://siliconflow.cn/)
- [Doubao-Seedream 5.0](https://www.volcengine.com/product/seedream) via 火山方舟
- [火山引擎 ASR](https://www.volcengine.com/product/asr) / [腾讯云 ASR](https://cloud.tencent.com/product/asr)
- [阿里云 OSS](https://www.aliyun.com/product/oss)
- [MongoDB](https://www.mongodb.com/) / [mongoose](https://mongoosejs.com/)

