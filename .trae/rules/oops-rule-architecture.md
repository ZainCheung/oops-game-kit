---
name: "Architecture Specification"
description: "Oops Framework 三层架构设计规范，定义 View/Business/Model 层交互原则和数据流"
priority: "high"
triggers:
  keywords:
    - "架构"
    - "三层"
    - "View"
    - "Business"
    - "Model"
    - "模块设计"
    - "层间通信"
    - "架构设计"
  patterns:
    - ".*架构.*"
    - ".*模块.*设计.*"
    - ".*三层.*"
---

# Oops Framework - 三层架构规范

本文档定义 Oops Framework 的三层架构设计规范，核心原则是**视图层优先直接调用 Business API，事件仅用于跨模块通信**。

> **⚠️ 注意**：本文档专注架构设计原则。各层的具体代码模板和强制要求参见 `oops-rule-coding.md`。

---

## 1. 核心设计原则

### 1.1 视图层与业务层的交互原则

| 层级 | 原则/职责 | 示例 |
|------|-----------|------|
| **View（视图层）** | 原则1：优先直接调用 Business API | `this.ent.B_Backpack_Main.update(1001, 5)` |
| **View（视图层）** | 原则2：仅当需要响应其他模块通知时才使用事件监听 | `this.watch(BackpackEventName.UIUpdate, ...)` |
| **Business（业务层）** | 对外 API：供 View 直接调用 | `update()`、`use()`、`remove()` |
| **Business（业务层）** | 内部事件：通知同模块 View 更新 | `this.event.emit(BackpackEventName.UIUpdate)` |
| **Business（业务层）** | 跨模块事件：通知其他模块（降低耦合） | `this.event.emit(RedDotEventName.Add, redDotData)` |

**调用关系（简化）**：
`View（用户操作）` → `直接调用` → `Business（处理业务）`

### 1.2 事件使用规范

| 场景 | 推荐方式 | 说明 |
|------|---------|------|
| **同模块 View → Business** | 直接调用 API | `this.ent.B_Backpack_Main.update(1001, 5)` |
| **同模块 Business → View** | 模块内事件 | `this.event.emit(BackpackEventName.UIUpdate)` |
| **同模块 View ↔ View** | 直接引用 | `this.ent.VC_Backpack_Main.refresh(props)` |
| **跨模块通信** | 全局事件 | `this.event.emit(RedDotEventName.Add, redDotData)` |
| **View 响应数据变化** | 事件监听 | `this.watch(BackpackEventName.UIUpdate, ...)` |

**关键原则**：
- ✅ **View 主动调用**：用户操作直接调用 Business API
- ✅ **同模块 View 间通信**：直接通过 `this.ent.VC_XXX` 引用调用
- ✅ **Business 被动通知**：数据变化通过事件通知 View 更新
- ✅ **跨模块解耦**：使用全局事件进行跨模块通信
- ❌ **避免 View 通过事件触发 Business 方法**：不要 `emit` 后再 `watch`
- ❌ **避免同模块 View 间使用事件**：直接引用更高效

---

## 2. 架构层次

### 2.1 三层架构概览

| 层级 | 职责 | 核心组件 | 继承基类 | 交互方式 |
|------|------|----------|----------|----------|
| **View (视图层)** | 界面显示、用户交互 | `VC_Backpack_Main` / `V_Backpack_Prop` | `CCView` | 直接调用 Business API |
| **Business (业务层)** | 业务逻辑、数据验证 | `B_Backpack_Main` (update / use / remove) | `CCBusiness` | 操作数据、触发事件 |
| **Model (数据层)** | 数据存储、状态管理 | `M_Backpack_Main` (props Collection) | `ecs.Comp` | 被 Business 操作 |

### 2.2 调用关系

| 步骤 | 方向 | 调用方式 | 说明 |
|------|------|----------|------|
| 1 | View → Business | 直接调用 API | 用户操作触发业务逻辑 |
| 2 | Business → Model | 操作数据 | 业务层修改数据状态 |
| 3 | Model → View | 事件通知 | 数据变化后通知视图更新 |

**数据流向**: `View` → `Business` → `Model` → `View` (通过事件)

### 2.3 各层职责

| 层级 | 核心职责 | 禁止行为 | 继承基类 |
|------|----------|----------|----------|
| **View (视图层)** | 界面显示、用户交互、动画效果 | 直接操作数据 | `CCView` |
| **Business (业务层)** | 业务逻辑、数据验证、流程控制 | 直接加载资源 | `CCBusiness` |
| **Model (数据层)** | 数据存储、数据计算、数据转换 | 包含业务逻辑 | `ecs.Comp` |

---

## 3. 层间通讯规则

### 3.1 视图层 → 业务层（优先直接调用）

```typescript
// ✅ 正确 - 直接调用 Business API
onLoad() {
    this.refresh(this.ent.getProps());
}

onUseButtonClick(propId: number) {
    this.ent.B_Backpack_Main.use(propId, 1);
}
```

### 3.2 视图层 → 业务层（事件仅用于被动响应）

