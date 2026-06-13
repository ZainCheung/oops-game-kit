---
name: "oops-guide-framework-modules"
description: "Oops Framework core functional modules overview. Called when user needs to understand oops.xxx API functionality overview, quick reference, or navigate to detailed skills."
triggers:
  keywords:
    - "oops"
    - "framework module"
    - "core feature"
    - "API"
    - "feature overview"
  patterns:
    - ".*oops\\..*"
    - ".*framework.*"
    - ".*module.*"
---

# Oops Framework Core Functional Modules Overview

## Usage Instructions

When user asks about framework features, needs quick reference, or navigation to specific modules, use this skill to provide overview and navigation.

## Core Module Quick Reference

| Module | Entry | Purpose | Detailed Skill |
|--------|-------|---------|---------------|
| Log | `oops.log` | Log output, filtering, customization | `oops-core-log` |
| Timer | `oops.timer` | Countdown, delayed execution, server time sync | `oops-core-timer` |
| Random | `oops.random` | Random number generation, random extraction, seed random | `oops-core-random` |
| Storage | `oops.storage` | Local data persistence, encrypted storage | `oops-core-storage` |
| GUI | `oops.gui` | UI management, layer control | `oops-guide-viewui` |
| ECS | `ecs` | Entity Component System | `oops-guide-entity` |

## Module Usage Principles

1. **View layer** open/close UI must use `this.ent.B_[Module]_ViewUI.openMain()` / `removeMain()`, prohibit directly calling `oops.gui.open()` / `oops.gui.remove()`
2. **Business layer** uses `oops.log.logBusiness(msg, module)` to record logs
3. **All layers** use `oops.timer` for timing operations, prohibit `setTimeout`/`setInterval`
4. **Data storage** uses `oops.storage`, prohibit directly operating `localStorage`

## Related Specifications

- Core constraints: `../rules/oops-rule-core.md`
- Coding standards: `../rules/oops-rule-coding.md`
