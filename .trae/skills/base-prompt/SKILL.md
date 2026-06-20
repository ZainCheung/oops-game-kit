---
name: "base-prompt"
description: "Oops Framework 提示弹窗模块使用指南。当用户需要实现Alert提示、Confirm确认、可跳过确认弹窗或网络错误提示时调用。涵盖4种弹窗类型的事件触发与数据配置。"
triggers:
  keywords:
    - "提示弹窗"
    - "prompt"
    - "Prompt"
    - "Alert"
    - "Confirm"
    - "确认弹窗"
    - "网络错误提示"
    - "PromptEventName"
  patterns:
    - ".*弹窗.*"
    - ".*prompt.*"
    - ".*Prompt.*"
    - ".*Alert.*"
    - ".*Confirm.*"
---

# Oops Framework 提示弹窗模块

本文档介绍 Oops Framework 的提示弹窗系统，包括 Alert 提示、Confirm 确认、可跳过确认和网络错误提示。

## 触发条件

**当用户需要以下操作时调用此技能**：
- 弹出 Alert 提示窗口
- 弹出 Confirm 确认窗口（带确认/取消）
- 弹出可跳过的 Confirm 确认窗口
- 弹出网络错误提示

**不匹配的情况**（使用其他技能）：

| 场景 | 推荐技能/文档 |
|------|--------------|
| 编码标准 | `../rules/oops-rule-coding.md` |
| 目录结构 | `../rules/oops-rule-structure.md` |
| 视图管理 | `oops-guide-viewui` |

---

## 1. 模块架构

提示弹窗模块采用 ECS 架构，由以下文件组成：

```
prompt/
├── Prompt.ts                  # 模块入口（Entity）
├── PromptEvent.ts             # 事件枚举与事件数据接口
└── bll/
    └── B_Prompt_Main.ts       # 核心业务逻辑（4种弹窗处理）
```

---

## 2. 事件类型 (PromptEventName)

```typescript
enum PromptEventName {
    Alert = 'onPromptAlert',           // Alert提示窗口
    Confirm = 'onPromptConfirm',       // Confirm确认窗口
    ConfirmSkip = 'onPromptConfirmSkip', // 可跳过的Confirm窗口
    NetError = 'onPromptNetError',     // 网络错误提示
}
```

---

## 3. 使用方法

### 3.1 Alert 提示窗口

弹出只有确认按钮的提示窗口：

```typescript
import { PromptEventName } from '../PromptEvent';

// 基础用法
this.emit(PromptEventName.Alert, {
    content: '操作成功！',
});

// 完整参数
this.emit(PromptEventName.Alert, {
    title: 'common_prompt_title',   // 窗口标题（多语言key，可选）
    content: '操作成功！',           // 提示内容
    okWord: 'common_prompt_ok',     // 确认按钮文本（多语言key，可选）
    onOk: () => {                   // 确认回调（可选）
        console.log('用户点击了确认');
    },
});
```

### 3.2 Confirm 确认窗口

弹出带确认和取消按钮的确认窗口：

```typescript
import { PromptEventName } from '../PromptEvent';

// 基础用法
this.emit(PromptEventName.Confirm, {
    content: '确定要退出游戏吗？',
    onOk: () => {
        console.log('确认退出');
    },
});

// 完整参数
this.emit(PromptEventName.Confirm, {
    title: 'common_prompt_title',       // 窗口标题（多语言key，可选）
    content: '确定要退出游戏吗？',       // 提示内容
    okWord: 'common_prompt_ok',         // 确认按钮文本（多语言key，可选）
    cancelWord: 'common_prompt_cancal', // 取消按钮文本（多语言key，可选）
    onOk: () => {                       // 确认回调（可选）
        console.log('确认');
    },
    onCancel: () => {                   // 取消回调（可选）
        console.log('取消');
    },
});
```

### 3.3 可跳过的 Confirm 窗口

弹出可勾选"不再提示"的确认窗口，跳过后自动执行确认回调：

```typescript
import { PromptEventName } from '../PromptEvent';

this.emit(PromptEventName.ConfirmSkip, {
    skipId: 'purchase_confirm',     // 跳过标识ID（必填，用于本地存储）
    title: 'common_prompt_title',   // 窗口标题（多语言key，可选）
    content: '确定要花费100钻石吗？', // 提示内容
    okWord: 'common_prompt_ok',     // 确认按钮文本（多语言key，可选）
    cancelWord: 'common_prompt_cancal', // 取消按钮文本（多语言key，可选）
    onOk: () => {                   // 确认回调（可选）
        console.log('确认花费');
    },
    onCancel: () => {               // 取消回调（可选）
        console.log('取消');
    },
    skipDay: 1,                     // 跳过天数（可选，默认1日）
});
```

**跳过逻辑**：
- 首次弹出窗口，用户可勾选"不再提示"
- 勾选后，`skipDay` 天内不再弹出，直接执行 `onOk` 回调
- 通过 `PromptSkip.isPrompt(skipId)` 检查是否需要弹窗

### 3.4 网络错误提示

弹出网络错误提示窗口：

```typescript
import { PromptEventName } from '../PromptEvent';

// 基础用法
this.emit(PromptEventName.NetError, {
    code: 1001,
});

// 完整参数
this.emit(PromptEventName.NetError, {
    code: 1001,                     // 错误码（必填）
    msg: '网络连接超时',             // 错误消息（可选，默认 'common_net_error'）
    onOk: () => {                   // 确认回调（可选）
        console.log('用户关闭了错误提示');
    },
});
```

