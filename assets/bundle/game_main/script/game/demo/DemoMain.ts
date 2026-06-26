import { _decorator } from 'cc';
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
// 设计原则（参见 Readme.md）：
//  - B_Share_Main 是通用层，禁止硬编码任何游戏专属数据
//  - 所有游戏专属的分享素材（imageUrl / title / 路径等）统一放在这里
//  - 任何游戏需要修改分享内容，**只改这里**，不要碰 B_Share_Main.ts
//
// 使用方式：
//  1. 游戏启动时（Main.ts）调用 registerAll() → 注册右上角菜单默认分享卡
//  2. 玩家在游戏内点分享按钮 → 调 shareCustom(...) / shareScreenshot()

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

// ========================================
// DemoMain 组件
// ========================================

/** 教程列表 */
@ccclass('DemoMain')
export class DemoMain extends GameComponent {
    protected async onLoad(): Promise<void> {
        this.button.bind();

        // 注册新手引导
        // this.event.emit(GuideEventName.AutoBind, { ui: this.node });

        // 显示红点（count=1）
        this.event.emit(RedDotEventName.Update, { key: 'Demo', count: 1 });
    }

    /** 点击按钮触发全部 ECS 功能演示（控制台输出） */
    @debounce.click()
    Button() {
        // runAllEcsDemos();
        oops.gui.toast('ABC');

        console.log('Button');

        // 点击后取消红点（通过事件确认红点，由 B_RedDot_Event 处理）
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
        // oops.message.emit(PromptEventName.Alert, {
        //     title: '加载中',
        //     content: '请稍后...',
        // });
        oops.gui.toast('loading');
    }


    //#region ========== 分享功能 ==========

    /** 分享按钮 - 默认分享（使用预设图片） */
    @debounce.click()
    ShareButton() {
        console.log('[Demo] ShareButton: 触发分享');
        share(SHARE_TITLE);
    }

    /** 分享按钮2 - 自定义图片分享 */
    @debounce.click()
    ShareButton2() {
        console.log('[Demo] ShareButton2: 触发自定义图片分享');
        shareCustom('一起来玩！', 'https://example.com/share.png');
    }

    /** 分享按钮3 - 截图分享 */
    @debounce.click()
    ShareButton3() {
        console.log('[Demo] ShareButton3: 触发截图分享');
        // 实际使用时需传入截图 base64 数据
        shareScreenshot('来看看我的战绩！', '');
    }

    //#endregion
}
