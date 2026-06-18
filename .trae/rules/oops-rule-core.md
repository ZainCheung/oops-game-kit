---
alwaysApply: true
---

# Oops Framework - 核心强制约束与工作流

本文档定义 AI 在生成代码时的**绝对强制约束**和**标准开发流程**。违反任何一条即视为不合格代码。

> **绝对优先级**：本文档的约束**高于**所有其他规则、技能和示例代码。当本文档与任何其他规范冲突时，**以本文档为准**。两个规则冲突时，以**更严格**的为准。
>
> **生成原则**：AI 必须**先加载 `oops-rule-coding.md` 中的对应元模板 → 替换占位符 → 填充业务逻辑**，禁止凭记忆自由编写。

---

## 1. AI 行为红线

### [强制性] 1.1 不生成未使用的代码

```typescript
// ❌ 绝对禁止 - 用户没有提到的功能/属性/装饰器，就不要生成
protected [用户未提的功能开关] = true;     // 用户没提到此功能

protected [用户未提的属性]: any = null;    // 用户没提到此属性

@property([用户未提的组件类型])
private [用户未提的节点名]: [类型] = null!;  // 用户没提到这个节点！
```

**判定标准**：如果删除某行代码后，剩余代码仍能完整实现用户描述的功能，则该行代码是**未使用的**。未使用的代码**必须删除**，不管它"以后可能有用"。

### [强制性] 1.2 不添加用户未要求的方法

**判定标准**：如果用户没有明确提到某个功能、按钮、事件或操作，AI **绝对禁止**为其生成对应的处理方法。

```typescript
// ❌ 绝对禁止 - 用户只说"[功能A]"，不要预设"[功能B]""[功能C]"等方法
private on[用户未提的功能]Click() { ... }
private on[用户未提的操作]Event() { ... }
```

**常见违规场景**：
- 用户要求"显示列表" → AI 自动生成"刷新""删除""编辑"按钮事件
- 用户要求"打开界面" → AI 自动生成"关闭动画""切换标签"方法
- 用户要求"发送请求" → AI 自动生成"重试""取消""缓存"逻辑

### [强制性] 1.3 不预设"未来可能用到"的属性

```typescript
// ❌ 绝对禁止 - 用户没提到的属性/状态不要声明
private [用户未提的属性]: [类型] = [默认值];  // 用户没说需要此属性
private [用户未提的状态]: boolean = false;   // 用户没说需要此状态
```

### [强制性] 1.4 精准修改原则

当修改已有文件时：
- **禁止"改进"相邻代码** — 不要重构没有损坏的东西
- **禁止修改无关注释或格式** — 只修改与需求直接相关的部分
- **必须匹配现有风格** — 即使你会用不同的方式编写
- **删除变更导致的孤立代码** — 删除你的更改导致未使用的导入/变量/函数

**测试标准**：每一行更改都应该能直接追溯到用户的请求。

### [强制性] 1.5 死代码处理规则

| 场景 | 处理方式 |
|------|----------|
| 你的更改导致某导入/变量/函数不再使用 | ✅ **必须删除** |
| 预先存在的死代码（与你本次修改无关） | ⚠️ **提及但不删除**（除非用户明确要求清理）|

### [强制性] 1.6 禁止生成未使用的导入

**AI 必须在生成代码时确保每个导入都被实际使用，禁止为了"可能用到"而导入。**

```typescript
// ❌ 绝对禁止 - 导入后从未使用
import { oops } from 'db://oops-framework/core/Oops';  // 文件中没有任何地方使用 [导入项]
import { ecs } from 'db://oops-framework/libs/ecs/ECS'; // 文件中没有任何地方使用 [导入项]

// ✅ 正确 - 只导入实际使用的模块
import { CCBusiness } from 'db://oops-framework/module/common/CCBusiness';
import { [Module] } from '../[Module]';
```

**判定标准**：如果删除某个 `import` 语句后，代码仍然可以完整编译和运行，则该导入是**未使用的**。未使用的导入**必须删除**。

