---
name: "Project Structure"
description: "Oops Framework directory structure and naming conventions, including project directory, module directory, file and class naming rules"
priority: "medium"
triggers:
  keywords:
    - "directory"
    - "structure"
    - "naming"
    - "folder"
    - "prefix"
    - "create module"
  patterns:
    - ".*directory.*structure.*"
    - ".*create.*module.*"
    - ".*naming.*convention.*"
---

# Oops Framework - Project Structure and Naming Conventions

This document defines the directory structure, module organization, and file/class/method naming rules of Oops Framework.

---

## 1. Project Directory Structure

### 1.1 Project Assets Directory

```
assets/                          # Project assets root directory
├── bundle/                      # Remote resource bundle directory
│   ├── audios/                  # Audio resources
│   ├── common/                  # Common resources
│   │   ├── anim/                # Animation resources
│   │   ├── prefab/              # Common prefabs
│   │   └── texture/             # Common textures
│   ├── config/                  # Configuration data
│   │   └── game/                # Game configuration
│   ├── game/                    # Game core gameplay resources directory
│   ├── gui/                     # Game UI resources
│   │   ├── common/              # Common game UI
│   │   └── loading/             # Loading game UI
│   ├── language/                # Multi-language resources
├── libs/                        # Third-party libraries
├── resources/                   # Engine default resource bundle directory
└── script/                      # Script code
    └── game/                    # Game business module code
```

### 1.2 Framework Source Directory

```
extensions/oops-plugin-framework/assets/    # Framework source root directory
├── core/                                    # Core features
│   ├── common/                              # Common modules
│   │   ├── audio/                           # Audio management
│   │   ├── event/                           # Event system
│   │   ├── loader/                          # Resource loading
│   │   ├── log/                             # Log system
│   │   ├── storage/                         # Local storage
│   │   └── timer/                           # Timer
│   ├── game/                                # Game management
│   ├── gui/                                 # GUI system
│   │   ├── layer/                           # Layer management
│   │   └── prompt/                          # Prompt components
│   └── utils/                               # Utility classes
├── libs/                                    # Extension libraries
│   ├── animator/                            # Animation system
│   ├── animator-effect/                     # Animation effects
│   ├── animator-move/                       # Move animation
│   ├── behavior-tree/                       # Behavior tree
│   ├── camera/                              # Camera control
│   ├── collection/                          # Collection classes
│   ├── ecs/                                 # ECS framework
│   ├── extension/                           # Extension methods
│   ├── gui/                                 # GUI components
│   ├── model-view/                          # MVVM framework
│   ├── network/                             # Network module
│   └── render-texture/                      # Render texture
├── module/                                  # Game business module base classes
│   ├── common/                              # Common module classes
│   │   ├── CCBusiness.ts                    # Business layer base class
│   │   ├── CCEntity.ts                      # Entity base class
│   │   ├── CCView.ts                        # View layer base class
│   │   └── GameComponent.ts                 # Component base class
│   ├── config/                              # Configuration module
│   └── decorator/                           # Decorators
└── types/                                   # Type definitions
```

---

## 2. Module Directory Structure

```
[module]/                       # Directory name lowercase (e.g.: backpack/)
├── [Module].ts                # Module entry (CCEntity), first letter uppercase (e.g.: Backpack.ts)
├── [Module]Event.ts           # Event definitions
├── [Module]EventData.ts       # Event data types
├── model/                     # Data layer
│   ├── M_[module]_Model.ts
│   ├── M_[module]_Config.ts
│   └── enum/                  # Enum subdirectory
│       └── EM_[module].ts     # Enum definitions
├── bll/                       # Business layer
│   └── B_[module]_[feature].ts
└── view/                      # View layer
    ├── VC_[module]_[feature].ts     # ECS view
    └── V_[module]_[feature].ts      # Normal view
```

### 2.1 Module Naming Conventions

**Module name must match directory name, first letter uppercase**

| Item | Naming Rule | Example |
|------|------------|---------|
| **Directory name** | Lowercase module name | `backpack`, `login`, `shop` |
| **Module class name** | Module name with first letter uppercase | `Backpack`, `Login`, `Shop` |
| **Entity file name** | Same as module class name | `Backpack.ts`, `Login.ts`, `Shop.ts` |

**Examples**:
- Directory: `backpack/` (lowercase)
- Entity file: `backpack/Backpack.ts` (first letter uppercase)
- Module class name: `export class Backpack extends CCEntity`
- Model file: `backpack/model/M_Backpack_Main.ts`
- Business file: `backpack/bll/B_Backpack_Main.ts`
- View file: `backpack/view/VC_Backpack_Main.ts`

**Error Examples**:
- ❌ Directory `backpack/` + file `backpack/User.ts` (module name inconsistent with directory)
- ❌ Directory `backpack/` + class name `class BackpackModule` (redundant suffix)
- ❌ Directory `Backpack/` (directory name uses uppercase)

---

## 3. Prefix Rules Table

