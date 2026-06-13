---
name: "oops-core-timer"
description: "Oops Framework timer module usage guide. Called when user needs to implement countdown, timed trigger, server time sync, or manage multiple timers. Covers Timer basic timer and TimerManager timer manager usage."
triggers:
  keywords:
    - "timer"
    - "TimerManager"
    - "countdown"
    - "timed trigger"
    - "CD"
    - "cooldown"
    - "server time"
    - "oops.timer"
  patterns:
    - ".*timer.*"
    - "TimerManager.*"
    - ".*countdown.*"
    - ".*cooldown.*"
---

# Oops Framework Timer Module

This document introduces Oops Framework's timer system, including basic timer, countdown management, server time sync, and other features.

## Trigger Conditions

**Call this skill when user needs the following operations**:
- Implement countdown functionality
- Timed trigger events
- Server time synchronization
- Manage multiple timers
- Implement CD cooldown time

**Non-matching cases** (use other skills/documents):

| Scenario | Recommended Skill/Document |
|----------|---------------------------|
| Coding standards | `../rules/oops-rule-coding.md` |

---

## 1. Timer Manager (TimerManager)

### 1.1 Get Instance

```typescript
import { oops } from 'db://oops-framework/core/Oops';

// Access through oops (recommended)
oops.timer.register(this.data, "countDown", this, this.onSecond, this.onComplete);

// Or import directly
import { TimerManager } from 'db://oops-framework/core/common/timer/TimerManager';
```

> **Note**: TimerManager is a singleton component, accessed through `oops.timer`, has no `.instance` property.

---

## 2. Basic Timer (Timer)

`Timer` is a lightweight timed trigger component, used to trigger callbacks at specified intervals.

### 2.1 Create and Use

```typescript
import { Timer } from 'db://oops-framework/core/common/timer/Timer';

// Create 1-second interval timer
const timer = new Timer(1);

// Set callback function
timer.callback = () => {
    console.log("Trigger every second");
};

// Update timer in update
update(dt: number) {
    if (timer.update(dt)) {
        // Timer returns true when triggered
        console.log("Timer triggered");
    }
}

// Get progress (0-1)
const progress = timer.progress;

// Get elapsed time
const elapsed = timer.elapsedTime;
```

### 2.2 Timer API

| Property/Method | Type | Description |
|----------------|------|-------------|
| `step` | `number` | Trigger interval time (seconds) |
| `elapsedTime` | `number` | Elapsed time (seconds) |
| `progress` | `number` | Current progress (0-1) |
| `callback` | `Function \| null` | Callback function when triggered |
| `update(dt)` | `boolean` | Update timer, returns true when triggered |
| `reset()` | `void` | Reset elapsed time |
| `stop()` | `void` | Stop timer |
| `destroy()` | `void` | Destroy timer, release memory |

---

## 3. Countdown Function

### 3.1 Register Countdown

Use `register` method to register a countdown manager with callbacks on specified object:

```typescript
export class Test extends Component {
    private timeId!: string;
    private data = { countDown: 10 };

    start() {
        // Register countdown callback manager on specified object
        this.timeId = oops.timer.register(
            this.data,           // Data object
            "countDown",         // Time field name (must be number type)
            this,                // Object triggering events
            this.onSecond,       // Per-second event callback (optional)
            this.onComplete      // Countdown complete event callback (optional)
        );
    }

    private onSecond() {
        console.log("Trigger every second, current value:", this.data.countDown);
    }

    private onComplete() {
        console.log("Countdown complete triggered");
    }

    onDestroy() {
        // Unregister countdown
        oops.timer.unRegister(this.timeId);
    }
}
```

### 3.2 Countdown Manager API

| Method | Parameters | Description |
|--------|-----------|-------------|
| `register(object, field, target, onSecond?, onComplete?)` | `object`: Data object, `field`: Field name, `target`: Event target, `onSecond?`: Per-second callback, `onComplete?`: Complete callback | Register countdown, returns countdown ID |
| `unRegister(id)` | `id`: Countdown ID | Unregister specified countdown |
| `addCallback(id, onSecond?, onComplete?)` | `id`: Countdown ID, `onSecond?`: Per-second callback, `onComplete?`: Complete callback | Add callbacks for specified countdown |
| `removeCallback(id, onSecond?, onComplete?)` | `id`: Countdown ID, `onSecond?`: Callback to remove, `onComplete?`: Callback to remove | Remove callbacks for specified countdown |
| `has(id)` | `id`: Countdown ID | Check if specified id timer exists |
| `getTimerCount()` | None | Get current active timer count |
| `clear()` | None | Clear all timers, release memory |

---

## 4. Server Time Sync

### 4.1 Set and Get Server Time

```typescript
// Set after getting time from server
const serverTime = await fetchServerTime();
oops.timer.setServerTime(serverTime);

// Get current server time (millisecond timestamp)
const currentServerTime = oops.timer.getServerTime();

// Get server time object
const serverDate = oops.timer.getServerDate();
```

