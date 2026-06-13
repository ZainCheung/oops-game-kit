---
name: "oops-core-log"
description: "Oops Framework log module usage guide. Called when user needs to use log features, understand log types, configure log filters, or implement custom log output. Covers LogType log types and Logger log manager usage."
triggers:
  keywords:
    - "log"
    - "Logger"
    - "LogType"
    - "print log"
    - "debug log"
    - "log filter"
    - "console.log"
    - "oops.log"
  patterns:
    - ".*log.*"
    - "LogType.*"
---

# Oops Framework Log Module

This document introduces Oops Framework's log system, including log types, usage methods, and configuration.

## Trigger Conditions

**Call this skill when user needs the following operations**:
- Use log features to print debug information
- Understand log types and categories
- Configure log filters to control output
- Implement custom log console
- Performance timing features

**Non-matching cases** (use other skills/documents):

| Scenario | Recommended Skill/Document |
|----------|---------------------------|
| Coding standards | `../rules/oops-rule-coding.md` |

---

## 1. Log Manager (Logger)

### 1.1 Get Instance

```typescript
import { oops } from 'db://oops-framework/core/Oops';

// Access through oops
oops.log.trace("Standard log");

// Or import directly
import { Logger } from 'db://oops-framework/core/common/log/Logger';
Logger.instance.trace("Standard log");
```

### 1.2 Log Types (LogType)

```typescript
/** Log types */
export enum LogType {
    Net = 1,        // Network layer log
    Model = 2,      // Data structure layer log
    Business = 4,   // Business logic layer log
    View = 8,       // View layer log
    Config = 16,    // Config log
    Trace = 32,     // Standard log
}
```

---

## 2. Basic Log Output

### 2.1 Standard Log

```typescript
// Standard log (black)
oops.log.trace("Normal info");

// Standard log with color
oops.log.trace("Normal info", "#ff0000");
```

### 2.2 Layered Logs

```typescript
// Network layer log (orange)
oops.log.logNet("Network request info", "Network");

// Data layer log (purple)
oops.log.logModel("Data change info", "Model");

// Business layer log (blue)
oops.log.logBusiness("Business logic info", "Business");

// View layer log (green)
oops.log.logView("View layer info", "View");

// Config log (gray)
oops.log.logConfig("Config info", "Config");
```

### 2.3 View Layer Dedicated Log

```typescript
// View layer log - for UI related log output
oops.log.logView("View layer info");

// Example: Backpack UI load complete
private onLoad() {
    super.onLoad();
    oops.log.logView("Backpack UI load complete");
}
```

> **Note**: View layer logs use `oops.log.logView()`, convenient for filtering UI related logs in console.

### 2.4 Log with Description

```typescript
// Use description to categorize logs
oops.log.logBusiness("Update backpack prop", "Backpack");
oops.log.logBusiness("Use prop complete", "Backpack");
oops.log.logNet("Request backpack data", "Network");
```

---

## 3. Log Configuration

### 3.1 Set Log Type Filter

```typescript
import { LogType } from 'db://oops-framework/core/common/log/Logger';

// Only show view and business layer logs
oops.log.setTags(LogType.View | LogType.Business);

// Show all logs
oops.log.setTags(
    LogType.Net |
    LogType.Model |
    LogType.Business |
    LogType.View |
    LogType.Config |
    LogType.Trace
);

// Show no logs (pass null)
oops.log.setTags(null!);
```

### 3.2 Enable/Disable Log

```typescript
// Completely disable log output (close all console methods)
oops.log.disable();
```

---

## 4. Custom Log Console

### 4.1 Set Custom Console

```typescript
import { ILoggerConsole } from 'db://oops-framework/core/common/log/Logger';

class MyLoggerConsole implements ILoggerConsole {
    trace(content: string, color: string): void {
        // Custom output logic, e.g., send to server
        console.log(content);
    }
}

// Set custom log console
oops.log.setLoggerConsole(new MyLoggerConsole());
```

---

## 5. Performance Timing

### 5.1 Basic Timing

```typescript
// Start timing
oops.log.start("Load backpack data");

// Execute operation
await loadBackpackData();

// End timing and output
oops.log.end("Load backpack data");  // Output: [Performance][Load backpack data]Cost[1234ms]
```

### 5.2 Multi-Segment Timing

```typescript
// Time multiple operations simultaneously
oops.log.start("Init backpack");
oops.log.start("Load prop resources");

await initBackpack();
oops.log.end("Init backpack");

await loadPropResources();
oops.log.end("Load prop resources");
```

---

## 6. Table Print

```typescript
// Print object table
const backpackData = {
    propCount: 50,
    capacity: 100,
    lastUpdate: Date.now()
};
oops.log.table(backpackData);
```

---

## 7. Backpack Module Log Example

### 7.1 Business Layer Log

