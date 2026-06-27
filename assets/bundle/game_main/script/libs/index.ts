/**
 * 第三方 SDK 库统一入口
 *
 * 该目录用于存放外部第三方 SDK 源码及类型声明。
 *
 * 当前包含：
 * - umeng/wechat/  : 友盟+ 微信小游戏 SDK（类型声明，需手动下载 .js）
 * - umeng/douyin/  : 友盟+ 抖音小游戏 SDK（类型声明，需手动下载 .js）
 *
 * 注意：
 * SDK 通过各业务模块在运行时按平台动态 require 加载，无需在此静态导出。
 * 详见：
 * - base/sdk/analysis/entity/UmengAnalysisSdk.ts
 */
export {};
