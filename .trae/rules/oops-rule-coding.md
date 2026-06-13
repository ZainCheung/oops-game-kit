---
name: "Coding Standard"
description: "Oops Framework code meta-templates and coding standards for each layer. AI must strictly apply the meta-templates from this document when generating code, free-form coding is prohibited."
priority: "high"
triggers:
  keywords:
    - "code"
    - "template"
    - "Entity"
    - "Model"
    - "Business"
    - "View"
    - "import"
    - "event"
    - "coding standard"
  patterns:
    - ".*code.*template.*"
    - ".*write.*standard.*"
---

# Oops Framework - Coding Standard (Meta-Template Version)

> **⚠️ Highest Priority Constraint**: All specifications in this document are constrained by `oops-rule-core.md`. When this document conflicts with `core`, **the `core` document takes precedence**.
>
> **Generation Principle**: AI must **first load the corresponding meta-template → replace placeholders → fill business logic**. Free-form coding from memory is prohibited.

---

## Placeholder Definitions

| Placeholder | Meaning | Replacement Example |
|-------------|---------|--------------------|
| `[Module]` | Module name, PascalCase | `Backpack`, `Friend`, `Shop` |
| `[module]` | Module name all lowercase | `backpack`, `friend`, `shop` |
| `[Name]` | File function suffix | `Main`, `Detail`, `Item`, `List` |
| `[EventKey]` | Event enum key name | `Use`, `Update`, `UIUpdate` |
| `[eventKey]` | Event enum key name lowercase | `use`, `update`, `uiUpdate` |
| `[EventValue]` | Event string value | `onBackpackUse`, `onFriendUpdate` |
| `[ParentComp]` | List item parent component class name | `ListItemReddot`, `ListItem` |

---

## 1. Entity Layer Meta-Template

### 1.1 Mandatory Meta-Template

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

### 1.2 Mandatory Requirements

| Check Item | Requirement |
|-----------|-------------|
| Inheritance | Must inherit `CCEntity` |
| Decorator | `@ecs.register('[Module]')`, parameter **without prefix** |
| Model property | Use `!` assertion, e.g. `M_[Module]_Main!: M_[Module]_Main` |
| init() | Only contains component registration, **absolutely no business logic** |

---

## 2. Model Layer Meta-Template

### 2.1 Mandatory Meta-Template

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

### 2.2 Mandatory Requirements

| Check Item | Requirement |
|-----------|-------------|
| Inheritance | Must inherit `ecs.Comp` |
| Decorator | `@ecs.register('M_[Module]_Main')`, parameter **with M_ prefix** |
| reset() | **Must implement**; clean custom memory |
| Properties | Only declare data fields explicitly requested by user |
| Prohibited | ❌ No business logic; ❌ No unused property declarations |

---

## 3. Business Layer Meta-Template

### 3.1 Main Business Meta-Template

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

### 3.2 Mandatory Requirements

| Check Item | Requirement |
|-----------|-------------|
| Inheritance | Must inherit `CCBusiness<[Module]>` |
| init() | **Must** call `setWatch()` |
| setWatch() | All `watch()` unified here, third parameter must be `this` |
| Event handler signature | **Must exactly match**: `private onXxx<K extends [Module]EventName.Xxx>(event: K, data: I[Module]EventDataMap[K]): void` |
| Trigger event | Use `this.emit()` |
| Log | Business layer uses `oops.log.logBusiness(msg, module)` |

### 3.3 Event Handler Method Signature (Absolutely No Deformation)

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

---

## 4. ViewUI Management Business Meta-Template

### 4.1 Mandatory Meta-Template

```typescript
import { Node } from 'cc';
import { CCBusiness } from 'db://oops-framework/module/common/CCBusiness';
import { [Module] } from '../[Module]';
import { VC_[Module]_Main } from '../view/VC_[Module]_Main';

export class B_[Module]_ViewUI extends CCBusiness<[Module]> {
    /** Open [Module] main UI */
    openMain(): Promise<Node | null> {
        return this.ent.addUi(VC_[Module]_Main);
    }

    /** Close [Module] main UI */
    removeMain(): void {
        this.ent.removeUi(VC_[Module]_Main);
    }
}
```

### 4.2 Mandatory Requirements

