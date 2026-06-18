---
name: "oops-guide-viewui"
description: "Oops Framework ViewUI 视图管理规范。当用户需要打开/关闭界面、管理视图生命周期时调用。"
triggers:
  keywords:
    - "ViewUI"
    - "视图管理"
    - "打开界面"
    - "关闭界面"
    - "openUI"
    - "removeUI"
    - "oops.gui"
  patterns:
    - ".*ViewUI.*"
    - ".*视图管理.*"
    - ".*打开界面.*"
    - ".*关闭界面.*"
---

# Oops Framework ViewUI 管理规范

## 使用说明

生成 ViewUI 管理代码时，**必须**遵循以下流程：

1. 打开 `oops-rule-coding.md`，找到 **"4. ViewUI 管理 Business 元模板"**
2. 复制元模板，替换 `[Module]` 占位符
3. 对照下方强制要求逐项检查

> **⚠️ 重要**：此文件由 MCP 工具自动生成。AI **绝对禁止**修改、删除或重命名。若文件已存在 → 完全忽略；若不存在 → 由 MCP 生成，AI 不主动创建。

## 强制元模板（来自 oops-rule-coding.md）

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

## 强制要求

| 检查项 | 要求 |
|--------|------|
| 继承 | `CCBusiness<[Module]>` |
| 方法名 | `openMain()` / `removeMain()` |
| 打开界面 | `this.ent.addUi(ViewClass)`，返回 `Promise<Node \| null>` |
| 关闭界面 | `this.ent.removeUi(ViewClass)`，返回 `void` |
| 禁止 | ❌ 不在 ViewUI 中编写业务逻辑；❌ 不直接操作 Model |

> **⚠️ 重要**：此文件由 MCP 工具自动生成。AI **绝对禁止**修改、删除或重命名。

## 常见错误

```typescript
// ❌ 错误 - 在 ViewUI 中编写业务逻辑
openMain() {
    this.ent.addUi(VC_Friend_Main);
    this.ent.M_Friend_Main.loadData();  // 禁止！这是业务逻辑
}

// ❌ 错误 - 直接操作 Model
removeMain() {
    this.ent.removeUi(VC_Friend_Main);
    this.ent.M_Friend_Main.clear();  // 禁止！应在 B_Friend_Main 中处理
}

// ❌ 错误 - 使用 oops.gui.open() / oops.gui.remove()
openMain() {
    oops.gui.open('VC_Friend_Main');  // 禁止！应使用 this.ent.addUi()
}
```

## 关联规范

- 元模板定义：`../rules/oops-rule-coding.md` 第 4 节
- 核心约束：`../rules/oops-rule-core.md` 第 1 章、第 4 章
- View 层：`oops-guide-view`
