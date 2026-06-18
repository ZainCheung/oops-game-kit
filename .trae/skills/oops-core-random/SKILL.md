---
name: "oops-core-random"
description: "Oops Framework 随机数模块使用指南。当用户需要生成随机数、随机抽取数组元素、定和随机分配或需要使用种子随机时调用。涵盖 RandomManager 随机管理器和 SeedRandom 种子随机的使用方法。"
triggers:
  keywords:
    - "随机数"
    - "random"
    - "RandomManager"
    - "SeedRandom"
    - "随机抽取"
    - "定和随机"
    - "种子随机"
    - "随机分配"
    - "oops.random"
    - "getRandomInt"
    - "getRandomFloat"
  patterns:
    - ".*随机.*"
    - ".*random.*"
    - "RandomManager.*"
    - "SeedRandom.*"
---

# Oops Framework 随机数模块

本文档介绍 Oops Framework 的随机数系统，包括基础随机数生成、数组随机抽取、定和分配和种子随机功能。

## 触发条件

**当用户需要以下操作时调用此技能**：
- 生成指定范围的随机数
- 从数组中随机抽取元素
- 定和随机分配（如属性点分配）
- 使用种子随机保证可重复性
- 设置自定义随机算法

**不匹配的情况**（使用其他技能）：

| 场景 | 推荐技能/文档 |
|------|--------------|
| 编码标准 | `../rules/oops-rule-coding.md` |

---

## 1. 随机管理器 (RandomManager)

### 1.1 获取实例

```typescript
import { oops } from 'db://oops-framework/core/Oops';

// 通过 oops 访问
oops.random.getRandomInt(1, 100);

// 或直接获取单例
import { RandomManager } from 'db://oops-framework/core/common/random/RandomManager';
RandomManager.instance.getRandomInt(1, 100);
```

### 1.2 设置自定义随机库

```typescript
// 使用第三方随机库（如 seedrandom）
import * as seedrandom from 'seedrandom';

RandomManager.instance.setRandom(seedrandom('my-seed'));
```

---

## 2. 基础随机数生成

### 2.1 随机浮点数

```typescript
/**
 * 生成指定范围的随机浮点数
 * @param min 最小值（包含）
 * @param max 最大值（不包含）
 */

// [0, 1) 默认范围
const r1 = oops.random.getRandomFloat();

// [10, 20) 指定范围
const r2 = oops.random.getRandomFloat(10, 20);
```

### 2.2 随机整数

```typescript
/**
 * 生成指定范围的随机整数
 * @param min  最小值
 * @param max  最大值
 * @param type 区间类型 (1, 2, 3)
 *   - type 1: [min, max)  左闭右开，包含min，不包含max
 *   - type 2: [min, max]  闭区间，包含min和max（默认）
 *   - type 3: (min, max)  开区间，不包含min和max
 */

// [1, 10] 包含1和10（默认）
const dice = oops.random.getRandomInt(1, 6, 2);

// [0, 100) 包含0，不包含100
const percent = oops.random.getRandomInt(0, 100, 1);

// (0, 100) 不包含0和100
const exclusive = oops.random.getRandomInt(0, 100, 3);
```

### 2.3 区间类型对比

| type | 区间表示 | 包含min | 包含max | 示例 (1, 10) |
|------|----------|---------|---------|--------------|
| 1 | [min, max) | ✅ | ❌ | 1, 2, ..., 9 |
| 2 | [min, max] | ✅ | ✅ | 1, 2, ..., 10 |
| 3 | (min, max) | ❌ | ❌ | 2, 3, ..., 9 |

---

## 3. 数组随机操作

### 3.1 生成随机数数组

```typescript
/**
 * 生成指定范围的随机数数组（可重复）
 * @param min 最小值
 * @param max 最大值
 * @param n   随机个数
 */

// 生成5个 [50, 100] 的随机整数
const values = oops.random.getRandomByMinMaxList(50, 100, 5);
// 结果: [67, 82, 50, 91, 73] (可能重复)
```

### 3.2 从数组中随机抽取（不重复）

