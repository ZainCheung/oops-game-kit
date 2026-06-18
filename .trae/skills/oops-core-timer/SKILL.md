---
name: "oops-core-timer"
description: "Oops Framework 定时器模块使用指南。当用户需要实现倒计时、定时触发、服务器时间同步或需要管理多个定时器时调用。涵盖 Timer 基础定时器和 TimerManager 定时器管理器的使用方法。"
triggers:
  keywords:
    - "定时器"
    - "timer"
    - "TimerManager"
    - "倒计时"
    - "定时触发"
    - "CD"
    - "冷却时间"
    - "服务器时间"
    - "oops.timer"
  patterns:
    - ".*定时.*"
    - ".*timer.*"
    - "TimerManager.*"
    - ".*倒计时.*"
    - ".*冷却.*"
---

# Oops Framework 定时器模块

本文档介绍 Oops Framework 的定时器系统，包括基础定时器、倒计时管理、服务器时间同步等功能。

## 触发条件

**当用户需要以下操作时调用此技能**：
- 实现倒计时功能
- 定时触发事件
- 服务器时间同步
- 管理多个定时器
- 实现CD冷却时间

**不匹配的情况**（使用其他技能）：

| 场景 | 推荐技能/文档 |
|------|--------------|
| 编码标准 | `../rules/oops-rule-coding.md` |

---

## 1. 定时器管理器 (TimerManager)

### 1.1 获取实例

```typescript
import { oops } from 'db://oops-framework/core/Oops';

// 通过 oops 访问（推荐）
oops.timer.register(this.data, "countDown", this, this.onSecond, this.onComplete);

// 或直接导入
import { TimerManager } from 'db://oops-framework/core/common/timer/TimerManager';
```

> **注意**：TimerManager 是单例组件，通过 `oops.timer` 访问，没有 `.instance` 属性。

---

## 2. 基础定时器 (Timer)

`Timer` 是一个轻量级的定时触发组件，用于在指定时间间隔触发回调。

### 2.1 创建与使用

```typescript
import { Timer } from 'db://oops-framework/core/common/timer/Timer';

// 创建1秒间隔的定时器
const timer = new Timer(1);

// 设置回调函数
timer.callback = () => {
    console.log("每秒触发一次");
};

// 在 update 中更新定时器
update(dt: number) {
    if (timer.update(dt)) {
        // 定时器触发时返回 true
        console.log("定时器触发");
    }
}

// 获取进度（0-1）
const progress = timer.progress;

// 获取已逝去时间
const elapsed = timer.elapsedTime;
```

### 2.2 Timer API

| 属性/方法 | 类型 | 说明 |
|-----------|------|------|
| `step` | `number` | 触发间隔时间（秒） |
| `elapsedTime` | `number` | 已逝去时间（秒） |
| `progress` | `number` | 当前进度（0-1） |
| `callback` | `Function \| null` | 触发时的回调函数 |
| `update(dt)` | `boolean` | 更新定时器，触发返回 true |
| `reset()` | `void` | 重置已逝去时间 |
| `stop()` | `void` | 停止定时器 |
| `destroy()` | `void` | 销毁定时器，释放内存 |

---

## 3. 倒计时功能

### 3.1 注册倒计时

使用 `register` 方法在指定对象上注册一个带回调的倒计时管理器：

```typescript
export class Test extends Component {
    private timeId!: string;
    private data = { countDown: 10 };

    start() {
        // 在指定对象上注册倒计时回调管理器
        this.timeId = oops.timer.register(
            this.data,           // 数据对象
            "countDown",         // 时间字段名（必须是数字类型）
            this,                // 触发事件的对象
            this.onSecond,       // 每秒事件回调（可选）
            this.onComplete      // 倒计时完成事件回调（可选）
        );
    }

    private onSecond() {
        console.log("每秒触发一次，当前值:", this.data.countDown);
    }

    private onComplete() {
        console.log("倒计时完成触发");
    }

    onDestroy() {
        // 注销倒计时
        oops.timer.unRegister(this.timeId);
    }
}
```

### 3.2 倒计时管理器 API

| 方法 | 参数 | 说明 |
|------|------|------|
| `register(object, field, target, onSecond?, onComplete?)` | `object`: 数据对象, `field`: 字段名, `target`: 事件目标, `onSecond?`: 每秒回调, `onComplete?`: 完成回调 | 注册倒计时，返回倒计时编号 |
| `unRegister(id)` | `id`: 倒计时编号 | 注销指定倒计时 |
| `addCallback(id, onSecond?, onComplete?)` | `id`: 倒计时编号, `onSecond?`: 每秒回调, `onComplete?`: 完成回调 | 为指定倒计时添加回调 |
| `removeCallback(id, onSecond?, onComplete?)` | `id`: 倒计时编号, `onSecond?`: 要移除的回调, `onComplete?`: 要移除的回调 | 移除指定倒计时的回调 |
| `has(id)` | `id`: 倒计时编号 | 检查指定 id 的定时器是否存在 |
| `getTimerCount()` | 无 | 获取当前活跃的定时器数量 |
| `clear()` | 无 | 清理所有定时器，释放内存 |

---

## 4. 服务器时间同步

### 4.1 设置与获取服务器时间

```typescript
// 从服务器获取时间后设置
const serverTime = await fetchServerTime();
oops.timer.setServerTime(serverTime);

// 获取当前服务器时间（毫秒时间戳）
const currentServerTime = oops.timer.getServerTime();

// 获取服务器时间对象
const serverDate = oops.timer.getServerDate();
```

