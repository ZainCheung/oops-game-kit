---
alwaysApply: true
---

# Oops Framework - Core Mandatory Constraints and Workflow

This document defines the **absolute mandatory constraints** and **standard development workflow** for AI when generating code. Violating any single rule is considered non-compliant code.

> **Absolute Priority**: The constraints in this document **take precedence over** all other rules, skills, and example code. When this document conflicts with any other specification, **this document shall prevail**. When two rules conflict, the **stricter** one shall prevail.
>
> **Generation Principle**: AI must **first load the corresponding meta-template from `oops-rule-coding.md` → replace placeholders → fill business logic**. Free-form coding from memory is prohibited.

---

## 1. AI Behavior Red Lines

### [Mandatory] 1.1 Do Not Generate Unused Code

```typescript
// ❌ Absolutely prohibited - Do not generate features/properties/decorators not mentioned by user
protected [feature user didn't mention] = true;     // User didn't mention this feature

protected [property user didn't mention]: any = null;    // User didn't mention this property

@property([component type user didn't mention])
private [node name user didn't mention]: [type] = null!;  // User didn't mention this node!
```

**Determination Standard**: If removing a line of code still allows the remaining code to fully implement the functionality described by the user, then that line is **unused**. Unused code **must be deleted**, regardless of whether it "might be useful later".

### [Mandatory] 1.2 Do Not Add Methods Not Requested by User

**Determination Standard**: If the user did not explicitly mention a certain feature, button, event, or operation, AI is **absolutely prohibited** from generating corresponding handler methods.

```typescript
// ❌ Absolutely prohibited - User only said "[Feature A]", do not preset "[Feature B]" "[Feature C]" etc.
private on[feature user didn't mention]Click() { ... }
private on[operation user didn't mention]Event() { ... }
```

**Common Violation Scenarios**:
- User requests "display list" → AI auto-generates "refresh" "delete" "edit" button events
- User requests "open UI" → AI auto-generates "close animation" "switch tab" methods
- User requests "send request" → AI auto-generates "retry" "cancel" "cache" logic

### [Mandatory] 1.3 Do Not Preset "Future Might Be Used" Properties

```typescript
// ❌ Absolutely prohibited - Do not declare properties/states not mentioned by user
private [property user didn't mention]: [type] = [default value];  // User didn't say need this property
private [state user didn't mention]: boolean = false;   // User didn't say need this state
```

### [Mandatory] 1.4 Precise Modification Principle

When modifying existing files:
- **Prohibit "improving" adjacent code** — Do not refactor what isn't broken
- **Prohibit modifying unrelated comments or formatting** — Only modify parts directly related to requirements
- **Must match existing style** — Even if you would write it differently
- **Delete orphaned code caused by changes** — Delete unused imports/variables/functions caused by your changes

**Test Standard**: Every line of change should be directly traceable to the user's request.

### [Mandatory] 1.5 Dead Code Handling Rules

| Scenario | Handling |
|----------|----------|
| Your change causes an import/variable/function to no longer be used | ✅ **Must delete** |
| Pre-existing dead code (unrelated to your change) | ⚠️ **Mention but do not delete** (unless user explicitly requests cleanup) |

### [Mandatory] 1.6 Prohibit Generating Unused Imports

**AI must ensure every import is actually used when generating code. Prohibit importing "just in case".**

```typescript
// ❌ Absolutely prohibited - Import never used
import { oops } from 'db://oops-framework/core/Oops';  // No usage of [import item] anywhere in file
import { ecs } from 'db://oops-framework/libs/ecs/ECS'; // No usage of [import item] anywhere in file

// ✅ Correct - Only import actually used modules
import { CCBusiness } from 'db://oops-framework/module/common/CCBusiness';
import { [Module] } from '../[Module]';
```

**Determination Standard**: If deleting an `import` statement still allows the code to fully compile and run, then that import is **unused**. Unused imports **must be deleted**.

### [Mandatory] 1.7 Prohibit Calling Non-Existent Methods

**AI must ensure every method called actually exists in the target class or framework. Prohibit fabricating method names from memory or assumptions.**

```typescript
// ❌ Absolutely prohibited - Calling non-existent method
reset() {
    this.unwatchAll();  // ❌ [Target class] does not have [method name]() method! Framework auto-manages event release
}

// ❌ Absolutely prohibited - Assuming method exists
this.ent.B_[Module]_Main.[undefined method](id);  // ❌ If Business layer doesn't expose this method, prohibit calling!

// ✅ Correct - Only call confirmed existing methods
this.emit([Module]EventName.[EventKey], { [field]: data.[field] });  // ✅ emit is confirmed method of CCBusiness/CCView
this.ent.B_[Module]_ViewUI.removeMain();  // ✅ MCP-generated view management class, method confirmed existing
```

