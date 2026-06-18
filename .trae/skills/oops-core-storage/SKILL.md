---
name: "oops-core-storage"
description: "Oops Framework 本地存储模块使用指南。当用户需要存储游戏数据、读取本地配置、实现数据持久化或需要数据加密存储时调用。涵盖 StorageManager 存储管理器的使用方法，包括基础存储、批量操作、JSON存储和数据加密。"
triggers:
  keywords:
    - "存储"
    - "storage"
    - "StorageManager"
    - "本地存储"
    - "数据持久化"
    - "存档"
    - "保存数据"
    - "读取数据"
    - "oops.storage"
    - "setItem"
    - "getItem"
    - "localStorage"
  patterns:
    - ".*存储.*"
    - ".*storage.*"
    - "StorageManager.*"
    - ".*存档.*"
---

# Oops Framework 本地存储模块

本文档介绍 Oops Framework 的本地存储系统，包括基础存储、批量操作、数据加密和用户隔离功能。

## 触发条件

**当用户需要以下操作时调用此技能**：
- 存储游戏数据到本地
- 读取本地存储的数据
- 实现数据持久化
- 需要数据加密存储
- 多用户数据隔离
- 批量存储/读取操作

**不匹配的情况**（使用其他技能）：

| 场景 | 推荐技能/文档 |
|------|--------------|
| 编码标准 | `../rules/oops-rule-coding.md` |
| 内存数据管理 | `oops-guide-model` |

---

## 1. 存储管理器 (StorageManager)

### 1.1 获取实例

```typescript
import { oops } from 'db://oops-framework/core/Oops';

// 通过 oops 访问（推荐）
oops.storage.set('key', 'value');

// 或直接导入（框架初始化后使用）
import { StorageManager } from 'db://oops-framework/core/common/storage/StorageManager';
// 注意：StorageManager 没有 .instance 单例属性，需通过 oops.storage 访问
```

### 1.2 初始化加密

```typescript
import { StorageSecuritySimple } from 'db://oops-framework/core/common/storage/StorageSecuritySimple';

// 使用简单加密（XOR加密）
const security = new StorageSecuritySimple();
security.key = 'my-secret-key-16';
security.iv = 'my-iv-16-chars!!';

oops.storage.init(security);
```

---

## 2. 基础存储操作

### 2.1 存储数据

```typescript
/**
 * 存储本地数据
 * @param key   存储键
 * @param value 存储值
 * @returns     是否成功
 */

// 存储字符串
oops.storage.set('username', 'Player001');

// 存储数字
oops.storage.set('level', 50);

// 存储布尔值
oops.storage.set('isNewPlayer', true);

// 存储对象（自动JSON序列化）
const playerData = {
    uid: 10001,
    name: 'Player001',
    level: 50
};
oops.storage.set('playerData', playerData);
```

### 2.2 读取数据

```typescript
/**
 * 获取指定关键字的数据
 * @param key          键
 * @param defaultValue 默认值
 * @returns            存储的值或默认值
 */

// 读取字符串（默认返回空字符串）
const username = oops.storage.get('username');
const username2 = oops.storage.get('username', 'Guest');

// 读取数字
const level = oops.storage.getNumber('level', 1);

// 读取布尔值
const isNew = oops.storage.getBoolean('isNewPlayer', false);

// 读取JSON对象
const playerData = oops.storage.getJson('playerData', {});
```

### 2.3 删除数据

```typescript
// 删除单个键
oops.storage.remove('tempData');

// 批量删除
oops.storage.removeBatch(['temp1', 'temp2', 'temp3']);

// 清空所有存储（危险操作）
oops.storage.clear();
```

### 2.4 检查与查询

```typescript
// 检查 key 是否存在
const exists = oops.storage.has('playerData');

// 获取所有当前用户的 key
const keys = oops.storage.getAllKeys();

// 获取存储使用情况
const info = oops.storage.getStorageInfo();
console.log(`存储了 ${info.keyCount} 个键，估计大小: ${info.estimatedSize} 字节`);
```

---

## 3. 批量操作

### 3.1 批量存储

```typescript
/**
 * 批量存储（性能优化：减少 40-60% 的调用开销）
 * @param data 键值对对象
 * @returns    成功存储的数量
 */

const data = {
    'player.name': 'Player001',
    'player.level': 50,
    'player.gold': 10000
};

const successCount = oops.storage.setBatch(data);
```

