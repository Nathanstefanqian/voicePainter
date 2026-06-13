# 字节跳动（ByteDance）前端 AI 工程师面试准备计划

## 1. 现状分析 (Current State Analysis)

Nathan 目前拥有极佳的开局背景：
- **学术背书**：上海大学电子信息复试第一名，逻辑思维与学习能力已获证明。
- **技术栈**：深度实践 React + Vite + NestJS + AI (Agent/RAG/MCP)，完全符合字节目前大力推行的 **AI 工程化** 趋势。
- **项目深度**：Lumi 项目已迭代至 2.0，具备完整的全栈开发与部署经验。
- **已完成复习**：浏览器与网络基础、Javascript 核心（原型链、闭包、Event Loop）、Lumi 基础架构。

## 2. 核心准备策略 (Core Strategy)

字节面试以“硬核”著称，重点考察**底层原理、代码手写能力、算法深度**以及**AI 与前端的结合能力**。

### 阶段一：前端深度与 React 进阶 (巩固基础)
- **React 19 特性**：深入理解 `useOptimistic`、`Actions` 以及 RSC（React Server Components）的架构。
- **React 底层原理**：深入 Fiber 架构、Lane 优先级模型、Diff 算法细节（最长递增子序列）。
- **性能优化实战**：结合 Lumi 项目，总结重排重绘优化、虚拟列表实现、Rspack/Rsbuild 构建提效。
- **CSS 核心**：BFC、Flex/Grid 布局细节、CSS 变量在主题切换中的应用。

### 阶段二：AI 工程化 (核心竞争力)
- **流式输出（Streaming）**：深入 SSE 协议，解决长文本渲染卡顿与 DOM 节点溢出问题。
- **AI 交互模式**：总结 RAG UI 设计、引用标注、上下文管理、Token 消耗优化（结合 Lumi-fe）。
- **前端模型应用**：了解 Transformers.js、WebGPU 等在浏览器端进行轻量级推理的可能性。

### 阶段三：计算机基础与硬核算法 (突破难点)
- **网络协议**：深入 HTTP/3 (QUIC)、TLS 握手细节、TCP 拥塞控制、WebSocket 断线重连机制。
- **手写代码（字节必考）**：
  - 实现一个带并发限制的异步调度器（Scheduler）。
  - 手写 `Promise.all` / `Promise.retry` / `Promise.finally`。
  - 手写深拷贝（解决循环引用）、防抖节流（rAF 版）。
- **算法突击**：重点刷 LeetCode 前 200 题中的字节高频题（树、动态规划、双指针、滑动窗口）。

### 阶段四：项目复盘与简历打磨 (软实力)
- **STAR 法则**：针对 Lumi 项目，总结“最难的技术挑战”、“如何通过 AI 提升工程效率”、“性能指标的具体提升”。
- **架构思维**：思考如何将 Lumi 扩展为 Monorepo、如何设计微前端架构、如何实现跨端逻辑复用（Lumi-ios / Lumi-wechat）。

## 3. 具体执行步骤 (Proposed Changes)

| 目标文件/模块 | 准备内容 | 验证方式 |
| :--- | :--- | :--- |
| **基础知识文档** | 更新 [前端 - React 框架(补充).md](file:///Users/nathanq/sites/lumi/docs/基础知识/前端 - React 框架(补充).md) 包含 React 19 内容。 | 文档完整性检查 |
| **算法专题** | 在 [前端 - 算法篇.md](file:///Users/nathanq/sites/lumi/docs/基础知识/前端 - 算法篇.md) 中整理字节高频手写题。 | 手写代码运行验证 |
| **Lumi 项目优化** | 在 [Lumi-fe](file:///Users/nathanq/sites/lumi/Lumi-fe) 中实现一个高性能并发调度器用于面试演示。 | 本地性能测试 |
| **面试突击功能** | 迭代 Lumi 的“面试突击”模块，增加“字节跳动专题”分类。 | 页面功能验证 |

## 4. 验证与交付 (Verification)
- **模拟面试**：由图图进行 3 轮针对性的模拟面试（基础面、原理面、系统设计面）。
- **代码考核**：在 15 分钟内白板手写出复杂的异步调度逻辑。
- **项目演示**：能清晰阐述 Lumi 的 AI 架构设计及其解决的业务痛点。

---
*计划生成：小欣妍 (图图)*
*目标：助力 Nathan 拿下字节跳动深圳校招 Offer！*
