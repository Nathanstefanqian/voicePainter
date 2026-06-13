# 赛博皇帝：AI 智能体可视化虚拟世界方案

本方案旨在为 Lumi 打造一个“虚拟地图”风格的智能体监控界面（赛博皇帝），让用户能直观看到 AI 圆桌会议中的智能体在虚拟空间中的活动与实时对话。

## 1. 当前状态分析
- **后端**：`AIService` 已实现多 Agent 圆桌讨论逻辑（SSE 流式），`MenuService` 支持动态菜单。
- **前端**：已具备成熟的侧边栏和基础 UI 框架，支持 Socket.io 实时通信。
- **缺失点**：缺乏一个统一的“智能体世界”网关和前端可视化地图组件。

## 2. 方案设计

### 2.1 后端实现 (Lumi-be)
- **新建 `AgentWorldGateway`**: 
  - 专门负责推送“虚拟世界”的状态更新。
  - 事件包括：`agent:join` (进入房间), `agent:move` (移动位置), `agent:speak` (正在发言), `agent:idle` (待机)。
- **集成 `AIService`**:
  - 在 `roundtableDiscussionStream` 执行过程中，同步调用 `AgentWorldGateway` 推送当前发言 Agent 的状态。
- **菜单注册**:
  - 在 `MenuService` 中新增 `agent-world` 菜单，图标使用 `Globe` 或 `Monitor`，命名为“赛博皇帝”。

### 2.2 前端实现 (Lumi-fe)
- **新建 `AgentWorldView` 组件**:
  - **地图层**：一个简约的 2D 虚拟会议室背景（使用 CSS Grid 或 SVG）。
  - **智能体层**：根据后端坐标渲染 Agent 头像/Emoji，使用 `framer-motion` 实现平滑移动。
  - **气泡层**：当 Agent 发言时，在头像上方弹出实时气泡展示内容。
- **状态管理**:
  - 使用 `zustand` 维护一个 `useAgentWorldStore`，记录当前地图上的所有 Agent 及其位置和状态。

## 3. 具体修改步骤

### 后端修改
1. **[menu.service.ts](file:///Users/nathanq/sites/lumi/Lumi-be/src/menu/menu.service.ts)**:
   - 在 `onModuleInit` 中添加 `agent-world` 菜单初始化逻辑。
2. **[ai.module.ts](file:///Users/nathanq/sites/lumi/Lumi-be/src/ai/ai.module.ts)**:
   - 注册新的 `AgentWorldGateway`。
3. **[AIService](file:///Users/nathanq/sites/lumi/Lumi-be/src/ai/ai.service.ts)**:
   - 注入 `AgentWorldGateway`，在圆桌讨论流中添加状态广播代码。

### 前端修改
1. **[AgentWorldView.tsx](file:///Users/nathanq/sites/lumi/Lumi-fe/src/features/ai/components/agent-world-view.tsx)**:
   - 实现 2D 虚拟地图交互。
2. **[AppRoutes.tsx](file:///Users/nathanq/sites/lumi/Lumi-fe/src/routes/index.tsx)**:
   - 注册 `/agent-world` 路由。

## 4. 验证步骤
1. **启动后端服务**，确认控制台输出“Agent world menu added”。
2. **进入前端“赛博皇帝”页面**，观察地图背景是否加载。
3. **发起一次 AI 圆桌会议**，观察地图上的 Agent 是否会根据发言顺序出现气泡提示并产生位置变动。

## 5. 假设与决策
- **坐标系统**：采用简单的 0-100 百分比坐标，适配响应式布局。
- **通信协议**：优先使用现有的 Socket.io 体系，保证实时性。
- **Agent 形象**：优先使用 `AgentPreset` 中定义的 `avatar`（图片）或 `emoji`。
