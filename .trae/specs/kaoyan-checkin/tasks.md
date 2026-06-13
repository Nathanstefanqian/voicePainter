# Tasks

* [x] Task 1: 后端数据模型开发：实现考研任务与打卡提交的 Schema。

  * [x] SubTask 1.1: 创建 `KaoyanTask` Schema (title, content, assignee, date, status)。

  * [x] SubTask 1.2: 创建 `KaoyanSubmission` Schema (taskId, userId, noteImage, insight, tomatoImage, taskImages)。

* [x] Task 2: 后端业务逻辑开发：实现任务发布、查询与打卡提交接口。

  * [x] SubTask 2.1: 实现 `assignTask` 接口（限制 Lv2 用户权限，支持自然语言解析占位）。

  * [x] SubTask 2.2: 实现 `getDailyTasks` 接口，根据日期 and 用户获取任务。

  * [x] SubTask 2.3: 实现 `submitKaoyanCheckin` 接口，包含 50 字校验及积分发放逻辑。

* [x] Task 3: 菜单注册：在 `MenuService` 中新增“考研打卡”功能。

* [x] Task 4: 前端视图开发：实现考研打卡核心界面。

  * [x] SubTask 4.1: 构建 `KaoyanView`基础布局。

  * [x] SubTask 4.2: 实现任务展示列表及分项截图上传。

  * [x] SubTask 4.3: 实现总提交表单（心得、笔记、番茄 TODO）。

* [x] Task 5: 权限增强：实现按钮级别的 Lv2 权限控制。

* [x] Task 6: 积分与反馈系统优化。

  * [ ] SubTask 6.1: 打卡成功后的动画反馈与Lumi式鼓励语展示。

# Task Dependencies

* Task 2 依赖于 Task 1

* Task 4 依赖于 Task 2

* Task 5 依赖于 Task 4