**Common Traps**:
- `this.unwatchAll()` — **Does not exist**. Framework auto-releases event listeners when component is destroyed, no manual call needed.
- `this.ent.add(ViewClass)` — **Does not exist**. Correct is `this.ent.addUi(ViewClass)` or `this.ent.addPrefab(ViewClass, parent)`.
- `this.ent.B_XXX.someMethod()` — **Must confirm**. If Business layer hasn't defined this method, prohibit calling from View layer.

**Rules**:
1. Before calling any method, must first confirm the method is defined in the target class.
2. If uncertain whether a method exists, **prohibit guessing**, should consult framework documentation or ask user.
3. Framework auto-managed features (event release, button unbinding) **prohibit manually calling release methods**.

---

## 2. Decision Inquiry Principle (Stop When Uncertain, Confirm Before Proceeding)

### [Mandatory] 2.1 Must Ask When Encountering Multiple Options

When user requirements have the following ambiguities, **must** use AskUserQuestion tool to ask developer, prohibit arbitrarily choosing:

| Ambiguity Type | Example | Must Ask |
|---------------|---------|----------|
| Uncertain feature scope | "Make a backpack system" → Include organize, sort, batch operations? | Must ask |
| Unspecified interaction method | "Click friend to open details" → Popup or navigate to new UI? | Must ask |
| Undefined data structure | "Display player info" → Which fields to display? | Must ask |
| Missing business rules | "Buy item" → Quantity limits, cooldown time? | Must ask |
| Unspecified visual hierarchy | "Main UI has list" → Simple text or complex cards? | Must ask |
| Non-unique technical solution | One Model or multiple Models in Model layer? | Must ask |
| Ambiguous event design | One event or multiple events? | Must ask |
| Unclear data flow direction | Active pull or passive push? | Must ask |

### [Mandatory] 2.2 Must Provide Options When Asking

When asking, **prohibit** just throwing out questions for developer to freely answer. Must provide:
1. **2-4 clear options**
2. **Pros and cons of each option**
3. **AI's best recommendation and reasoning**

### [Mandatory] 2.3 Decision Points During Development Also Need Asking

During code generation, if discovering similar decision issues (e.g., need to add a method not mentioned, need to assume some data structure), **must** pause generation and ask developer.

Prohibit assuming for the sake of "keeping the flow".

### [Mandatory] 2.4 Can Only Continue After Decision Confirmation

**Only after all key decisions are confirmed by developer, can enter MCP file creation stage.**

During code generation, must also pause if encountering:
- Discovering properties/methods not mentioned by user but needing assumption
- Discovering multiple equivalent implementation options (e.g., one event vs multiple events)
- Discovering need for supplementary business rules to continue coding
- Discovering missing UI interaction details (e.g., feedback method after button click)

**Handling**: Stop current file generation, use AskUserQuestion to ask, continue after getting response.

---

## 3. Mandatory Code Generation Order

### [Mandatory] 3.1 Three-Tier Code Generation Order

When generating module code, **strictly prohibit skipping or reversing order**, must execute in following order:

| Layer | Order | File Type |
|-------|-------|-----------|
| **Layer 1: Data Layer (Model)** | 1 | Entity file (module entity definition) |
| | 2 | Model file (data model definition) |
| | 3 | Enum file (enum definitions) |
| | 4 | Type file (type definitions) |
| | 5 | Interface file (interface definitions) |
| | 6 | Config file (config definitions) |
| **Layer 2: Business Layer (Business)** | 7 | Event file (event definitions) |
| | 8 | EventData file (event data definitions) |
| | 9 | Business file (business logic implementation) |
| | 10 | System file (system logic implementation) |
| **Layer 3: Display Layer (View)** | 11 | View file (UI view implementation) |
| | 12 | ViewPrefab file (prefab view implementation) |

### [Mandatory] 3.2 Generation Principles

- **Must implement data layer first, then business layer, finally display layer**
- **Strictly prohibit skipping data layer to directly implement business or display layer**
- **Strictly prohibit implementing display layer first then going back to fill data layer**
- **One-time correctness**: Class names, inheritance, imports, decorators, methods all correct at once
- **Prohibit step-by-step correction**: No longer use SearchReplace for gradual correction
- **Generate according to meta-template**: Strictly follow meta-templates in `oops-rule-coding.md`, not from memory
- **Ask when uncertain**: When encountering uncertain issues, don't make decisions yourself, prompt developer to supplement info

