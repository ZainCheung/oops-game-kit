---
name: "oops-guide-view"
description: "Oops Framework View 层编写规范。当用户需要创建界面、绑定按钮事件、处理 UI 更新时调用。"
triggers:
  keywords:
    - "View"
    - "界面"
    - "CCView"
    - "GameComponent"
    - "gui.register"
    - "prefab.register"
  patterns:
    - ".*View.*"
    - ".*界面.*"
    - ".*UI.*"
---

# Oops Framework View 层规范

## 使用说明

生成 View 层代码时，**必须**遵循以下流程：

1. 确定 View 类型：
   - 独立 UI 窗口/弹窗 → **ECS View** (`CCView`)
   - 列表项/格子项/图标 → **GameComponent**
2. 打开 `oops-rule-coding.md`，找到对应元模板（第 6 节 ECS View 或第 7 节 GameComponent）
3. 复制元模板，替换 `[Module]` 和 `[Name]` 占位符
4. 根据用户需求添加 `@property` 和按钮事件
5. 对照下方强制要求逐项检查

## ECS View 元模板（来自 oops-rule-coding.md 第 6 节）

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
        this.button.bind();
        // 初始化逻辑
    }

    private setWatch() {
        // this.event.setEvent([Module]EventName.[EventKey]);
    }

    //#region 事件处理
    //#endregion

    //#region 按钮事件
    // private [BtnName](): void {
    //     // 按钮点击逻辑
    // }
    //#endregion

    reset(): void {
        // 清理自定义内存
    }
}
```

## GameComponent 元模板（来自 oops-rule-coding.md 第 7 节）

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

## ECS View 强制要求

| 检查项 | 要求 |
|--------|------|
| 继承 | 必须继承 `CCView<[Module]>` |
| ECS 装饰器 | `@ecs.register('VC_[Module]_[Name]', false)`，第二个参数必须是 `false` |
| GUI 装饰器 | `@gui.register('VC_[Module]_[Name]', { layer: LayerType.UI, prefab: 'gui/[module]/prefab/VC_[Module]_[Name]' })` |
| **layer 值** | 根据界面类型选择（详见下方 LayerType 选择指南） |
| onLoad() | 必须调用 `super.onLoad()`、`this.setWatch()`、`this.button.bind()` |
| setWatch() | 使用 `this.event.setEvent()` 注册全局事件 |
| 按钮事件 | 方法名格式 `btn[按钮节点名]`，由 `this.button.bind()` 自动绑定 |
| reset() | **必须实现**，只清理自定义内存 |
| 关闭视图 | 使用 `this.remove()`，❌ 禁止 `oops.gui.remove()` |
| @property | 必须使用 `= null!` 初始化 |
| 日志 | 使用 `oops.log.logView()` |

### LayerType 选择指南

| 界面类型 | LayerType 值 | 说明 | 示例 |
|----------|-------------|------|------|
| 主界面/功能页面 | `LayerType.UI` | 普通游戏界面，可多个同时存在 | 背包主界面、好友列表 |
| 弹窗/浮层 | `LayerType.PopUp` | 独立弹框，通常有关闭按钮 | 查询弹框、提示弹窗 |
| 模式对话框 | `LayerType.Dialog` | 需要用户响应的模态窗口 | 确认对话框、输入框 |
| 系统窗口 | `LayerType.System` | 系统级提示，最高层级 | 断线重连、系统公告 |

> **⚠️ 常见错误**：弹窗层必须使用 `LayerType.PopUp`，❌ 禁止使用 `LayerType.Pop`（不存在）。

## GameComponent 强制要求

| 检查项 | 要求 |
|--------|------|
| 继承 | 必须继承 `GameComponent` |
| ECS 装饰器 | ❌ **禁止** `@ecs.register` |
| GUI 装饰器 | ❌ **禁止** `@gui.register` |
| Prefab 装饰器 | ✅ 需要 `@prefab.register`（如果作为预制体使用） |
| 点击事件 | 方法名**必须**是 `onNodeClick`（GameComponent 自动绑定） |
| setData() | 必须包含，供外部设置数据 |
| reset() | 必须实现 |

## 常见错误

```typescript
// ❌ 错误 - 使用 start() 而非 onLoad()
start() {  // 错误！应为 onLoad()
    this.setWatch();
}

// ❌ 错误 - 未调用 super.onLoad()
onLoad() {
    this.setWatch();  // 错误！缺少 super.onLoad()
}

// ❌ 错误 - 未调用 setButton()
onLoad() {
    super.onLoad();
    this.setWatch();  // 错误！缺少 this.button.bind()
}

// ❌ 错误 - 按钮事件名不规范
private onCloseButtonClick() { }  // 错误！应为 btnClose()

// ❌ 错误 - 未调用 this.button.bind()
private bindEvents() {
    this.btnClose.node.on(Node.EventType.TOUCH_END, this.btnClose, this);  // 禁止！应使用 this.button.bind()
}

// ❌ 错误 - 直接调用 oops.gui.remove()
oops.gui.remove('VC_Friend_Main');  // 错误！View 层应使用 this.remove()

// ❌ 错误 - View 层通过 Business 关闭自身（循环依赖）
this.ent.B_Friend_ViewUI.removeMain();  // 错误！View 层关闭自身应使用 this.remove()

// ❌ 错误 - GameComponent 使用 @ecs.register
@ecs.register('V_Friend_Item', false)  // 禁止！GameComponent 不需要 ECS 装饰器

// ❌ 错误 - 弹窗使用 LayerType.Pop（不存在）
@gui.register('VC_Friend_Search', { layer: LayerType.Pop, ... })  // 错误！应为 LayerType.PopUp

// ✅ 正确 - 弹窗使用 LayerType.PopUp
@gui.register('VC_Friend_Search', { layer: LayerType.PopUp, ... })  // 正确
```

## View 类型选择指南

| 场景 | 类型 | 继承 | 装饰器 |
|------|------|------|--------|
| 独立 UI 窗口/弹窗 | ECS View | `CCView<Module>` | `@ecs.register` + `@gui.register` |
| 列表项/格子项/图标 | GameComponent | `GameComponent` | `@ccclass` (+ `@prefab.register`) |

## 关联规范

- ECS View 元模板：`../rules/oops-rule-coding.md` 第 6 节
- GameComponent 元模板：`../rules/oops-rule-coding.md` 第 7 节
- 核心约束：`../rules/oops-rule-core.md` 第 4 章
- ViewUI 管理：`oops-guide-viewui`
