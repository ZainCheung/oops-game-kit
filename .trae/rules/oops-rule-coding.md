---
name: "Coding Standard"
description: "Oops Framework 各层代码元模板与编码规范。AI生成代码时必须严格套用本文档的元模板，禁止自由发挥。"
priority: "high"
triggers:
  keywords:
    - "代码"
    - "模板"
    - "Entity"
    - "Model"
    - "Business"
    - "View"
    - "导入"
    - "事件"
    - "编码规范"
  patterns:
    - ".*代码.*模板.*"
    - ".*编写.*规范.*"
---

# Oops Framework - 编码标准（元模板版）

> **⚠️ 最高优先级约束**：本文档所有规范受 `oops-rule-core.md` 约束。当本文档与 `core` 冲突时，**以 `core` 为准**。
>
> **生成原则**：AI 必须**先加载对应元模板 → 替换占位符 → 填充业务逻辑**，禁止凭记忆自由编写。

---

## 占位符定义

| 占位符 | 含义 | 替换示例 |
|--------|------|----------|
| `[Module]` | 模块名，大驼峰 | `Backpack`, `Friend`, `Shop` |
| `[module]` | 模块名全小写 | `backpack`, `friend`, `shop` |
| `[Name]` | 文件功能后缀 | `Main`, `Detail`, `Item`, `List` |
| `[EventKey]` | 事件枚举键名 | `Use`, `Update`, `UIUpdate` |
| `[eventKey]` | 事件枚举键名小写 | `use`, `update`, `uiUpdate` |
| `[EventValue]` | 事件字符串值 | `onBackpackUse`, `onFriendUpdate` |
| `[ParentComp]` | 列表项父组件类名 | `ListItemReddot`, `ListItem` |

---

## 1. Entity 层元模板

### 1.1 强制元模板

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

### 1.2 强制要求

| 检查项 | 要求 |
|--------|------|
| 继承 | 必须继承 `CCEntity` |
| 装饰器 | `@ecs.register('[Module]')`，参数**不带前缀** |
| Model 属性 | 使用 `!` 断言，如 `M_[Module]_Main!: M_[Module]_Main` |
| init() | 仅含组件注册，**绝对禁止**业务逻辑 |

---

## 2. Model 层元模板

### 2.1 强制元模板

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

### 2.2 强制要求

| 检查项 | 要求 |
|--------|------|
| 继承 | 必须继承 `ecs.Comp` |
| 装饰器 | `@ecs.register('M_[Module]_Main')`，参数**带 M_ 前缀** |
| reset() | **必须实现**；清理自定义内存 |
| 属性 | 仅声明用户**明确要求**的数据字段 |
| 禁止 | ❌ 不包含业务逻辑；❌ 不声明未使用的属性 |

---

## 3. Business 层元模板

### 3.1 主业务 Business 元模板（watch 模式）

> **适用场景**：Business 需要监听其他模块事件并响应（如监听数据变化、跨模块通知）。

```typescript
import { CCBusiness } from 'db://oops-framework/module/common/CCBusiness';
import { classname } from 'db://oops-framework/module/decorator/ClassNameDecorator';
import { [Module] } from '../[Module]';
import { [Module]EventName, I[Module]EventDataMap } from '../[Module]Event';

@classname('B_[Module]_Main')
export class B_[Module]_Main extends CCBusiness<[Module]> {
    protected init() {
        this.setWatch();
    }

    /** 注册事件监听 - 所有事件在此统一注册 */
    private setWatch() {
        // this.watch([Module]EventName.[EventKey], this.on[EventName], this);
    }

    //#region 全局事件处理
    // private on[EventName]<K extends [Module]EventName.[EventKey]>(event: K, data: I[Module]EventDataMap[K]): void {
    //     // 业务逻辑
    // }
    //#endregion

    //#region 业务逻辑
    //#endregion
}
```

### 3.1b 事件驱动 Business 元模板（setEvent 模式）

> **适用场景**：Business 通过全局事件分发被触发（如 Prompt 弹窗、红点事件驱动、账号全局事件等），使用 `this.event.setEvent()` 注册事件，框架自动路由到同名处理方法。

```typescript
import { CCBusiness } from 'db://oops-framework/module/common/CCBusiness';
import { classname } from 'db://oops-framework/module/decorator/ClassNameDecorator';
import { [Module] } from '../[Module]';
import { [Module]EventName, type I[Module]EventDataMap } from '../[Module]Event';

@classname('B_[Module]_[Name]')
export class B_[Module]_[Name] extends CCBusiness<[Module]> {
    protected init() {
        this.event.setEvent(
            [Module]EventName.[EventKey1],
            [Module]EventName.[EventKey2]);
    }

    //#region 全局事件处理
    // private on[EventName]<K extends [Module]EventName.[EventKey]>(event: K, data: I[Module]EventDataMap[K]): void {
    //     // 业务逻辑
    // }
    //#endregion
}
```

