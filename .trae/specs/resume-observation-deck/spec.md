# 简历投递观察台 (Resume Observation Deck) Spec

## Why
Nathan 正在备战大厂实习和校招，需要一个集中的“观察台”来监控上海、深圳等地区的互联网大厂投递情况。
目前投递信息分散在各个官网，缺乏一个宏观的视角来观察投递进度、总结经验，并在感到迷茫或“一筹莫展”时提供心理支撑和数据反馈。

## What Changes
- **Lumi-be**:
  - 新增 `ResumeObservation` 模块，包含 Schema, Controller, Service。
  - 在 `MenuService` 中注册“投递观察台”菜单项。
- **Lumi-fe**:
  - 新增 `src/features/resume-observation` 目录。
  - 实现 `ResumeObservationView` 页面，包含统计面板和交互式表格。
  - 集成 API 调用和状态管理。

## Impact
- Affected specs: 无
- Affected code: `Lumi-be` (Menu, API), `Lumi-fe` (Routes, Features).

## ADDED Requirements
### Requirement: 核心观察台页面
系统必须提供一个美观且功能丰富的页面，用于展示和管理投递记录。

#### Scenario: 成功查看列表
- **WHEN** 用户点击侧边栏“投递观察台”
- **THEN** 页面展示统计概览卡片和公司投递列表
- **AND** 列表默认按最后更新时间排序

### Requirement: 地区与公司分类
支持按上海、深圳等地区分类显示，并包含官网地址。

#### Scenario: 筛选地区
- **WHEN** 用户在筛选器中选择“深圳”
- **THEN** 列表仅显示深圳地区的互联网公司

### Requirement: 状态监控与记录
用户可以记录投递状态、岗位、日期及备注。

#### Scenario: 更新投递进度
- **WHEN** 用户将“字节跳动”的状态改为“面试中”
- **THEN** 系统更新记录，并同步更新顶部统计面板的“面试中”计数

### Requirement: 情绪价值与观察总结
在页面中集成“观察总结”功能，帮助用户在焦虑时进行自我复盘。

#### Scenario: 记录观察随笔
- **WHEN** 用户在观察台底部输入“今日面经总结”并保存
- **THEN** 记录被持久化，并在时间轴中展示

## MODIFIED Requirements
### Requirement: 侧边栏菜单
- **MODIFIED**: 增加“投递观察台”入口，图标使用 `Monitor` 或 `LayoutDashboard`。

## REMOVED Requirements
无
