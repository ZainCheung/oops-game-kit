---
name: "Project Structure"
description: "Oops Framework 目录结构与命名规范，包含项目目录、模块目录、文件与类命名规则"
priority: "medium"
triggers:
  keywords:
    - "目录"
    - "结构"
    - "命名"
    - "文件夹"
    - "前缀"
    - "创建模块"
  patterns:
    - ".*目录.*结构.*"
    - ".*创建.*模块.*"
    - ".*命名.*规范.*"
---

# Oops Framework - 项目结构与命名规范

本文档定义 Oops Framework 的目录结构、模块组织方式和文件/类/方法命名规则。

---

## 1. 项目目录结构

### 1.1 项目资源目录

```
assets/                          # 项目资源根目录
├── bundle/                      # 远程资源包目录
│   ├── audios/                  # 音频资源
│   ├── common/                  # 通用资源
│   │   ├── anim/                # 动画资源
│   │   ├── prefab/              # 通用预制体
│   │   └── texture/             # 通用纹理
│   ├── config/                  # 配置数据
│   │   └── game/                # 游戏配置
│   ├── game/                    # 游戏核心玩法资源目录
│   ├── gui/                     # 游戏界面资源
│   │   ├── common/              # 通用游戏界面
│   │   └── loading/             # 加载游戏界面
│   ├── language/                # 多语言资源
├── libs/                        # 第三方库
├── resources/                   # 引擎默认资源包目录
└── script/                      # 脚本代码
    └── game/                    # 游戏业务模块代码
```

### 1.2 框架源码目录

```
extensions/oops-plugin-framework/assets/    # 框架源码根目录
├── core/                                    # 核心功能
│   ├── common/                              # 通用模块
│   │   ├── audio/                           # 音频管理
│   │   ├── event/                           # 事件系统
│   │   ├── loader/                          # 资源加载
│   │   ├── log/                             # 日志系统
│   │   ├── storage/                         # 本地存储
│   │   └── timer/                           # 定时器
│   ├── game/                                # 游戏管理
│   ├── gui/                                 # GUI系统
│   │   ├── layer/                           # 层级管理
│   │   └── prompt/                          # 提示组件
│   └── utils/                               # 工具类
├── libs/                                    # 扩展库
│   ├── animator/                            # 动画系统
│   ├── animator-effect/                     # 动画特效
│   ├── animator-move/                       # 移动动画
│   ├── behavior-tree/                       # 行为树
│   ├── camera/                              # 相机控制
│   ├── collection/                          # 集合类
│   ├── ecs/                                 # ECS框架
│   ├── extension/                           # 扩展方法
│   ├── gui/                                 # GUI组件
│   ├── model-view/                          # MVVM框架
│   ├── network/                             # 网络模块
│   └── render-texture/                      # 渲染纹理
├── module/                                  # 游戏业务模块基类
│   ├── common/                              # 通用模块类
│   │   ├── CCBusiness.ts                    # 业务层基类
│   │   ├── CCEntity.ts                      # 实体基类
│   │   ├── CCView.ts                        # 视图层基类
│   │   └── GameComponent.ts                 # 组件基类
│   ├── config/                              # 配置模块
│   └── decorator/                           # 装饰器
└── types/                                   # 类型定义
```

---

## 2. 模块目录结构

```
[模块名]/                       # 目录名小写（如：backpack/）
├── [模块名].ts                # 模块入口（CCEntity），首字母大写（如：Backpack.ts）
├── [模块名]Event.ts           # 事件定义
├── [模块名]EventData.ts       # 事件数据类型
├── model/                     # 数据层
│   ├── M_[模块]_Model.ts
│   ├── M_[模块]_Config.ts
│   └── enum/                  # 枚举子目录
│       └── EM_[模块].ts       # 枚举定义
├── bll/                       # 业务层
│   └── B_[模块]_[功能].ts
└── view/                      # 视图层
    ├── VC_[模块]_[功能].ts     # ECS视图
    └── V_[模块]_[功能].ts      # 普通视图
```

### 2.1 模块命名规范

**模块名必须与目录名一致，首字母大写**

| 项目 | 命名规则 | 示例 |
|------|----------|------|
| **目录名** | 小写模块名 | `backpack`, `login`, `shop` |
| **模块类名** | 首字母大写的模块名 | `Backpack`, `Login`, `Shop` |
| **Entity 文件名** | 与模块类名相同 | `Backpack.ts`, `Login.ts`, `Shop.ts` |

**示例**：
- 目录：`backpack/`（小写）
- Entity 文件：`backpack/Backpack.ts`（首字母大写）
- 模块类名：`export class Backpack extends CCEntity`
- Model 文件：`backpack/model/M_Backpack_Main.ts`
- Business 文件：`backpack/bll/B_Backpack_Main.ts`
- View 文件：`backpack/view/VC_Backpack_Main.ts`

**错误示例**：
- ❌ 目录 `backpack/` + 文件 `backpack/User.ts`（模块名与目录名不一致）
- ❌ 目录 `backpack/` + 类名 `class BackpackModule`（多余的后缀）
- ❌ 目录 `Backpack/`（目录名用了大写）

---

## 3. 前缀规则表

