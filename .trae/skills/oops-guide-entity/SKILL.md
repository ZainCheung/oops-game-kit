---
name: "oops-guide-entity"
description: "Oops Framework Entity layer writing specification. Called when user needs to create module entry, register Entity, or manage Model and Business layer components."
triggers:
  keywords:
    - "Entity"
    - "entity"
    - "module entry"
    - "CCEntity"
    - "ecs.register"
    - "addComponents"
    - "addBusinesss"
  patterns:
    - ".*Entity.*"
    - ".*entity.*"
    - ".*module entry.*"
---

# Oops Framework Entity Layer Specification

## Usage Instructions

When generating Entity layer code, **must** follow this workflow:

1. Open `oops-rule-coding.md`, find **"1. Entity Layer Meta-Template"**
2. Copy the meta-template, replace `[Module]` placeholder
3. Based on user requirements, decide which Businesses to register (usually at least `B_[Module]_Main` and `B_[Module]_ViewUI`)
4. Check item by item against mandatory requirements below

## Mandatory Meta-Template (from oops-rule-coding.md)

```typescript
import { ecs } from 'db://oops-framework/libs/ecs/ECS';
import { CCEntity } from 'db://oops-framework/module/common/CCEntity';
import { B_[Module]_Main } from './bll/B_[Module]_Main';
import { B_[Module]_ViewUI } from './bll/B_[Module]_ViewUI';
import { M_[Module]_Main } from './model/M_[Module]_Main';

@ecs.register('[Module]')
export class [Module] extends CCEntity {
    M_[Module]_Main!: M_[Module]_Main;

    B_[Module]_Main!: B_[Module]_Main;
    B_[Module]_ViewUI!: B_[Module]_ViewUI;

    protected init() {
        this.addComponents(M_[Module]_Main);
        this.addBusinesss(B_[Module]_Main, B_[Module]_ViewUI);
    }
}
```

## Mandatory Requirements

| Check Item | Requirement |
|-----------|-------------|
| Inheritance | Must inherit `CCEntity` |
| Decorator | `@ecs.register('[Module]')`, parameter **without prefix** |
| Model property | Use `!` assertion, e.g. `M_[Module]_Main!: M_[Module]_Main` |
| init() | Only contains component registration, **absolutely no business logic** |

## Common Errors

```typescript
// ❌ Error - Writing business logic in init()
protected init() {
    this.addComponents(M_Backpack_Main);
    if (this.someCondition) {  // Prohibited! This is business logic
        this.addBusinesss(B_Backpack_Main);
    }
}

// ❌ Error - Encapsulating business methods in Entity
getProp(id: number) {
    return this.M_Backpack_Main.props.get(id);  // Prohibited! Should be implemented in Business layer
}
```

## Related Specifications

- Meta-template definition: `../rules/oops-rule-coding.md` Section 1
- Core constraints: `../rules/oops-rule-core.md` Chapter 5
- Project structure: `../rules/oops-rule-structure.md`
