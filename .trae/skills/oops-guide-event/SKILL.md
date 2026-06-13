---
name: "oops-guide-event"
description: "Oops Framework event system writing specification. Called when user needs to define module events, event data interfaces, or declare global extensions."
triggers:
  keywords:
    - "Event"
    - "event"
    - "event system"
    - "event definition"
    - "declare global"
    - "TypedEventMap"
    - "event enum"
  patterns:
    - ".*Event.*"
    - ".*event.*"
    - ".*declare global.*"
---

# Oops Framework Event System Specification

## Usage Instructions

When generating event system code, **must** follow this workflow:

1. Open `oops-rule-coding.md`, find **"4. Event Layer Meta-Template"**
2. Copy the meta-template, replace `[Module]` placeholder
3. Add event enums and event data interfaces based on user requirements
4. **Absolutely do not omit** `declare global` extension
5. Check item by item against mandatory requirements below

## Mandatory Meta-Template (from oops-rule-coding.md)

The event system consists of two files: `[Module]Event.ts` (enum and re-export) and `[Module]EventData.ts` (data interfaces and global declaration).

### [Module]Event.ts (Event Enum File)

```typescript
/** [Module] event enum */
export enum [Module]EventName {
    /** [Description] */
    [EventKey] = '[EventValue]',
}

export {
    type I[Module][EventKey]Data,
    type I[Module]EventDataMap,
} from './[Module]EventData';
```

> **⚠️ Key Constraint**: In `export { ... }` re-export syntax, **must** add `type` keyword. Types are only used at compile time, using `type` clearly identifies export nature and avoids circular dependency issues.

### [Module]EventData.ts (Event Data File)

```typescript
/** [Description] event data */
export interface I[Module][EventKey]Data {
    // Data fields
}

/** [Module] event data mapping */
export interface I[Module]EventDataMap {
    [EventValue]: I[Module][EventKey]Data;
}

// ✅ Must include - Extend global event types
declare global {
    namespace OopsFramework {
        interface TypedEventMap extends I[Module]EventDataMap {}
    }
}
```

## Mandatory Requirements

| Check Item | Requirement |
|-----------|-------------|
| Enum | Use `export enum [Module]EventName` |
| Mapping interface | Use `export interface I[Module]EventDataMap` |
| Enum values | String value format `on[Module][Action]` |
| Global extension | **Must include** `declare global` extending `TypedEventMap` |
| Export | `export { type ... }` re-export must add `type` keyword |

## Common Errors

```typescript
// ❌ Error - Omitting declare global
declare global {  // Must not omit!
    namespace OopsFramework {
        interface TypedEventMap extends IBackpackEventDataMap {}
    }
}

// ❌ Error - Enum key with prefix
export enum BackpackEventName {
    BackpackUse = 'onBackpackUse',  // Error! Key should be Use
}

// ✅ Correct
export enum BackpackEventName {
    Use = 'onBackpackUse',
}

// ❌ Error - export without type
export { IBackpackEventDataMap } from './BackpackEventData';  // Error! Should be export { type IBackpackEventDataMap }
```

## Related Specifications

- Meta-template definition: `../rules/oops-rule-coding.md` Section 4
- Core constraints: `../rules/oops-rule-core.md` Chapter 4
- Business layer event usage: `oops-guide-business`
