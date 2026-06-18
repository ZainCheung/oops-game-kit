---
name: "oops-guide-model"
description: "Oops Framework Model 层编写规范。当用户需要创建数据组件、定义数据结构、实现 reset() 时调用。"
triggers:
  keywords:
    - "Model"
    - "数据层"
    - "ecs.Comp"
    - "reset"
    - "数据结构"
  patterns:
    - ".*Model.*"
    - ".*数据.*"
    - ".*数据层.*"
---

# Oops Framework Model 层规范

## 使用说明

生成 Model 层代码时，**必须**遵循以下流程：

1. 打开 `oops-rule-coding.md`，找到 **"2. Model 层元模板"**
2. 复制元模板，替换 `[Module]` 占位符
3. 仅声明用户**明确要求**的数据字段
4. 实现 `reset()` 方法清理自定义内存
5. 对照下方强制要求逐项检查

## 强制元模板（来自 oops-rule-coding.md）

```typescript
import { ecs } from 'db://oops-framework/libs/ecs/ECS';

@ecs.register('M_[Module]_Main')
export class M_[Module]_Main extends ecs.Comp {
    /** 数据字段 - 仅声明用户明确要求的属性 */
    // 示例: items: SomeType[] = [];

    reset() {
        // 清理自定义内存，释放数据引用
    }
}
```

## 强制要求

| 检查项 | 要求 |
|--------|------|
| 继承 | 必须继承 `ecs.Comp` |
| 装饰器 | `@ecs.register('M_[Module]_Main')`，参数**带 M_ 前缀** |
| reset() | **必须实现**；清理自定义内存 |
| 属性 | 仅声明用户**明确要求**的数据字段 |
| 禁止 | ❌ 不包含业务逻辑；❌ 不声明未使用的属性 |

## 常见错误

```typescript
// ❌ 错误 - 包含业务逻辑
reset() {
    this.items.sort();  // 禁止！这是业务逻辑
}

// ❌ 错误 - 声明未使用的属性
private cache: Map<string, any> = new Map();  // 用户没要求！

// ❌ 错误 - 装饰器不带 M_ 前缀
@ecs.register('Backpack_Main')  // 错误！应为 M_Backpack_Main
```

## 关联规范

- 元模板定义：`../rules/oops-rule-coding.md` 第 2 节
- 核心约束：`../rules/oops-rule-core.md` 第 1 章
- 项目结构：`../rules/oops-rule-structure.md`
