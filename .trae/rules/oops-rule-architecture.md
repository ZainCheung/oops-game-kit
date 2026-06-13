---
name: "Architecture Specification"
description: "Oops Framework Three-Tier Architecture Design Specification, defining View/Business/Model layer interaction principles and data flow"
priority: "high"
triggers:
  keywords:
    - "architecture"
    - "three-tier"
    - "View"
    - "Business"
    - "Model"
    - "module design"
    - "layer communication"
    - "architecture design"
  patterns:
    - ".*architecture.*"
    - ".*module.*design.*"
    - ".*three-tier.*"
---

# Oops Framework - Three-Tier Architecture Specification

This document defines the three-tier architecture design specification of Oops Framework. The core principle is **View layer should directly call Business API first, events are only used for cross-module communication**.

> **⚠️ Note**: This document focuses on architecture design principles. For specific code templates and mandatory requirements of each layer, see `oops-rule-coding.md`.

---

## 1. Core Design Principles

### 1.1 Interaction Principles Between View and Business Layers

| Layer | Principle/Responsibility | Example |
|-------|--------------------------|---------|
| **View** | Principle 1: Directly call Business API first | `this.ent.B_Backpack_Main.update(1001, 5)` |
| **View** | Principle 2: Only use event listening when responding to notifications from other modules | `this.watch(BackpackEventName.UIUpdate, ...)` |
| **Business** | External API: For View to directly call | `update()`, `use()`, `remove()` |
| **Business** | Internal events: Notify same-module View to update | `this.emit(BackpackEventName.UIUpdate)` |
| **Business** | Cross-module events: Notify other modules (reduce coupling) | `this.emit(RedDotEventName.Add, redDotData)` |

**Calling Relationship (Simplified)**:
`View (User Action)` → `Direct Call` → `Business (Process Business)`

### 1.2 Event Usage Specification

| Scenario | Recommended Way | Description |
|----------|----------------|-------------|
| **Same-module View → Business** | Direct API call | `this.ent.B_Backpack_Main.update(1001, 5)` |
| **Same-module Business → View** | Module internal event | `this.emit(BackpackEventName.UIUpdate)` |
| **Same-module View ↔ View** | Direct reference | `this.ent.VC_Backpack_Main.refresh(props)` |
| **Cross-module communication** | Global event | `this.emit(RedDotEventName.Add, redDotData)` |
| **View responding to data changes** | Event listening | `this.watch(BackpackEventName.UIUpdate, ...)` |

**Key Principles**:
- ✅ **View actively calls**: User actions directly call Business API
- ✅ **Same-module View communication**: Direct reference via `this.ent.VC_XXX`
- ✅ **Business passive notification**: Data changes notify View updates through events
- ✅ **Cross-module decoupling**: Use global events for cross-module communication
- ❌ **Avoid View triggering Business methods through events**: Don't `emit` then `watch`
- ❌ **Avoid using events for same-module View communication**: Direct reference is more efficient

---

## 2. Architecture Layers

### 2.1 Three-Tier Architecture Overview

| Layer | Responsibility | Core Components | Base Class | Interaction |
|-------|---------------|-----------------|------------|-------------|
| **View** | UI display, user interaction | `VC_Backpack_Main` / `V_Backpack_Prop` | `CCView` | Directly call Business API |
| **Business** | Business logic, data validation | `B_Backpack_Main` (update / use / remove) | `CCBusiness` | Operate data, trigger events |
| **Model** | Data storage, state management | `M_Backpack_Main` (props Collection) | `ecs.Comp` | Operated by Business |

### 2.2 Calling Relationship

| Step | Direction | Calling Method | Description |
|------|-----------|---------------|-------------|
| 1 | View → Business | Direct API call | User action triggers business logic |
| 2 | Business → Model | Operate data | Business layer modifies data state |
| 3 | Model → View | Event notification | Notify view update after data changes |

**Data Flow**: `View` → `Business` → `Model` → `View` (via events)

### 2.3 Layer Responsibilities

| Layer | Core Responsibility | Prohibited Behavior | Base Class |
|-------|--------------------|---------------------|------------|
| **View** | UI display, user interaction, animation effects | Directly operate data | `CCView` |
| **Business** | Business logic, data validation, flow control | Directly load resources | `CCBusiness` |
| **Model** | Data storage, data calculation, data conversion | Contains business logic | `ecs.Comp` |

---

## 3. Inter-Layer Communication Rules

### 3.1 View Layer → Business Layer (Direct Call First)

```typescript
// ✅ Correct - Directly call Business API
onLoad() {
    this.refresh(this.ent.getProps());
}

onUseButtonClick(propId: number) {
    this.ent.B_Backpack_Main.use(propId, 1);
}
```

### 3.2 View Layer → Business Layer (Events Only for Passive Response)

