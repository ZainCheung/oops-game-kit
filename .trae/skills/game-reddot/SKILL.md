---
name: "game-reddot"
description: "Oops Framework 红点模块使用指南。当用户需要实现红点提示、红点树结构管理、红点显示绑定或红点确认逻辑时调用。涵盖红点添加、删除、更新、绑定、确认等完整流程。"
triggers:
  keywords:
    - "红点"
    - "reddot"
    - "RedDot"
    - "红点提示"
    - "红点树"
    - "红点绑定"
    - "红点确认"
    - "V_RedDot_View"
  patterns:
    - ".*红点.*"
    - ".*reddot.*"
    - ".*RedDot.*"
---

# Oops Framework 红点模块

本文档介绍 Oops Framework 的红点系统，包括红点树结构配置、红点显示绑定、红点数据更新和红点确认逻辑。

## 触发条件

**当用户需要以下操作时调用此技能**：
- 实现红点提示功能
- 配置红点树结构
- 绑定红点显示对象
- 更新红点数量
- 实现红点确认（已读）逻辑

**不匹配的情况**（使用其他技能）：

| 场景 | 推荐技能/文档 |
|------|--------------|
| 编码标准 | `../rules/oops-rule-coding.md` |
| 目录结构 | `../rules/oops-rule-structure.md` |

---

## 1. 模块架构

红点模块采用 ECS 架构，由以下文件组成：

```
reddot/
├── RedDot.ts                  # 红点模块入口（Entity）
├── RedDotEvent.ts             # 红点事件枚举与类型导出
├── RedDotEventData.ts         # 红点事件数据接口定义
├── bll/
│   ├── B_RedDot_Main.ts       # 红点核心逻辑（树结构、更新、绑定）
│   └── B_RedDot_Event.ts      # 红点事件驱动（添加、删除、更新、绑定、确认）
├── model/
│   ├── M_RedDot_Model.ts      # 红点数据模型
│   ├── enum/
│   │   └── EM_RedDot.ts       # 红点枚举（显示类型、存储名）
│   └── interface/
│       └── IM_RedDot_Node.ts  # 红点节点数据接口
└── view/
    └── V_RedDot_View.ts       # 红点视图组件
```

---

## 2. 红点树结构

红点采用**树形路径**组织，用 `/` 分隔层级关系：

```typescript
// 红点数据结构示例
{
    Root: 'Root',              // 根节点
    Demo: 'Root/Demo',         // 子节点
    Backpack: 'Root/Backpack', // 背包节点
    Prop1: 'Root/Backpack/Prop1' // 背包子节点
}
```

**规则**：
- 父节点的 count 是所有子节点 count 之和
- 更新子节点时，会自动向上冒泡更新所有父节点
- 路径必须从根节点开始，逐级声明

---

## 3. 红点显示类型 (EM_RedDotType)

```typescript
import { EM_RedDotType } from '../model/enum/EM_RedDot';

/** 红点显示类型 */
enum EM_RedDotType {
    Default = 0,  // 带数字红点
    Pure = 1,     // 纯红点（无数字）
    Note = 2      // 感叹号提示
}
```

---

## 4. 使用方法

### 4.1 配置红点树结构

在 `B_RedDot_Main.init()` 中配置红点树：

```typescript
protected init() {
    const model = this.ent.M_RedDot_Model;
    model.config = {
        Root: 'Root',
        Demo: 'Root/Demo',
        Backpack: 'Root/Backpack',
        Prop1: 'Root/Backpack/Prop1'
    };

    // 重复配置检查
    if (this.repeat(model.config)) {
        console.warn('【红点】配置数据重复，请检查');
    }

    // 初始化红点节点
    const keys = Object.keys(model.config);
    for (const key of keys) {
        const name = model.config[key];
        const info: IM_RedDot_Node = { path: name, count: 0, type: 0, node: null! };
        model.rdns.set(name, info);
    }
}
```

### 4.2 添加红点配置（动态）

