---
name: "oops-core-log"
description: "Oops Framework 日志模块使用指南。当用户需要使用日志功能、了解日志类型、配置日志过滤器或实现自定义日志输出时调用。涵盖 LogType 日志类型、Logger 日志管理器的使用方法。"
triggers:
  keywords:
    - "日志"
    - "log"
    - "Logger"
    - "LogType"
    - "打印日志"
    - "调试日志"
    - "日志过滤"
    - "console.log"
    - "oops.log"
  patterns:
    - ".*日志.*"
    - ".*log.*"
    - "LogType.*"
---

# Oops Framework 日志模块

本文档介绍 Oops Framework 的日志系统，包括日志类型、使用方法和配置方式。

## 触发条件

**当用户需要以下操作时调用此技能**：
- 使用日志功能打印调试信息
- 了解日志类型和分类
- 配置日志过滤器控制输出
- 实现自定义日志控制台
- 性能计时功能

**不匹配的情况**（使用其他技能）：

| 场景 | 推荐技能/文档 |
|------|--------------|
| 编码标准 | `../rules/oops-rule-coding.md` |

---

## 1. 日志管理器 (Logger)

### 1.1 获取实例

```typescript
import { oops } from 'db://oops-framework/core/Oops';

// 通过 oops 访问
oops.log.trace("标准日志");

// 或直接导入
import { Logger } from 'db://oops-framework/core/common/log/Logger';
Logger.instance.trace("标准日志");
```

### 1.2 日志类型 (LogType)

```typescript
/** 日志类型 */
export enum LogType {
    Net = 1,        // 网络层日志
    Model = 2,      // 数据结构层日志
    Business = 4,   // 业务逻辑层日志
    View = 8,       // 视图层日志
    Config = 16,    // 配置日志
    Trace = 32,     // 标准日志
}
```

---

## 2. 基础日志输出

### 2.1 标准日志

```typescript
// 标准日志（黑色）
oops.log.trace("普通信息");

// 带颜色的标准日志
oops.log.trace("普通信息", "#ff0000");
```

### 2.2 分层日志

```typescript
// 网络层日志（橙色）
oops.log.logNet("网络请求信息", "Network");

// 数据层日志（紫色）
oops.log.logModel("数据变更信息", "Model");

// 业务层日志（蓝色）
oops.log.logBusiness("业务逻辑信息", "Business");

// 视图层日志（绿色）
oops.log.logView("视图层信息", "View");

// 配置日志（灰色）
oops.log.logConfig("配置信息", "Config");
```

### 2.3 视图层专用日志

```typescript
// 视图层日志 - 用于 UI 相关日志输出
oops.log.logView("视图层信息");

// 示例：背包界面加载完成
private onLoad() {
    super.onLoad();
    oops.log.logView("背包界面加载完成");
}
```

> **注意**：视图层日志使用 `oops.log.logView()`，便于在控制台过滤 UI 相关日志。

### 2.4 带描述的日志

```typescript
// 使用描述分类日志
oops.log.logBusiness("更新背包道具", "Backpack");
oops.log.logBusiness("使用道具完成", "Backpack");
oops.log.logNet("请求背包数据", "Network");
```

---

## 3. 日志配置

### 3.1 设置日志类型过滤

```typescript
import { LogType } from 'db://oops-framework/core/common/log/Logger';

// 只显示视图层和业务层日志
oops.log.setTags(LogType.View | LogType.Business);

// 显示所有日志
oops.log.setTags(
    LogType.Net |
    LogType.Model |
    LogType.Business |
    LogType.View |
    LogType.Config |
    LogType.Trace
);

// 不显示任何日志（传入 null）
oops.log.setTags(null!);
```

### 3.2 启用/禁用日志

```typescript
// 完全禁用日志输出（关闭所有 console 方法）
oops.log.disable();
```

---

## 4. 自定义日志控制台

### 4.1 设置自定义控制台

```typescript
import { ILoggerConsole } from 'db://oops-framework/core/common/log/Logger';

class MyLoggerConsole implements ILoggerConsole {
    trace(content: string, color: string): void {
        // 自定义输出逻辑，例如发送到服务器
        console.log(content);
    }
}

// 设置自定义日志控制台
oops.log.setLoggerConsole(new MyLoggerConsole());
```

---

## 5. 性能计时

### 5.1 基础计时

```typescript
// 开始计时
oops.log.start("加载背包数据");

// 执行操作
await loadBackpackData();

// 结束计时并输出
oops.log.end("加载背包数据");  // 输出: [性能][加载背包数据]消耗[1234ms]
```

### 5.2 多段计时

```typescript
// 同时计时多个操作
oops.log.start("初始化背包");
oops.log.start("加载道具资源");

await initBackpack();
oops.log.end("初始化背包");

await loadPropResources();
oops.log.end("加载道具资源");
```

---

## 6. 表格打印

```typescript
// 打印对象表格
const backpackData = {
    propCount: 50,
    capacity: 100,
    lastUpdate: Date.now()
};
oops.log.table(backpackData);
```

---

## 7. 背包模块日志示例

### 7.1 Business 层日志