### [强制性] 1.7 禁止调用不存在的方法

**AI 必须确保调用的每个方法都真实存在于目标类或框架中，禁止凭记忆或假设编造方法名。**

```typescript
// ❌ 绝对禁止 - 调用不存在的方法
reset() {
    this.unwatchAll();  // ❌ [目标类] 不存在 [方法名]() 方法！框架自动管理事件释放
}

// ❌ 绝对禁止 - 假设存在的方法
this.ent.B_[Module]_Main.[未定义的方法](id);  // ❌ 如果 Business 层没有公开此方法，禁止调用！

// ✅ 正确 - 只调用确认存在的方法
this.emit([Module]EventName.[EventKey], { [字段]: data.[字段] });  // ✅ emit 是 CCBusiness/CCView 的确认方法
this.ent.B_[Module]_ViewUI.removeMain();  // ✅ 由 MCP 生成的视图管理类，方法已确认存在
```

**常见陷阱**：
- `this.unwatchAll()` — **不存在**。框架在组件销毁时自动释放事件监听，无需手动调用。
- `this.ent.add(ViewClass)` — **不存在**。正确的是 `this.ent.addUi(ViewClass)` 或 `this.ent.addPrefab(ViewClass, parent)`。
- `this.ent.B_XXX.someMethod()` — **必须确认**。如果 Business 层没有定义该方法，禁止在 View 层调用。

**规则**：
1. 调用任何方法前，必须先确认该方法在目标类中已定义。
2. 如果不确定某个方法是否存在，**禁止猜测**，应查阅框架文档或询问用户。
3. 框架自动管理的功能（如事件释放、按钮解绑）**禁止手动调用释放方法**。

---

## 2. 决策询问原则（模糊即停，确认再行）

### [强制性] 2.1 遇到多方案选择时必须询问

当用户需求存在以下模糊性时，**必须**使用 AskUserQuestion 工具询问开发者，禁止擅自选择：

| 模糊类型 | 示例 | 必须询问 |
|---------|------|---------|
| 功能范围不确定 | "做一个背包系统" → 是否包含整理、排序、批量操作？ | 必须询问 |
| 交互方式未明确 | "点击好友打开详情" → 是弹窗还是跳转新界面？ | 必须询问 |
| 数据结构未定义 | "显示玩家信息" → 需要显示哪些字段？ | 必须询问 |
| 业务规则缺失 | "购买道具" → 是否有数量限制、冷却时间？ | 必须询问 |
| 视觉层级未说明 | "主界面有列表" → 列表项是简单文本还是复杂卡片？ | 必须询问 |
| 技术方案不唯一 | Model 层用一个 Model 还是多个？ | 必须询问 |
| 事件设计有歧义 | 一个事件还是多个事件？ | 必须询问 |
| 数据流方向不明 | 主动拉取还是被动推送？ | 必须询问 |

### [强制性] 2.2 询问时必须提供选项

询问时**禁止**只抛出问题让开发者自由回答，必须提供：
1. **2-4 个明确的选项**
2. **每个选项的优缺点说明**
3. **AI 的最佳推荐及理由**

### [强制性] 2.3 开发过程中的决策点同样要询问

在代码生成过程中，如果发现同类决策性问题（如需要新增一个未提及的方法、需要假设某种数据结构），**必须**暂停生成，回头询问开发者。

禁止为了"保持流畅"而擅自假设。

### [强制性] 2.4 决策确认后才能继续

**只有所有关键决策都得到开发者确认后，才能进入 MCP 创建文件阶段。**

在代码生成阶段，如果遇到以下情况也必须暂停：
- 发现用户需求中未提及但需要假设的属性/方法
- 发现多个等价的实现方案（如一种事件 vs 多种事件）
- 发现需要补充的业务规则才能继续编码
- 发现 UI 交互细节缺失（如按钮点击后的反馈方式）

**处理方式**：停止当前文件生成，使用 AskUserQuestion 询问，得到答复后继续。

---

## 3. 强制代码生成顺序