**与 watch 模式的区别**：

| 对比项 | watch 模式（3.1） | setEvent 模式（3.1b） |
|--------|-------------------|----------------------|
| 注册方式 | `this.watch(EventName, handler, this)` | `this.event.setEvent(EventName1, EventName2, ...)` |
| 路由方式 | 手动指定回调函数 | 框架按事件名自动路由到 `onXxx` 方法 |
| 适用场景 | 主动监听其他模块事件 | 被动响应全局事件分发 |
| 典型命名 | `B_[Module]_Main` | `B_[Module]_Event`、`B_Prompt_Main` |
| 导入风格 | `I[Module]EventDataMap`（值导入） | `type I[Module]EventDataMap`（type 导入） |

### 3.2 强制要求

| 检查项 | watch 模式（3.1） | setEvent 模式（3.1b） |
|--------|-------------------|----------------------|
| **@classname 装饰器** | **必须**添加 `@classname('B_[Module]_Main')`，名称与类名一致 | **必须**添加 `@classname('B_[Module]_[Name]')`，名称与类名一致 |
| 继承 | 必须继承 `CCBusiness<[Module]>` | 必须继承 `CCBusiness<[Module]>` |
| init() | **必须**调用 `setWatch()` | **必须**调用 `this.event.setEvent(...)` |
| 事件注册 | `setWatch()` 中统一 `watch()`，第三个参数必须是 `this` | `this.event.setEvent()` 传入所有事件枚举 |
| 事件处理签名 | **必须完全匹配**：`private onXxx<K extends XxxEventName.Xxx>(event: K, data: IXxxEventDataMap[K]): void` | **必须完全匹配**：`private onXxx<K extends XxxEventName.Xxx>(event: K, data: IXxxEventDataMap[K]): void` |
| 触发事件 | 使用 `this.event.emit()` | 使用 `this.event.emit()` |
| 日志 | Business 层使用 `oops.log.logBusiness(msg, module)` | Business 层使用 `oops.log.logBusiness(msg, module)` |
| 导入风格 | `I[Module]EventDataMap`（值导入） | `type I[Module]EventDataMap`（type 导入） |

### 3.3 事件处理方法签名（绝对禁止变形）

```typescript
// ✅ 唯一正确格式
private on[EventName]<K extends [Module]EventName.[EventKey]>(event: K, data: I[Module]EventDataMap[K]): void {
    // 实现逻辑
}
```

**禁止**：
- ❌ 省略 `event: K` 参数
- ❌ 使用 `keyof I[Module]EventDataMap`
- ❌ 修改参数顺序或泛型约束格式
- ❌ 自由发挥签名

---

## 4. ViewUI 管理 Business 元模板

### 4.1 强制元模板

```typescript
import { Node } from 'cc';
import { CCBusiness } from 'db://oops-framework/module/common/CCBusiness';
import { [Module] } from '../[Module]';
import { VC_[Module]_Main } from '../view/VC_[Module]_Main';

export class B_[Module]_ViewUI extends CCBusiness<[Module]> {
    /** 打开[Module]主界面 */
    openMain(): Promise<Node | null> {
        return this.ent.addUi(VC_[Module]_Main);
    }

    /** 关闭[Module]主界面 */
    removeMain(): void {
        this.ent.removeUi(VC_[Module]_Main);
    }
}
```

### 4.2 强制要求

| 检查项 | 要求 |
|--------|------|
| 继承 | `CCBusiness<[Module]>` |
| 方法名 | `openMain()` / `removeMain()` |
| 打开界面 | `this.ent.addUi(ViewClass)`，返回 `Promise<Node \| null>` |
| 关闭界面 | `this.ent.removeUi(ViewClass)`，返回 `void` |

> **⚠️ 重要**：此文件由 MCP 工具自动生成。AI **绝对禁止**修改、删除或重命名。若文件已存在 → 完全忽略；若不存在 → 由 MCP 生成，AI 不主动创建。

---

## 5. ViewPrefab 管理 Business 元模板

### 5.1 强制元模板

```typescript
import { Node } from 'cc';
import { CCBusiness } from 'db://oops-framework/module/common/CCBusiness';
import { [Module] } from '../[Module]';
import { V_[Module]_Item } from '../view/V_[Module]_Item';

export class B_[Module]_ViewPrefab extends CCBusiness<[Module]> {
    /** 创建[Module]项预制体 */
    openItem(parent: Node): Promise<Node | null> {
        return this.ent.addPrefab(V_[Module]_Item, parent);
    }

    /** 移除[Module]项预制体 */
    removeItem(node: Node): void {
        this.ent.removePrefab(node);
    }
}
```

### 5.2 强制要求

