---
name: "oops-guide-enum"
description: "Oops Framework enum definition specification. Called when user needs to create module enums or define constants."
triggers:
  keywords:
    - "Enum"
    - "enum"
    - "constant"
    - "config"
  patterns:
    - ".*Enum.*"
    - ".*enum.*"
    - ".*constant.*"
---

# Oops Framework Enum Specification

## Usage Instructions

When generating enum code, **must** follow this workflow:

1. Open `oops-rule-structure.md`, find enum naming conventions in **"3. Prefix Rules Table"**
2. Select correct prefix (`EM_` / `EB_` / `EV_`) based on enum's layer
3. Add enum values based on user requirements
4. Check item by item against mandatory requirements below

## Mandatory Requirements

| Check Item | Requirement |
|-----------|-------------|
| Naming | `export enum [Prefix]_[Module]`, select prefix based on layer |
| Export | Must `export` |
| Value type | String or number enum, select based on scenario |

### Layer Prefix Comparison Table (from oops-rule-structure.md)

| Layer | Enum Prefix | Example |
|-------|------------|---------|
| **model** | `EM_` | `EM_Backpack.ts` |
| **bll** | `EB_` | `EB_Backpack.ts` |
| **view** | `EV_` | `EV_Backpack.ts` |

## Related Specifications

- Prefix rules: `../rules/oops-rule-structure.md` Section 3
- Project structure: `../rules/oops-rule-structure.md`