### 3.2 批量读取

```typescript
/**
 * 批量获取（性能优化）
 * @param keys          要获取的 key 数组
 * @param defaultValues 默认值对象（可选）
 * @returns             键值对对象
 */

const keys = ['player.name', 'player.level', 'player.gold'];
const result = oops.storage.getBatch(keys);
```

---

## 4. 用户数据隔离

### 4.1 设置用户ID

```typescript
// 登录后设置用户ID
oops.storage.setUser('user_10001');

// 此时存储的数据会自动添加用户前缀
oops.storage.set('level', 50);  // 实际存储: user_10001_level

// 读取时也会自动处理
const level = oops.storage.get('level');  // 读取: user_10001_level
```

### 4.2 清空用户数据

```typescript
// 清空当前用户的所有数据
oops.storage.clearUser();
```

---

## 5. 资源释放

```typescript
// 释放存储管理器资源（切换场景或不需要时调用）
oops.storage.dispose();
```

---

## 6. 背包模块存储示例

### 6.1 保存背包数据

```typescript
import { oops } from 'db://oops-framework/core/Oops';
import { CCBusiness } from 'db://oops-framework/module/common/CCBusiness';
import { Backpack } from '../Backpack';
import { IRemoteProp } from '../BackpackEvent';

export class B_Backpack_Storage extends CCBusiness<Backpack> {
    private static readonly KEY_BACKPACK = 'backpack_data';

    /** 保存背包数据到本地 */
    saveBackpack(): void {
        const data: IRemoteProp[] = [];
        this.ent.M_Backpack_Main.props.forEach((prop) => {
            data.push({
                propId: prop.M_Prop_Main.id,
                amount: prop.M_Prop_Main.amount
            });
        });

        oops.storage.set(B_Backpack_Storage.KEY_BACKPACK, data);
        oops.log.logBusiness('背包数据已保存', 'Backpack');
    }

    /** 从本地加载背包数据 */
    loadBackpack(): IRemoteProp[] | null {
        return oops.storage.getJson<IRemoteProp[]>(B_Backpack_Storage.KEY_BACKPACK);
    }

    /** 清空本地背包存档 */
    clearBackpack(): void {
        oops.storage.remove(B_Backpack_Storage.KEY_BACKPACK);
    }
}
```

### 6.2 批量保存设置

```typescript
/** 批量保存背包设置 */
saveSettings(settings: { autoSort: boolean; showReddot: boolean; filterType: number }): void {
    const data = {
        'backpack.autoSort': settings.autoSort,
        'backpack.showReddot': settings.showReddot,
        'backpack.filterType': settings.filterType
    };
    oops.storage.setBatch(data);
}
```

---

## 7. API 速查表

| 方法 | 参数 | 返回值 | 说明 |
|------|------|--------|------|
| `init(iis)` | `IStorageSecurity` | `void` | 初始化加密 |
| `setUser(id)` | `string` | `void` | 设置用户ID |
| `set(key, value)` | `string, any` | `boolean` | 存储数据 |
| `get(key, default?)` | `string, any` | `string` | 读取数据 |
| `getNumber(key, default?)` | `string, number` | `number` | 读取数字 |
| `getBoolean(key, default?)` | `string, boolean` | `boolean` | 读取布尔值 |
| `getJson(key, default?)` | `string, T` | `T` | 读取JSON对象 |
| `remove(key)` | `string` | `boolean` | 删除单个键 |
| `removeBatch(keys)` | `string[]` | `number` | 批量删除 |
| `clear()` | 无 | `void` | 清空所有存储 |
| `clearUser()` | 无 | `void` | 清空当前用户数据 |
| `setBatch(data)` | `Record<string, any>` | `number` | 批量存储 |
| `getBatch(keys, defaults?)` | `string[], Record?` | `Record<string, string>` | 批量读取 |
| `has(key)` | `string` | `boolean` | 检查key是否存在 |
| `getAllKeys()` | 无 | `string[]` | 获取所有key |
| `getStorageInfo()` | 无 | `{keyCount, estimatedSize}` | 获取存储信息 |
| `dispose()` | 无 | `void` | 释放资源 |

---

## 8. 关联技能

| 场景 | 推荐技能 |
|------|----------|
| 代码风格规范 | `oops-guide-code-style` |
| Business 层编写 | `oops-guide-business` |
| Model 层编写 | `oops-guide-model` |
