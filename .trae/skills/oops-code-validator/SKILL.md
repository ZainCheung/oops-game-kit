---
name: "oops-code-validator"
description: "Oops Framework code validation skill. Automatically validates generated code against framework specifications, ensuring 100% error-free. Supports TypeScript compilation check, ESLint check, framework rule check, and auto-fixes for fixable issues. Must call this skill for validation after code generation."
triggers:
  keywords:
    - "validate"
    - "validation"
    - "code validation"
    - "check code"
    - "lint"
    - "compilation check"
    - "typescript check"
  patterns:
    - "validate.*"
    - ".*validation.*"
    - ".*check.*code"
    - ".*lint.*"
---

# Oops Framework Code Validation Skill

## Core Responsibility

Automatically validate generated code to ensure:

1. **TypeScript compilation passes** - No type errors
2. **ESLint check passes** - No code style issues
3. **Framework rule check passes** - Conforms to Oops Framework specifications

**Input**: Generated code file path list
**Output**: Validation report (pass/fail + issue list + fix suggestions)

**⚠️ Absolutely prohibited: Delivering code without passing validation. Validation failed = Not deliverable.**

> **Note**: This skill is called by `oops-workflow-code-generation` at step 3, can also be called separately to validate existing code.

***

## Validation Flow

### Flow Overview

| Step | Check Item | Tool/Method | Check Content | Auto Fix |
|------|-----------|-------------|--------------|----------|
| 1 | TypeScript compilation check | `npx tsc --noEmit` | Type errors, syntax errors | Try auto fix |
| 2 | ESLint check | `npx eslint` | Code style, specification issues | `--fix` auto fix |
| 3 | Framework rule check | Custom rules | Class names, inheritance, imports, decorators, method signatures | Try auto fix |
| 4 | Generate validation report | - | Summarize results | - |

### Flow Diagram

```
Step 1 → Step 2 → Step 3 → Generate Report → All passed → Return success
                                      ↓ Has errors
                                Return fail + issue list → Must fix and re-validate
```

***

## Validation Rule Library

> **Specification Source**: The following validation rules correspond to framework specification files, validation uses rule files as standard:
>
> - Project structure → `../rules/oops-rule-structure.md`
> - Coding standards → `../rules/oops-rule-coding.md`
> - Core constraints → `../rules/oops-rule-core.md`
> - Architecture specification → `../rules/oops-rule-architecture.md`

### Rule 1: Class Name Specification Check

| File Type | Regex Rule | Example | Error Message |
|-----------|-----------|---------|--------------|
| View | `^VC_[A-Z][a-zA-Z]*_[A-Z][a-zA-Z]*$` | `VC_Backpack_Main` | View class name must use VC_{Module}_{Name} format |
| Model | `^M_[A-Z][a-zA-Z]*_[A-Z][a-zA-Z]*$` | `M_Backpack_Main` | Model class name must use M_{Module}_{Name} format |
| Business | `^B_[A-Z][a-zA-Z]*_[A-Z][a-zA-Z]*$` | `B_Backpack_Main` | Business class name must use B_{Module}_{Name} format |
| Entity | `^[A-Z][a-zA-Z]*$` | `Backpack` | Entity class name must use PascalCase, no underscores |

### Rule 2: Inheritance Check

| File Type | Expected Inheritance | Example | Error Message |
|-----------|---------------------|---------|--------------|
| View | `extends CCView<\w+>` | `extends CCView<Backpack>` | View must inherit CCView<Module> |
| Model | `extends ecs\.Comp` | `extends ecs.Comp` | Model must inherit ecs.Comp |
| Business | `extends CCBusiness<\w+>` | `extends CCBusiness<Backpack>` | Business must inherit CCBusiness<Module> |
| Entity | `extends CCEntity` | `extends CCEntity` | Entity must inherit CCEntity |

### Rule 3: Import Statement Check

- Check if required imports exist (based on file type)
- **Prohibit unused imports**: Every identifier imported by `import` must be actually used in file
- **Prohibit speculative imports**: Do not import "might be used" but actually unused modules

**Unused import check example**:

