---
name: "oops-core-random"
description: "Oops Framework random number module usage guide. Called when user needs to generate random numbers, randomly extract array elements, fixed-sum random allocation, or use seed random. Covers RandomManager random manager and SeedRandom seed random usage."
triggers:
  keywords:
    - "random"
    - "random number"
    - "RandomManager"
    - "SeedRandom"
    - "random extract"
    - "fixed-sum random"
    - "seed random"
    - "random allocation"
    - "oops.random"
    - "getRandomInt"
    - "getRandomFloat"
  patterns:
    - ".*random.*"
    - "RandomManager.*"
    - "SeedRandom.*"
---

# Oops Framework Random Number Module

This document introduces Oops Framework's random number system, including basic random number generation, array random extraction, fixed-sum allocation, and seed random features.

## Trigger Conditions

**Call this skill when user needs the following operations**:
- Generate random numbers in specified range
- Randomly extract elements from array
- Fixed-sum random allocation (e.g., attribute point allocation)
- Use seed random to ensure reproducibility
- Set custom random algorithm

**Non-matching cases** (use other skills/documents):

| Scenario | Recommended Skill/Document |
|----------|---------------------------|
| Coding standards | `../rules/oops-rule-coding.md` |

---

## 1. Random Manager (RandomManager)

### 1.1 Get Instance

```typescript
import { oops } from 'db://oops-framework/core/Oops';

// Access through oops
oops.random.getRandomInt(1, 100);

// Or directly get singleton
import { RandomManager } from 'db://oops-framework/core/common/random/RandomManager';
RandomManager.instance.getRandomInt(1, 100);
```

### 1.2 Set Custom Random Library

```typescript
// Use third-party random library (e.g., seedrandom)
import * as seedrandom from 'seedrandom';

RandomManager.instance.setRandom(seedrandom('my-seed'));
```

---

## 2. Basic Random Number Generation

### 2.1 Random Float

```typescript
/**
 * Generate random float in specified range
 * @param min Minimum value (inclusive)
 * @param max Maximum value (exclusive)
 */

// [0, 1) default range
const r1 = oops.random.getRandomFloat();

// [10, 20) specified range
const r2 = oops.random.getRandomFloat(10, 20);
```

### 2.2 Random Integer

```typescript
/**
 * Generate random integer in specified range
 * @param min  Minimum value
 * @param max  Maximum value
 * @param type Interval type (1, 2, 3)
 *   - type 1: [min, max)  Left-closed right-open, includes min, excludes max
 *   - type 2: [min, max]  Closed interval, includes min and max (default)
 *   - type 3: (min, max)  Open interval, excludes min and max
 */

// [1, 10] includes 1 and 10 (default)
const dice = oops.random.getRandomInt(1, 6, 2);

// [0, 100) includes 0, excludes 100
const percent = oops.random.getRandomInt(0, 100, 1);

// (0, 100) excludes 0 and 100
const exclusive = oops.random.getRandomInt(0, 100, 3);
```

### 2.3 Interval Type Comparison

| type | Interval | Includes min | Includes max | Example (1, 10) |
|------|----------|-------------|-------------|----------------|
| 1 | [min, max) | ✅ | ❌ | 1, 2, ..., 9 |
| 2 | [min, max] | ✅ | ✅ | 1, 2, ..., 10 |
| 3 | (min, max) | ❌ | ❌ | 2, 3, ..., 9 |

---

## 3. Array Random Operations

### 3.1 Generate Random Number Array

```typescript
/**
 * Generate random number array in specified range (allow duplicates)
 * @param min Minimum value
 * @param max Maximum value
 * @param n   Random count
 */

// Generate 5 random integers in [50, 100]
const values = oops.random.getRandomByMinMaxList(50, 100, 5);
// Result: [67, 82, 50, 91, 73] (may duplicate)
```

### 3.2 Random Extract from Array (No Duplicates)

```typescript
/**
 * Get random objects from array (no duplicate extraction)
 * @param objects Object array
 * @param n       Random count (cannot exceed array length)
 */

// Extract 3 from prop list
const props = [
    { id: 1001, name: 'Potion', type: 1 },
    { id: 1002, name: 'Sword', type: 2 },
    { id: 1003, name: 'Shield', type: 2 },
    { id: 1004, name: 'Scroll', type: 3 },
];
const selectedProps = oops.random.getRandomByObjectList(props, 3);
```

---

## 4. Fixed-Sum Random Allocation

### 4.1 Basic Usage

```typescript
/**
 * Fixed-sum random allocation (randomly allocate a total sum into n parts)
 * @param n   Number of parts
 * @param sum Total sum (must be positive)
 */

// Randomly allocate 100 attribute points to 5 attributes
const attributes = oops.random.getRandomBySumList(5, 100);
// Result: [23, 15, 31, 8, 23] (sum is 100)
```

### 4.2 Fixed-Sum Allocation Characteristics

- Each part can be 0
- Last part takes remaining value to ensure accurate sum
- Allocation result is random, not guaranteed uniform

```typescript
const result1 = oops.random.getRandomBySumList(3, 10);
// Possible result: [0, 7, 3] - First part can be 0
```

---

## 5. Seed Random (SeedRandom)

### 5.1 Basic Usage

```typescript
import { SeedRandom } from 'db://oops-framework/core/common/random/SeedRandom';

// Create seed random instance
const seedRandom = new SeedRandom('my-seed-string');

// Use seed random to generate
const value1 = seedRandom.random.getRandomInt(1, 100);
const value2 = seedRandom.random.getRandomFloat(0, 1);

// Destroy instance
seedRandom.destroy();
```

### 5.2 Application Scenarios

```typescript
// Reproducible game map
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

// Same seed generates same map
const map1 = generateMap('level-1');
const map2 = generateMap('level-1'); // Same as map1
```

### 5.3 Seed Random Characteristics

- Same seed produces same random sequence
- Independent of global random state
- Need manual destroy to release memory

---

## 6. Backpack Module Random Example

### 6.1 Random Prop Drop

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

    /** Random prop drop */
    randomLoot(count: number = 3): void {
        // Randomly extract non-duplicate props
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

### 6.2 Random Reward Allocation

```typescript
/** Randomly allocate reward to multiple prop types */
randomDistributeReward(totalAmount: number): IRemoteProp[] {
    // Randomly allocate total to 3 prop types
    const distribution = oops.random.getRandomBySumList(3, totalAmount);
    
    return [
        { propId: 1001, amount: distribution[0] },
        { propId: 1002, amount: distribution[1] },
        { propId: 1003, amount: distribution[2] },
    ];
}
```

---

## 7. Related Skills

| Scenario | Recommended Skill |
|----------|------------------|
| Business layer writing | `oops-guide-business` |
