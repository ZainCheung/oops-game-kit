# Bugly 小游戏 SDK 放置说明

## 目录结构

```
libs/bugly/
├── wechat/          # 微信小游戏 Bugly SDK
│   ├── bugly-wxgame-sdk.js    ← 已放置（基于 bugly-mp-sdk@1.0.5-beta.4）
│   └── bugly-wxgame-sdk.d.ts  ← 类型声明
├── douyin/          # 抖音小游戏 Bugly SDK
│   ├── bugly-ttgame-sdk.js    ← 已放置（基于 bugly-mp-sdk@1.0.5-beta.4）
│   └── bugly-ttgame-sdk.d.ts  ← 类型声明
├── bugly-mp-sdk.d.ts          ← 通用类型声明（可选）
└── README.md                  # 本文件
```

## 来源说明

本 SDK 取自官方 npm 包 `bugly-mp-sdk@1.0.5-beta.4`：
- 构建产物：`aegis.min.js`（UMD 格式）
- 支持平台：微信、抖音、支付宝、百度等小程序/小游戏
- 通过 `require` 引入后，需根据平台传入对应适配器（`wxAdaptor` / `ttAdaptor`）

## 接入方式

在项目启动时注入 Bugly SDK 实例：

```typescript
import { monitoring } from '../base/sdk/monitoring';
import { BuglyMonitoringSdk } from '../base/sdk/monitoring/entity/BuglyMonitoringSdk';

monitoring.setSdk(new BuglyMonitoringSdk());
monitoring.init({ appId: '你的Bugly产品ID', version: '1.0.0' });
```

## 注意事项

- 微信和抖音共用同一套构建产物，只是通过不同适配器区分平台。
- Beta 版目前处于灰度验证阶段，建议先小范围试用。
- 若需要更新版本，可执行 `npm install bugly-mp-sdk@latest` 后重新复制 `node_modules/bugly-mp-sdk/lib/aegis.min.js` 到对应目录。