```typescript
import { oops } from 'db://oops-framework/core/Oops';
import { CCBusiness } from 'db://oops-framework/module/common/CCBusiness';
import { Backpack } from '../Backpack';
import { BackpackEventName, IBackpackEventDataMap } from '../BackpackEvent';

export class B_Backpack_Main extends CCBusiness<Backpack> {
    protected init() {
        oops.log.logBusiness("Backpack business init complete", "Backpack");
        this.setWatch();
    }

    private setWatch() {
        this.watch(BackpackEventName.Use, this.onBackpackUse, this);
        this.watch(BackpackEventName.Update, this.onBackpackUpdate, this);
    }

    private onBackpackUse<K extends BackpackEventName.Use>(event: K, data: IBackpackEventDataMap[K]): void {
        oops.log.logBusiness(`Use prop: id=${data.id}, amount=${data.amount}`, "Backpack");
        this.use(data.id, data.amount, data.listId);
    }

    private onBackpackUpdate<K extends BackpackEventName.Update>(event: K, data: IBackpackEventDataMap[K]): void {
        oops.log.logBusiness(`Receive backpack data update: ${data.data.length} items`, "Backpack");
        data.data.forEach((p) => {
            this.update(p.propId, p.amount);
        });
    }

    private update(id: number, amount: number) {
        oops.log.logBusiness(`Update prop: id=${id}, amount=${amount}`, "Backpack");
        // ...
    }
}
```

### 7.2 View Layer Log

```typescript
import { oops } from 'db://oops-framework/core/Oops';
import { CCView } from 'db://oops-framework/module/common/CCView';
import { Backpack } from '../Backpack';

export class VC_Backpack_Main extends CCView<Backpack> {
    onLoad() {
        super.onLoad();
        oops.log.logView("Backpack UI load complete");
        this.setWatch();
    }

    private onBtnClose() {
        oops.log.logView("Close backpack UI");
        this.ent.B_Backpack_ViewUI.removeMain();
    }
}
```

---

## 8. Best Practices

### 8.1 Usage Recommendations

| Scenario | Recommended Method | Description |
|----------|-------------------|-------------|
| Standard log | `oops.log.trace()` | Regular log output |
| Network layer | `oops.log.logNet()` | Network request/response |
| Data layer | `oops.log.logModel()` | Data changes |
| Business layer | `oops.log.logBusiness()` | Business logic |
| View layer | `oops.log.logView()` | UI related logs |
| Config layer | `oops.log.logConfig()` | Config info |
| Performance analysis | `oops.log.start()` / `oops.log.end()` | Measure code execution time |
| Table print | `oops.log.table()` | Print object tables |

### 8.2 Notes

```typescript
// ✅ Recommended: Use description to categorize logs
oops.log.logBusiness("Update backpack prop", "Backpack");

// ❌ Avoid: Logs without description
oops.log.trace("Some info");  // Hard to categorize and filter

// ✅ Recommended: Disable logs in production
oops.log.disable();

// ❌ Avoid: Output large amounts of logs in production
// Will affect performance
```

---

## 9. Layered Log Specification

Oops Framework adopts three-tier architecture, each layer has corresponding log usage specification.

### 9.1 View Layer

View layer uses `oops.log.logView()` to output view related logs.

```typescript
export class VC_Backpack_Main extends CCView<Backpack> {
    onLoad() {
        super.onLoad();
        oops.log.logView("Backpack UI load complete");
    }
}
```

**View layer log usage scenarios**:

| Scenario | Recommended Method | Description |
|----------|-------------------|-------------|
| UI lifecycle | `oops.log.logView()` | Open, close, show, hide |
| User interaction | `oops.log.logView()` | Button click, list selection |
| Error info | `oops.log.logView()` | UI load failure etc. |

### 9.2 Business Layer

Business layer uses `oops.log.logBusiness()` to output business logic logs, recommend using module name as description for easy filtering.

```typescript
export class B_Backpack_Main extends CCBusiness<Backpack> {
    private update(id: number, amount: number) {
        oops.log.logBusiness(`Update prop: id=${id}, amount=${amount}`, "Backpack");
        // Business logic...
    }
}
```

**Business layer log usage scenarios**:

| Scenario | Recommended Method | Description |
|----------|-------------------|-------------|
| Business initialization | `oops.log.logBusiness()` | Business component init complete |
| Business method execution | `oops.log.logBusiness()` | Key business logic execution |
| Event handling | `oops.log.logBusiness()` | Receive/process events |
| Error info | `oops.log.logBusiness()` | Business logic errors |
| Performance timing | `oops.log.start()` / `oops.log.end()` | Time-consuming operations |

### 9.3 Model Layer

Data layer uses `oops.log.logModel()` to output data change logs.

```typescript
export class M_Backpack_Main extends ecs.Comp {
    props = new Collection<number, Prop>();

    reset() {
        oops.log.logModel("Clean backpack data", "Backpack");
        this.props.forEach((p) => p.destroy());
        this.props.clear();
    }
}
```

---

## 10. Related Skills

| Scenario | Recommended Skill |
|----------|------------------|
| Business layer writing | `oops-guide-business` |
| View layer writing | `oops-guide-view` |
| Model layer writing | `oops-guide-model` |
