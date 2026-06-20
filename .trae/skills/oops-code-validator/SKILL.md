---
name: "oops-code-validator"
description: "Oops Framework 代码验证技能。自动化验证生成的代码是否符合框架规范，确保100%无错误。支持 TypeScript 编译检查、ESLint 检查、框架规则检查，并自动修复可修复的问题。在代码生成后必须调用此技能进行验证。"
triggers:
  keywords:
    - "validate"
    - "验证"
    - "代码验证"
    - "检查代码"
    - "lint"
    - "编译检查"
    - "typescript检查"
  patterns:
    - "validate.*"
    - ".*验证.*"
    - "检查.*代码"
    - ".*lint.*"
---

# Oops Framework 代码验证技能

## 核心职责

自动化验证生成的代码，确保：

1. **TypeScript 编译通过** - 无类型错误
2. **ESLint 检查通过** - 无代码风格问题
3. **框架规则检查通过** - 符合 Oops Framework 规范

**输入**：生成的代码文件路径列表
**输出**：验证报告（通过/失败 + 问题列表 + 修复建议）

**⚠️ 绝对禁止：验证未通过就交付代码。验证失败 = 不可交付。**

> **注意**：此技能由 `oops-workflow-code-generation` 在步骤3调用，也可单独调用验证已有代码。

***

## 验证流程

### 流程概览

| 步骤 | 检查项             | 工具/方式              | 检查内容              | 自动修复         |
| -- | --------------- | ------------------ | ----------------- | ------------ |
| 1  | TypeScript 编译检查 | `npx tsc --noEmit` | 类型错误、语法错误         | 尝试自动修复       |
| 2  | ESLint 检查       | `npx eslint`       | 代码风格、规范问题         | `--fix` 自动修复 |
| 3  | 框架规则检查          | 自定义规则              | 类名、继承、导入、装饰器、方法签名 | 尝试自动修复       |
| 4  | 生成验证报告          | -                  | 汇总结果              | -            |

### 流程图

```
步骤1 → 步骤2 → 步骤3 → 生成报告 → 全部通过 → 返回成功
                                      ↓ 有错误
                                返回失败 + 问题列表 → 必须修复后重新验证
```

***

## 验证规则库

> **规范来源**：以下验证规则对应框架规范文件，验证时以规则文件为准：
>
> - 项目结构 → `../rules/oops-rule-structure.md`
> - 编码标准 → `../rules/oops-rule-coding.md`
> - 核心约束 → `../rules/oops-rule-core.md`
> - 架构规范 → `../rules/oops-rule-architecture.md`

### 规则1：类名规范检查

| 文件类型     | 正则规则                                 | 示例                 | 错误信息                                  |
| -------- | ------------------------------------ | ------------------ | ------------------------------------- |
| View     | `^VC_[A-Z][a-zA-Z]*_[A-Z][a-zA-Z]*$` | `VC_Backpack_Main` | View类名必须使用 VC\_{Module}\_{Name} 格式    |
| Model    | `^M_[A-Z][a-zA-Z]*_[A-Z][a-zA-Z]*$`  | `M_Backpack_Main`  | Model类名必须使用 M\_{Module}\_{Name} 格式    |
| Business | `^B_[A-Z][a-zA-Z]*_[A-Z][a-zA-Z]*$`  | `B_Backpack_Main`  | Business类名必须使用 B\_{Module}\_{Name} 格式 |
| Entity   | `^[A-Z][a-zA-Z]*$`                   | `Backpack`         | Entity类名必须使用大驼峰格式，不含下划线               |

### 规则2：继承关系检查

| 文件类型     | 期望继承                      | 示例                             | 错误信息                            |
| -------- | ------------------------- | ------------------------------ | ------------------------------- |
| View     | `extends CCView<\w+>`     | `extends CCView<Backpack>`     | View必须继承 CCView<Module>         |
| Model    | `extends ecs\.Comp`       | `extends ecs.Comp`             | Model必须继承 ecs.Comp              |
| Business | `extends CCBusiness<\w+>` | `extends CCBusiness<Backpack>` | Business必须继承 CCBusiness<Module> |
| Entity   | `extends CCEntity`        | `extends CCEntity`             | Entity必须继承 CCEntity             |

### 规则3：导入语句检查

- 检查必需导入是否存在（根据文件类型）
- **禁止未使用的导入**：每个 `import` 导入的标识符必须在文件中被实际使用
- **禁止假设性导入**：不得导入"可能用到"但实际未使用的模块

**未使用导入检查示例**：

