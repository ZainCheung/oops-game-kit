---
name: "oops-guide-business"
description: "Oops Framework Business 层编写规范。当用户需要编写业务逻辑、事件监听、数据操作时调用。"
triggers:
  keywords:
    - "Business"
    - "业务逻辑"
    - "CCBusiness"
    - "bll"
    - "业务层"
    - "setWatch"
    - "setEvent"
    - "init()"
  patterns:
    - ".*Business.*"
    - ".*业务.*"
    - ".*业务逻辑.*"
---

# Oops Framework Business 层规范

## 使用说明

生成 Business 层代码时，**必须**遵循以下流程：

1. 打开 `oops-rule-coding.md`，找到 **"3. Business 层元模板"**
2. **根据场景选择模板**：
   - **watch 模式（3.1）**：Business 需要主动监听其他模块事件
   - **setEvent 模式（3.1b）**：Business 通过全局事件分发被触发
3. 复制元模板，替换 `[Module]` 占位符
4. 实现事件处理方法，**严格匹配签名格式**
5. 对照下方强制要求逐项检查

## 模式一：watch 模式（3.1）

> **适用场景**：Business 需要监听其他模块事件并响应（如监听数据变化、跨模块通知）。

```typescript
import { CCBusiness } from 'db://oops-framework/module/common/CCBusiness';
import { [Module] } from '../[Module]';
import { [Module]EventName, I[Module]EventDataMap } from '../[Module]Event';

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

## 模式二：setEvent 模式（3.1b）

> **适用场景**：Business 通过全局事件分发被触发（如 Prompt 弹窗、红点事件驱动、账号全局事件等），使用 `this.event.setEvent()` 注册事件，框架自动路由到同名处理方法。

```typescript
import { CCBusiness } from 'db://oops-framework/module/common/CCBusiness';
import { [Module] } from '../[Module]';
import { [Module]EventName, type I[Module]EventDataMap } from '../[Module]Event';

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

## 两种模式对比

| 对比项 | watch 模式（3.1） | setEvent 模式（3.1b） |
|--------|-------------------|----------------------|
| 注册方式 | `this.watch(EventName, handler, this)` | `this.event.setEvent(EventName1, EventName2, ...)` |
| 路由方式 | 手动指定回调函数 | 框架按事件名自动路由到 `onXxx` 方法 |
| 适用场景 | 主动监听其他模块事件 | 被动响应全局事件分发 |
| 典型命名 | `B_[Module]_Main` | `B_[Module]_Event`、`B_Prompt_Main` |
| 导入风格 | `I[Module]EventDataMap`（值导入） | `type I[Module]EventDataMap`（type 导入） |

## 强制要求

| 检查项 | watch 模式 | setEvent 模式 |
|--------|-----------|--------------|
| 继承 | 必须继承 `CCBusiness<[Module]>` | 必须继承 `CCBusiness<[Module]>` |
| init() | **必须**调用 `setWatch()` | **必须**调用 `this.event.setEvent(...)` |
| 事件注册 | `setWatch()` 中统一 `watch()`，第三个参数必须是 `this` | `this.event.setEvent()` 传入所有事件枚举 |
| 事件处理签名 | 完全匹配（见下方） | 完全匹配（见下方） |
| 触发事件 | 使用 `this.event.emit()` | 使用 `this.event.emit()` |
| 日志 | `oops.log.logBusiness(msg, module)` | `oops.log.logBusiness(msg, module)` |
| 导入风格 | `I[Module]EventDataMap`（值导入） | `type I[Module]EventDataMap`（type 导入） |

## 事件触发 API 说明

`CCBusiness` 提供两种事件触发方式，**必须使用新版 API**：

| API | 状态 | 说明 |
|-----|------|------|
| `this.event.emit()` | ✅ 推荐使用 | 新版 API，通过事件模块触发 |
| `this.emit()` | ❌ 已废弃 | 旧版兼容 API（`@deprecated`），内部仍调用 `this.event.emit()` |

> **⚠️ 原因**：`this.emit()` 是旧版兼容方法，已标记 `@deprecated`，未来版本可能移除。所有事件触发统一使用 `this.event.emit()`，与 `this.event.watch()`、`this.event.setEvent()` 等保持一致。

```typescript
// ✅ 正确 - 使用新版 API
this.event.emit(SdkEventName.Show, res);

// ❌ 错误 - 使用已废弃的旧版 API
this.emit(SdkEventName.Show, res);
```

## 事件处理方法签名（绝对禁止变形）

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

## 常见错误

```typescript
// ❌ 错误 - 事件处理签名变形
private onBackpackUse(data: IBackpackEventDataMap[BackpackEventName.Use]): void  // 缺少 event: K

// ❌ 错误 - 使用 keyof
private onBackpackUse<K extends keyof IBackpackEventDataMap>(event: K, data: IBackpackEventDataMap[K]): void

// ❌ 错误 - watch 模式未调用 setWatch()
protected init() {
    // 忘记调用 this.setWatch()！
}

// ❌ 错误 - watch 第三个参数不是 this
this.watch(BackpackEventName.Use, this.onBackpackUse);  // 缺少 this！

// ❌ 错误 - setEvent 模式使用 this.setEvent() 而非 this.event.setEvent()
this.setEvent(RedDotEventName.Add);  // 应为 this.event.setEvent()

// ❌ 错误 - setEvent 模式导入未使用 type
import { IRedDotEventDataMap } from '../RedDotEvent';  // 应为 type IRedDotEventDataMap

// ❌ 错误 - 使用已废弃的 this.emit() 而非 this.event.emit()
this.emit(BackpackEventName.UIUpdate, data);  // 应为 this.event.emit()
```

## 关联规范

- 元模板定义：`../rules/oops-rule-coding.md` 第 3 节
- 核心约束：`../rules/oops-rule-core.md` 第 1 章、第 4 章
- 事件系统：`oops-guide-event`
