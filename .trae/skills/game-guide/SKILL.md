---
name: "game-guide"
description: "Oops Framework 新手引导模块使用指南。当用户需要配置或修改引导步骤、config.json、引导节点路径、引导提示方向、引导界面控制时调用。涵盖引导配置、引导事件、引导流程与编辑器使用。"
---

# Game Guide 新手引导模块

## 模块概述

新手引导模块基于 Oops Framework 的 ECS 架构实现，通过 JSON 配置文件控制指定界面的引导流程。主要功能包括：

1. **引导配置**：通过 `config.json` 配置各界面的引导步骤、节点、提示内容等
2. **自动绑定**：界面打开时自动根据配置绑定引导节点
3. **遮罩与提示**：支持强引导（遮罩 + 高亮）和弱引导（仅提示）
4. **引导编辑器**：支持运行时编辑并输出引导配置

## 模块文件结构

```
assets/bundle/game_main/script/game/guide/
├── Guide.ts                  # 引导 Entity（入口）
├── GuideConst.ts             # 引导常量（编辑器模式开关）
├── GuideEvent.ts             # 引导事件定义与全局事件扩展
├── bll/
│   └── B_Guide_Main.ts       # 引导业务逻辑（加载配置、注册节点、检查触发）
├── model/
│   └── M_Guide_Main.ts       # 引导数据（当前步骤、节点映射、配置数据）
└── view/
    ├── VC_Guide_Main.ts      # 引导主逻辑（自动绑定、下一步、检查验证）
    ├── VC_Guide_Mask.ts      # 引导遮罩与可点击区域绘制
    ├── VC_Guide_Prompt.ts    # 引导提示框显示与方位计算
    ├── V_Guide_Item.ts       # 引导节点数据组件（绑定到目标节点）
    ├── V_Guide_Editor.ts     # 引导编辑器（单按钮添加）
    └── V_Guide_EditorMain.ts # 引导编辑器主逻辑（点击任意节点添加）
```

配置资源路径：`assets/bundle/game_main/gui/guide/config.json`

预制体路径：`assets/bundle/game_main/gui/guide/prefab/`（Mask、Prompt、Box）

---

## 配置文件 config.json

### 配置格式

配置文件是一个 JSON 对象，**键为界面根节点名称**，**值为该界面的引导步骤数组**。

```json
{
    "V_Demo_Main": [
        {
            "step": 1,
            "node": "Button",
            "offsetW": 0,
            "offsetH": 0,
            "tipsDirection": "top",
            "tips": "点击Button按钮"
        },
        {
            "step": 2,
            "node": "Button001",
            "offsetW": 0,
            "offsetH": 0,
            "tipsDirection": "left",
            "tips": "点击Button-001按钮"
        }
    ]
}
```

### 字段说明

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `step` | number | 是 | 引导步骤编号，从1开始递增 |
| `node` | string | 是 | 目标节点在界面中的路径（支持相对路径） |
| `offsetW` | number | 否 | 引导框左右扩大的宽度（默认0） |
| `offsetH` | number | 否 | 引导框上下扩大的高度（默认0） |
| `tipsDirection` | string | 否 | 提示框方位：`auto`（自动）、`top`、`bottom`、`left`、`right`（默认`auto`） |
| `tips` | string | 否 | 提示文本内容，为空时不显示提示框 |
| `handAngle` | number | 否 | 手指图标旋转角度（默认0） |
| `handScale` | object | 否 | 手指图标缩放，格式 `{"x": 1, "y": 1}`（默认`{x:1,y:1}`） |
| `next` | boolean | 否 | 点击后是否自动进入下一步（默认true） |
| `save` | number | 否 | 保存引导进度的步骤编号（默认0，不保存） |
| `weak` | boolean | 否 | 是否为弱引导（不显示遮罩，默认false） |
| `box` | array | 否 | 附加提示框数组，每个元素包含 `node`、`offsetW`、`offsetH` |

### 配置示例：多界面引导

```json
{
    "V_Demo_Main": [
        {
            "step": 1,
            "node": "Button",
            "tipsDirection": "top",
            "tips": "点击开始按钮"
        },
        {
            "step": 2,
            "node": "Button001",
            "tipsDirection": "left",
            "tips": "点击设置按钮"
        }
    ],
    "V_Demo_Setting": [
        {
            "step": 3,
            "node": "ButtonClose",
            "tipsDirection": "bottom",
            "tips": "点击关闭按钮",
            "save": 3
        }
    ]
}
```

### 配置示例：弱引导 + 附加提示框

```json
{
    "V_Demo_Main": [
        {
            "step": 1,
            "node": "Button",
            "tipsDirection": "right",
            "tips": "这是一个弱引导",
            "weak": true,
            "box": [
                {
                    "node": "Button/Icon",
                    "offsetW": 10,
                    "offsetH": 10
                }
            ]
        }
    ]
}
```

