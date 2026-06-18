---
name: "oops-guide-framework-modules"
description: "Oops Framework 核心功能模块概览。当用户需要了解 oops.xxx API 的功能概览、快速参考或导航到详细技能时调用。"
triggers:
  keywords:
    - "oops"
    - "框架模块"
    - "核心功能"
    - "API"
    - "功能概览"
  patterns:
    - ".*oops\\..*"
    - ".*框架.*"
    - ".*模块.*"
---

# Oops Framework 核心功能模块概览

## 使用说明

当用户询问框架功能、需要快速参考或导航到具体模块时，使用本技能提供概览和导航。

## 核心模块速查表

| 模块 | 入口 | 用途 | 详细技能 |
|------|------|------|----------|
| 日志 | `oops.log` | 日志输出、过滤、自定义 | `oops-core-log` |
| 定时器 | `oops.timer` | 倒计时、延迟执行、服务器时间同步 | `oops-core-timer` |
| 随机数 | `oops.random` | 随机数生成、随机抽取、种子随机 | `oops-core-random` |
| 存储 | `oops.storage` | 本地数据持久化、加密存储 | `oops-core-storage` |
| GUI | `oops.gui` | 界面管理、层级控制 | `oops-guide-viewui` |
| ECS | `ecs` | 实体组件系统 | `oops-guide-entity` |

## 模块使用原则

1. **View 层** 打开/关闭界面必须通过 `this.ent.B_[Module]_ViewUI.openMain()` / `removeMain()`，禁止直接调用 `oops.gui.open()` / `oops.gui.remove()`
2. **Business 层** 使用 `oops.log.logBusiness(msg, module)` 记录日志
3. **所有层** 使用 `oops.timer` 进行定时操作，禁止 `setTimeout`/`setInterval`
4. **数据存储** 使用 `oops.storage`，禁止直接操作 `localStorage`

## 关联规范

- 核心约束：`../rules/oops-rule-core.md`
- 编码规范：`../rules/oops-rule-coding.md`