### [强制性] 3.1 三层代码生成顺序

生成模块代码时，**严禁跳过或逆序**，必须按以下顺序执行：

| 层级 | 顺序 | 文件类型 |
|------|------|----------|
| **第1层：数据层 (Model)** | 1 | Entity 文件（模块实体定义） |
| | 2 | Model 文件（数据模型定义） |
| | 3 | Enum 文件（枚举定义） |
| | 4 | Type 文件（类型定义） |
| | 5 | Interface 文件（接口定义） |
| | 6 | Config 文件（配置定义） |
| **第2层：业务层 (Business)** | 7 | Event 文件（事件定义） |
| | 8 | EventData 文件（事件数据定义） |
| | 9 | Business 文件（业务逻辑实现） |
| | 10 | System 文件（系统逻辑实现） |
| **第3层：显示层 (View)** | 11 | View 文件（界面视图实现） |
| | 12 | ViewPrefab 文件（预制体视图实现） |

### [强制性] 3.2 生成原则

- **必须先实现数据层，再实现业务层，最后实现显示层**
- **严禁跳过数据层直接实现业务层或显示层**
- **严禁先实现显示层再回头补数据层**
- **一次性正确**：类名、继承、导入、装饰器、方法全部一次性正确
- **禁止分步修正**：不再使用 SearchReplace 逐步修正
- **对照元模板生成**：严格对照 `oops-rule-coding.md` 中的元模板生成，不凭记忆
- **不确定时询问**：遇到不确定的问题，不要自作主张，应提示开发者补充信息

---

## 4. API 使用与视图管理

### [强制性] 4.1 禁止在 View 层直接调用底层 API

**View 层禁止直接调用（应通过 Business 层）**：

| API | 状态 | 说明 |
|-----|------|------|
| `oops.gui.open(string)` | ❌ 禁止 | 存在，但禁止在 View 层直接调用 |
| `oops.gui.remove(string)` | ❌ 禁止 | 存在，但禁止在 View 层直接调用 |
| `instantiate(this.prefab)` | ❌ 禁止 | View 层禁止自行实例化预制体 |
| `this.ent.add(ViewClass)` | ❌ 不存在 | 不存在此方法，应使用 `this.ent.addUi(ViewClass)` |

**已确认可用的 API（View 层使用）**：

| API | 使用场景 | 示例 |
|-----|----------|------|
| `this.remove()` | View 关闭自身 | `this.remove();` |
| `this.ent.B_[Module]_ViewUI.openMain()` | 打开 UI 主界面 | `this.ent.B_[Module]_ViewUI.openMain();` |
| `this.ent.B_[Module]_ViewUI.removeMain()` | 关闭 UI 主界面 | `this.ent.B_[Module]_ViewUI.removeMain();` |
| `this.ent.B_[Module]_ViewUI.openDetail()` | 打开 UI 详情界面 | `this.ent.B_[Module]_ViewUI.openDetail();` |

**已确认可用的 API（Business 层使用）**：

| API | 使用场景 | 示例 |
|-----|----------|------|
| `this.ent.addUi(ViewClass)` | Business 层添加 UI | `this.ent.addUi(VC_[Module]_Main);` |
| `this.ent.removeUi(ViewClass)` | Business 层移除 UI | `this.ent.removeUi(VC_[Module]_Main);` |
| `this.ent.addPrefab(ViewClass, parent)` | Business 层添加预制体 | `this.ent.addPrefab(V_[Module]_[Name], parent);` |
| `this.ent.removePrefab(node)` | Business 层移除预制体 | `this.ent.removePrefab(node);` |
| `this.emit(EventName, data)` | 触发事件 | `this.emit([Module]EventName.[EventKey], { [字段], [字段] });` |
| `this.watch(EventName, callback, this)` | 监听事件 | `this.watch([Module]EventName.[EventKey], this.on[方法名], this);` |
| `oops.log.logBusiness(msg, module)` | Business 层日志 | `oops.log.logBusiness('[日志内容]', '[模块名]');` |
| `oops.log.logView(msg)` | View 层日志 | `oops.log.logView('[日志内容]');` |

