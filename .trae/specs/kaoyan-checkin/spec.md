# 考研打卡系统 (Kaoyan Check-in) Spec

## Why
为了帮助学弟学妹更好地备考研究生，在 Lumi 系统中建立一个规范化的打卡机制。通过 Lv2 用户的监督（每日发布任务）和积分激励制度，提升学习动力和效率。

## What Changes
- **Backend**:
  - 新增 `KaoyanTask` 模块，用于存储每日发布的自然语言任务及解析后的结构化任务。
  - 新增 `KaoyanSubmission` 模块，记录用户的打卡内容（笔记、心得、番茄钟、任务截图）。
  - 扩展 `CheckInService` 或新建 `KaoyanService` 处理积分逻辑。
  - 在 `MenuService` 中注册“考研打卡”菜单。
- **Frontend**:
  - 新增 `KaoyanView` 功能组件。
  - 实现 Lv2 用户的任务发布界面（支持自然语言输入）。
  - 实现普通用户的打卡提交界面（多图上传 + 文本校验）。
  - 集成积分展示与反馈。

## Impact
- **Affected specs**: 菜单系统、积分系统。
- **Affected code**: `Lumi-be/src/exam-prep`, `Lumi-fe/src/features/exam-prep` (或新建目录)。

## ADDED Requirements
### Requirement: 任务发布 (Lv2 专属)
系统必须允许 Lv2 等级（level: 2）的用户通过自然语言为特定学弟学妹发布次日任务。
- **Scenarios**:
  - **WHEN** Lv2 用户输入“明天张三需要完成：1. 数学第一章习题 2. 英语单词 100 个”，并指定用户张三。
  - **THEN** 系统解析并存储任务，张三在次日可见。

### Requirement: 任务展示与打卡
用户登录后在菜单中看到属于自己的今日任务，并能针对每个任务上传截图。
- **Scenarios**:
  - **WHEN** 用户完成“数学第一章习题”。
  - **THEN** 用户上传该任务对应的练习截图。

### Requirement: 总提交校验
用户在完成所有分项任务后，必须进行总提交。
- **Scenarios**:
  - **WHEN** 用户点击总提交，且“今日收获”少于 50 字，或未上传“番茄 TODO”截图/“笔记”截图。
  - **THEN** 系统报错提示“内容不足或缺少必要凭证”。
  - **WHEN** 用户满足所有条件提交。
  - **THEN** 系统记录打卡成功，发放积分，并显示鼓励语。

### Requirement: 积分制度 (自由规划)
- **基础奖励**：每日完成打卡奖励 **30 积分**。
- **连续打卡奖励**：连续 7 天打卡奖励额外 **50 积分**。
- **质量奖励**：Lv2 用户可对心得体会进行点赞，每获一个赞额外奖励 **5 积分**。

## MODIFIED Requirements
### Requirement: 菜单展示
`MenuService` 需包含“考研打卡”项，默认 `minLevel: 0`（所有备考学弟学妹可见），但内部“发布任务”按钮仅对 `level >= 2` 开放。
