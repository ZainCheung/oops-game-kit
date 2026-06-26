/**
 * 业务层 · 分享素材中心
 *
 * 设计原则（参见 Readme.md）：
 *  - B_Share_Main 是通用层，禁止硬编码任何游戏专属数据
 *  - 所有游戏专属的分享素材（imageUrl / title / 路径等）统一放在这个文件
 *  - 任何游戏需要修改分享内容，**只改这个文件**，不要碰 B_Share_Main.ts
 *
 * 使用方式：
 *  1. 游戏启动时（Main.ts）调用 ShareAssets.registerAll() → 注册右上角菜单默认分享卡
 *  2. 玩家在游戏内点分享按钮 → 调 ShareAssets.shareCustom(...) / shareScreenshot()
 */

import { oops } from 'db://oops-framework/core/Oops';
import { ShareEventName } from './ShareEvent';

/** 分享卡片封面图（玩家点右上角"..."时显示） */
export const SHARE_IMAGE_URL =
    'https://img.remit.ee/api/file/BQACAgUAAyEGAASHRsPbAAEWERBqPPiU_5bT6fNXX9bA5WlPcOTAlwAChCwAAoQQ6VXdWZitGoNuCTwE.png';

/** 分享卡片默认标题 */
export const SHARE_TITLE = '一起来玩!';

/**
 * 注册所有游戏专属的分享配置到 B_Share_Main 通用层
 *
 * 必须在游戏启动时（Base 构造完成后）调用一次
 */
export function registerAll(): void {
    // 1. 注册右上角菜单默认分享卡
    oops.message.dispatchEvent(ShareEventName.RegisterShareMenu, {
        callback: () => ({
            title: SHARE_TITLE,
            imageUrl: SHARE_IMAGE_URL,
        }),
    });
    console.log('[ShareAssets] 分享配置已注册');

    // 2. 开启分享菜单按钮
    oops.message.dispatchEvent(ShareEventName.ShowShareMenu, {
        withShareTicket: false,
        menus: ['shareAppMessage', 'shareTimeline'],
    });
}

/** 用默认图片分享给好友 */
export function share(title: string, path?: string): void {
    oops.message.dispatchEvent(ShareEventName.ShareWithImage, {
        title,
        path,
        imageUrl: SHARE_IMAGE_URL,
        withShareTicket: false,
    });
}

/** 用自定义图片分享给好友 */
export function shareCustom(title: string, imageUrl: string, path?: string): void {
    oops.message.dispatchEvent(ShareEventName.ShareWithImage, {
        title,
        path,
        imageUrl,
        withShareTicket: false,
    });
}

/** 截图分享 */
export function shareScreenshot(title: string, screenshotData: string): void {
    oops.message.dispatchEvent(ShareEventName.ShareScreenshot, {
        title,
        screenshotData,
        withShareTicket: false,
    });
}