| Check Item | Requirement |
|-----------|-------------|
| Inheritance | `CCBusiness<[Module]>` |
| Method names | `openMain()` / `removeMain()` |
| Open UI | `this.ent.addUi(ViewClass)`, returns `Promise<Node \| null>` |
| Close UI | `this.ent.removeUi(ViewClass)`, returns `void` |

> **⚠️ Important**: This file is auto-generated by MCP tool. AI is **absolutely prohibited** from modifying, deleting, or renaming it. If file exists → completely ignore; If not exists → generated by MCP, AI does not actively create it.

---

## 5. ViewPrefab Management Business Meta-Template

### 5.1 Mandatory Meta-Template

```typescript
import { Node } from 'cc';
import { CCBusiness } from 'db://oops-framework/module/common/CCBusiness';
import { [Module] } from '../[Module]';
import { V_[Module]_Item } from '../view/V_[Module]_Item';

export class B_[Module]_ViewPrefab extends CCBusiness<[Module]> {
    /** Create [Module] item prefab */
    openItem(parent: Node): Promise<Node | null> {
        return this.ent.addPrefab(V_[Module]_Item, parent);
    }

    /** Remove [Module] item prefab */
    removeItem(node: Node): void {
        this.ent.removePrefab(node);
    }
}
```

### 5.2 Mandatory Requirements

| Check Item | Requirement |
|-----------|-------------|
| Method names | `openItem(parent)` / `removeItem(node)` |
| Create prefab | `this.ent.addPrefab(ViewClass, parent)` |
| Remove prefab | `this.ent.removePrefab(node)` |

> **⚠️ Important**: This file is auto-generated by MCP tool. AI is **absolutely prohibited** from modifying, deleting, or renaming it.

---

## 6. ECS View Layer Meta-Template

### 6.1 Mandatory Meta-Template

```typescript
import { Node, _decorator } from 'cc';
import { gui } from 'db://oops-framework/core/gui/Gui';
import { LayerType } from 'db://oops-framework/core/gui/layer/LayerEnum';
import { ecs } from 'db://oops-framework/libs/ecs/ECS';
import { CCView } from 'db://oops-framework/module/common/CCView';
import { [Module] } from '../[Module]';
import { [Module]EventName } from '../[Module]Event';

const { ccclass, property } = _decorator;

@ccclass('VC_[Module]_[Name]')
@ecs.register('VC_[Module]_[Name]', false)
@gui.register('VC_[Module]_[Name]', { layer: LayerType.UI, prefab: 'gui/[module]/prefab/VC_[Module]_[Name]' })
export class VC_[Module]_[Name] extends CCView<[Module]> {
    // @property(SomeComponent)
    // private someComponent: SomeComponent = null!;

    onLoad() {
        super.onLoad();
        this.setWatch();
        this.setButton();
        // Initialization logic
    }

    private setWatch() {
        // this.watch([Module]EventName.[EventKey], this.on[EventName]UI, this);
    }

    //#region Event handling
    // private on[EventName]UI<K extends [Module]EventName.[EventKey]>(event: K, data: I[Module]UI[Name]Data): void {
    //     // UI update logic
    // }
    //#endregion

    //#region Button events
    // private onBtn[ButtonName](): void {
    //     // Button click logic
    // }
    //#endregion

    reset(): void {
        // Clean custom memory
    }
}
```

### 6.2 Mandatory Requirements

| Check Item | Requirement |
|-----------|-------------|
| Inheritance | Must inherit `CCView<[Module]>` |
| ECS decorator | `@ecs.register('VC_[Module]_[Name]', false)`, second parameter must be `false` |
| GUI decorator | `@gui.register('VC_[Module]_[Name]', { layer: LayerType.UI, prefab: 'gui/[module]/prefab/VC_[Module]_[Name]' })` |
| **layer value** | Select based on UI type (see 6.3 LayerType Selection Guide below) |
| onLoad() | Must call `super.onLoad()`, `this.setWatch()`, `this.setButton()` |
| setWatch() | All `watch()` unified here |
| Button events | Method name format `onBtn[ButtonNodeName]`, auto-bound by `setButton()` |
| reset() | **Must implement**, only clean custom memory |
| Close view | Use `this.remove()`, ❌ prohibit `oops.gui.remove()` |
| @property | Must use `= null!` initialization |
| Log | Use `oops.log.logView()` |