**API 使用决策树**：
```
需要操作界面？
    │
    ├─ View 层需要关闭自身 ──► this.remove()
    │
    ├─ View 层需要打开其他界面 ──► this.ent.B_[Module]_ViewUI.open{ViewName}()
    │
    ├─ View 层需要创建预制体 ──► this.ent.B_[Module]_ViewPrefab.open{PrefabName}(parent)
    │
    ├─ Business 层需要打开界面 ──► this.ent.addUi(ViewClass)
    │
    ├─ Business 层需要创建预制体 ──► this.ent.addPrefab(ViewClass, parent)
    │
    └─ 不确定？ ──► 询问用户，禁止猜测
```

### [强制性] 4.2 按钮事件必须用 setButton()

```typescript
// ❌ 绝对禁止 - 手动绑定按钮事件
private bindEvents() {
    this.[按钮节点名]?.node.on(Node.EventType.TOUCH_END, this.[方法名], this);
}

// ✅ 正确
onLoad() {
    super.onLoad();
    this.setWatch();
    this.setButton();  // 自动监听所有按钮
}

/** [按钮描述] - 按钮事件方法名格式：onBtn + 按钮节点名 */
private onBtn[按钮节点名](): void { ... }
```

**按钮事件命名规范**：
- **按钮事件**（由 `setButton()` 自动绑定）：`onBtn[按钮节点名]`（如 `onBtnClose`、`onBtnSearch`）
- **普通方法**：`on[动作/事件]`（如 `onRefresh`、`onDataUpdate`）

**禁止在 reset()/onDestroy() 中手动解绑按钮事件** — 框架自动管理。

### [强制性] 4.3 reset() 与 onDestroy() 职责说明

**核心原则**：
- `reset()` 是 **ECS 生命周期方法**，实体被销毁时由框架自动调用
- `onDestroy()` 是 **Cocos 引擎生命周期方法**，节点销毁时调用
- **如果类中已实现 `reset()`，则不需要再实现 `onDestroy()`** — 两者作用相同，都是清理自定义内存

```typescript
// ❌ 绝对禁止 - reset() 中手动解绑事件（框架自动释放）
reset() {
    this.unwatchAll();  // 框架会自动释放事件监听
}

// ❌ 错误 - 重复清理（有 reset 就不需要 onDestroy）
reset() {
    this.props = null!;
}

onDestroy() {
    this.props = null!;  // 重复！reset() 已经清理过了
    super.onDestroy();
}

// ✅ 正确 - 只在 reset() 中清理自定义内存
reset() {
    // 只清理当前类中自定义的内存内容
    this.myCustomMap.clear();
    this.props = null!;
}
```

**规则**：
1. ECS 组件（Entity/Model/Business/View）**优先使用 `reset()`** 清理内存
2. 只有纯 Cocos 组件（非 ECS）才需要使用 `onDestroy()`
3. **禁止在 reset() 中调用 `this.unwatchAll()`** — 框架会自动释放事件监听

### [强制性] 4.4 View 层必须通过 Business 操作界面

```typescript
// ❌ 绝对禁止 - View 层直接操作
oops.gui.open('VC_[Module]_[Name]');     // 禁止直接调用！
this.ent.add(VC_[Module]_[Name]);        // 不存在此方法！
instantiate(this.[预制体属性]);            // 禁止自行实例化！

// ✅ 正确 - 通过 Business 操作
this.ent.B_[Module]_ViewUI.open[ViewName]();
```

### [强制性] 4.5 MCP 生成的视图管理文件绝对禁止 AI 修改

`B_[Module]_ViewUI.ts` 和 `B_[Module]_ViewPrefab.ts` 由 MCP 工具自动生成，包含视图管理的标准 API。**AI 绝对禁止修改、删除、重命名这些文件中的任何代码**。

**AI 看到这两个文件时的处理原则**：
- 如果文件已存在 → **完全忽略，不做任何修改**
- 如果文件不存在 → 由 MCP 工具生成，AI 不主动创建