### 4.2 本地时间

```typescript
// 获取本地时间（毫秒时间戳）
const clientTime = oops.timer.getClientTime();

// 获取本地时间对象
const clientDate = oops.timer.getClientDate();

// 获取游戏开始到现在逝去的时间（毫秒）
const gameTime = oops.timer.getTime();
```

### 4.3 服务器倒计时示例

```typescript
export class EventTimer extends Component {
    private timeId!: string;
    private eventData = { endTime: 3600 }; // 1小时倒计时

    start() {
        // 基于服务器时间的倒计时
        const serverNow = oops.timer.getServerTime();
        const endTime = serverNow + 3600 * 1000; // 1小时后
        
        // 计算剩余秒数
        this.eventData.endTime = Math.floor((endTime - serverNow) / 1000);
        
        this.timeId = oops.timer.register(
            this.eventData,
            "endTime",
            this,
            this.onSecond,
            this.onComplete
        );
    }

    private onSecond() {
        console.log(`活动剩余时间: ${this.eventData.endTime} 秒`);
    }

    private onComplete() {
        console.log("活动结束");
    }

    onDestroy() {
        oops.timer.unRegister(this.timeId);
    }
}
```

---

## 5. 游戏前后台切换处理

```typescript
// 游戏最小化时保存时间数据
oops.timer.save();

// 游戏最大化时恢复时间数据
oops.timer.load();
```

---

## 6. 背包模块定时器示例

### 6.1 限时道具倒计时

```typescript
import { oops } from 'db://oops-framework/core/Oops';
import { TimeUtil } from 'db://oops-framework/core/utils/TimeUtils';
import { CCBusiness } from 'db://oops-framework/module/common/CCBusiness';
import { Backpack } from '../Backpack';

export class B_Backpack_LimitedTime extends CCBusiness<Backpack> {
    /** 限时道具倒计时数据 */
    private limitData: Map<number, { time: number }> = new Map();
    /** 限时道具定时器ID */
    private limitTimers: Map<number, string> = new Map();

    /** 设置道具限时 */
    setLimitedTime(propId: number, endTime: number): void {
        const prop = this.ent.M_Backpack_Main.props.get(propId);
        if (!prop) return;

        // 计算剩余秒数
        const remaining = Math.max(0, Math.floor((endTime - oops.timer.getServerTime()) / 1000));
        
        // 创建或更新倒计时数据
        if (!this.limitData.has(propId)) {
            this.limitData.set(propId, { time: 0 });
        }
        const data = this.limitData.get(propId)!;
        data.time = remaining;

        // 注册倒计时
        const timerId = oops.timer.register(
            data,
            "time",
            this,
            () => {
                oops.log.logBusiness(`道具 ${propId} 剩余时间: ${TimeUtil.format(data.time)}`, 'Backpack');
            },
            () => {
                oops.log.logBusiness(`道具 ${propId} 已过期`, 'Backpack');
                // 处理道具过期逻辑
                this.limitTimers.delete(propId);
            }
        );

        this.limitTimers.set(propId, timerId);
    }

    /** 清理道具定时器 */
    clearLimitedTime(propId: number): void {
        const timerId = this.limitTimers.get(propId);
        if (timerId) {
            oops.timer.unRegister(timerId);
            this.limitTimers.delete(propId);
        }
    }

    reset(): void {
        // 清理所有限时道具定时器
        for (const timerId of this.limitTimers.values()) {
            oops.timer.unRegister(timerId);
        }
        this.limitTimers.clear();
        this.limitData.clear();
    }
}
```

---

## 7. 最佳实践

### 7.1 使用建议

| 场景 | 推荐方法 | 说明 |
|------|----------|------|
| 简单定时触发 | `Timer` | 轻量级定时器，需手动在 update 中调用 |
| 带UI更新的倒计时 | `register` / `unRegister` | 自动管理每秒回调和完成事件 |
| 服务器时间相关 | `setServerTime` / `getServerTime` | 基于服务器时间的倒计时 |
| 多个倒计时管理 | `addCallback` / `removeCallback` | 动态添加/移除回调 |

### 7.2 注意事项

```typescript
// ✅ 推荐：及时注销倒计时
onDestroy() {
    oops.timer.unRegister(this.timeId);
}

// ❌ 避免：内存泄漏
// 组件销毁后倒计时仍在运行

// ✅ 推荐：使用数据对象字段存储倒计时值
private data = { countDown: 10 };
oops.timer.register(this.data, "countDown", this, this.onSecond, this.onComplete);

// ❌ 避免：直接使用原始值
// register 方法需要对象和字段名来修改值

// ✅ 推荐：使用服务器时间进行重要倒计时
const serverTimer = oops.timer.getServerTime();

// ❌ 避免：依赖本地时间进行关键逻辑
// 用户可能修改系统时间

// ✅ 推荐：游戏前后台切换时保存/恢复
game.on(Game.EVENT_HIDE, () => oops.timer.save());
game.on(Game.EVENT_SHOW, () => oops.timer.load());
```

---

## 8. 关联技能

| 场景 | 推荐技能 |
|------|---------|
| 代码风格规范 | `oops-guide-code-style` |
| 日志调试 | `oops-core-log` |
| 数据存储 | `oops-core-storage` |
| Business 层编写 | `oops-guide-business` |
