# 平台 SDK 模块

平台无关的多平台 SDK 接入层，目前实现 **微信小游戏** 全部能力。

## 目录结构

```
base/sdk/
├── Sdk.ts                      # ECS 实体入口（注册到 Base 模块）
├── SdkManager.ts               # SDK 管理器：自动识别平台 + 工厂注册
├── ISdk.ts                     # 平台无关 SDK 接口（所有平台实现此接口）
├── SdkEvent.ts                 # SDK 事件枚举
├── SdkEventData.ts             # 事件数据类型映射（扩展全局事件系统）
├── bll/
│   └── B_Sdk_Main.ts          # 主业务逻辑：初始化 + 事件转发
├── platform/
│   ├── DefaultSdk.ts          # 默认空实现（H5/编辑器兜底）
│   └── WeChatMiniGameSdk.ts   # 微信小游戏实现（继承 DefaultSdk）
└── model/
    ├── enum/EM_Sdk.ts         # 平台/广告/振动/网络类型枚举
    └── data/SdkData.ts        # 平台无关数据类型定义

libs/wechat-minigame-typings/   # 微信小游戏官方 TypeScript 类型定义 v3.8.20
├── index.d.ts
├── lib.wx.api.d.ts
├── lib.wx.cloud.d.ts
└── lib.wx.wasm.d.ts
```

## 设计原则

1. **接口统一**：所有平台实现 `ISdk` 接口，业务代码只依赖接口，不依赖具体平台。
2. **自动适配**：`SdkManager` 在启动时自动探测平台，选择对应的 SDK 实现。
3. **优雅降级**：未识别的平台自动回退到 `DefaultSdk`，方法返回 reject/空值，不会崩溃。
4. **Promise 化**：所有异步方法返回 Promise，原生回调式 API 已统一包装。
5. **扩展简单**：接入新平台只需新增一个实现 `ISdk` 的类，并在 `SdkManager.register` 注册。

## 已实现的微信小游戏能力

| 类别 | 能力 |
|------|------|
| 平台与生命周期 | `getSystemInfo` `getLaunchOptions` `onShow/onHide/onError` `exitMiniProgram` |
| 登录与用户 | `login` `checkSession` `getUserInfo` `createUserInfoButton` |
| 分享 | `shareAppMessage` `onShareAppMessage` `shareToTimeline` `showShareMenu` `hideShareMenu` |
| 广告 | Banner / 激励视频 / 插屏 / 格子 / 原生 5 种广告组件 |
| 虚拟支付 | `pay`（米大师游戏币 / 道具直购） |
| 本地存储 | `setStorage` `getStorage` `removeStorage` `clearStorage` `getStorageInfo` |
| 设备能力 | 振动 / 剪贴板 / 网络状态 / 屏幕亮度 / 屏幕常亮 / GC |
| 开放数据域 | `setUserCloudStorage` `removeUserCloudStorage` `getUserCloudStorage` |
| 客服 | `openCustomerServiceConversation` `openCustomerServiceChat` |
| 订阅消息 | `requestSubscribeMessage` |
| 隐私合规 | `getPrivacySetting` `requirePrivacyAuthorize` `onNeedPrivacyAuthorization` |
| 视频号 | `openChannelsUserProfile` `openChannelsLive` `openChannelsVideo` |
| 更新/子包/录屏/日志 | `getUpdateManager` `loadSubpackage` `getGameRecorderManager` `getRealtimeLogManager` |
| 能力检测 | `canIUse` `isReady` |

## 使用方式

### 1. 直接获取 SDK 实例调用

```ts
import { gsm } from 'db://oops-framework/.../GameSingletonModule';

// 通过 Base 模块访问
const sdk = gsm.base.sdk.B_Sdk_Main.getSdk();

// 登录
const { code } = await sdk.login();

// 获取系统信息
const info = await sdk.getSystemInfo();
console.log(info.brand, info.SDKVersion);

// 振动
await sdk.vibrateShort();

// 激励视频广告
const rewardedAd = sdk.createRewardedVideoAd({ adUnitId: 'adunit-xxx' });
if (rewardedAd) {
    rewardedAd.onClose((res) => {
        if (res.isEnded) {
            // 发放奖励
        }
    });
    await rewardedAd.show();
}

// 本地存储
await sdk.setStorage('key', { a: 1 });
const data = await sdk.getStorage('key');

// 虚拟支付（游戏币）
await sdk.pay({ mode: 'game', offerId: '123', quantity: 10 });
```

### 2. 监听 SDK 事件

```ts
import { oops } from 'db://oops-framework/core/Oops';
import { SdkEventName } from 'db://oops-framework/.../sdk/SdkEvent';

// 切前台/后台
oops.message.on(SdkEventName.Show, () => {
    // 恢复游戏音乐等
});
oops.message.on(SdkEventName.Hide, () => {
    // 暂停游戏音乐等
});

// 网络状态变化
oops.message.on(SdkEventName.NetworkChange, (res) => {
    console.log('网络:', res.networkType, res.isConnected);
});

// 全局错误
oops.message.on(SdkEventName.Error, (err) => {
    // 上报错误
});
```

### 3. 能力检测

```ts
const sdk = gsm.base.sdk.B_Sdk_Main.getSdk();

// 判断当前平台是否支持某能力
if (sdk.canIUse('wx.openChannelsLive')) {
    await sdk.openChannelsLive({ finderUserName: '...' });
}

// 判断是否支持分享到朋友圈
if (sdk.canShareToTimeline()) {
    sdk.shareToTimeline({ title: '快来玩!' });
}
```

## 接入新平台示例

以抖音小游戏为例：

```ts
// 1. 新建 platform/DouYinMiniGameSdk.ts
import { DefaultSdk } from './DefaultSdk';
import { SdkPlatform } from '../model/enum/EM_Sdk';

export class DouYinMiniGameSdk extends DefaultSdk {
    constructor() {
        super(SdkPlatform.DouYinMiniGame);
    }

    login() {
        // 用 tt.login 实现
        return new Promise((resolve, reject) => {
            tt.login({
                success: (res) => resolve({ code: res.code }),
                fail: reject,
            });
        });
    }
    // ... 其它接口按需实现
}

// 2. 在 SdkManager 静态块注册
SdkManager.register(SdkPlatform.DouYinMiniGame, () => new DouYinMiniGameSdk());
```

## 微信小游戏类型定义

`libs/wechat-minigame-typings/` 来自 npm 包 `minigame-api-typings@3.8.20`
（微信官方维护，MIT 协议），提供 `wx` 全局对象的完整 TypeScript 类型。

`WeChatMiniGameSdk.ts` 顶部通过 `/// <reference path>` 引入这些类型，
开发时在编辑器中可享受完整的 `wx.xxx` 接口提示与参数校验。
