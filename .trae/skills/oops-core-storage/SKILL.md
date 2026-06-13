---
name: "oops-core-storage"
description: "Oops Framework local storage module usage guide. Called when user needs to store game data, read local config, implement data persistence, or needs encrypted data storage. Covers StorageManager storage manager usage, including basic storage, batch operations, JSON storage, and data encryption."
triggers:
  keywords:
    - "storage"
    - "StorageManager"
    - "local storage"
    - "data persistence"
    - "save"
    - "save data"
    - "read data"
    - "oops.storage"
    - "setItem"
    - "getItem"
    - "localStorage"
  patterns:
    - ".*storage.*"
    - "StorageManager.*"
    - ".*save.*"
---

# Oops Framework Local Storage Module

This document introduces Oops Framework's local storage system, including basic storage, batch operations, data encryption, and user isolation features.

## Trigger Conditions

**Call this skill when user needs the following operations**:
- Store game data locally
- Read locally stored data
- Implement data persistence
- Need encrypted data storage
- Multi-user data isolation
- Batch storage/read operations

**Non-matching cases** (use other skills/documents):

| Scenario | Recommended Skill/Document |
|----------|---------------------------|
| Coding standards | `../rules/oops-rule-coding.md` |
| Memory data management | `oops-guide-model` |

---

## 1. Storage Manager (StorageManager)

### 1.1 Get Instance

```typescript
import { oops } from 'db://oops-framework/core/Oops';

// Access through oops (recommended)
oops.storage.set('key', 'value');

// Or import directly (use after framework initialization)
import { StorageManager } from 'db://oops-framework/core/common/storage/StorageManager';
// Note: StorageManager has no .instance singleton property, access through oops.storage
```

### 1.2 Initialize Encryption

```typescript
import { StorageSecuritySimple } from 'db://oops-framework/core/common/storage/StorageSecuritySimple';

// Use simple encryption (XOR encryption)
const security = new StorageSecuritySimple();
security.key = 'my-secret-key-16';
security.iv = 'my-iv-16-chars!!';

oops.storage.init(security);
```

---

## 2. Basic Storage Operations

### 2.1 Store Data

```typescript
/**
 * Store local data
 * @param key   Storage key
 * @param value Storage value
 * @returns     Whether successful
 */

// Store string
oops.storage.set('username', 'Player001');

// Store number
oops.storage.set('level', 50);

// Store boolean
oops.storage.set('isNewPlayer', true);

// Store object (auto JSON serialization)
const playerData = {
    uid: 10001,
    name: 'Player001',
    level: 50
};
oops.storage.set('playerData', playerData);
```

### 2.2 Read Data

```typescript
/**
 * Get data for specified key
 * @param key          Key
 * @param defaultValue Default value
 * @returns            Stored value or default value
 */

// Read string (default returns empty string)
const username = oops.storage.get('username');
const username2 = oops.storage.get('username', 'Guest');

// Read number
const level = oops.storage.getNumber('level', 1);

// Read boolean
const isNew = oops.storage.getBoolean('isNewPlayer', false);

// Read JSON object
const playerData = oops.storage.getJson('playerData', {});
```

### 2.3 Delete Data

```typescript
// Delete single key
oops.storage.remove('tempData');

// Batch delete
oops.storage.removeBatch(['temp1', 'temp2', 'temp3']);

// Clear all storage (dangerous operation)
oops.storage.clear();
```

### 2.4 Check and Query

```typescript
// Check if key exists
const exists = oops.storage.has('playerData');

// Get all current user keys
const keys = oops.storage.getAllKeys();

// Get storage usage info
const info = oops.storage.getStorageInfo();
console.log(`Stored ${info.keyCount} keys, estimated size: ${info.estimatedSize} bytes`);
```

---

## 3. Batch Operations

### 3.1 Batch Storage

```typescript
/**
 * Batch storage (performance optimization: reduce 40-60% call overhead)
 * @param data Key-value pair object
 * @returns    Number successfully stored
 */

const data = {
    'player.name': 'Player001',
    'player.level': 50,
    'player.gold': 10000
};

const successCount = oops.storage.setBatch(data);
```