---

## 4. API Usage and View Management

### [Mandatory] 4.1 Prohibit Directly Calling Low-Level APIs in View Layer

**View layer prohibited from directly calling (should go through Business layer)**:

| API | Status | Description |
|-----|--------|-------------|
| `oops.gui.open(string)` | ❌ Prohibited | Exists, but prohibited from direct call in View layer |
| `oops.gui.remove(string)` | ❌ Prohibited | Exists, but prohibited from direct call in View layer |
| `instantiate(this.prefab)` | ❌ Prohibited | View layer prohibited from self-instantiating prefabs |
| `this.ent.add(ViewClass)` | ❌ Does not exist | This method does not exist, should use `this.ent.addUi(ViewClass)` |

**Confirmed Available APIs (View layer usage)**:

| API | Usage Scenario | Example |
|-----|---------------|---------|
| `this.remove()` | View closes itself | `this.remove();` |
| `this.ent.B_[Module]_ViewUI.openMain()` | Open UI main interface | `this.ent.B_[Module]_ViewUI.openMain();` |
| `this.ent.B_[Module]_ViewUI.removeMain()` | Close UI main interface | `this.ent.B_[Module]_ViewUI.removeMain();` |
| `this.ent.B_[Module]_ViewUI.openDetail()` | Open UI detail interface | `this.ent.B_[Module]_ViewUI.openDetail();` |

**Confirmed Available APIs (Business layer usage)**:

| API | Usage Scenario | Example |
|-----|---------------|---------|
| `this.ent.addUi(ViewClass)` | Business layer adds UI | `this.ent.addUi(VC_[Module]_Main);` |
| `this.ent.removeUi(ViewClass)` | Business layer removes UI | `this.ent.removeUi(VC_[Module]_Main);` |
| `this.ent.addPrefab(ViewClass, parent)` | Business layer adds prefab | `this.ent.addPrefab(V_[Module]_[Name], parent);` |
| `this.ent.removePrefab(node)` | Business layer removes prefab | `this.ent.removePrefab(node);` |
| `this.emit(EventName, data)` | Trigger event | `this.emit([Module]EventName.[EventKey], { [field], [field] });` |
| `this.watch(EventName, callback, this)` | Listen to event | `this.watch([Module]EventName.[EventKey], this.on[method name], this);` |
| `oops.log.logBusiness(msg, module)` | Business layer log | `oops.log.logBusiness('[log content]', '[module name]');` |
| `oops.log.logView(msg)` | View layer log | `oops.log.logView('[log content]');` |

**API Usage Decision Tree**:
```
Need to operate UI?
    │
    ├─ View layer needs to close itself ──► this.remove()
    │
    ├─ View layer needs to open other UI ──► this.ent.B_[Module]_ViewUI.open{ViewName}()
    │
    ├─ View layer needs to create prefab ──► this.ent.B_[Module]_ViewPrefab.open{PrefabName}(parent)
    │
    ├─ Business layer needs to open UI ──► this.ent.addUi(ViewClass)
    │
    ├─ Business layer needs to create prefab ──► this.ent.addPrefab(ViewClass, parent)
    │
    └─ Uncertain? ──► Ask user, prohibit guessing
```

### [Mandatory] 4.2 Button Events Must Use setButton()

```typescript
// ❌ Absolutely prohibited - Manually binding button events
private bindEvents() {
    this.[button node name]?.node.on(Node.EventType.TOUCH_END, this.[method name], this);
}

// ✅ Correct
onLoad() {
    super.onLoad();
    this.setWatch();
    this.setButton();  // Auto-listen to all buttons
}

/** [Button description] - Button event method name format: onBtn + button node name */
private onBtn[button node name](): void { ... }
```

**Button Event Naming Conventions**:
- **Button events** (auto-bound by `setButton()`): `onBtn[button node name]` (e.g., `onBtnClose`, `onBtnSearch`)
- **Normal methods**: `on[action/event]` (e.g., `onRefresh`, `onDataUpdate`)

**Prohibit manually unbinding button events in reset()/onDestroy()** — Framework auto-manages.

### [Mandatory] 4.3 reset() and onDestroy() Responsibility Description

**Core Principle**:
- `reset()` is an **ECS lifecycle method**, auto-called by framework when entity is destroyed
- `onDestroy()` is a **Cocos engine lifecycle method**, called when node is destroyed
- **If class already implements `reset()`, then no need to implement `onDestroy()`** — Both serve the same purpose of cleaning custom memory