### 6.3 LayerType Selection Guide

| UI Type | LayerType Value | Description | Example |
|---------|----------------|-------------|---------|
| Main UI/Feature page | `LayerType.UI` | Normal game UI, multiple can exist simultaneously | Backpack main UI, friend list |
| Popup/Float layer | `LayerType.PopUp` | Independent popup, usually has close button | Query popup, tip popup |
| Modal dialog | `LayerType.Dialog` | Modal window requiring user response | Confirm dialog, input box |
| System window | `LayerType.System` | System-level prompt, highest layer | Disconnect reconnect, system announcement |

> **⚠️ Common Error**: Popup layer must use `LayerType.PopUp`, ❌ prohibit using `LayerType.Pop` (does not exist).

---

## 7. GameComponent View Layer Meta-Template

### 7.1 Mandatory Meta-Template

```typescript
import { _decorator } from 'cc';
import { GameComponent } from 'db://oops-framework/module/common/GameComponent';

const { ccclass, property } = _decorator;

@ccclass('V_[Module]_[Name]')
export class V_[Module]_[Name] extends GameComponent {
    // @property(Label)
    // private labelName: Label = null!;

    protected data: any = {
        // Data fields
    };

    /** Set data - Must include, for external data setting */
    setData(data: any) {
        // Data assignment logic
    }

    /** Click callback - Method name must be onNodeClick */
    private onNodeClick(): void {
        // Click logic
    }

    /** Reset data */
    reset(): void {
        // Clean custom memory
    }
}
```

### 7.2 Mandatory Requirements

| Check Item | Requirement |
|-----------|-------------|
| Inheritance | Must inherit `GameComponent` |
| ECS decorator | ❌ **Prohibit** `@ecs.register` |
| GUI decorator | ❌ **Prohibit** `@gui.register` |
| Prefab decorator | ✅ Need `@prefab.register` (if used as prefab) |
| Click event | Method name **must** be `onNodeClick` (GameComponent auto-binds) |
| setData() | Must include, for external data setting |
| reset() | Must implement |

---

## 8. Event Layer Meta-Template

### 8.1 Event Enum Meta-Template

```typescript
// [Module]Event.ts

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

> **⚠️ Note**: In `export { ... }` re-export syntax, **must** add `type` keyword. Types are only used at compile time, using `type` clearly identifies export nature.

### 8.2 Event Data Meta-Template

```typescript
// [Module]EventData.ts

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

### 8.3 Mandatory Requirements

| Check Item | Requirement |
|-----------|-------------|
| Enum values | String value format `on[Module][Action]` |
| Data interface | Named `I[Module][Action]Data` |
| Mapping interface | Named `I[Module]EventDataMap` |
| declare global | **Must include**, extend `OopsFramework.TypedEventMap` |
| Export style | `export { type ... }`, re-export must add `type` keyword |

---

## 9. Import Specification Summary

### 9.1 Framework Core Imports (Value Imports)

| Import Item | Correct Path |
|-------------|-------------|
| `ecs` | `db://oops-framework/libs/ecs/ECS` |
| `oops` | `db://oops-framework/core/Oops` |
| `CCEntity` | `db://oops-framework/module/common/CCEntity` |
| `CCBusiness` | `db://oops-framework/module/common/CCBusiness` |
| `CCView` | `db://oops-framework/module/common/CCView` |
| `GameComponent` | `db://oops-framework/module/common/GameComponent` |
| `gui` | `db://oops-framework/core/gui/Gui` |
| `LayerType` | `db://oops-framework/core/gui/layer/LayerEnum` |
| `prefab` | `db://oops-framework/module/decorator/GamePrefabDecorator` |

### 9.2 Import Rules

- Prohibit unused imports
- Prohibit speculative imports ("might be used")

---

## 10. Pre-Generation Self-Check List

AI must confirm item by item before generating each file:

### Entity Layer
- [ ] Inherit `CCEntity`
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
- [ ] **Delete all unused imports**
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
- [ ] Must include `declare global` block
- [ ] `declare global` namespace must be `OopsFramework`
- [ ] `TypedEventMap` must `extends IBackpackEventDataMap`

### Framework Import Check (All Files)
- [ ] Every import is actually used in the file
