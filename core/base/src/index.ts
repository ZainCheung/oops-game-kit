/// <reference path="./types/global.d.ts" />

/**
 * SDK 模块打包入口
 *
 * 对外公开内容：
 * - Sdk 类（平台 SDK 单例模块）
 * - ISdk 接口（平台无关 SDK 接口定义，仅暴露实际使用的方法）
 * - 相关类型定义
 *
 * 打包产物：assets/bundle/game_main/script/libs/sdk.js
 * 类型声明：assets/bundle/game_main/script/libs/sdk.d.ts
 */

// ===== 内部导入全部 SDK 源码（打包到 JS bundle）=====
// SdkManager 内部会注册所有平台实现，需要确保都被引入
import './sdk/platform/DefaultSdk';
import './sdk/platform/WeChatMiniGameSdk';
import './sdk/platform/DouYinMiniGameSdk';

// ===== 对外公开（仅实际使用的定义）=====
export { Sdk } from './sdk/Sdk';
export type { ISdk } from './sdk/ISdk';
export type {
    IShareOption,
    IShareToTimelineOption,
    IUserInfo,
    IUserInfoResult,
    ILoginResult,
} from './sdk/SdkTypes';
