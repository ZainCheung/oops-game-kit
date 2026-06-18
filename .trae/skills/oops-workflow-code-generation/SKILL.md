---
name: "oops-workflow-code-generation"
description: "Oops Framework 代码生成工作流。统一入口，AI直接生成符合规范的完整代码，MCP仅用于创建空文件，生成后立即验证。"
triggers:
  keywords:
    - "生成代码"
    - "创建模块"
    - "添加功能"
    - "生成模块"
    - "code generation"
    - "generate module"
    - "create module"
    - "workflow"
    - "工作流"
  patterns:
    - "生成.*模块"
    - "创建.*模块"
    - "添加.*功能"
    - ".*代码.*生成"
---

# Oops Framework 代码生成工作流

## 架构概览

### 工作流程概览

| 阶段 | 组件            | 核心职责     | 处理内容                       | 输出   |
| -- | ------------- | -------- | -------------------------- | ---- |
| 1  | **MCP**       | 创建文件     | 仅创建空文件和目录结构                | 空文件  |
| 2  | **AI生成**      | 直接生成完整代码 | 类名/继承/导入/装饰器/方法一次性正确       | 完整代码 |
| 3  | **Validator** | 验证检查     | 调用 `oops-code-validator` 技能 | 验证报告 |

### 流程流向

```
MCP (创建空文件) → AI (直接生成完整规范代码) → Validator (验证)
                                                      ↓ 验证失败
                                                 返回AI修复
```

### 各组件详细说明

| 组件            | 输入    | 处理                               | 输出     |
| ------------- | ----- | -------------------------------- | ------ |
| **MCP**       | 模块设计  | 仅创建空文件和目录结构                      | 空文件    |
| **AI**        | 空文件路径 | 直接写入符合框架规范的完整代码                  | 完整代码文件 |
| **Validator** | 生成的代码 | 调用 `oops-code-validator` 技能执行验证      | 验证结果   |

---

## 工作流程

### 步骤 1：MCP 创建空文件

**MCP 职责**：仅创建空文件和基础目录结构，不写入任何代码内容。

```
MCP 工具调用
    ├── CreateModule - 创建模块目录和空文件（仅创建，不填充）
    ├── ModuleEntity - 创建 Entity 空文件
    ├── ModuleModel - 创建 Model 空文件
    ├── ModuleBusiness - 创建 Business 空文件
    ├── ModuleView - 创建 View 空文件
    ├── ModuleEnum - 创建枚举空文件
    ├── ModuleType - 创建类型空文件
    ├── ModuleInterface - 创建接口空文件
    └── ModuleEvent - 创建事件空文件
```

**MCP 输出**：空文件（0字节或仅包含文件创建）

---

### 步骤 1.5：决策确认（关键）

在调用 MCP 创建空文件之前，AI 必须先完成：

1. **需求解析**：将用户描述转化为具体的功能点清单
2. **模糊点识别**：标记出所有需要开发者确认的不确定项
3. **决策询问**：使用 AskUserQuestion 向开发者呈现选项（2-4 个方案 + 优缺点 + AI 推荐）
4. **确认归档**：将开发者的选择记录到后续生成中

**触发条件**：

- 功能范围不确定（如"背包系统"是否包含整理/排序/批量操作）
- 交互方式未明确（弹窗 vs 跳转 vs 内嵌）
- 数据结构未定义（需要显示/存储哪些具体字段）
- 业务规则缺失（限制条件、状态流转、数量上限）
- 视觉层级未说明（简单列表项 vs 复杂卡片）
- 技术方案不唯一（Model 层用一个还是多个）
- 事件设计有歧义（一个事件还是多个事件）
- 数据流方向不明（主动拉取还是被动推送）

**执行标准**：

- 以上任一情况出现 → **必须使用 AskUserQuestion 询问开发者**
- 所有关键决策明确 → 方可进入 MCP 创建文件阶段

**只有所有关键决策都得到开发者确认后，才能进入 MCP 创建文件阶段。**

> **详细约束规则参见**：`../rules/oops-rule-core.md` 第2章"决策询问原则"

---

### 步骤 2：AI 直接生成完整代码

**AI 职责**：根据规范直接生成完整、正确的代码，一次性写入文件。

**正确行为**：

- ✅ AI 直接根据规范生成完整代码
- ✅ 使用 `Write` 工具一次性写入完整文件
- ✅ 确保类名、继承、导入、装饰器、方法全部正确

**代码生成中的决策检查**：
即使在代码生成过程中，如果遇到以下情况也必须暂停：

- 发现用户需求中未提及但需要假设的属性/方法
- 发现多个等价的实现方案（如一种事件 vs 多种事件）
- 发现需要补充的业务规则才能继续编码
- 发现 UI 交互细节缺失（如按钮点击后的反馈方式）

