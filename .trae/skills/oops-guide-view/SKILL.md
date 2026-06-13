---
name: "oops-guide-view"
description: "Oops Framework View layer writing specification. Called when user needs to create UI, bind button events, or handle UI updates."
triggers:
  keywords:
    - "View"
    - "UI"
    - "CCView"
    - "GameComponent"
    - "gui.register"
    - "prefab.register"
  patterns:
    - ".*View.*"
    - ".*UI.*"
---

# Oops Framework View Layer Specification

## Usage Instructions

When generating View layer code, **must** follow this workflow:

1. Determine View type:
   - Independent UI window/popup → **ECS View** (`CCView`)
   - List item/grid item/icon → **GameComponent**
2. Open `oops-rule-coding.md`, find corresponding meta-template (Section 6 ECS View or Section 7 GameComponent)
3. Copy the meta-template, replace `[Module]` and `[Name]` placeholders
4. Add `@property` and button events based on user requirements
5. Check item by item against mandatory requirements below

## ECS View Meta-Template (from oops-rule-coding.md Section 6)

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

## GameComponent Meta-Template (from oops-rule-coding.md Section 7)

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

## ECS View Mandatory Requirements

| Check Item | Requirement |
|-----------|-------------|
| Inheritance | Must inherit `CCView<[Module]>` |
| ECS decorator | `@ecs.register('VC_[Module]_[Name]', false)`, second parameter must be `false` |
| GUI decorator | `@gui.register('VC_[Module]_[Name]', { layer: LayerType.UI, prefab: 'gui/[module]/prefab/VC_[Module]_[Name]' })` |
| **layer value** | Select based on UI type (see LayerType Selection Guide below) |
| onLoad() | Must call `super.onLoad()`, `this.setWatch()`, `this.setButton()` |
| setWatch() | All `watch()` unified here |
| Button events | Method name format `onBtn[button node name]`, auto-bound by `setButton()` |
| reset() | **Must implement**, only clean custom memory |
| Close view | Use `this.remove()`, ❌ prohibit `oops.gui.remove()` |
| @property | Must use `= null!` initialization |
| Log | Use `oops.log.logView()` |

### LayerType Selection Guide

| UI Type | LayerType Value | Description | Example |
|---------|----------------|-------------|---------|
| Main UI/Feature page | `LayerType.UI` | Normal game UI, multiple can exist simultaneously | Backpack main UI, friend list |
| Popup/Float layer | `LayerType.PopUp` | Independent popup, usually has close button | Query popup, tip popup |
| Modal dialog | `LayerType.Dialog` | Modal window requiring user response | Confirm dialog, input box |
| System window | `LayerType.System` | System-level prompt, highest layer | Disconnect reconnect, system announcement |

> **⚠️ Common Error**: Popup layer must use `LayerType.PopUp`, ❌ prohibit using `LayerType.Pop` (does not exist).

## GameComponent Mandatory Requirements

| Check Item | Requirement |
|-----------|-------------|
| Inheritance | Must inherit `GameComponent` |
| ECS decorator | ❌ **Prohibit** `@ecs.register` |
| GUI decorator | ❌ **Prohibit** `@gui.register` |
| Prefab decorator | ✅ Need `@prefab.register` (if used as prefab) |
| Click event | Method name **must** be `onNodeClick` (GameComponent auto-binds) |
| setData() | Must include, for external data setting |
| reset() | Must implement |

## Common Errors

```typescript
// ❌ Error - Using start() instead of onLoad()
start() {  // Error! Should be onLoad()
    this.setWatch();
}

// ❌ Error - Not calling super.onLoad()
onLoad() {
    this.setWatch();  // Error! Missing super.onLoad()
}

// ❌ Error - Not calling setButton()
onLoad() {
    super.onLoad();
    this.setWatch();  // Error! Missing this.setButton()
}

// ❌ Error - Button event name not standard
private onCloseButtonClick() { }  // Error! Should be onBtnClose()

// ❌ Error - Manually binding button events
private bindEvents() {
    this.btnClose.node.on(Node.EventType.TOUCH_END, this.onBtnClose, this);  // Prohibited!
}

// ❌ Error - Directly calling oops.gui.remove()
oops.gui.remove('VC_Friend_Main');  // Error! View layer should use this.remove()

// ❌ Error - View layer closing itself through Business (circular dependency)
this.ent.B_Friend_ViewUI.removeMain();  // Error! View layer closing itself should use this.remove()

// ❌ Error - GameComponent using @ecs.register
@ecs.register('V_Friend_Item', false)  // Prohibited! GameComponent doesn't need ECS decorator

// ❌ Error - Popup using LayerType.Pop (doesn't exist)
@gui.register('VC_Friend_Search', { layer: LayerType.Pop, ... })  // Error! Should be LayerType.PopUp

// ✅ Correct - Popup using LayerType.PopUp
@gui.register('VC_Friend_Search', { layer: LayerType.PopUp, ... })  // Correct
```

## View Type Selection Guide

| Scenario | Type | Inheritance | Decorators |
|----------|------|------------|------------|
| Independent UI window/popup | ECS View | `CCView<Module>` | `@ecs.register` + `@gui.register` |
| List item/grid item/icon | GameComponent | `GameComponent` | `@ccclass` (+ `@prefab.register`) |

## Related Specifications

- ECS View meta-template: `../rules/oops-rule-coding.md` Section 6
- GameComponent meta-template: `../rules/oops-rule-coding.md` Section 7
- Core constraints: `../rules/oops-rule-core.md` Chapter 4
- ViewUI management: `oops-guide-viewui`