```typescript
// ❌ 绝对禁止 - 删除 MCP 生成的文件
// B_[Module]_ViewUI.ts  ← 禁止删除！

// ❌ 绝对禁止 - 修改方法名
class B_[Module]_ViewUI {
    [错误的方法名]() { ... }  // ❌ 错误！必须是 openMain()
}

// ❌ 绝对禁止 - 在 Business 中内联替代这个类
class B_[Module]_Main extends CCBusiness<[Module]> {
    View: B_[Module]_ViewUI = new B_[Module]_ViewUI(this.ent);  // ❌ 禁止内联！
}

// ✅ 正确 - 保留 MCP 生成的文件，直接使用其 API
this.ent.B_[Module]_ViewUI.openMain();
this.ent.B_[Module]_ViewUI.removeMain();
```

### [强制性] 4.6 MCP 生成的视图管理文件列表

以下两个视图管理 Business 文件**由 MCP 工具自动生成**，AI **绝对禁止修改、删除或重命名**其中的任何代码：

| 文件 | 职责 | 核心 API |
|------|------|----------|
| `B_[Module]_ViewUI.ts` | UI 界面管理 | `openMain()` / `removeMain()` / `openDetail()` / `removeDetail()` |
| `B_[Module]_ViewPrefab.ts` | 预制体管理 | `openA(parent)` / `removeA(node)` / `openItem(parent)` / `removeItem(node)` |

**使用方式**：需要打开/关闭界面或创建/销毁预制体时，**直接调用对应组件的 API**，禁止在 Entity 或其他 Business 中内联实现相同逻辑。

```typescript
// ✅ 正确 - View 层通过 Business 调用
this.ent.B_[Module]_ViewUI.openMain();
this.ent.B_[Module]_ViewUI.removeMain();
this.ent.B_[Module]_ViewPrefab.openA(this.node);
this.ent.B_[Module]_ViewPrefab.removeA(itemNode);

// ❌ 绝对禁止 - AI 修改 MCP 生成的视图管理文件（B_[Module]_ViewUI.ts / B_[Module]_ViewPrefab.ts）
// ❌ 绝对禁止 - 在 Entity 中内联实现 openMain() 逻辑
// ❌ 绝对禁止 - 删除 B_[Module]_ViewUI.ts 或 B_[Module]_ViewPrefab.ts
```

---

## 5. Entity 层绝对禁止包含业务逻辑

### [强制性] 5.1 Entity 是模块入口，禁止编写业务方法

Entity（实体）的职责是**作为模块入口注册和管理各层组件**，**绝对禁止**在 Entity 中编写任何业务逻辑方法或视图操作方法。

```typescript
// ❌ 绝对禁止 - Entity 中编写业务方法
@ecs.register('[Module]')
export class [Module] extends CCEntity {
    // ❌ 错误！业务方法必须写在 Business 层
    [业务方法名]([参数]): [返回类型] {
        return this.M_[Module]_Main.[属性].[方法]([参数]);
    }

    // ❌ 错误！视图操作必须写在 View 层或调用 Business 层
    [视图操作方法名](): void {
        this.B_[Module]_ViewUI.openMain();
    }
}

// ✅ 正确 - Entity 只负责注册组件，不包含任何业务逻辑
@ecs.register('[Module]')
export class [Module] extends CCEntity {
    M_[Module]_Main!: M_[Module]_Main;
    B_[Module]_Main!: B_[Module]_Main;
    B_[Module]_ViewUI!: B_[Module]_ViewUI;
    B_[Module]_ViewPrefab!: B_[Module]_ViewPrefab;

    protected init() {
        this.addComponents(M_[Module]_Main);
        this.addBusinesss(B_[Module]_Main, B_[Module]_ViewUI, B_[Module]_ViewPrefab);
    }
}
```

### [强制性] 5.2 业务逻辑归属判定