| 检查项 | 要求 |
|--------|------|
| 方法名 | `openItem(parent)` / `removeItem(node)` |
| 创建预制体 | `this.ent.addPrefab(ViewClass, parent)` |
| 移除预制体 | `this.ent.removePrefab(node)` |

> **⚠️ 重要**：此文件由 MCP 工具自动生成。AI **绝对禁止**修改、删除或重命名。

---

## 6. ECS View 层元模板

### 6.1 强制元模板

```typescript
import { Node, _decorator } from 'cc';
import { gui } from 'db://oops-framework/core/gui/Gui';
import { LayerType } from 'db://oops-framework/core/gui/layer/LayerEnum';
import { ecs } from 'db://oops-framework/libs/ecs/ECS';
import { CCView } from 'db://oops-framework/module/common/CCView';
import { [Module] } from '../[Module]';
import { [Module]EventName } from '../[Module]Event';

const { ccclass, property } = _decorator;

@ccclass('VC_[Module]_[Name]')
@ecs.register('VC_[Module]_[Name]', false)
@gui.register('VC_[Module]_[Name]', { layer: LayerType.UI, prefab: 'gui/[module]/prefab/VC_[Module]_[Name]' })
export class VC_[Module]_[Name] extends CCView<[Module]> {
    // @property(SomeComponent)
    // private someComponent: SomeComponent = null!;

    onLoad() {
        super.onLoad();
        this.setWatch();
        this.setButton();
        // 初始化逻辑
    }

    private setWatch() {
        // this.watch([Module]EventName.[EventKey], this.on[EventName]UI, this);
    }

    //#region 事件处理
    // private on[EventName]UI<K extends [Module]EventName.[EventKey]>(event: K, data: I[Module]UI[Name]Data): void {
    //     // UI 更新逻辑
    // }
    //#endregion

    //#region 按钮事件
    // private onBtn[ButtonName](): void {
    //     // 按钮点击逻辑
    // }
    //#endregion

    reset(): void {
        // 清理自定义内存
    }
}
```

### 6.2 强制要求

| 检查项 | 要求 |
|--------|------|
| 继承 | 必须继承 `CCView<[Module]>` |
| ECS 装饰器 | `@ecs.register('VC_[Module]_[Name]', false)`，第二个参数必须是 `false` |
| GUI 装饰器 | `@gui.register('VC_[Module]_[Name]', { layer: LayerType.UI, prefab: 'gui/[module]/prefab/VC_[Module]_[Name]' })` |
| **layer 值** | 根据界面类型选择（详见下方 6.3 LayerType 选择指南） |
| onLoad() | 必须调用 `super.onLoad()`、`this.setWatch()`、`this.setButton()` |

### 6.3 LayerType 选择指南

| 界面类型 | LayerType 值 | 说明 | 示例 |
|----------|-------------|------|------|
| 主界面/功能页面 | `LayerType.UI` | 普通游戏界面，可多个同时存在 | 背包主界面、好友列表 |
| 弹窗/浮层 | `LayerType.PopUp` | 独立弹框，通常有关闭按钮 | 查询弹框、提示弹窗 |
| 模式对话框 | `LayerType.Dialog` | 需要用户响应的模态窗口 | 确认对话框、输入框 |
| 系统窗口 | `LayerType.System` | 系统级提示，最高层级 | 断线重连、系统公告 |

> **⚠️ 常见错误**：弹窗层必须使用 `LayerType.PopUp`，❌ 禁止使用 `LayerType.Pop`（不存在）。

| setWatch() | 所有 `watch()` 统一在此 |
| 按钮事件 | 方法名格式 `onBtn[按钮节点名]`，由 `setButton()` 自动绑定 |
| reset() | **必须实现**，只清理自定义内存 |
| 关闭视图 | 使用 `this.remove()`，❌ 禁止 `oops.gui.remove()` |
| @property | 必须使用 `= null!` 初始化 |
| 日志 | 使用 `oops.log.logView()` |

---

## 7. GameComponent 视图层元模板

### 7.1 强制元模板

```typescript
import { _decorator } from 'cc';
import { GameComponent } from 'db://oops-framework/module/common/GameComponent';

const { ccclass, property } = _decorator;

@ccclass('V_[Module]_[Name]')
export class V_[Module]_[Name] extends GameComponent {
    // @property(Label)
    // private labelName: Label = null!;

    protected data: any = {
        // 数据字段
    };

    /** 设置数据 - 必须包含，供外部设置数据 */
    setData(data: any) {
        // 数据赋值逻辑
    }

    /** 点击回调 - 方法名必须是 onNodeClick */
    private onNodeClick(): void {
        // 点击逻辑
    }

    /** 重置数据 */
    reset(): void {
        // 清理自定义内存
    }
}
```

### 7.2 强制要求

