---
name: "oops-workflow-code-generation"
description: "Oops Framework code generation workflow. Unified entry point, AI directly generates complete code conforming to specifications, MCP only used for creating empty files, validate immediately after generation."
triggers:
  keywords:
    - "generate code"
    - "create module"
    - "add feature"
    - "generate module"
    - "code generation"
    - "generate module"
    - "create module"
    - "workflow"
  patterns:
    - ".*generate.*module"
    - ".*create.*module"
    - ".*add.*feature"
    - ".*code.*generate"
---

# Oops Framework Code Generation Workflow

## Architecture Overview

### Workflow Overview

| Phase | Component | Core Responsibility | Processing Content | Output |
|-------|-----------|--------------------|--------------------|--------|
| 1 | **MCP** | Create files | Only create empty files and directory structure | Empty files |
| 2 | **AI Generation** | Directly generate complete code | Class names/inheritance/imports/decorators/methods correct at once | Complete code |
| 3 | **Validator** | Validation check | Call `oops-code-validator` skill | Validation report |

### Flow Direction

```
MCP (Create empty files) → AI (Directly generate complete standard code) → Validator (Validate)
                                                      ↓ Validation failed
                                                 Return to AI for fix
```

### Component Details

| Component | Input | Processing | Output |
|-----------|-------|-----------|--------|
| **MCP** | Module design | Only create empty files and directory structure | Empty files |
| **AI** | Empty file paths | Directly write complete code conforming to framework specifications | Complete code files |
| **Validator** | Generated code | Call `oops-code-validator` skill to execute validation | Validation results |

---

## Workflow

### Step 1: MCP Creates Empty Files

**MCP Responsibility**: Only create empty files and basic directory structure, do not write any code content.

```
MCP tool calls
    ├── CreateModule - Create module directory and empty files (only create, do not fill)
    ├── ModuleEntity - Create Entity empty file
    ├── ModuleModel - Create Model empty file
    ├── ModuleBusiness - Create Business empty file
    ├── ModuleView - Create View empty file
    ├── ModuleEnum - Create enum empty file
    ├── ModuleType - Create type empty file
    ├── ModuleInterface - Create interface empty file
    └── ModuleEvent - Create event empty file
```

**MCP Output**: Empty files (0 bytes or only file creation)

---

### Step 1.5: Decision Confirmation (Critical)

Before calling MCP to create empty files, AI must first complete:

1. **Requirement analysis**: Transform user description into specific feature point list
2. **Ambiguity identification**: Mark all uncertain items needing developer confirmation
3. **Decision inquiry**: Use AskUserQuestion to present options to developer (2-4 solutions + pros/cons + AI recommendation)
4. **Confirmation archive**: Record developer's choices for subsequent generation

**Trigger Conditions**:

- Uncertain feature scope (e.g., does "backpack system" include organize/sort/batch operations)
- Unspecified interaction method (popup vs navigate vs embed)
- Undefined data structure (which specific fields to display/store)
- Missing business rules (limit conditions, state transitions, quantity limits)
- Unspecified visual hierarchy (simple list item vs complex cards)
- Non-unique technical solution (one or multiple Models in Model layer)
- Ambiguous event design (one event or multiple events)
- Unclear data flow direction (active pull or passive push)

**Execution Standard**:

- Any of the above occurs → **Must use AskUserQuestion to ask developer**
- All key decisions clear → Can enter MCP file creation stage

**Only after all key decisions are confirmed by developer, can enter MCP file creation stage.**

> **Detailed constraint rules see**: `../rules/oops-rule-core.md` Chapter 2 "Decision Inquiry Principle"

---

### Step 2: AI Directly Generates Complete Code

**AI Responsibility**: According to specifications, directly generate complete, correct code, write to file at once.

**Correct Behavior**:

- ✅ AI directly generates complete code according to specifications
- ✅ Use `Write` tool to write complete file at once
- ✅ Ensure class names, inheritance, imports, decorators, methods all correct

**Decision checks during code generation**:
Even during code generation, must pause if encountering:

- Discovering properties/methods not mentioned by user but needing assumption
- Discovering multiple equivalent implementation options (e.g., one event vs multiple events)
- Discovering need for supplementary business rules to continue coding
- Discovering missing UI interaction details (e.g., feedback method after button click)

**Handling**: Stop current file generation, use AskUserQuestion to ask, continue after getting response.

