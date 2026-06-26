/**
 * 平台全局变量声明
 *
 * wx / tt 在小游戏运行时由宿主注入，打包时不需要 webpack 解析。
 * 打包阶段仅做语法转译（transpileOnly），类型检查由主项目 IDE/CI 负责。
 */

// 引用项目自带的微信小游戏 typings，提供 WechatMinigame 命名空间
/// <reference path="../libs/wechat-minigame-typings/index.d.ts" />

/** 抖音小游戏全局对象 */
declare const tt: any;