```typescript
import { oops } from 'db://oops-framework/core/Oops';
import { CCBusiness } from 'db://oops-framework/module/common/CCBusiness';
import { Backpack } from '../Backpack';
import { BackpackEventName, IBackpackEventDataMap } from '../BackpackEvent';

export class B_Backpack_Main extends CCBusiness<Backpack> {
    protected init() {
        oops.log.logBusiness("背包业务初始化完成", "Backpack");
        this.setWatch();
    }

    private setWatch() {
        this.watch(BackpackEventName.Use, this.onBackpackUse, this);
        this.watch(BackpackEventName.Update, this.onBackpackUpdate, this);
    }

    private onBackpackUse<K extends BackpackEventName.Use>(event: K, data: IBackpackEventDataMap[K]): void {
        oops.log.logBusiness(`使用道具: id=${data.id}, amount=${data.amount}`, "Backpack");
        this.use(data.id, data.amount, data.listId);
    }

    private onBackpackUpdate<K extends BackpackEventName.Update>(event: K, data: IBackpackEventDataMap[K]): void {
        oops.log.logBusiness(`接收背包数据更新: ${data.data.length} 条`, "Backpack");
        data.data.forEach((p) => {
            this.update(p.propId, p.amount);
        });
    }

    private update(id: number, amount: number) {
        oops.log.logBusiness(`更新道具: id=${id}, amount=${amount}`, "Backpack");
        // ...
    }
}
```

### 7.2 View 层日志

```typescript
import { oops } from 'db://oops-framework/core/Oops';
import { CCView } from 'db://oops-framework/module/common/CCView';
import { Backpack } from '../Backpack';

export class VC_Backpack_Main extends CCView<Backpack> {
    onLoad() {
        super.onLoad();
        oops.log.logView("背包界面加载完成");
        this.setWatch();
    }

    private onBtnClose() {
        oops.log.logView("关闭背包界面");
        this.ent.B_Backpack_ViewUI.removeMain();
    }
}
```

---

## 8. 最佳实践

### 8.1 使用建议

| 场景 | 推荐方法 | 说明 |
|------|----------|------|
| 标准日志 | `oops.log.trace()` | 常规日志输出 |
| 网络层 | `oops.log.logNet()` | 网络请求/响应 |
| 数据层 | `oops.log.logModel()` | 数据变更 |
| 业务层 | `oops.log.logBusiness()` | 业务逻辑 |
| 视图层 | `oops.log.logView()` | UI 相关日志 |
| 配置层 | `oops.log.logConfig()` | 配置信息 |
| 性能分析 | `oops.log.start()` / `oops.log.end()` | 测量代码执行时间 |
| 表格打印 | `oops.log.table()` | 打印对象表格 |

### 8.2 注意事项

```typescript
// ✅ 推荐：使用描述分类日志
oops.log.logBusiness("更新背包道具", "Backpack");

// ❌ 避免：无描述的日志
oops.log.trace("一些信息");  // 难以分类和过滤

// ✅ 推荐：生产环境禁用日志
oops.log.disable();

// ❌ 避免：在生产环境输出大量日志
// 会影响性能
```

---

## 9. 分层日志规范

Oops Framework 采用三层架构，每层有对应的日志使用规范。

### 9.1 View 层（视图层）

视图层使用 `oops.log.logView()` 输出视图相关日志。

```typescript
export class VC_Backpack_Main extends CCView<Backpack> {
    onLoad() {
        super.onLoad();
        oops.log.logView("背包界面加载完成");
    }
}
```

**View 层日志使用场景**：

| 场景 | 推荐方法 | 说明 |
|------|----------|------|
| 界面生命周期 | `oops.log.logView()` | 打开、关闭、显示、隐藏 |
| 用户交互 | `oops.log.logView()` | 按钮点击、列表选择 |
| 错误信息 | `oops.log.logView()` | 界面加载失败等 |

### 9.2 Business 层（业务层）

业务层使用 `oops.log.logBusiness()` 输出业务逻辑日志，建议使用模块名作为描述便于过滤。

```typescript
export class B_Backpack_Main extends CCBusiness<Backpack> {
    private update(id: number, amount: number) {
        oops.log.logBusiness(`更新道具: id=${id}, amount=${amount}`, "Backpack");
        // 业务逻辑...
    }
}
```

**Business 层日志使用场景**：

| 场景 | 推荐方法 | 说明 |
|------|----------|------|
| 业务初始化 | `oops.log.logBusiness()` | 业务组件初始化完成 |
| 业务方法执行 | `oops.log.logBusiness()` | 关键业务逻辑执行 |
| 事件处理 | `oops.log.logBusiness()` | 收到/处理事件 |
| 错误信息 | `oops.log.logBusiness()` | 业务逻辑错误 |
| 性能计时 | `oops.log.start()` / `oops.log.end()` | 耗时操作计时 |

### 9.3 Model 层（数据层）

数据层使用 `oops.log.logModel()` 输出数据变更日志。

```typescript
export class M_Backpack_Main extends ecs.Comp {
    props = new Collection<number, Prop>();

    reset() {
        oops.log.logModel("清理背包数据", "Backpack");
        this.props.forEach((p) => p.destroy());
        this.props.clear();
    }
}
```

---

## 10. 关联技能

| 场景 | 推荐技能 |
|------|----------|
| Business 层编写 | `oops-guide-business` |
| View 层编写 | `oops-guide-view` |
| Model 层编写 | `oops-guide-model` |