### 3.2 Batch Read

```typescript
/**
 * Batch get (performance optimization)
 * @param keys          Key array to get
 * @param defaultValues Default value object (optional)
 * @returns             Key-value pair object
 */

const keys = ['player.name', 'player.level', 'player.gold'];
const result = oops.storage.getBatch(keys);
```

---

## 4. User Data Isolation

### 4.1 Set User ID

```typescript
// Set user ID after login
oops.storage.setUser('user_10001');

// Stored data will auto-add user prefix
oops.storage.set('level', 50);  // Actual storage: user_10001_level

// Read will also auto-handle
const level = oops.storage.get('level');  // Read: user_10001_level
```

### 4.2 Clear User Data

```typescript
// Clear all current user data
oops.storage.clearUser();
```

---

## 5. Resource Release

```typescript
// Release storage manager resources (call when switching scenes or not needed)
oops.storage.dispose();
```

---

## 6. Backpack Module Storage Example

### 6.1 Save Backpack Data

```typescript
import { oops } from 'db://oops-framework/core/Oops';
import { CCBusiness } from 'db://oops-framework/module/common/CCBusiness';
import { Backpack } from '../Backpack';
import { IRemoteProp } from '../BackpackEvent';

export class B_Backpack_Storage extends CCBusiness<Backpack> {
    private static readonly KEY_BACKPACK = 'backpack_data';

    /** Save backpack data to local */
    saveBackpack(): void {
        const data: IRemoteProp[] = [];
        this.ent.M_Backpack_Main.props.forEach((prop) => {
            data.push({
                propId: prop.M_Prop_Main.id,
                amount: prop.M_Prop_Main.amount
            });
        });

        oops.storage.set(B_Backpack_Storage.KEY_BACKPACK, data);
        oops.log.logBusiness('Backpack data saved', 'Backpack');
    }

    /** Load backpack data from local */
    loadBackpack(): IRemoteProp[] | null {
        return oops.storage.getJson<IRemoteProp[]>(B_Backpack_Storage.KEY_BACKPACK);
    }

    /** Clear local backpack save */
    clearBackpack(): void {
        oops.storage.remove(B_Backpack_Storage.KEY_BACKPACK);
    }
}
```

### 6.2 Batch Save Settings

```typescript
/** Batch save backpack settings */
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

## 7. API Quick Reference

| Method | Parameters | Return Value | Description |
|--------|-----------|-------------|-------------|
| `init(iis)` | `IStorageSecurity` | `void` | Initialize encryption |
| `setUser(id)` | `string` | `void` | Set user ID |
| `set(key, value)` | `string, any` | `boolean` | Store data |
| `get(key, default?)` | `string, any` | `string` | Read data |
| `getNumber(key, default?)` | `string, number` | `number` | Read number |
| `getBoolean(key, default?)` | `string, boolean` | `boolean` | Read boolean |
| `getJson(key, default?)` | `string, T` | `T` | Read JSON object |
| `remove(key)` | `string` | `boolean` | Delete single key |
| `removeBatch(keys)` | `string[]` | `number` | Batch delete |
| `clear()` | None | `void` | Clear all storage |
| `clearUser()` | None | `void` | Clear current user data |
| `setBatch(data)` | `Record<string, any>` | `number` | Batch storage |
| `getBatch(keys, defaults?)` | `string[], Record?` | `Record<string, string>` | Batch read |
| `has(key)` | `string` | `boolean` | Check if key exists |
| `getAllKeys()` | None | `string[]` | Get all keys |
| `getStorageInfo()` | None | `{keyCount, estimatedSize}` | Get storage info |
| `dispose()` | None | `void` | Release resources |

---

## 8. Related Skills

| Scenario | Recommended Skill |
|----------|------------------|
| Business layer writing | `oops-guide-business` |
| Model layer writing | `oops-guide-model` |