```typescript
// ✅ Correct - Listen for data changes, passively update UI
private setWatch() {
    this.watch(BackpackEventName.UIUpdate, this.onBackpackUpdateUI, this);
    this.watch(BackpackEventName.UIRemove, this.onBackpackRemoveUI, this);
}
```

### 3.3 Business Layer → View Layer (Notify via Events)

```typescript
// ✅ Correct - Business notifies View updates through events
update(id: number, amount: number): void {
    // 1. Modify Model data
    let prop = this.ent.M_Backpack_Main.props.get(id);
    if (prop) {
        prop.M_Prop_Main.amount += amount;
    }
    
    // 2. Notify View update (passive notification, not directly calling View method)
    this.emit(BackpackEventName.UIUpdate, { prop, listId: undefined });
}
```

### 3.4 Cross-Module Communication (Use Global Events)

```typescript
// Business layer triggers global events
init() {
    const redDotAddData: IRedDotAddData = {
        key: EM_BackpackRedDot.BackpackKey,
        path: EM_BackpackRedDot.BackpackPath,
    };
    this.emit(RedDotEventName.Add, redDotAddData);
    this.setWatch();
}

// Other modules listen to global events
private setWatch() {
    this.watch(RedDotEventName.Update, this.onRedDotUpdate, this);
}
```

---

## 4. Communication Decision Tree

```
View needs to interact with other components?
    │
    ├─ Same-module View component ──► Direct reference
    │   this.ent.VC_XXX.method()
    │
    ├─ Business layer ──► Direct API call
    │   this.ent.B_XXX.method()
    │
    ├─ Respond to data changes ──► Listen to module internal events
    │   this.watch(ModuleEventName.XXX, ...)
    │
    └─ Cross-module communication ──► Use global events
        this.emit(GlobalEventName.XXX)
```

### Detailed Decision Flow

```
Same-module interaction?
    │
    ├─ View → Business ──► Direct API call
    │   this.ent.B_Backpack_Main.update(1001, 5)
    │
    ├─ View → View ──► Direct reference
    │   this.ent.VC_Backpack_Main.refresh(props)
    │
    ├─ Business → View ──► Module internal events
    │   this.emit(BackpackEventName.UIUpdate)
    │
    └─ Cross-module ──► Global events
        this.emit(RedDotEventName.Add, redDotData)
```

---

## 5. Base Class Inheritance

| Layer | Class Name | Base Class | Registration Decorator |
|-------|-----------|------------|----------------------|
| Entity | `[Module]` | `CCEntity` | `@ecs.register('[Module]')` |
| Model | `M_[Module]_Model` | `ecs.Comp` | `@ecs.register('M_[Module]_Model')` |
| Business | `B_[Module]_[Name]` | `CCBusiness<[Module]>` | None |
| View (ECS) | `VC_[Module]_[Name]` | `CCView<[Module]>` | `@ecs.register('VC_[Module]_[Name]', false)` + `@gui.register(...)` |

---

## 6. API Reference Specification (Mandatory)

### 6.1 Core Principle

**When generating code, if referencing APIs from other components, you must confirm the API exists. When uncertain, you must ask the developer. Do not assume APIs exist.**

### 6.2 API Existence Check Flow

```
Need to call API from another component?
    │
    ├─ Target component file exists?
    │   ├─ No ──► Ask developer: Does target component exist?
    │   └─ Yes ──► Read file, check if API exists
    │
    ├─ API exists?
    │   ├─ Yes ──► Generate calling code
    │   └─ No ──► Ask developer
    │
    └─ Uncertain?
        └─ Yes ──► Ask developer
```

### 6.3 Question Template

When API doesn't exist or is uncertain, use the following format to ask:

```
**API Reference Confirmation**

When generating [current component], need to call [target component].[methodName](), but found:

[Specific situation description]
- Case A: [target component] does not have [methodName] method
- Case B: Cannot determine if [target component] exists
- Case C: [Other cases]

Please confirm:
1. Add [methodName] method to [target component]?
2. Use another existing method (e.g., [existing method name])?
3. Skip this call for now?
4. Other solution (please describe):
```

### 6.4 Prohibited Behaviors

❌ **The following behaviors are strictly prohibited**:

1. Assume API exists and generate calling code
2. Automatically generate non-existent APIs
3. Use ambiguous method names (e.g., when uncertain between `findProp` or `getProp`, do not guess)

---

## 7. Design Principles Summary

1. **Direct Call First**:
   - View → Business: Direct API call
   - Same-module View ↔ View: Direct reference via `this.ent.VC_XXX`

2. **Events for Decoupling**:
   - Business → View: Module internal event notification
   - Cross-module communication: Global events for decoupling

3. **Unidirectional Data Flow**:
   - View calls Business → Business updates Model → Business notifies View

4. **Reduce Coupling**:
   - Same-module: Direct reference and calls (efficient)
   - Cross-module: Global events (decoupled)