| 方法类型 | 正确归属 | 错误归属 |
|----------|----------|----------|
| 数据处理、验证、流程控制 | Business 层 (`B_[Module]_Main`) | ❌ Entity |
| 界面打开/关闭 | `B_[Module]_ViewUI` / `B_[Module]_ViewPrefab` | ❌ Entity |
| 数据存储、状态管理 | Model 层 (`M_[Module]_Main`) | ❌ Entity |
| 用户交互、UI 更新 | View 层 (`VC_[Module]_Main`) | ❌ Entity |

### [强制性] 5.3 使用方式

需要使用业务功能时，**调用对应层组件的 API**，而不是在 Entity 中封装：

```typescript
// ✅ 正确 - 直接调用 Business 层 API
this.ent.B_[Module]_Main.[业务方法]([参数]);

// ✅ 正确 - 直接调用视图管理 Business API
this.ent.B_[Module]_ViewUI.openMain();
this.ent.B_[Module]_ViewPrefab.openA(parentNode);

// ✅ 正确 - 直接访问 Model 数据（只读场景）
const [数据] = this.ent.M_[Module]_Main.[属性].get([键]);

// ❌ 绝对禁止 - 在 Entity 中封装一层再调用
// Entity 中：[方法名]([参数]) { this.B_[Module]_Main.[业务方法]([参数]); }
// 外部调用：this.ent.[方法名]([参数]);  ← 错误！
```

---

## 6. 属性初始化风格

### [强制性] 6.1 @property 属性必须使用 `null!` 初始化

所有使用 `@property` 装饰器的属性，**必须**使用 `null!` 进行初始化。

```typescript
// ✅ 正确
@property([组件类型])
private [属性名]: [组件类型] = null!;

// ❌ 错误 - 必须初始化
@property([组件类型])
private [属性名]: [组件类型];

// ❌ 错误 - 禁止使用 = null（不含 !）
@property([组件类型])
private [属性名]: [组件类型] = null;

// ❌ 错误 - 禁止使用联合类型
@property([组件类型])
private [属性名]: [组件类型] | null = null;

// ❌ 错误 - 禁止使用可选标记
@property([组件类型])
private [属性名]?: [组件类型];
```

**原因**：Cocos Creator 的 `@property` 会在编辑器中自动赋值；`null!` 告诉 TypeScript "这个值不会为 null，相信我"；避免在代码中到处写非空断言（`!`）。

---

## 7. 日志原则

### [强制性] 7.1 禁止在 Business/View 中使用 console.log

```typescript
// ❌ 绝对禁止
console.log('[日志内容]');

// ✅ 正确 - Business 层
oops.log.logBusiness('[日志内容]', '[模块名]');

// ✅ 正确 - View 层
oops.log.logView('[日志内容]');
```

---

## 8. 验证闭环

### [强制性] 8.1 AI 直接生成完整代码

```typescript
// ✅ 正确 - AI 直接生成完整规范代码并写入
Write(filePath, "完整代码内容");
```

**工作流**：
1. MCP 仅按需创建空文件
2. AI 直接生成符合规范的完整代码（一次性写入）
3. Validator 验证

### [强制性] 8.2 禁止跳过验证步骤

代码生成后**必须**：
- [ ] 检查每个导入是否被实际使用
- [ ] 检查类名、继承、装饰器是否符合元模板
- [ ] 检查方法签名是否完全匹配（尤其是事件处理）
- [ ] 检查 `declare global` 是否存在（EventData 文件）
- [ ] 检查 `@property` 是否使用 `= null!`
- [ ] 检查是否包含未使用的代码/方法/属性
- [ ] 每一行变更是否能追溯到用户请求？

### [强制性] 8.3 元模板生成检查流程

AI 生成每个文件时，必须执行以下思维链：

```
1. 确定文件类型（Entity/Model/Business/View/Event...）
2. 打开 oops-rule-coding.md，找到对应元模板
3. 复制元模板到思维中
4. 替换所有 [Module]/[Name] 占位符
5. 根据用户需求填充业务逻辑
6. 对照"生成前自检清单"逐项检查
7. 删除所有未使用的导入/变量/方法
8. 输出最终代码
```