```typescript
/**
 * 获取数组中随机对象（不重复抽取）
 * @param objects 对象数组
 * @param n       随机个数（不能超过数组长度）
 */

// 从道具列表中抽取3个
const props = [
    { id: 1001, name: '药水', type: 1 },
    { id: 1002, name: '剑', type: 2 },
    { id: 1003, name: '盾', type: 2 },
    { id: 1004, name: '卷轴', type: 3 },
];
const selectedProps = oops.random.getRandomByObjectList(props, 3);
```

---

## 4. 定和随机分配

### 4.1 基础用法

```typescript
/**
 * 定和随机分配（将一个总和随机分配成n份）
 * @param n   分配份数
 * @param sum 总和（必须为正数）
 */

// 将100点属性随机分配到5个属性上
const attributes = oops.random.getRandomBySumList(5, 100);
// 结果: [23, 15, 31, 8, 23] (总和为100)
```

### 4.2 定和分配特性

- 每份可以为0
- 最后一份取剩余值确保总和准确
- 分配结果随机，不保证均匀

```typescript
const result1 = oops.random.getRandomBySumList(3, 10);
// 可能结果: [0, 7, 3] - 第一份可以为0
```

---

## 5. 种子随机 (SeedRandom)

### 5.1 基础用法

```typescript
import { SeedRandom } from 'db://oops-framework/core/common/random/SeedRandom';

// 创建种子随机实例
const seedRandom = new SeedRandom('my-seed-string');

// 使用种子随机生成
const value1 = seedRandom.random.getRandomInt(1, 100);
const value2 = seedRandom.random.getRandomFloat(0, 1);

// 销毁实例
seedRandom.destroy();
```

### 5.2 应用场景

```typescript
// 可重复的游戏地图
function generateMap(seed: string): number[][] {
    const sr = new SeedRandom(seed);
    const map: number[][] = [];
    
    for (let i = 0; i < 10; i++) {
        const row: number[] = [];
        for (let j = 0; j < 10; j++) {
            row.push(sr.random.getRandomInt(0, 5));
        }
        map.push(row);
    }
    
    sr.destroy();
    return map;
}

// 相同种子生成相同地图
const map1 = generateMap('level-1');
const map2 = generateMap('level-1'); // 与map1相同
```

### 5.3 种子随机特性

- 相同种子产生相同随机序列
- 独立于全局随机状态
- 需要手动销毁释放内存

---

## 6. 背包模块随机示例

### 6.1 随机掉落道具

```typescript
import { oops } from 'db://oops-framework/core/Oops';
import { CCBusiness } from 'db://oops-framework/module/common/CCBusiness';
import { Backpack } from '../Backpack';
import { BackpackEventName, IBackpackUpdateData, IRemoteProp } from '../BackpackEvent';

export class B_Backpack_Loot extends CCBusiness<Backpack> {
    private lootTable = [
        { propId: 1001, minAmount: 1, maxAmount: 5 },
        { propId: 1002, minAmount: 1, maxAmount: 3 },
        { propId: 1003, minAmount: 1, maxAmount: 1 },
    ];

    /** 随机掉落道具 */
    randomLoot(count: number = 3): void {
        // 随机抽取不重复的道具
        const selected = oops.random.getRandomByObjectList(this.lootTable, count);
        
        const data: IRemoteProp[] = selected.map(item => ({
            propId: item.propId,
            amount: oops.random.getRandomInt(item.minAmount, item.maxAmount, 2)
        }));

        const updateData: IBackpackUpdateData = { data };
        this.emit(BackpackEventName.Update, updateData);
    }
}
```

### 6.2 随机分配奖励

```typescript
/** 随机分配奖励到多个道具类型 */
randomDistributeReward(totalAmount: number): IRemoteProp[] {
    // 将总数随机分配到3种道具上
    const distribution = oops.random.getRandomBySumList(3, totalAmount);
    
    return [
        { propId: 1001, amount: distribution[0] },
        { propId: 1002, amount: distribution[1] },
        { propId: 1003, amount: distribution[2] },
    ];
}
```

---

## 7. 关联技能

| 场景 | 推荐技能 |
|------|----------|
| 代码风格规范 | `oops-guide-code-style` |
| 数学计算工具 | `oops-guide-code-utils` |
| Business 层编写 | `oops-guide-business` |