```typescript
// ❌ Absolutely prohibited - Manually unbinding events in reset() (framework auto-releases)
reset() {
    this.unwatchAll();  // Framework auto-releases event listeners
}

// ❌ Error - Duplicate cleanup (have reset no need onDestroy)
reset() {
    this.props = null!;
}

onDestroy() {
    this.props = null!;  // Duplicate! reset() already cleaned
    super.onDestroy();
}

// ✅ Correct - Only clean custom memory in reset()
reset() {
    // Only clean custom memory content in current class
    this.myCustomMap.clear();
    this.props = null!;
}
```

**Rules**:
1. ECS components (Entity/Model/Business/View) **prefer using `reset()`** to clean memory
2. Only pure Cocos components (non-ECS) need to use `onDestroy()`
3. **Prohibit calling `this.unwatchAll()` in reset()** — Framework auto-releases event listeners

### [Mandatory] 4.4 View Layer Must Operate UI Through Business

```typescript
// ❌ Absolutely prohibited - View layer direct operation
oops.gui.open('VC_[Module]_[Name]');     // Prohibit direct call!
this.ent.add(VC_[Module]_[Name]);        // This method doesn't exist!
instantiate(this.[prefab property]);     // Prohibit self-instantiation!

// ✅ Correct - Operate through Business
this.ent.B_[Module]_ViewUI.open[ViewName]();
```

### [Mandatory] 4.5 MCP-Generated View Management Files Absolutely Prohibit AI Modification

`B_[Module]_ViewUI.ts` and `B_[Module]_ViewPrefab.ts` are auto-generated by MCP tool, containing standard APIs for view management. **AI is absolutely prohibited from modifying, deleting, or renaming any code in these files**.

**AI handling principles when seeing these two files**:
- If file exists → **Completely ignore, make no modifications**
- If file doesn't exist → Generated by MCP tool, AI does not actively create

```typescript
// ❌ Absolutely prohibited - Delete MCP-generated files
// B_[Module]_ViewUI.ts  ← Prohibit deletion!

// ❌ Absolutely prohibited - Modify method names
class B_[Module]_ViewUI {
    [wrong method name]() { ... }  // ❌ Error! Must be openMain()
}

// ❌ Absolutely prohibited - Inline replacement of this class in Business
class B_[Module]_Main extends CCBusiness<[Module]> {
    View: B_[Module]_ViewUI = new B_[Module]_ViewUI(this.ent);  // ❌ Prohibit inline!
}

// ✅ Correct - Keep MCP-generated files, directly use their APIs
this.ent.B_[Module]_ViewUI.openMain();
this.ent.B_[Module]_ViewUI.removeMain();
```

### [Mandatory] 4.6 MCP-Generated View Management File List

The following two view management Business files **are auto-generated by MCP tool**, AI **is absolutely prohibited from modifying, deleting, or renaming** any code in them:

| File | Responsibility | Core API |
|------|---------------|----------|
| `B_[Module]_ViewUI.ts` | UI interface management | `openMain()` / `removeMain()` / `openDetail()` / `removeDetail()` |
| `B_[Module]_ViewPrefab.ts` | Prefab management | `openA(parent)` / `removeA(node)` / `openItem(parent)` / `removeItem(node)` |

**Usage**: When needing to open/close UI or create/destroy prefabs, **directly call corresponding component's API**, prohibit inline implementing same logic in Entity or other Business.

```typescript
// ✅ Correct - View layer calls through Business
this.ent.B_[Module]_ViewUI.openMain();
this.ent.B_[Module]_ViewUI.removeMain();
this.ent.B_[Module]_ViewPrefab.openA(this.node);
this.ent.B_[Module]_ViewPrefab.removeA(itemNode);

// ❌ Absolutely prohibited - AI modifying MCP-generated view management files (B_[Module]_ViewUI.ts / B_[Module]_ViewPrefab.ts)
// ❌ Absolutely prohibited - Inline implementing openMain() logic in Entity
// ❌ Absolutely prohibited - Deleting B_[Module]_ViewUI.ts or B_[Module]_ViewPrefab.ts
```

---

## 5. Entity Layer Absolutely Prohibits Containing Business Logic

### [Mandatory] 5.1 Entity Is Module Entry, Prohibit Writing Business Methods

Entity's responsibility is **to serve as module entry registering and managing layer components**, **absolutely prohibited** from writing any business logic methods or view operation methods in Entity.