通过事件动态添加红点节点：

```typescript
import { RedDotEventName } from '../RedDotEvent';

// 添加红点配置
this.emit(RedDotEventName.Add, { key: 'Mail', path: 'Root/Mail' });
```

### 4.3 删除红点配置

```typescript
this.emit(RedDotEventName.Remove, { key: 'Mail' });
```

### 4.4 更新红点数量

```typescript
// 直接赋值（assign=true，默认）：设置红点数量为 5
this.emit(RedDotEventName.Update, { key: 'Demo', count: 5, assign: true });

// 变化量（assign=false）：在当前数量基础上 +2
this.emit(RedDotEventName.Update, { key: 'Demo', count: 2, assign: false });

// 重置为 0
this.emit(RedDotEventName.Update, { key: 'Demo', count: 0, assign: true });
```

**注意**：如果该红点已被确认（confirm），更新事件会被忽略。

### 4.5 绑定红点显示对象

```typescript
import { EM_RedDotType } from '../model/enum/EM_RedDot';

// 绑定红点到节点，使用默认显示类型
this.emit(RedDotEventName.Bind, { key: 'Demo', node: this.node });

// 绑定红点到节点，指定显示类型
this.emit(RedDotEventName.Bind, {
    key: 'Demo',
    node: this.node,
    type: EM_RedDotType.Pure
});
```

### 4.6 红点确认（已读）

```typescript
// 确认红点并保存到本地存储（下次启动不会重复显示）
this.emit(RedDotEventName.Confirm, { key: 'Demo', save: true });

// 确认红点但不保存（仅当前会话有效）
this.emit(RedDotEventName.Confirm, { key: 'Demo', save: false });
```

### 4.7 获取红点数量

```typescript
// 通过 RedDot Entity 获取指定路径的红点数量
const count = this.ent.getCount('Root/Demo');
```

---

## 5. V_RedDot_View 红点视图组件

`V_RedDot_View` 是挂载在红点预制体上的组件，负责控制红点的显示逻辑。

### 5.1 静态绑定（检查器设置）

在编辑器中设置 `key` 和 `style` 属性，组件在 `onLoad` 时自动绑定：

```typescript
@ccclass('V_RedDot_View')
export class V_RedDot_View extends GameComponent {
    @property(Label) count: Label = null!;
    @property(CCString) key = '';      // 红点唯一关键字
    @property({ type: Style }) style = Style.Default;  // 红点样式
}
```

### 5.2 动态初始化

```typescript
// 动态创建红点时调用 init
const view = node.getComponent(V_RedDot_View)!;
view.init('Mail', 'Root/Mail');  // 自动添加配置并设置数量为1
```

### 5.3 红点确认（视图层）

```typescript
// 用户点击红点后确认
const view = this.node.getComponent(V_RedDot_View)!;
view.confirm(true);  // true = 保存到本地存储
```

### 5.4 自定义显示效果

重写 `setState` 方法自定义红点显示：

```typescript
setState(rdn: IM_RedDot_Node) {
    // 是否显示红点
    this.node.active = rdn.count > 0;

    switch (rdn.type) {
        case EM_RedDotType.Default:
            // 带数字红点，超过99显示99+
            this.count.string = rdn.count < 100 ? rdn.count.toString() : '99+';
            break;
        default:
            // 纯红点/感叹号，隐藏数字
            this.count.node.active = false;
            break;
    }

    // 通过 BhvFrameIndex 切换红点图标
    const bfi = this.node.getComponent(BhvFrameIndex);
    if (bfi) bfi.index = rdn.type;
}
```

---

## 6. 事件数据接口

| 事件 | 接口 | 字段 |
|------|------|------|
| `Add` | `IRedDotAddData` | `key: string`, `path: string` |
| `Remove` | `IRedDotRemoveData` | `key: string` |
| `Update` | `IRedDotUpdateData` | `key: string`, `count?: number`, `assign?: boolean` |
| `Bind` | `IRedDotBindData` | `key: string`, `node: Node`, `type?: EM_RedDotType` |
| `Confirm` | `IRedDotConfirmData` | `key: string`, `save: boolean` |

