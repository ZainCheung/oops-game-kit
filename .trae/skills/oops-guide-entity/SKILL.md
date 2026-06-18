---
name: "oops-guide-entity"
description: "Oops Framework Entity 层编写规范。当用户需要创建模块入口、注册 Entity、管理 Model 与 Business 层组件时调用。"
triggers:
  keywords:
    - "Entity"
    - "实体"
    - "模块入口"
    - "CCEntity"
    - "ecs.register"
    - "addComponents"
    - "addBusinesss"
  patterns:
    - ".*Entity.*"
    - ".*实体.*"
    - ".*模块入口.*"
---

# Oops Framework Entity 层规范

## 使用说明

生成 Entity 层代码时，**必须**遵循以下流程：

1. 打开 `oops-rule-coding.md`，找到 **"1. Entity 层元模板"**
2. 复制元模板，替换 `[Module]` 占位符
3. 根据用户需求决定注册哪些 Business（通常至少包含 `B_[Module]_Main` 和 `B_[Module]_ViewUI`）
4. 对照下方强制要求逐项检查

## 强制元模板（来自 oops-rule-coding.md）

```typescript
import { ecs } from 'db://oops-framework/libs/ecs/ECS';
import { CCEntity } from 'db://oops-framework/module/common/CCEntity';
import { B_[Module]_Main } from './bll/B_[Module]_Main';
import { B_[Module]_ViewUI } from './bll/B_[Module]_ViewUI';
import { M_[Module]_Main } from './model/M_[Module]_Main';

@ecs.register('[Module]')
export class [Module] extends CCEntity {
    M_[Module]_Main!: M_[Module]_Main;

    B_[Module]_Main!: B_[Module]_Main;
    B_[Module]_ViewUI!: B_[Module]_ViewUI;

    protected init() {
        this.addComponents(M_[Module]_Main);
        this.addBusinesss(B_[Module]_Main, B_[Module]_ViewUI);
    }
}
```

## 强制要求

| 检查项 | 要求 |
|--------|------|
| 继承 | 必须继承 `CCEntity` |
| 装饰器 | `@ecs.register('[Module]')`，参数**不带前缀** |
| Model 属性 | 使用 `!` 断言，如 `M_[Module]_Main!: M_[Module]_Main` |
| init() | 仅含组件注册，**绝对禁止**业务逻辑 |

## 常见错误

```typescript
// ❌ 错误 - 在 init() 中编写业务逻辑
protected init() {
    this.addComponents(M_Backpack_Main);
    if (this.someCondition) {  // 禁止！这是业务逻辑
        this.addBusinesss(B_Backpack_Main);
    }
}

// ❌ 错误 - 在 Entity 中封装业务方法
getProp(id: number) {
    return this.M_Backpack_Main.props.get(id);  // 禁止！应在 Business 层实现
}


```

## 关联规范

- 元模板定义：`../rules/oops-rule-coding.md` 第 1 节
- 核心约束：`../rules/oops-rule-core.md` 第 5 章
- 项目结构：`../rules/oops-rule-structure.md`