```typescript
// ❌ Absolutely prohibited - Writing business methods in Entity
@ecs.register('[Module]')
export class [Module] extends CCEntity {
    // ❌ Error! Business methods must be written in Business layer
    [business method name]([parameters]): [return type] {
        return this.M_[Module]_Main.[property].[method]([parameters]);
    }

    // ❌ Error! View operations must be written in View layer or call Business layer
    [view operation method name](): void {
        this.B_[Module]_ViewUI.openMain();
    }
}

// ✅ Correct - Entity only responsible for registering components, contains no business logic
@ecs.register('[Module]')
export class [Module] extends CCEntity {
    M_[Module]_Main!: M_[Module]_Main;
    B_[Module]_Main!: B_[Module]_Main;
    B_[Module]_ViewUI!: B_[Module]_ViewUI;
    B_[Module]_ViewPrefab!: B_[Module]_ViewPrefab;

    protected init() {
        this.addComponents(M_[Module]_Main);
        this.addBusinesss(B_[Module]_Main, B_[Module]_ViewUI, B_[Module]_ViewPrefab);
    }
}
```

### [Mandatory] 5.2 Business Logic Ownership Determination

| Method Type | Correct Owner | Wrong Owner |
|-------------|--------------|-------------|
| Data processing, validation, flow control | Business layer (`B_[Module]_Main`) | ❌ Entity |
| UI open/close | `B_[Module]_ViewUI` / `B_[Module]_ViewPrefab` | ❌ Entity |
| Data storage, state management | Model layer (`M_[Module]_Main`) | ❌ Entity |
| User interaction, UI update | View layer (`VC_[Module]_Main`) | ❌ Entity |

### [Mandatory] 5.3 Usage Method

When needing business functionality, **call corresponding layer component's API**, instead of encapsulating in Entity:

```typescript
// ✅ Correct - Directly call Business layer API
this.ent.B_[Module]_Main.[business method]([parameters]);

// ✅ Correct - Directly call view management Business API
this.ent.B_[Module]_ViewUI.openMain();
this.ent.B_[Module]_ViewPrefab.openA(parentNode);

// ✅ Correct - Directly access Model data (read-only scenario)
const [data] = this.ent.M_[Module]_Main.[property].get([key]);

// ❌ Absolutely prohibited - Encapsulate in Entity then call
// Entity: [method name]([parameters]) { this.B_[Module]_Main.[business method]([parameters]); }
// External call: this.ent.[method name]([parameters]);  ← Error!
```

---

## 6. Property Initialization Style

### [Mandatory] 6.1 @property Properties Must Use `null!` Initialization

All properties using `@property` decorator **must** use `null!` for initialization.

```typescript
// ✅ Correct
@property([component type])
private [property name]: [component type] = null!;

// ❌ Error - Must initialize
@property([component type])
private [property name]: [component type];

// ❌ Error - Prohibit using = null (without !)
@property([component type])
private [property name]: [component type] = null;

// ❌ Error - Prohibit using union type
@property([component type])
private [property name]: [component type] | null = null;

// ❌ Error - Prohibit using optional marker
@property([component type])
private [property name]?: [component type];
```

**Reason**: Cocos Creator's `@property` auto-assigns in editor; `null!` tells TypeScript "this value won't be null, trust me"; avoids writing non-null assertions (`!`) everywhere in code.

---

## 7. Log Principles

### [Mandatory] 7.1 Prohibit Using console.log in Business/View

```typescript
// ❌ Absolutely prohibited
console.log('[log content]');

// ✅ Correct - Business layer
oops.log.logBusiness('[log content]', '[module name]');

// ✅ Correct - View layer
oops.log.logView('[log content]');
```

---

## 8. Verification Closed Loop

### [Mandatory] 8.1 AI Directly Generates Complete Code

```typescript
// ✅ Correct - AI directly generates complete standard code and writes
Write(filePath, "complete code content");
```

**Workflow**:
1. MCP only creates empty files as needed
2. AI directly generates complete code conforming to standards (one-time write)
3. Validator verifies

### [Mandatory] 8.2 Prohibit Skipping Verification Steps

After code generation **must**:
- [ ] Check if each import is actually used
- [ ] Check if class names follow naming conventions
- [ ] Check if inheritance relationships are correct
- [ ] Check if decorators are correct
- [ ] Check if method signatures match meta-templates
- [ ] Check if `declare global` is included (EventData files)
- [ ] Check if unused code is deleted

**Rule**: Verification failed = Not deliverable. Must fix and re-verify.
