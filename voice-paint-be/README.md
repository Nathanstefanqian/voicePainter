# VoicePaint Backend

NestJS API 服务，提供语音识别、AI 意图理解、AI 绘图、会话管理等功能。

## 技术栈

- **框架**: NestJS + TypeScript
- **数据库**: MongoDB + Mongoose
- **认证**: JWT 双 Token（Access + Refresh，HttpOnly Cookie）
- **语音识别**: 火山引擎 ASR / 腾讯云 ASR（可切换）
- **意图理解**: 硅基流动 DeepSeek-V3（LangChain）
- **AI 绘图**: 火山方舟 Seedream 5.0
- **文件存储**: 阿里云 OSS

## 启动

```bash
npm install
npm run start:dev
```

API 文档：`http://localhost:3000/api`

## 环境变量

详见根目录 `.env` 配置说明或参考 `docs/` 目录下的环境变量模板。

## 模块结构

```
src/
├── auth/          # 用户认证（注册/登录/刷新/登出）
├── voice/         # 语音识别（多 ASR 提供商）
├── llm/           # 意图识别（DeepSeek + LangChain）
├── draw/          # 绘图生成（Seedream）
├── image/         # 图片管理
├── session/       # 会话管理
├── common/        # OSS 文件上传
└── config/        # 环境变量校验
```

## API 前缀

所有接口统一前缀 `/api`，如 `/api/auth/login`