---

## 7. 完整使用示例

### 7.1 背包红点示例

```typescript
import { RedDotEventName } from 'db://.../reddot/RedDotEvent';
import { EM_RedDotType } from 'db://.../reddot/model/enum/EM_RedDot';

export class BackpackView extends Component {
    start() {
        // 1. 绑定红点显示对象到背包节点
        this.emit(RedDotEventName.Bind, {
            key: 'Backpack',
            node: this.backpackNode,
            type: EM_RedDotType.Default
        });

        // 2. 更新背包红点数量（服务器返回新道具）
        this.emit(RedDotEventName.Update, {
            key: 'Backpack',
            count: 3,
            assign: true
        });
    }

    /** 点击背包，确认红点 */
    onBackpackClick() {
        this.emit(RedDotEventName.Confirm, { key: 'Backpack', save: true });
    }
}
```

### 7.2 动态添加红点示例

```typescript
import { RedDotEventName } from 'db://.../reddot/RedDotEvent';

export class MailSystem {
    initMailRedDot() {
        // 动态添加邮件红点配置
        this.emit(RedDotEventName.Add, { key: 'Mail', path: 'Root/Mail' });

        // 绑定显示对象
        this.emit(RedDotEventName.Bind, {
            key: 'Mail',
            node: this.mailNode,
            type: EM_RedDotType.Pure
        });

        // 设置红点数量
        this.emit(RedDotEventName.Update, { key: 'Mail', count: 1 });
    }

    removeMailRedDot() {
        // 移除邮件红点配置
        this.emit(RedDotEventName.Remove, { key: 'Mail' });
    }
}
```

---

## 8. 最佳实践

### 8.1 使用建议

| 场景 | 推荐方法 | 说明 |
|------|----------|------|
| 固定红点结构 | `B_RedDot_Main.init()` 配置 | 游戏启动时初始化固定红点树 |
| 动态红点 | `RedDotEventName.Add` 事件 | 运行时动态添加/移除红点 |
| 带数字的红点 | `EM_RedDotType.Default` | 显示具体数量，超过99显示99+ |
| 纯提示红点 | `EM_RedDotType.Pure` | 只显示红点，不显示数字 |
| 永久确认 | `save: true` | 确认后保存到本地，重启不重复显示 |
| 临时确认 | `save: false` | 仅当前会话有效 |

### 8.2 注意事项

```typescript
// ✅ 推荐：路径必须从根节点开始逐级声明
model.config = {
    Root: 'Root',
    Backpack: 'Root/Backpack',
    Prop1: 'Root/Backpack/Prop1'
};

// ❌ 避免：跳过中间层级
model.config = {
    Root: 'Root',
    Prop1: 'Root/Backpack/Prop1'  // 缺少 Backpack 层级
};

// ✅ 推荐：确认红点时按需保存
this.emit(RedDotEventName.Confirm, { key: 'Mail', save: true });

// ❌ 避免：所有红点都保存确认状态
// 会导致本地存储膨胀，且动态红点不应持久化

// ✅ 推荐：更新数量时明确指定 assign 参数
this.emit(RedDotEventName.Update, { key: 'Demo', count: 5, assign: true });

// ❌ 避免：不指定 assign 导致歧义
this.emit(RedDotEventName.Update, { key: 'Demo', count: 5 });  // assign 默认 true，但不够明确

// ✅ 推荐：V_RedDot_View 组件的 key 与 config 中的 key 对应
// ❌ 避免：key 不匹配导致绑定失败
```

---

## 9. 关联技能

| 场景 | 推荐技能 |
|------|---------|
| Business 层编写 | `oops-guide-business` |
| Model 层编写 | `oops-guide-model` |
| View 层编写 | `oops-guide-view` |
| 事件系统 | `oops-guide-event` |
| 本地存储 | `oops-core-storage` |
