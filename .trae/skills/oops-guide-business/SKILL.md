---
name: "oops-guide-business"
description: "Oops Framework Business layer writing specification. Called when user needs to write business logic, event listeners, or data operations."
triggers:
  keywords:
    - "Business"
    - "business logic"
    - "CCBusiness"
    - "bll"
    - "business layer"
    - "setWatch"
    - "init()"
  patterns:
    - ".*Business.*"
    - ".*business.*"
    - ".*business logic.*"
---

# Oops Framework Business Layer Specification

## Usage Instructions

When generating Business layer code, **must** follow this workflow:

1. Open `oops-rule-coding.md`, find **"3. Business Layer Meta-Template"**
2. Copy the meta-template, replace `[Module]` placeholder
3. Register all events needing listening in `setWatch()`
4. Implement event handler methods, **strictly match signature format**
5. Check item by item against mandatory requirements below

## Mandatory Meta-Template (from oops-rule-coding.md)

```typescript
import { CCBusiness } from 'db://oops-framework/module/common/CCBusiness';
import { [Module] } from '../[Module]';
import { [Module]EventName, I[Module]EventDataMap } from '../[Module]Event';

export class B_[Module]_Main extends CCBusiness<[Module]> {
    protected init() {
        this.setWatch();
    }

    /** Register event listeners - All events registered here uniformly */
    private setWatch() {
        // this.watch([Module]EventName.[EventKey], this.on[EventName], this);
    }

    //#region Global event handling
    // private on[EventName]<K extends [Module]EventName.[EventKey]>(event: K, data: I[Module]EventDataMap[K]): void {
    //     // Business logic
    // }
    //#endregion

    //#region Business logic
    //#endregion
}
```

## Mandatory Requirements

| Check Item | Requirement |
|-----------|-------------|
| Inheritance | Must inherit `CCBusiness<[Module]>` |
| init() | **Must** call `setWatch()` |
| setWatch() | All `watch()` unified here, third parameter must be `this` |
| Event handler signature | **Must exactly match**: `private onXxx<K extends [Module]EventName.Xxx>(event: K, data: I[Module]EventDataMap[K]): void` |
| Trigger event | Use `this.emit()` |
| Log | Business layer uses `oops.log.logBusiness(msg, module)` |

## Event Handler Method Signature (Absolutely No Deformation)

```typescript
// ✅ Only correct format
private on[EventName]<K extends [Module]EventName.[EventKey]>(event: K, data: I[Module]EventDataMap[K]): void {
    // Implementation logic
}
```

**Prohibited**:
- ❌ Omit `event: K` parameter
- ❌ Use `keyof I[Module]EventDataMap`
- ❌ Modify parameter order or generic constraint format
- ❌ Free-form signature

## Common Errors

```typescript
// ❌ Error - Event handler signature deformed
private onBackpackUse(data: IBackpackEventDataMap[BackpackEventName.Use]): void  // Missing event: K

// ❌ Error - Using keyof
private onBackpackUse<K extends keyof IBackpackEventDataMap>(event: K, data: IBackpackEventDataMap[K]): void

// ❌ Error - Not calling setWatch()
protected init() {
    // Forgot to call this.setWatch()!
}

// ❌ Error - watch third parameter not this
this.watch(BackpackEventName.Use, this.onBackpackUse);  // Missing this!
```

## Related Specifications

- Meta-template definition: `../rules/oops-rule-coding.md` Section 3
- Core constraints: `../rules/oops-rule-core.md` Chapter 1, Chapter 4
- Event system: `oops-guide-event`