| 检查项 | 要求 |
|--------|------|
| 继承 | 必须继承 `GameComponent` |
| ECS 装饰器 | ❌ **禁止** `@ecs.register` |
| GUI 装饰器 | ❌ **禁止** `@gui.register` |
| Prefab 装饰器 | ✅ 需要 `@prefab.register`（如果作为预制体使用） |
| 点击事件 | 方法名**必须**是 `onNodeClick`（GameComponent 自动绑定） |
| setData() | 必须包含，供外部设置数据 |
| reset() | 必须实现 |

---

## 8. Event 层元模板

### 8.1 事件元模板（单文件模式）

```typescript
// [Module]Event.ts

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

### 8.2 强制要求

| 检查项 | 要求 |
|--------|------|
| 枚举 | 使用 `export enum [Module]EventName` |
| 枚举值 | 字符串值格式 `on[Module][Action]` |
| 数据接口 | 命名 `I[Module][Action]Data`，与枚举定义在同一文件 |
| 映射接口 | 命名 `I[Module]EventDataMap`，与枚举定义在同一文件 |
| declare global | **必须包含**，扩展 `OopsFramework.TypedEventMap` |
| 文件数量 | 事件枚举与事件数据合并为**单个文件** `[Module]Event.ts` |

---

## 9. 导入规范汇总

### 9.1 框架核心导入（值导入）

| 导入项 | 正确路径 |
|--------|----------|
| `ecs` | `db://oops-framework/libs/ecs/ECS` |
| `oops` | `db://oops-framework/core/Oops` |
| `CCEntity` | `db://oops-framework/module/common/CCEntity` |
| `CCBusiness` | `db://oops-framework/module/common/CCBusiness` |
| `classname` | `db://oops-framework/module/decorator/ClassNameDecorator` |
| `CCView` | `db://oops-framework/module/common/CCView` |
| `GameComponent` | `db://oops-framework/module/common/GameComponent` |
| `gui` | `db://oops-framework/core/gui/Gui` |
| `LayerType` | `db://oops-framework/core/gui/layer/LayerEnum` |
| `prefab` | `db://oops-framework/module/decorator/GamePrefabDecorator` |

### 9.2 导入规范

- 禁止未使用的导入
- 禁止假设性导入（"可能用到"）

---

## 10. 生成前自检清单

AI 生成每个文件前，必须逐项确认：

### Entity 层
- [ ] 继承 `CCEntity`
- [ ] `@ecs.register('[Module]')` 不带前缀
- [ ] Model 属性使用 `!` 断言
- [ ] `init()` 仅含组件注册

### Model 层
- [ ] 继承 `ecs.Comp`
- [ ] `@ecs.register('M_[Module]_Main')` 带 M_ 前缀
- [ ] 实现 `reset()`
- [ ] 仅声明用户要求的属性

### Business 层
- [ ] 继承 `CCBusiness<[Module]>`
- [ ] **必须**添加 `@classname('B_[Module]_[Name]')` 装饰器，名称与类名一致
- [ ] **watch 模式**：`init()` 调用 `setWatch()`，`watch()` 第三个参数是 `this`
- [ ] **setEvent 模式**：`init()` 调用 `this.event.setEvent(...)`，导入使用 `type I[Module]EventDataMap`
- [ ] 事件处理签名完全匹配元模板
- [ ] 使用 `this.event.emit()` 触发事件
- [ ] 删除所有未使用的导入

### ViewUI / ViewPrefab 层
- [ ] 继承 `CCBusiness<[Module]>`
- [ ] 方法名严格 `openMain` / `removeMain` / `openItem` / `removeItem`
- [ ] 使用 `this.ent.addUi()` / `this.ent.removeUi()`
- [ ] 使用 `this.ent.addPrefab()` / `this.ent.removePrefab()`

### ECS View 层
- [ ] 继承 `CCView<[Module]>`
- [ ] `@ecs.register('VC_[Module]_[Name]', false)`
- [ ] `@gui.register(...)`
- [ ] `onLoad()` 调用 `super.onLoad()` + `setWatch()` + `setButton()`
- [ ] 按钮事件名 `onBtn[按钮节点名]`
- [ ] 实现 `reset()`
- [ ] `@property` 使用 `= null!`

### GameComponent 层
- [ ] 继承 `GameComponent`
- [ ] ❌ 无 `@ecs.register`
- [ ] ❌ 无 `@gui.register`
- [ ] 有 `onNodeClick()`
- [ ] 有 `setData()`
- [ ] 有 `reset()`

### Event 层
- [ ] 枚举值格式 `on[Module][Action]`
- [ ] 包含 `declare global` 块
- [ ] `OopsFramework.TypedEventMap extends I[Module]EventDataMap`
- [ ] 事件枚举与事件数据在**同一文件** `[Module]Event.ts` 中
