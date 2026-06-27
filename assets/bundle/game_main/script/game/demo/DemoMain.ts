import { _decorator, sys } from 'cc';
import { oops } from 'db://oops-framework/core/Oops';
import { GameComponent } from 'db://oops-framework/module/common/GameComponent';
import { PromptEventName } from '../../base/prompt/PromptEvent';
import { debounce } from 'db://oops-framework/module/decorator/DebounceDecorator';
import { RedDotEventName } from '../reddot/RedDotEvent';
import { ShareEventName } from '../../base/share/ShareEvent';

const { ccclass } = _decorator;

// ========================================
// 分享素材中心（业务层）
// ========================================
//
// 分享入口：
//  1. 自定义图片分享给好友（shareCustom）
//  2. 截图分享（shareScreenshot，自动截取当前画面）
//  3. 朋友圈分享 —— 由 registerAll() 通过 wx.showShareMenu 配置
//
// 使用方式：
//  - 游戏启动时调用 registerAll() 注册菜单默认分享卡
//  - 玩家在游戏内点分享按钮 → 调 shareCustom(...) / shareScreenshot(...)

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
    oops.message.dispatchEvent(ShareEventName.RegisterShareMenu, {
        callback: () => ({
            title: SHARE_TITLE,
            imageUrl: SHARE_IMAGE_URL,
        }),
    });
    console.log('[ShareAssets] 分享配置已注册');

    oops.message.dispatchEvent(ShareEventName.ShowShareMenu, {
        withShareTicket: false,
        menus: ['shareAppMessage', 'shareTimeline'],
    });
}

/** 用自定义图片分享给好友 */
export function shareCustom(title: string, presetImageUrl: string, path?: string): void {
    oops.message.dispatchEvent(ShareEventName.ShareWithImage, {
        title,
        path,
        presetImageUrl,
        withShareTicket: false,
    });
}

/** 截图分享 —— 自动截取当前画面并分享 */
export function shareScreenshot(title: string): void {
    oops.message.dispatchEvent(ShareEventName.ShareScreenshot, {
        title,
        screenshotData: '',  // 空字符串触发自动截图
        withShareTicket: false,
    });
}

// ========================================
// DemoMain 组件
// ========================================

/** 教程列表 */
@ccclass('DemoMain')
export class DemoMain extends GameComponent {
    protected async onLoad(): Promise<void> {
        this.button.bind();
        registerAll();
        this.event.emit(RedDotEventName.Update, { key: 'Demo', count: 1 });
    }

    /** 点击按钮触发全部 ECS 功能演示（控制台输出） */
    @debounce.click()
    Button() {
        oops.gui.toast('ABC');
        console.log('Button');
        this.event.emit(RedDotEventName.Confirm, { key: 'Demo', save: false });
    }

    Button001() {
        oops.message.emit(PromptEventName.Confirm, {
            title: '加载中',
            content: '请稍后...',
        });
        console.log('Button001');
    }

    loading() {
        oops.gui.toast('loading');
    }

    //#region ========== 分享功能 ==========

    /** 截图分享按钮（节点名 ScreenshotShareButton） */
    @debounce.click()
    ScreenshotShareButton() {
        console.log('[Demo] ScreenshotShareButton: 触发截图分享');
        shareScreenshot('来看看我的战绩！');
    }

    /** 自定义图片分享按钮(节点名 ChangeableShareButton) */
    @debounce.click()
    ChangeableShareButton() {
        console.log('[Demo] ChangeableShareButton: 触发自定义图片分享');
        shareCustom(SHARE_TITLE, SHARE_IMAGE_URL);
    }

    //#endregion
}