```typescript
// ❌ Error - Imported but not used
import { oops } from 'db://oops-framework/core/Oops';  // No oops usage in file

// ❌ Error - Speculative import
import { ecs } from 'db://oops-framework/libs/ecs/ECS'; // Current file doesn't need ecs

// ✅ Correct - Only import actually used
import { CCBusiness } from 'db://oops-framework/module/common/CCBusiness';
```

### Rule 4: Decorator Check

| File Type | Required Decorators |
|-----------|-------------------|
| View | `@ccclass('VC_xxx')`, `@ecs.register('VC_xxx', false)`, `@gui.register(...)` |
| Model | `@ecs.register('M_xxx')` |
| Entity | `@ecs.register('xxx')` |

### Rule 5: Method Signature Check

| File Type | Check Items |
|-----------|------------|
| Business | Must have `init()` and `setWatch()`; event handling must use generic signature |
| View | Must have `reset()` |

**Event handler method signature (mandatory format)**:

```typescript
private onEventName<K extends ModuleEventName.EventName>(event: K, data: IModuleEventDataMap[K]): void
```

### Rule 5.1: Prohibit Calling Non-Existent Methods

**AI must ensure every method called actually exists in target class or framework.**

| Method | Status | Description |
|--------|--------|-------------|
| `this.unwatchAll()` | ❌ Does not exist | Framework auto-manages event release, prohibit manual call |
| `this.ent.add(ViewClass)` | ❌ Does not exist | Correct is `this.ent.addUi(ViewClass)` |
| `this.ent.B_XXX.someMethod()` | ⚠️ Need confirm | Must confirm Business layer has defined this method |

**Check rules**:

1. Called methods must exist in target class definition
2. Prohibit fabricating method names from memory or assumptions
3. Framework auto-managed features (event release, button unbinding) prohibit manual release method calls

### Rule 6: declare global Check (EventData Files)

- `[Module]EventData.ts` must contain `declare global` block
- Must extend `OopsFramework.TypedEventMap`

### Rule 7: Property Initialization Style Check

- `@property` properties must use `= null!` initialization
- Prohibit `= null`, no initialization, union types, optional markers

***

## Self-Check List

After generating code, check item by item:

### Entity Layer

- [ ] `import { CCEntity }` import correct
- [ ] `@ecs.register('Backpack')` parameter is module name, **without prefix**
- [ ] Model property declaration uses `!` assertion
- [ ] `init()` method **contains no business logic**

### Model Layer

- [ ] `@ecs.register('M_Backpack_Main')` parameter **with M_ prefix**
- [ ] Must implement `reset()` method
- [ ] Only declare properties explicitly mentioned by user

### Business Layer

- [ ] `CCBusiness`, `IBackpackEventDataMap` imports correct
- [ ] `init()` calls `setWatch()`
- [ ] `watch()` calls unified in `setWatch()`, third parameter is `this`
- [ ] Event handler generic signature exactly matches (see `oops-rule-coding.md` section 3.3)
- [ ] **Delete all unused imports** (e.g., unused `oops`, `ecs`, etc.)
- [ ] **Only call confirmed existing methods**, prohibit assuming Business layer has some method

### View Layer

- [ ] `@property` used components correctly imported from `'cc'`
- [ ] `CCView`, `ecs`, `gui`, `LayerType` imports correct
- [ ] `BackpackEventName`, `IBackpackEventDataMap`, `Backpack` imports correct
- [ ] `@ecs.register('VC_Backpack_Main', false)` second parameter must be `false`
- [ ] `@property` properties use `= null!` initialization
- [ ] `onLoad()` calls `super.onLoad()` and `this.setWatch()`
- [ ] Must include `reset()` method
- [ ] **reset() prohibits calling** **`this.unwatchAll()`** — framework auto-manages
- [ ] **Only call confirmed existing methods**, prohibit assuming methods exist

### EventData Layer

- [ ] Must contain `declare global` block
- [ ] `declare global` namespace must be `OopsFramework`
- [ ] `TypedEventMap` must `extends IBackpackEventDataMap`

### Framework Import Check (All Files)
- [ ] Every import is actually used in the file