---

## Specification References

All code generation must follow the following rule files:

| Specification | File Path | Content |
|--------------|-----------|---------|
| **Core Constraints** | `../rules/oops-rule-core.md` | AI behavior red lines, decision inquiry, mandatory generation order, validation closed loop |
| **Architecture Specification** | `../rules/oops-rule-architecture.md` | Three-tier architecture design specification, inter-layer communication rules |
| **Coding Standards** | `../rules/oops-rule-coding.md` | Layer code templates, import/event/method specifications |
| **Project Structure** | `../rules/oops-rule-structure.md` | Directory structure, file and class naming conventions |

**Must when generating**:

1. Open corresponding rule file
2. Find corresponding file type meta-template
3. Replace placeholders and directly use
4. **Prohibit free-form coding, prohibit coding from memory**

---

## Placeholder Description

| Placeholder | Replacement Rule | Example |
|-------------|-----------------|---------|
| `[Module]` | Module name, PascalCase | `Shop`, `Friend`, `Login` |
| `[Name]` | File function suffix | `Main`, `List`, `Item`, `Model` |
| `[module]` | Module name all lowercase | `shop`, `friend`, `login` |
| `[EventName]` | Event name, first letter uppercase | `BuyClick`, `DataUpdate` |

---

## MCP Auto-Generation Description

The following files are auto-generated by MCP tool, AI does not need to manually write:

| File | Generation Timing | Description |
|------|------------------|-------------|
| `B_[Module]_ViewUI.ts` | When creating `gameComponent` or `ecsView` type View | Auto-add `open{ViewName}()` and `remove{ViewName}()` methods |
| `B_[Module]_ViewPrefab.ts` | When creating `gameComponentPrefab` or `ecsViewPrefab` type View | Auto-add `open{ViewName}(parent)` and `remove{ViewName}(node)` methods |

**AI Prohibited**:

- ❌ Delete these two files
- ❌ Modify method names in them
- ❌ Create inline ViewUI/ViewPrefab replacement classes in other Business

> **Detailed constraints see**: `../rules/oops-rule-core.md` Chapter 4 "API Usage and View Management"

---

## Step 3: Validation Check

After code generation **must** call `oops-code-validator` skill for validation.

**Validation Flow**:

1. Call `oops-code-validator` skill
2. Fix issues according to validation report (if any)
3. Re-validate until passed

**Validation Failure Handling**:

- Must fix and re-validate
- **Validation not passed, absolutely not deliverable**

> **Detailed validation rules, self-check list, and fix methods see `oops-code-validator` skill**

---

## Three-Tier Architecture Skill Reference

When generating code, reference the following skills for standard writing of each layer:

| Layer | Skill File | Meta-Template Source |
|-------|-----------|---------------------|
| Entity | `oops-guide-entity` | `../rules/oops-rule-coding.md` Section 1 |
| Model | `oops-guide-model` | `../rules/oops-rule-coding.md` Section 2 |
| Business | `oops-guide-business` | `../rules/oops-rule-coding.md` Section 3 |
| ViewUI | `oops-guide-viewui` | `../rules/oops-rule-coding.md` Section 4 |
| ECS View | `oops-guide-view` | `../rules/oops-rule-coding.md` Section 6 |
| GameComponent | `oops-guide-view` | `../rules/oops-rule-coding.md` Section 7 |
| Event | `oops-guide-event` | `../rules/oops-rule-coding.md` Section 8 |
| Enum | `oops-guide-enum` | `../rules/oops-rule-structure.md` Section 3 |

---

## Backpack Module Directory Structure Reference

```
backpack/
├── Backpack.ts                    # Entity layer
├── BackpackEvent.ts               # Event enum
├── BackpackEventData.ts           # Event data interface
├── bll/
│   ├── B_Backpack_Main.ts         # Business logic
│   ├── B_Backpack_ViewUI.ts       # View management (MCP generated, AI prohibit modification)
│   └── B_Backpack_ViewPrefab.ts   # Prefab management (MCP generated, AI prohibit modification)
├── model/
│   ├── M_Backpack_Main.ts         # Data component
│   └── enum/
│       └── EM_Backpack.ts         # Module enum
└── view/
    ├── VC_Backpack_Main.ts        # Main UI
    └── V_Backpack_Prop.ts         # List item
```