| 文件类型 | 前缀 | 示例 | 说明 |
|----------|------|------|------|
| **Entity (实体层)** | 无 | `Backpack.ts` | 模块入口实体组件 |
| **Model (数据层)** | `M_` | `M_Backpack_Main.ts` | 数据模型组件 |
| **Business (业务层)** | `B_` | `B_Backpack_Main.ts` | 业务逻辑组件 |
| **System (系统层)** | `S_` | `S_Backpack_Sort.ts` | ECS 系统组件 |
| **ECS View (视图层)** | `VC_` | `VC_Backpack_Main.ts` | ECS 视图组件 |
| **GameComponent (视图层)** | `V_` | `V_Backpack_Prop.ts` | 游戏组件视图 |
| **Enum (枚举)** | `EM_` / `EB_` / `EV_` | `EM_Backpack.ts` | model层EM, bll层EB, view层EV |
| **Type (类型)** | `TM_` / `TB_` / `TV_` | `TM_Backpack_Data.ts` | model层TM, bll层TB, view层TV |
| **Config (配置)** | `CM_` / `CB_` / `CV_` | `CM_Backpack_Table.ts` | model层CM, bll层CB, view层CV |
| **Interface (接口)** | `IM_` / `IB_` / `IV_` | `IM_Backpack_Data.ts` | model层IM, bll层IB, view层IV |
| **Event (事件)** | 无 | `BackpackEvent.ts` | 事件定义 |
| **EventData (事件数据)** | 无 | `BackpackEventData.ts` | 事件数据定义 |

### 3.1 层级前缀对照表

| 层级 | Enum | Type | Config | Interface |
|------|------|------|--------|-----------|
| **model** | `EM_` | `TM_` | `CM_` | `IM_` |
| **bll** | `EB_` | `TB_` | `CB_` | `IB_` |
| **view** | `EV_` | `TV_` | `CV_` | `IV_` |

---

## 4. 命名格式

```
[前缀]_[模块名]_[功能描述].ts

示例：
- Backpack.ts                 (Entity层-背包模块-入口实体)
- M_Backpack_Main.ts          (Model层-背包模块-主数据模型)
- B_Backpack_Main.ts          (Business层-背包模块-主业务)
- B_Backpack_ViewUI.ts        (Business层-背包模块-视图管理)
- S_Backpack_Sort.ts          (System层-背包模块-排序系统)
- VC_Backpack_Main.ts         (ECS View层-背包模块-主界面)
- V_Backpack_Prop.ts          (GameComponent层-背包模块-道具项)
- EM_Backpack.ts              (Enum-背包模块-红点枚举)
- TM_Backpack_Data.ts         (Type-背包模块-数据类型)
- CM_Backpack_Table.ts        (Config-背包模块-配置表)
- IM_Backpack_Data.ts         (Interface-背包模块-数据接口)
- BackpackEvent.ts            (Event-背包事件)
- BackpackEventData.ts        (EventData-背包事件数据)
```

---

## 5. 方法命名规范

### 5.1 方法命名风格

| 类型 | 命名风格 | 示例 | 说明 |
|------|----------|------|------|
| 公共方法 | camelCase | `buyItem()`, `updateData()` | 小写开头，动词开头 |
| 私有方法 | camelCase | `update()`, `onClick()` | **不加 `_` 前缀** |
| 保护方法 | camelCase | `init()`, `reset()` | **不加 `_` 前缀** |
| 事件处理 | `on` + 元素 + 动作 | `onBuyButtonClick()`, `onDataUpdate()` | UI事件处理 |

### 5.2 方法命名前缀约定

| 前缀 | 用途 | 示例 |
|------|------|------|
| `get` | 获取数据 | `getGold()`, `getItemById()` |
| `set` | 设置数据 | `setGold()`, `setConfig()` |
| `is` | 布尔判断 | `isValid()`, `isEmpty()` |
| `has` | 存在判断 | `hasItem()`, `hasPermission()` |
| `can` | 能力判断 | `canBuy()`, `canEquip()` |
| `on` | 事件处理 | `onClick()`, `onDataChange()` |
| `update` | 更新数据 | `updateUI()`, `updateState()` |
| `init` | 初始化 | `init()`, `initData()` |
| `reset` | 重置 | `reset()`, `resetData()` |

---

## 6. 成员变量命名规范

| 类型 | 命名风格 | 示例 | 说明 |
|------|----------|------|------|
| 公共成员 | camelCase | `gold`, `itemCount` | 小写开头 |
| 私有成员 | camelCase | `data`, `isLoaded` | **不加 `_` 前缀** |
| 保护成员 | camelCase | `config` | **不加 `_` 前缀** |

---

## 7. 常量命名规范

| 类型 | 命名风格 | 示例 |
|------|----------|------|
| 全局常量 | UPPER_SNAKE_CASE | `MAX_COUNT`, `DEFAULT_SPEED` |
| 类常量 | UPPER_SNAKE_CASE | `static readonly MAX_ITEMS = 100` |
| 枚举值 | UPPER_SNAKE_CASE | `DEFAULT = 1` |

---

## 8. 泛型命名规范

| 字母 | 用途 | 示例 |
|------|------|------|
| `T` | 通用类型 | `class List<T>` |
| `K` | 键类型 | `K extends keyof T` |
| `V` | 值类型 | `class Map<K, V>` |
| `E` | 元素类型 | `class Array<E>` |
| `R` | 返回类型 | `function map<T, R>(): R[]` |

---

## 9. 文件组织原则

1. **按层分离** — 不同类型的组件放在对应目录（model/、bll/、view/）
2. **就近原则** — 相关的类型定义放在同一目录
3. **扁平结构** — 避免过深的目录嵌套