**禁止跳过任何一步**。

---

## 9. 导入路径唯一真理源

### [强制性] 9.1 框架导入路径表

以下路径为**唯一正确答案**，禁止使用其他路径：

| 导入项 | 正确路径 | 用途 |
|--------|----------|------|
| `ecs` | `db://oops-framework/libs/ecs/ECS` | ECS 框架 |
| `oops` | `db://oops-framework/core/Oops` | 框架核心 |
| `CCEntity` | `db://oops-framework/module/common/CCEntity` | Entity 基类 |
| `CCBusiness` | `db://oops-framework/module/common/CCBusiness` | Business 基类 |
| `CCView` | `db://oops-framework/module/common/CCView` | ECS View 基类 |
| `GameComponent` | `db://oops-framework/module/common/GameComponent` | 普通组件基类 |
| `gui` | `db://oops-framework/core/gui/Gui` | GUI 系统 |
| `LayerType` | `db://oops-framework/core/gui/layer/LayerEnum` | 层级枚举 |
| `prefab` | `db://oops-framework/module/decorator/GamePrefabDecorator` | 预制体装饰器 |

### [强制性] 9.2 无需导入的框架模块

以下模块通过 `oops.xxx` 直接访问，**不需要 import**：

- `oops.log` - 日志管理器
- `oops.config` - 游戏配置
- `oops.storage` - 本地存储
- `oops.res` - 资源管理
- `oops.message` - 全局消息
- `oops.random` - 随机工具
- `oops.timer` - 游戏时间管理
- `oops.audio` - 游戏音乐管理
- `oops.gui` - 二维界面管理
- `oops.game` - 三维游戏世界管理
- `oops.language` - 多语言模块
- `oops.ecs` - ECS 根系统
- `oops.mvvm` - MVVM 框架
- `oops.pool` - 对象池

### [强制性] 9.3 导入风格

```typescript
// ✅ 正确 - 值导入（类/函数在运行时使用）
import { Node, _decorator } from 'cc';
import { CCBusiness } from 'db://oops-framework/module/common/CCBusiness';
import { [Module] } from '../[Module]';

// ✅ 正确 - 类型导入（仅在类型位置使用）
import  { Node } from 'cc';  // 仅作为类型标注，无运行时引用

// ❌ 错误 - export type
export { I[Module]EventDataMap } from './[Module]EventData';

// ✅ 正确 - 值导出
export { type I[Module]EventDataMap } from './[Module]EventData';
```

---

## 10. 架构决策速查表

### [强制性] 10.1 同模块内通信方式

| 方向 | 方式 | 示例 |
|------|------|------|
| View → Business | 直接调用 API | `this.ent.B_[Module]_Main.[方法]([参数])` |
| View → View | 直接引用 | `this.ent.VC_[Module]_Main.[方法]([参数])` |
| Business → View | 模块内事件 | `this.emit([Module]EventName.[EventKey])` |
| Business → Model | 直接操作 | `this.ent.M_[Module]_Main.[属性].set([键], [值])` |
| 跨模块 | 全局事件 | `this.emit([全局事件名].[EventKey], [数据])` |

### [强制性] 10.2 View 类型选择

| 场景 | 类型 | 继承 | 装饰器 |
|------|------|------|--------|
| 独立 UI 窗口/弹窗 | ECS View | `CCView<Module>` | `@ecs.register` + `@gui.register` |
| 列表项/格子项/图标 | GameComponent | `GameComponent` | `@ccclass` (+ `@prefab.register`) |

### [强制性] 10.3 生命周期方法选择

| 组件类型 | 初始化 | 清理 |
|----------|--------|------|
| ECS 组件 (Entity/Model/Business/View) | `init()` / `onLoad()` | `reset()` |
| 纯 Cocos 组件 | `onLoad()` | `onDestroy()` |

**规则**：ECS 组件优先使用 `reset()`，有 `reset()` 就不需要 `onDestroy()`。