### 4.2 Local Time

```typescript
// Get local time (millisecond timestamp)
const clientTime = oops.timer.getClientTime();

// Get local time object
const clientDate = oops.timer.getClientDate();

// Get elapsed time since game start (milliseconds)
const gameTime = oops.timer.getTime();
```

### 4.3 Server Countdown Example

```typescript
export class EventTimer extends Component {
    private timeId!: string;
    private eventData = { endTime: 3600 }; // 1 hour countdown

    start() {
        // Server time based countdown
        const serverNow = oops.timer.getServerTime();
        const endTime = serverNow + 3600 * 1000; // 1 hour later
        
        // Calculate remaining seconds
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
        console.log(`Event remaining time: ${this.eventData.endTime} seconds`);
    }

    private onComplete() {
        console.log("Event ended");
    }

    onDestroy() {
        oops.timer.unRegister(this.timeId);
    }
}
```

---

## 5. Game Foreground/Background Switch Handling

```typescript
// Save time data when game minimized
oops.timer.save();

// Restore time data when game maximized
oops.timer.load();
```

---

## 6. Backpack Module Timer Example

### 6.1 Limited Time Prop Countdown

```typescript
import { oops } from 'db://oops-framework/core/Oops';
import { TimeUtil } from 'db://oops-framework/core/utils/TimeUtils';
import { CCBusiness } from 'db://oops-framework/module/common/CCBusiness';
import { Backpack } from '../Backpack';

export class B_Backpack_LimitedTime extends CCBusiness<Backpack> {
    /** Limited time prop countdown data */
    private limitData: Map<number, { time: number }> = new Map();
    /** Limited time prop timer IDs */
    private limitTimers: Map<number, string> = new Map();

    /** Set prop limited time */
    setLimitedTime(propId: number, endTime: number): void {
        const prop = this.ent.M_Backpack_Main.props.get(propId);
        if (!prop) return;

        // Calculate remaining seconds
        const remaining = Math.max(0, Math.floor((endTime - oops.timer.getServerTime()) / 1000));
        
        // Create or update countdown data
        if (!this.limitData.has(propId)) {
            this.limitData.set(propId, { time: 0 });
        }
        const data = this.limitData.get(propId)!;
        data.time = remaining;

        // Register countdown
        const timerId = oops.timer.register(
            data,
            "time",
            this,
            () => {
                oops.log.logBusiness(`Prop ${propId} remaining time: ${TimeUtil.format(data.time)}`, 'Backpack');
            },
            () => {
                oops.log.logBusiness(`Prop ${propId} expired`, 'Backpack');
                // Handle prop expiration logic
                this.limitTimers.delete(propId);
            }
        );

        this.limitTimers.set(propId, timerId);
    }

    /** Clear prop timer */
    clearLimitedTime(propId: number): void {
        const timerId = this.limitTimers.get(propId);
        if (timerId) {
            oops.timer.unRegister(timerId);
            this.limitTimers.delete(propId);
        }
    }

    reset(): void {
        // Clear all limited time prop timers
        for (const timerId of this.limitTimers.values()) {
            oops.timer.unRegister(timerId);
        }
        this.limitTimers.clear();
        this.limitData.clear();
    }
}
```

---

## 7. Best Practices

### 7.1 Usage Recommendations

| Scenario | Recommended Method | Description |
|----------|-------------------|-------------|
| Simple timed trigger | `Timer` | Lightweight timer, need manual call in update |
| Countdown with UI update | `register` / `unRegister` | Auto-manage per-second callback and complete event |
| Server time related | `setServerTime` / `getServerTime` | Server time based countdown |
| Multiple countdown management | `addCallback` / `removeCallback` | Dynamically add/remove callbacks |

### 7.2 Notes

```typescript
// ✅ Recommended: Unregister countdown in time
onDestroy() {
    oops.timer.unRegister(this.timeId);
}

// ❌ Avoid: Memory leak
// Component destroyed but countdown still running

// ✅ Recommended: Use data object field to store countdown value
private data = { countDown: 10 };
oops.timer.register(this.data, "countDown", this, this.onSecond, this.onComplete);

// ❌ Avoid: Directly use primitive value
// register method needs object and field name to modify value

// ✅ Recommended: Use server time for important countdowns
const serverTimer = oops.timer.getServerTime();

// ❌ Avoid: Depend on local time for critical logic
// User may modify system time

// ✅ Recommended: Save/restore when game foreground/background switches
game.on(Game.EVENT_HIDE, () => oops.timer.save());
game.on(Game.EVENT_SHOW, () => oops.timer.load());
```

---

## 8. Related Skills

| Scenario | Recommended Skill |
|----------|------------------|
| Log debugging | `oops-core-log` |
| Data storage | `oops-core-storage` |
| Business layer writing | `oops-guide-business` |