---

## 4. 事件数据接口

| 事件 | 接口 | 必填字段 | 可选字段 |
|------|------|----------|----------|
| `Alert` | `IPromptAlertData` | `content` | `title`, `okWord`, `onOk` |
| `Confirm` | `IPromptConfirmData` | `content` | `title`, `okWord`, `cancelWord`, `onOk`, `onCancel` |
| `ConfirmSkip` | `IPromptConfirmSkipData` | `skipId`, `content` | `title`, `okWord`, `cancelWord`, `onOk`, `onCancel`, `skipDay` |
| `NetError` | `IPromptNetErrorData` | `code` | `msg`, `onOk` |

---

## 5. 弹窗预制体配置

弹窗预制体位于 `game_common` 包中：

| 弹窗类型 | 预制体路径 | 层级 |
|----------|-----------|------|
| Alert | `gui/window/prefab/PB_Alert` | `LayerType.Dialog` |
| Confirm | `gui/window/prefab/PB_Confirm` | `LayerType.Dialog` |
| ConfirmSkip | `gui/window/prefab/ConfirmSkip` | `LayerType.Dialog` |

所有弹窗均带遮罩层（`mask: true`）。

---

## 6. 完整使用示例

### 6.1 购买确认（可跳过）

```typescript
import { PromptEventName } from 'db://.../prompt/PromptEvent';

export class ShopBusiness {
    /** 购买道具 */
    buyProp(propId: number, price: number) {
        this.emit(PromptEventName.ConfirmSkip, {
            skipId: `buy_prop_${propId}`,
            content: `确定花费${price}钻石购买该道具吗？`,
            skipDay: 7,
            onOk: () => {
                this.doBuy(propId);
            },
        });
    }

    private doBuy(propId: number) {
        // 实际购买逻辑
    }
}
```

### 6.2 网络请求错误处理

```typescript
import { PromptEventName } from 'db://.../prompt/PromptEvent';

export class NetworkManager {
    /** 处理请求错误 */
    handleError(code: number, msg?: string) {
        this.emit(PromptEventName.NetError, {
            code,
            msg,
            onOk: () => {
                // 用户确认后重试或返回
                this.retryOrBack();
            },
        });
    }
}
```

### 6.3 退出游戏确认

```typescript
import { PromptEventName } from 'db://.../prompt/PromptEvent';

export class GameExitHandler {
    /** 退出游戏确认 */
    showExitConfirm() {
        this.emit(PromptEventName.Confirm, {
            content: '确定要退出游戏吗？',
            onOk: () => {
                // 退出游戏
                game.end();
            },
            onCancel: () => {
                // 取消，继续游戏
            },
        });
    }
}
```

---

## 7. 最佳实践

### 7.1 使用建议

| 场景 | 推荐方法 | 说明 |
|------|----------|------|
| 简单提示 | `PromptEventName.Alert` | 只需确认，无需取消 |
| 需要用户确认 | `PromptEventName.Confirm` | 带确认/取消双按钮 |
| 高频操作确认 | `PromptEventName.ConfirmSkip` | 允许用户跳过，减少打扰 |
| 网络异常 | `PromptEventName.NetError` | 统一的网络错误提示 |

### 7.2 注意事项

```typescript
// ✅ 推荐：content 使用明确的提示文案
this.emit(PromptEventName.Alert, { content: '道具数量不足' });

// ❌ 避免：content 为空或模糊
this.emit(PromptEventName.Alert, { content: '' });

// ✅ 推荐：ConfirmSkip 必须提供唯一的 skipId
this.emit(PromptEventName.ConfirmSkip, {
    skipId: 'delete_mail_confirm',
    content: '确定删除所有邮件？',
});

// ❌ 避免：skipId 重复或缺失
this.emit(PromptEventName.ConfirmSkip, {
    skipId: 'confirm',  // 太笼统，容易与其他弹窗冲突
    content: '确定删除所有邮件？',
});

// ✅ 推荐：title/okWord/cancelWord 使用多语言 key
this.emit(PromptEventName.Confirm, {
    title: 'common_prompt_title',
    content: '确定要退出吗？',
    okWord: 'common_prompt_ok',
    cancelWord: 'common_prompt_cancal',
});

// ❌ 避免：直接硬编码中文文本（不利于国际化）
this.emit(PromptEventName.Confirm, {
    title: '提示',
    content: '确定要退出吗？',
    okWord: '确定',
    cancelWord: '取消',
});

// ✅ 推荐：skipDay 根据业务场景合理设置
this.emit(PromptEventName.ConfirmSkip, {
    skipId: 'daily_gift',
    content: '领取每日礼包？',
    skipDay: 1,  // 每日礼包，1天跳过
});

// ❌ 避免：skipDay 设置过长
this.emit(PromptEventName.ConfirmSkip, {
    skipId: 'important_action',
    content: '确认删除账号？',
    skipDay: 365,  // 重要操作不应允许长时间跳过
});
```

---

## 8. 关联技能

| 场景 | 推荐技能 |
|------|---------|
| Business 层编写 | `oops-guide-business` |
| 事件系统 | `oops-guide-event` |
| 视图管理 | `oops-guide-viewui` |
| 本地存储 | `oops-core-storage` |
