---
name: "game-config-add"
description: "当用户需要添加游戏自定义环境配置字段时调用。涵盖向 Config.d.ts 添加类型声明、向 config.json 的 dev/test/prod 三个环境添加对应字段与默认值。"
triggers:
  keywords:
    - "添加游戏配置"
    - "添加配置"
    - "config.json"
    - "游戏配置"
    - "IConfigEnvironment"
    - "环境配置"
  patterns:
    - "添加.*配置.*字段"
    - "新增.*配置.*字段"
    - "配置.*字段.*添加"
    - "环境.*配置.*字段"
---

# Game Config Add 游戏配置添加

## 模块概述

游戏自定义环境配置用于扩展 `config.json` 的 `dev/test/prod` 字段，并通过 `IConfigEnvironment` 模块增强提供强类型支持。

主要文件：
- 类型声明文件：`assets/bundle/game_main/script/types/Config.d.ts`
- 配置数据文件：`assets/resources/config.json`

---

## 添加配置字段流程

当用户需要添加一个新的游戏配置字段时，按以下流程操作：

1. **确认字段信息**：与用户确认以下信息
   - 字段名（如 `zipTable`）
   - 字段类型（如 `boolean`、`number`、`string`、`object`）
   - 各环境默认值（`dev`/`test`/`prod` 可不同）
   - 字段注释说明（用于生成 JSDoc）

2. **修改 Config.d.ts**：在 `IConfigEnvironment` 接口中添加类型声明

3. **修改 config.json**：在 `dev`、`test`、`prod` 三个对象中分别添加该字段与默认值

---

## 操作示例

### 示例：添加 `zipTable` 字段（boolean 类型）

**Step 1：确认字段信息**

| 信息 | 值 |
|------|-----|
| 字段名 | `zipTable` |
| 类型 | `boolean` |
| dev 默认值 | `false` |
| test 默认值 | `false` |
| prod 默认值 | `false` |
| 注释 | 是否启用数据表 zip 压缩 |

**Step 2：修改 `Config.d.ts`**

```typescript
/**
 * 游戏自定义环境配置 - 扩展 config.json 的 dev/test/prod 字段
 * 通过 IConfigEnvironment 模块增强，使 oops.config.game.data.zipTable 具有强类型
 * 需在 Main.ts 首行 import 以确保持续生效
 */
import type { } from 'db://oops-framework/module/config/GameConfig';

declare module 'db://oops-framework/module/config/GameConfig' {
    interface IConfigEnvironment {
        /** 是否开启收集与分析功能 */
        sdkAnalysis: boolean;
        /** 是否开启获取平台隐私信息开关 */
        sdkPrivacy: false;
        /** 是否启用数据表 zip 压缩 */
        zipTable: boolean;
    }
}
```

> **注意**：若字段已有默认值的字面量类型（如 `false`），可直接写为字面量类型；若各环境值可能不同，写为通用类型（如 `boolean`）。

**Step 3：修改 `config.json`**

在 `dev`、`test`、`prod` 三个对象中各添加一行：

```json
{
  "type": "dev",
  "config": {
    "dev": {
      "version": "1.0.0",
      "localDataKey": "oops",
      "localDataIv": "framework",
      "frameRate": 60,
      "loadingTimeoutGui": 1000,
      "mobileSafeArea": true,
      "stats": false,
      "sdkAnalysis": false,
      "sdkPrivacy": false,
      "zipTable": false
    },
    "test": {
      "version": "1.0.0",
      "localDataKey": "oops",
      "localDataIv": "framework",
      "frameRate": 60,
      "loadingTimeoutGui": 1000,
      "mobileSafeArea": false,
      "stats": false,
      "sdkAnalysis": false,
      "sdkPrivacy": false,
      "zipTable": false
    },
    "prod": {
      "version": "1.0.0",
      "localDataKey": "oops",
      "localDataIv": "framework",
      "frameRate": 60,
      "loadingTimeoutGui": 1000,
      "mobileSafeArea": false,
      "stats": false,
      "sdkAnalysis": false,
      "sdkPrivacy": false,
      "zipTable": false
    }
  }
}
```

---

## 字段类型规范

| 类型 | 示例值 | 说明 |
|------|--------|------|
| `boolean` | `true` / `false` | 布尔值 |
| `number` | `60` / `1000` | 数字（整数或浮点数） |
| `string` | `"oops"` / `"framework"` | 字符串 |
| `object` | `{ "key": "value" }` | 对象（JSON 格式） |
| `array` | `[1, 2, 3]` | 数组（JSON 格式） |

---

## 使用配置

```typescript
// 获取当前环境配置（自动根据 config.json 的 type 字段）
const config = oops.config.game.data;

// 访问自定义字段（因模块扩展，具有强类型提示）
const zipTable = config.zipTable; // boolean
const sdkAnalysis = config.sdkAnalysis; // boolean
```

---

## 注意事项

1. **类型一致性**：`Config.d.ts` 中声明的类型必须与 `config.json` 中实际值的类型一致
2. **三环境同步**：添加字段时必须在 `dev`、`test`、`prod` 三个环境中都添加，默认值可根据环境需求不同
3. **字段注释**：务必在 `Config.d.ts` 中添加 JSDoc 注释，说明字段用途
4. **JSON 格式**：`config.json` 中最后一个字段后面不要加逗号（JSON 标准不允许尾随逗号）
5. **Import 生效**：`Config.d.ts` 需在 `Main.ts` 首行 `import` 以确保持续生效

---

## 关联技能

| 场景 | 推荐技能 |
|------|----------|
| 游戏引导配置 | `game-guide` |
| 编码风格规范 | `oops-guide-code-style` |
