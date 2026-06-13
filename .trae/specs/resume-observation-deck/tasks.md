# Tasks

- [x] Task 1: 后端 `Lumi-be` 基础建设: 实现投递记录的持久化存储。
  - [x] SubTask 1.1: 创建 `ResumeObservation` Schema，包含公司、地区、链接、状态、日期、备注等字段。
  - [x] SubTask 1.2: 实现 CRUD 接口 (Controller/Service)。
  - [x] SubTask 1.3: 在 `MenuService` 中注册菜单，确保前端可见。
- [x] Task 2: 前端 `Lumi-fe` 类型与 API 定义: 建立前后端通信。
  - [x] SubTask 2.1: 定义 `ResumeObservation` 接口类型。
  - [x] SubTask 2.2: 实现 API 调用函数。
- [x] Task 3: 前端核心组件开发: 构建观察台 UI。
  - [x] SubTask 3.1: 开发顶部统计面板卡片。
  - [x] SubTask 3.2: 开发基于 `shadcn/ui` 的数据表格 (DataTable)，支持排序和筛选。
  - [x] SubTask 3.3: 开发新增/编辑投递记录的对话框 (Modal)。
- [x] Task 4: 前端页面集成与路由: 完成最终交互。
  - [x] SubTask 4.1: 创建 `ResumeObservationView` 主页面并集成各组件。
  - [x] SubTask 4.2: 在 `App.tsx` 中配置路由。
  - [x] SubTask 4.3: 增加“情绪价值”小挂件或观察日记区域。

# Task Dependencies
- [Task 2] depends on [Task 1]
- [Task 3] depends on [Task 2]
- [Task 4] depends on [Task 3]
