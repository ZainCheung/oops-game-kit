---
name: "oops-guide-enum"
description: "Oops Framework 枚举定义规范。当用户需要创建模块枚举、定义常量时调用。"
triggers:
  keywords:
    - "Enum"
    - "枚举"
    - "常量"
    - "配置"
  patterns:
    - ".*Enum.*"
    - ".*枚举.*"
    - ".*常量.*"
---

# Oops Framework 枚举规范

## 使用说明

生成枚举代码时，**必须**遵循以下流程：

1. 打开 `oops-rule-structure.md`，找到 **"3. 前缀规则表"** 中的枚举命名规范
2. 根据枚举所属层级选择正确前缀（`EM_` / `EB_` / `EV_`）
3. 根据用户需求添加枚举值
4. 对照下方强制要求逐项检查

## 强制要求

| 检查项 | 要求 |
|--------|------|
| 命名 | `export enum [Prefix]_[Module]`，前缀根据层级选择 |
| 导出 | 必须 `export` |
| 值类型 | 字符串或数字枚举，根据场景选择 |

### 层级前缀对照表（来自 oops-rule-structure.md）

| 层级 | Enum 前缀 | 示例 |
|------|-----------|------|
| **model** | `EM_` | `EM_Backpack.ts` |
| **bll** | `EB_` | `EB_Backpack.ts` |
| **view** | `EV_` | `EV_Backpack.ts` |

## 关联规范

- 前缀规则：`../rules/oops-rule-structure.md` 第 3 节
- 项目结构：`../rules/oops-rule-structure.md`
