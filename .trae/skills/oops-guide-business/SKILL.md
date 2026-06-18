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
2. 复制元模板，替换 `[Module]` 占位符
3. 在 `setWatch()` 中注册所有需要监听的事件
4. 实现事件处理方法，**严格匹配签名格式**
5. 对照下方强制要求逐项检查

## 强制元模板（来自 oops-rule-coding.md）

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

## 强制要求

| 检查项 | 要求 |
|--------|------|
| 继承 | 必须继承 `CCBusiness<[Module]>` |
| init() | **必须**调用 `setWatch()` |
| setWatch() | 所有 `watch()` 统一在此，第三个参数必须是 `this` |
| 事件处理签名 | **必须完全匹配**：`private onXxx<K extends [Module]EventName.Xxx>(event: K, data: I[Module]EventDataMap[K]): void` |
| 触发事件 | 使用 `this.emit()` |
| 日志 | Business 层使用 `oops.log.logBusiness(msg, module)` |

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

// ❌ 错误 - 未调用 setWatch()
protected init() {
    // 忘记调用 this.setWatch()！
}

// ❌ 错误 - watch 第三个参数不是 this
this.watch(BackpackEventName.Use, this.onBackpackUse);  // 缺少 this！
```

## 关联规范

- 元模板定义：`../rules/oops-rule-coding.md` 第 3 节
- 核心约束：`../rules/oops-rule-core.md` 第 1 章、第 4 章
- 事件系统：`oops-guide-event`