| File Type | Prefix | Example | Description |
|-----------|--------|---------|-------------|
| **Entity** | None | `Backpack.ts` | Module entry entity component |
| **Model** | `M_` | `M_Backpack_Main.ts` | Data model component |
| **Business** | `B_` | `B_Backpack_Main.ts` | Business logic component |
| **System** | `S_` | `S_Backpack_Sort.ts` | ECS system component |
| **ECS View** | `VC_` | `VC_Backpack_Main.ts` | ECS view component |
| **GameComponent** | `V_` | `V_Backpack_Prop.ts` | Game component view |
| **Enum** | `EM_` / `EB_` / `EV_` | `EM_Backpack.ts` | model layer EM, bll layer EB, view layer EV |
| **Type** | `TM_` / `TB_` / `TV_` | `TM_Backpack_Data.ts` | model layer TM, bll layer TB, view layer TV |
| **Config** | `CM_` / `CB_` / `CV_` | `CM_Backpack_Table.ts` | model layer CM, bll layer CB, view layer CV |
| **Interface** | `IM_` / `IB_` / `IV_` | `IM_Backpack_Data.ts` | model layer IM, bll layer IB, view layer IV |
| **Event** | None | `BackpackEvent.ts` | Event definitions |
| **EventData** | None | `BackpackEventData.ts` | Event data definitions |

### 3.1 Layer Prefix Comparison Table

| Layer | Enum | Type | Config | Interface |
|-------|------|------|--------|-----------|
| **model** | `EM_` | `TM_` | `CM_` | `IM_` |
| **bll** | `EB_` | `TB_` | `CB_` | `IB_` |
| **view** | `EV_` | `TV_` | `CV_` | `IV_` |

---

## 4. Naming Format

```
[prefix]_[ModuleName]_[FeatureDescription].ts

Examples:
- Backpack.ts                 (Entity layer - Backpack module - Entry entity)
- M_Backpack_Main.ts          (Model layer - Backpack module - Main data model)
- B_Backpack_Main.ts          (Business layer - Backpack module - Main business)
- B_Backpack_ViewUI.ts        (Business layer - Backpack module - View management)
- S_Backpack_Sort.ts          (System layer - Backpack module - Sort system)
- VC_Backpack_Main.ts         (ECS View layer - Backpack module - Main UI)
- V_Backpack_Prop.ts          (GameComponent layer - Backpack module - Prop item)
- EM_Backpack.ts              (Enum - Backpack module - Red dot enum)
- TM_Backpack_Data.ts         (Type - Backpack module - Data type)
- CM_Backpack_Table.ts        (Config - Backpack module - Config table)
- IM_Backpack_Data.ts         (Interface - Backpack module - Data interface)
- BackpackEvent.ts            (Event - Backpack events)
- BackpackEventData.ts        (EventData - Backpack event data)
```

---

## 5. Method Naming Conventions

### 5.1 Method Naming Style

| Type | Naming Style | Example | Description |
|------|-------------|---------|-------------|
| Public method | camelCase | `buyItem()`, `updateData()` | Lowercase start, verb start |
| Private method | camelCase | `update()`, `onClick()` | **No `_` prefix** |
| Protected method | camelCase | `init()`, `reset()` | **No `_` prefix** |
| Event handler | `on` + element + action | `onBuyButtonClick()`, `onDataUpdate()` | UI event handling |

### 5.2 Method Naming Prefix Conventions

| Prefix | Purpose | Example |
|--------|---------|---------|
| `get` | Get data | `getGold()`, `getItemById()` |
| `set` | Set data | `setGold()`, `setConfig()` |
| `is` | Boolean check | `isValid()`, `isEmpty()` |
| `has` | Existence check | `hasItem()`, `hasPermission()` |
| `can` | Capability check | `canBuy()`, `canEquip()` |
| `on` | Event handling | `onClick()`, `onDataChange()` |
| `update` | Update data | `updateUI()`, `updateState()` |
| `init` | Initialize | `init()`, `initData()` |
| `reset` | Reset | `reset()`, `resetData()` |

---

## 6. Member Variable Naming Conventions

| Type | Naming Style | Example | Description |
|------|-------------|---------|-------------|
| Public member | camelCase | `gold`, `itemCount` | Lowercase start |
| Private member | camelCase | `data`, `isLoaded` | **No `_` prefix** |
| Protected member | camelCase | `config` | **No `_` prefix** |

---

## 7. Constant Naming Conventions

| Type | Naming Style | Example |
|------|-------------|---------|
| Global constant | UPPER_SNAKE_CASE | `MAX_COUNT`, `DEFAULT_SPEED` |
| Class constant | UPPER_SNAKE_CASE | `static readonly MAX_ITEMS = 100` |
| Enum value | UPPER_SNAKE_CASE | `DEFAULT = 1` |

---

## 8. Generic Naming Conventions

| Letter | Purpose | Example |
|--------|---------|---------|
| `T` | Generic type | `class List<T>` |
| `K` | Key type | `K extends keyof T` |
| `V` | Value type | `class Map<K, V>` |
| `E` | Element type | `class Array<E>` |
| `R` | Return type | `function map<T, R>(): R[]` |

---

## 9. File Organization Principles

1. **Separate by layer** — Different component types in corresponding directories (model/, bll/, view/)
2. **Proximity principle** — Related type definitions in same directory
3. **Flat structure** — Avoid deep directory nesting