**处理方式**：停止当前文件生成，使用 AskUserQuestion 询问，得到答复后继续。

---

## 规范引用

所有代码生成必须遵循以下规则文件：

| 规范        | 文件路径                                      | 内容                        |
| --------- | ----------------------------------------- | ------------------------- |
| **核心约束**  | `../rules/oops-rule-core.md`           | AI 行为红线、决策询问、强制生成顺序、验证闭环 |
| **架构规范**  | `../rules/oops-rule-architecture.md`   | 三层架构设计规范、层间通讯规则           |
| **编码标准**  | `../rules/oops-rule-coding.md`         | 各层代码模板、导入/事件/方法规范         |
| **项目结构**  | `../rules/oops-rule-structure.md`      | 目录结构、文件与类命名规范              |

**生成时必须**：

1. 打开对应的规则文件
2. 找到对应文件类型的元模板
3. 替换占位符后直接使用
4. **禁止自由发挥，禁止凭记忆编写**

---

## 占位符说明

| 占位符           | 替换规则      | 示例                              |
| ------------- | --------- | ------------------------------- |
| `[Module]`    | 模块名，大驼峰   | `Shop`, `Friend`, `Login`       |
| `[Name]`      | 文件功能后缀    | `Main`, `List`, `Item`, `Model` |
| `[module]`    | 模块名全小写    | `shop`, `friend`, `login`       |
| `[EventName]` | 事件名，首字母大写 | `BuyClick`, `DataUpdate`        |

---

## MCP 自动生成说明

以下文件由 MCP 工具自动生成，AI 不需要手动编写：

| 文件                         | 生成时机                                                 | 说明                                                          |
| -------------------------- | ---------------------------------------------------- | ----------------------------------------------------------- |
| `B_[Module]_ViewUI.ts`     | 创建 `gameComponent` 或 `ecsView` 类型 View 时             | 自动添加 `open{ViewName}()` 和 `remove{ViewName}()` 方法           |
| `B_[Module]_ViewPrefab.ts` | 创建 `gameComponentPrefab` 或 `ecsViewPrefab` 类型 View 时 | 自动添加 `open{ViewName}(parent)` 和 `remove{ViewName}(node)` 方法 |

**AI 禁止**：

- ❌ 删除这两个文件
- ❌ 修改其中的方法名
- ❌ 在其它 Business 中创建内联的 ViewUI/ViewPrefab 替代类

> **详细约束参见**：`../rules/oops-rule-core.md` 第4章"API 使用与视图管理"

---

## 步骤 3：验证检查

代码生成后**必须**调用 `oops-code-validator` 技能进行验证。

**验证流程**：

1. 调用 `oops-code-validator` 技能
2. 根据验证报告修复问题（如有）
3. 重新验证直至通过

**验证失败处理**：

- 必须修复后重新验证
- **验证不通过，绝对不可交付**

> **详细验证规则、自检清单和修复方法参见 `oops-code-validator` 技能**

---

## 三层架构技能参考

代码生成时参考以下技能获取各层标准写法：

| 层级 | 技能文件 | 元模板来源 |
|------|----------|------------|
| Entity | `oops-guide-entity` | `../rules/oops-rule-coding.md` 第 1 节 |
| Model | `oops-guide-model` | `../rules/oops-rule-coding.md` 第 2 节 |
| Business | `oops-guide-business` | `../rules/oops-rule-coding.md` 第 3 节 |
| ViewUI | `oops-guide-viewui` | `../rules/oops-rule-coding.md` 第 4 节 |
| ECS View | `oops-guide-view` | `../rules/oops-rule-coding.md` 第 6 节 |
| GameComponent | `oops-guide-view` | `../rules/oops-rule-coding.md` 第 7 节 |
| Event | `oops-guide-event` | `../rules/oops-rule-coding.md` 第 8 节 |
| Enum | `oops-guide-enum` | `../rules/oops-rule-structure.md` 第 3 节 |

---

## 背包模块目录结构参考

```
backpack/
├── Backpack.ts                    # Entity 层
├── BackpackEvent.ts               # 事件枚举
├── BackpackEventData.ts           # 事件数据接口
├── bll/
│   ├── B_Backpack_Main.ts         # 业务逻辑
│   ├── B_Backpack_ViewUI.ts       # 视图管理（MCP生成，AI禁止修改）
│   └── B_Backpack_ViewPrefab.ts   # 预制体管理（MCP生成，AI禁止修改）
├── model/
│   ├── M_Backpack_Main.ts         # 数据组件
│   └── enum/
│       └── EM_Backpack.ts         # 模块枚举
└── view/
    ├── VC_Backpack_Main.ts        # 主界面
    └── V_Backpack_Prop.ts         # 列表项
```
