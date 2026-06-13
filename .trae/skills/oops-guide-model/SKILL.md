---
name: "oops-guide-model"
description: "Oops Framework Model layer writing specification. Called when user needs to create data components, define data structures, or implement reset()."
triggers:
  keywords:
    - "Model"
    - "data layer"
    - "ecs.Comp"
    - "reset"
    - "data structure"
  patterns:
    - ".*Model.*"
    - ".*data.*"
    - ".*data layer.*"
---

# Oops Framework Model Layer Specification

## Usage Instructions

When generating Model layer code, **must** follow this workflow:

1. Open `oops-rule-coding.md`, find **"2. Model Layer Meta-Template"**
2. Copy the meta-template, replace `[Module]` placeholder
3. Only declare data fields explicitly requested by user
4. Implement `reset()` method to clean custom memory
5. Check item by item against mandatory requirements below

## Mandatory Meta-Template (from oops-rule-coding.md)

```typescript
import { ecs } from 'db://oops-framework/libs/ecs/ECS';

@ecs.register('M_[Module]_Main')
export class M_[Module]_Main extends ecs.Comp {
    /** Data fields - Only declare properties explicitly requested by user */
    // Example: items: SomeType[] = [];

    reset() {
        // Clean custom memory, release data references
    }
}
```

## Mandatory Requirements

| Check Item | Requirement |
|-----------|-------------|
| Inheritance | Must inherit `ecs.Comp` |
| Decorator | `@ecs.register('M_[Module]_Main')`, parameter **with M_ prefix** |
| reset() | **Must implement**; clean custom memory |
| Properties | Only declare data fields explicitly requested by user |
| Prohibited | ❌ No business logic; ❌ No unused property declarations |

## Common Errors

```typescript
// ❌ Error - Contains business logic
reset() {
    this.items.sort();  // Prohibited! This is business logic
}

// ❌ Error - Declares unused properties
private cache: Map<string, any> = new Map();  // User didn't request!

// ❌ Error - Decorator without M_ prefix
@ecs.register('Backpack_Main')  // Error! Should be M_Backpack_Main
```

## Related Specifications

- Meta-template definition: `../rules/oops-rule-coding.md` Section 2
- Core constraints: `../rules/oops-rule-core.md` Chapter 1
- Project structure: `../rules/oops-rule-structure.md`
