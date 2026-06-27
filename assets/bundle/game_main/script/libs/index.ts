/**
 * 第三方 SDK 库统一入口
 *
 * 该目录用于存放外部第三方 SDK 源码及类型声明（如友盟、数数等）。
 *
 * 当前包含：
 * - umeng/wechat/  : 友盟+ 微信小游戏 SDK
 * - umeng/douyin/  : 友盟+ 抖音小游戏 SDK
 *
 * 使用方式：
 * ```typescript
 * import { UmengWechatSDK } from './libs';
 * ```
 */

// 友盟微信小游戏 SDK（需要手动下载 umeng-wxgame-sdk.js 到 umeng/wechat/ 目录）
export { default as UmengWechatSDK } from './umeng/wechat/umeng-wxgame-sdk';

// 友盟抖音小游戏 SDK（需要手动下载 umeng-ttgame-sdk.js 到 umeng/douyin/ 目录）
export { default as UmengDouyinSDK } from './umeng/douyin/umeng-ttgame-sdk';
