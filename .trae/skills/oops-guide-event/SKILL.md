---
name: "oops-guide-event"
description: "Oops Framework 事件系统编写规范。当用户需要定义模块事件、事件数据接口、declare global 扩展时调用。"
triggers:
  keywords:
    - "Event"
    - "事件"
    - "事件系统"
    - "事件定义"
    - "declare global"
    - "TypedEventMap"
    - "事件枚举"
  patterns:
    - ".*Event.*"
    - ".*事件.*"
    - ".*declare global.*"
---

# Oops Framework 事件系统规范

## 使用说明

生成事件系统代码时，**必须**遵循以下流程：

1. 打开 `oops-rule-coding.md`，找到 **"8. Event 层元模板"**
2. 复制元模板，替换 `[Module]` 占位符
3. 根据用户需求添加事件枚举和事件数据接口
4. **绝对不要遗漏** `declare global` 扩展
5. 对照下方强制要求逐项检查

## 强制元模板（来自 oops-rule-coding.md）

事件系统合并为**单个文件** `[Module]Event.ts`，包含事件枚举、事件数据接口和全局声明。

### [Module]Event.ts（事件定义文件）

```typescript
/** [Module]事件枚举 */
export enum [Module]EventName {
    /** [描述] */
    [EventKey] = '[EventValue]',
}

/** [描述]事件数据 */
export interface I[Module][EventKey]Data {
    // 数据字段
}

/** [Module]事件数据映射 */
export interface I[Module]EventDataMap {
    [EventValue]: I[Module][EventKey]Data;
}

// ✅ 必须包含 - 扩展全局事件类型
declare global {
    namespace OopsFramework {
        interface TypedEventMap extends I[Module]EventDataMap {}
    }
}
```

## 强制要求

| 检查项 | 要求 |
|--------|------|
| 枚举 | 使用 `export enum [Module]EventName` |
| 映射接口 | 使用 `export interface I[Module]EventDataMap` |
| 枚举值 | 字符串值格式 `on[Module][Action]` |
| 全局扩展 | **必须包含** `declare global` 扩展 `TypedEventMap` |
| 文件数量 | 事件枚举与事件数据合并为**单个文件** `[Module]Event.ts` |

## 常见错误

```typescript
// ❌ 错误 - 遗漏 declare global
declare global {  // 绝对不能省略！
    namespace OopsFramework {
        interface TypedEventMap extends IBackpackEventDataMap {}
    }
}

// ❌ 错误 - 枚举键带前缀
export enum BackpackEventName {
    BackpackUse = 'onBackpackUse',  // 错误！键应为 Use
}

// ✅ 正确
export enum BackpackEventName {
    Use = 'onBackpackUse',
}

// ❌ 错误 - 拆分为两个文件
// BackpackEvent.ts + BackpackEventData.ts  ← 错误！应合并为单个文件

// ✅ 正确 - 事件枚举与事件数据在同一文件
// BackpackEvent.ts（包含枚举、数据接口、映射接口、declare global）
```

## 关联规范

- 元模板定义：`../rules/oops-rule-coding.md` 第 8 节
- 核心约束：`../rules/oops-rule-core.md` 第 4 章
- Business 层事件使用：`oops-guide-business`