---

## 添加新界面引导步骤

当用户需要为某个新界面添加引导时，按以下流程操作：

1. **确认界面根节点名称**：界面的根节点名称（如 `V_Demo_Main`）即 config.json 中的键名
2. **确定目标节点路径**：在界面 prefab 中找到需要引导的节点，记录其相对路径
3. **编写引导步骤**：在 config.json 中添加对应键和步骤数组
4. **设置业务逻辑**：在 `B_Guide_Main.ts` 中调整 `last`（最大步骤数）和初始 `step`

### 修改 B_Guide_Main.ts 中的引导范围

```typescript
// 引导当前位置（恢复上次引导进度时可修改）
this.ent.M_Guide_Main.step = 1;
// 引导最大步数（最后一步编号 + 1，用于判断引导是否全部结束）
this.ent.M_Guide_Main.last = 3;
```

- `step`：当前引导步骤，可从服务器或本地存储读取恢复进度
- `last`：引导结束判断阈值，必须大于最后一步的编号

---

## 引导事件系统

### 事件枚举

```typescript
export enum GuideEventName {
    AutoBind = 'onGuideAutoBind',   // 新手引导自动绑定触发组件
    Register = 'onGuideRegister',     // 注册引导项
    Check    = 'onGuideCheck',      // 检查指定引导是否触发
}
```

### 事件使用

1. **AutoBind（自动绑定）**：界面打开时由 `VC_Guide_Main` 监听，自动根据 `config.json` 绑定节点
2. **Register（注册）**：手动注册引导节点到引导系统
3. **Check（检查）**：手动触发指定步骤的引导检查

### 全局事件扩展

引导模块已扩展 `OopsFramework.TypedEventMap`，支持通过 `oops.message.dispatchEvent` 触发。

---

## 引导提示方向

```typescript
export enum GuideDirection {
    Auto    = 'auto',    // 自动根据目标在屏幕位置选择最佳方位
    Top     = 'top',
    Bottom  = 'bottom',
    Left    = 'left',
    Right   = 'right',
}
```

- `Auto` 模式下：目标在屏幕上半部分则提示放上方，否则放下方

---

## 引导编辑器使用

### 启用编辑器模式

在 `GuideConst.ts` 中设置：

```typescript
export let GuideConst = true;  // true 时不会自动绑定引导事件，用于编辑器采集
```

### 编辑器组件

- **V_Guide_Editor**：绑定到目标节点，点击该节点自动记录路径并输出引导配置
- **V_Guide_EditorMain**：全局监听点击，点击任意节点记录路径并输出引导配置

### 编辑器输出

编辑器会在控制台输出 JSON 格式的引导数据，直接复制到 `config.json` 中即可使用。

---

## 强引导与弱引导

| 类型 | 特点 | 适用场景 |
|------|------|----------|
| 强引导（默认） | 显示遮罩，只有目标区域可点击 | 必须引导用户点击的关键步骤 |
| 弱引导 | 不显示遮罩，仅显示提示和手指 | 提示性引导，不阻断用户操作 |

在 config.json 中设置 `"weak": true` 开启弱引导。

---

## 开发注意事项

1. **节点路径正确性**：`node` 字段必须是界面内的有效节点路径，否则会在控制台报错
2. **步骤编号唯一性**：同一界面内的 `step` 不可重复，跨界面可连续递增
3. **last 值设置**：`last` 必须大于最后一步的编号，否则引导不会正常结束
4. **资源加载**：引导预制体（Mask、Prompt、Box）必须存在于 `gui/guide/prefab/` 目录
5. **config.json 路径**：必须能通过 `oops.res.get('gui/guide/config', JsonAsset)` 获取到

---

## 常见配置修改场景

### 场景1：修改某个界面的引导步骤

直接修改 `config.json` 中对应界面名称下的步骤数组。

### 场景2：新增界面引导

1. 在 `config.json` 中新增键值对（键为界面根节点名称）
2. 编写步骤数组
3. 更新 `B_Guide_Main.ts` 中的 `last` 值

### 场景3：修改提示文本或方位

修改对应步骤的 `tips` 和 `tipsDirection` 字段。

### 场景4：调整引导框大小

修改 `offsetW` 和 `offsetH` 字段，正值扩大，负值缩小。

### 场景5：引导进度保存

在 `B_Guide_Main.ts` 的 `onSave` 回调中实现存盘逻辑：

```typescript
// 每触发下一步存盘事件
gv.onSave = (step: number) => {
    // 将 step 保存到服务器或本地存储
    oops.storage.setNumber('guide_step', step);
};
```