```typescript
// ✅ 正确 - 监听数据变化，被动更新UI
private setWatch() {
    this.watch(BackpackEventName.UIUpdate, this.onBackpackUpdateUI, this);
    this.watch(BackpackEventName.UIRemove, this.onBackpackRemoveUI, this);
}
```

### 3.3 业务层 → 视图层（通过事件通知）

```typescript
// ✅ 正确 - Business 通过事件通知 View 更新
update(id: number, amount: number): void {
    // 1. 修改 Model 数据
    let prop = this.ent.M_Backpack_Main.props.get(id);
    if (prop) {
        prop.M_Prop_Main.amount += amount;
    }
    
    // 2. 通知 View 更新（被动通知，不是直接调用 View 方法）
    this.event.emit(BackpackEventName.UIUpdate, { prop, listId: undefined });
}
```

### 3.4 跨模块通信（使用全局事件）

```typescript
// Business 层触发全局事件
init() {
    const redDotAddData: IRedDotAddData = {
        key: EM_BackpackRedDot.BackpackKey,
        path: EM_BackpackRedDot.BackpackPath,
    };
    this.event.emit(RedDotEventName.Add, redDotAddData);
    this.setWatch();
}

// 其他模块监听全局事件
private setWatch() {
    this.watch(RedDotEventName.Update, this.onRedDotUpdate, this);
}
```

---

## 4. 通讯方式决策树

```
View 需要与其他组件交互？
    │
    ├─ 同模块 View 组件 ──► 直接引用
    │   this.ent.VC_XXX.method()
    │
    ├─ Business 层 ──► 直接调用 API
    │   this.ent.B_XXX.method()
    │
    ├─ 响应数据变化 ──► 监听模块内事件
    │   this.watch(ModuleEventName.XXX, ...)
    │
    └─ 跨模块通信 ──► 使用全局事件
        this.event.emit(GlobalEventName.XXX)
```

### 详细决策流程

```
同模块内的交互？
    │
    ├─ View → Business ──► 直接调用 API
    │   this.ent.B_Backpack_Main.update(1001, 5)
    │
    ├─ View → View ──► 直接引用
    │   this.ent.VC_Backpack_Main.refresh(props)
    │
    ├─ Business → View ──► 模块内事件
    │   this.event.emit(BackpackEventName.UIUpdate)
    │
    └─ 跨模块 ──► 全局事件
        this.event.emit(RedDotEventName.Add, redDotData)
```

---

## 5. 基类继承关系

| 层级 | 类名 | 继承基类 | 注册装饰器 |
|------|------|----------|------------|
| Entity | `[Module]` | `CCEntity` | `@ecs.register('[Module]')` |
| Model | `M_[Module]_Model` | `ecs.Comp` | `@ecs.register('M_[Module]_Model')` |
| Business | `B_[Module]_[Name]` | `CCBusiness<[Module]>` | `@classname('B_[Module]_[Name]')` |
| View (ECS) | `VC_[Module]_[Name]` | `CCView<[Module]>` | `@ecs.register('VC_[Module]_[Name]', false)` + `@gui.register(...)` |

---

## 6. API 引用规范（强制）

### 6.1 核心原则

**生成代码时，如果引用其他组件的 API，必须确认该 API 存在。不确定时，必须向开发者提问，禁止假设 API 存在。**

### 6.2 API 存在性检查流程

```
需要调用其他组件的 API？
    │
    ├─ 目标组件文件已存在？
    │   ├─ 否 ──► 提问开发者：目标组件是否存在？
    │   └─ 是 ──► 读取文件，检查 API 是否存在
    │
    ├─ API 存在？
    │   ├─ 是 ──► 生成调用代码
    │   └─ 否 ──► 提问开发者
    │
    └─ 不确定？
        └─ 是 ──► 提问开发者
```

### 6.3 提问模板

当 API 不存在或不确定时，必须使用以下格式提问：

```
**API 引用确认**

在生成 [当前组件] 时，需要调用 [目标组件].[方法名]()，但发现：

[具体情况描述]
- 情况 A：[目标组件] 中没有 [方法名] 方法
- 情况 B：无法确定 [目标组件] 是否存在
- 情况 C：[其他情况]

请确认：
1. 在 [目标组件] 中添加 [方法名] 方法？
2. 使用其他已有方法（如 [现有方法名]）？
3. 暂不实现此调用？
4. 其他方案（请描述）：
```

### 6.4 禁止行为

❌ **以下行为严格禁止**：

1. 假设 API 存在并生成调用代码
2. 自动生成不存在的 API
3. 使用模糊的方法名（如不确定是 `findProp` 还是 `getProp` 时禁止猜测）

---

## 7. 设计原则总结

1. **直接调用优先**：
   - View → Business：直接调用 API
   - 同模块 View ↔ View：直接通过 `this.ent.VC_XXX` 引用

2. **事件用于解耦**：
   - Business → View：模块内事件通知
   - 跨模块通信：全局事件解耦

3. **单向数据流**：
   - View 调用 Business → Business 更新 Model → Business 通知 View

4. **降低耦合度**：
   - 同模块内：直接引用和调用（高效）
   - 跨模块：全局事件（解耦）