```typescript
// ❌ 错误 - 导入后未使用
import { oops } from 'db://oops-framework/core/Oops';  // 文件中无 oops 的使用

// ❌ 错误 - 假设性导入
import { ecs } from 'db://oops-framework/libs/ecs/ECS'; // 当前文件不需要 ecs

// ✅ 正确 - 只导入实际使用的
import { CCBusiness } from 'db://oops-framework/module/common/CCBusiness';
```

### 规则4：装饰器检查

| 文件类型   | 必需装饰器                                                                      |
| ------ | -------------------------------------------------------------------------- |
| View   | `@ccclass('VC_xxx')`、`@ecs.register('VC_xxx', false)`、`@gui.register(...)` |
| Model  | `@ecs.register('M_xxx')`                                                   |
| Entity | `@ecs.register('xxx')`                                                     |

### 规则5：方法签名检查

| 文件类型     | 检查项                                      |
| -------- | ---------------------------------------- |
| Business | 必须有 `init()` 和 `setWatch()`；事件处理必须使用泛型签名 |
| View     | 必须有 `reset()`                            |

**事件处理方法签名（强制格式）**：

```typescript
private onEventName<K extends ModuleEventName.EventName>(event: K, data: IModuleEventDataMap[K]): void
```

### 规则5.1：禁止调用不存在的方法

**AI 必须确保调用的每个方法都真实存在于目标类或框架中。**

| 方法                            | 状态     | 说明                              |
| ----------------------------- | ------ | ------------------------------- |
| `this.unwatchAll()`           | ❌ 不存在  | 框架自动管理事件释放，禁止手动调用               |
| `this.ent.add(ViewClass)`     | ❌ 不存在  | 正确为 `this.ent.addUi(ViewClass)` |
| `this.ent.B_XXX.someMethod()` | ⚠️ 需确认 | 必须确认 Business 层已定义该方法           |

**检查规则**：

1. 调用的方法必须在目标类的定义中存在
2. 禁止凭记忆或假设编造方法名
3. 框架自动管理的功能（事件释放、按钮解绑）禁止手动调用释放方法

### 规则6：declare global 检查（Event 文件）

- `[Module]Event.ts` 必须包含 `declare global` 块
- 必须扩展 `OopsFramework.TypedEventMap`

### 规则7：属性初始化风格检查

- `@property` 属性必须使用 `= null!` 初始化
- 禁止 `= null`、不初始化、联合类型、可选标记

***

## 自检清单

生成代码后，按以下清单逐项检查：

### Entity 层

- [ ] `import { CCEntity }` 导入正确
- [ ] `@ecs.register('Backpack')` 参数是模块名，**不带前缀**
- [ ] Model 属性声明使用 `!` 断言
- [ ] `init()` 方法中**不编写任何业务逻辑**

### Model 层

- [ ] `@ecs.register('M_Backpack_Main')` 参数**带 M\_ 前缀**
- [ ] 必须实现 `reset()` 方法
- [ ] 只声明用户明确提到的属性

### Business 层

- [ ] `CCBusiness`、`IBackpackEventDataMap` 导入正确
- [ ] `init()` 中调用 `setWatch()`
- [ ] `watch()` 调用统一在 `setWatch()` 中，且第三个参数是 `this`
- [ ] 事件处理泛型签名必须完全匹配（详见 `oops-rule-coding.md` 第3.3节）
- [ ] **删除所有未使用的导入**（如未使用的 `oops`、`ecs` 等）
- [ ] **只调用确认存在的方法**，禁止假设 Business 层有某个方法

### View 层

- [ ] `@property` 使用的组件从 `'cc'` 正确导入
- [ ] `CCView`, `ecs`, `gui`, `LayerType` 导入正确
- [ ] `BackpackEventName`, `IBackpackEventDataMap`, `Backpack` 导入正确
- [ ] `@ecs.register('VC_Backpack_Main', false)` 第二个参数必须是 `false`
- [ ] `@property` 属性使用 `= null!` 初始化
- [ ] `onLoad()` 中调用 `super.onLoad()` 和 `this.setWatch()`
- [ ] 必须包含 `reset()` 方法
- [ ] **reset() 中禁止调用** **`this.unwatchAll()`** — 框架自动管理
- [ ] **只调用确认存在的方法**，禁止假设方法存在

### Event 层

- [ ] 必须包含 `declare global` 块
- [ ] `declare global` 中命名空间必须是 `OopsFramework`
- [ ] `TypedEventMap` 必须 `extends IBackpackEventDataMap`
- [ ] 事件枚举与事件数据在**同一文件** `[Module]Event.ts` 中

### 框架导入检查（所有文件）
