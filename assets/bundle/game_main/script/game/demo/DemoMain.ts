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
//  2. 截图分享（shareScreenshot，需调用方传入截图 base64）
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

/** 截图分享 —— 调用方需传入截图 base64 数据 */
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

    /**
     * 截图分享按钮（节点名 ScreenshotShareButton）
     * 走 canvas.toTempFilePathSync 截当前画面 → 读 base64 → 走 shareScreenshot
     */
    @debounce.click()
    ScreenshotShareButton() {
        console.log('[Demo] ScreenshotShareButton: 触发截图分享');
        captureWxCanvas().then((base64) => {
            if (!base64) {
                console.warn('[Demo] 微信截图失败');
                oops.gui.toast('截图分享失败');
                return;
            }
            console.log(`[Demo] 截图 base64 长度: ${base64.length}`);
            shareScreenshot('来看看我的战绩！', base64);
        }).catch((err) => {
            console.error('[Demo] 微信截图异常', err);
            oops.gui.toast('截图分享失败');
        });
    }

    /** 自定义图片分享按钮(节点名 ChangeableShareButton) */
    @debounce.click()
    ChangeableShareButton() {
        console.log('[Demo] ChangeableShareButton: 触发自定义图片分享');
        shareCustom(SHARE_TITLE, SHARE_IMAGE_URL);
    }

    //#endregion
}

// ========================================
// 微信小游戏截图
// ========================================

/**
 * 截图缩放倍率控制
 *   1   -> 原图(720x1280),最清晰,base64 体积最大
 *   0.5 -> 长宽各缩一半(360x640),base64 体积约 1/4
 *   0.33-> 缩到约 1/3,更小但更糊
 *   0.25-> 缩到 1/4(180x320),极小
 *
 * 改这一个值即可控制分享图大小。
 */
const SCALE = 0.5;

/**
 * 是否使用 letterbox 模式(上下撑满,左右补黑,固定 4:5 比例)
 *   false -> 直接出原图(按 SCALE 缩放后)
 *   true  -> 把游戏原图按比例缩放画到 800x1000 画布,左右留黑
 */
const USE_LETTERBOX = false;
const LETTERBOX_W = 800;
const LETTERBOX_H = 1000;

/**
 * 截当前画面并读成 base64
 *   1. canvas.toTempFilePathSync 截当前画面 PNG 临时文件
 *   2. (可选) 离屏 2D canvas letterbox 重画
 *   3. fs.readFileSync 读 base64
 */
function captureWxCanvas(): Promise<string> {
    return new Promise((resolve) => {
        try {
            const g: any = (globalThis as any);
            const wxAny: any = g.wx;
            const canvas: any = g.GameGlobal?.canvas || g.canvas;
            if (!canvas) {
                console.warn('[Screenshot] wx 找不到 canvas');
                resolve('');
                return;
            }

            const srcW: number = canvas.width || 0;
            const srcH: number = canvas.height || 0;
            if (!srcW || !srcH) {
                console.warn('[Screenshot] wx canvas 尺寸异常:', srcW, srcH);
                resolve('');
                return;
            }

            // 1) 截原图(按 SCALE 缩放到目标尺寸)
            const destW = Math.max(1, Math.round(srcW * SCALE));
            const destH = Math.max(1, Math.round(srcH * SCALE));
            const srcTempPath: string = canvas.toTempFilePathSync({
                x: 0,
                y: 0,
                width: srcW,
                height: srcH,
                destWidth: destW,
                destHeight: destH,
                fileType: 'png',
                quality: 1,
            });
            console.log(`[Screenshot] 原图已截: ${srcTempPath} (${srcW}x${srcH} -> ${destW}x${destH})`);

            if (!USE_LETTERBOX) {
                return resolve(readFileAsBase64(wxAny, srcTempPath));
            }

            // 2) letterbox 模式:把游戏图按比例缩放画到固定 4:5 画布,左右补黑
            const off: any = wxAny?.createOffscreenCanvas?.(LETTERBOX_W, LETTERBOX_H);
            if (!off) {
                console.warn('[Screenshot] createOffscreenCanvas 不可用,降级直传原图');
                return resolve(readFileAsBase64(wxAny, srcTempPath));
            }
            const ctx: any = off.getContext('2d');
            if (!ctx) {
                console.warn('[Screenshot] 离屏 canvas 无 2d ctx,降级直传原图');
                return resolve(readFileAsBase64(wxAny, srcTempPath));
            }
            const scale = LETTERBOX_H / destH;
            const drawW = Math.round(destW * scale);
            const drawH = LETTERBOX_H;
            const offsetX = Math.floor((LETTERBOX_W - drawW) / 2);
            const offsetY = 0;
            ctx.fillStyle = '#000000';
            ctx.fillRect(0, 0, LETTERBOX_W, LETTERBOX_H);

            const img: any = wxAny.createImage?.();
            if (!img) {
                console.warn('[Screenshot] createImage 不可用,降级直传原图');
                return resolve(readFileAsBase64(wxAny, srcTempPath));
            }
            img.onload = () => {
                try {
                    ctx.drawImage(img, offsetX, offsetY, drawW, drawH);
                    const outPath: string = off.toTempFilePathSync({
                        x: 0, y: 0,
                        width: LETTERBOX_W, height: LETTERBOX_H,
                        destWidth: LETTERBOX_W, destHeight: LETTERBOX_H,
                        fileType: 'png',
                        quality: 1,
                    });
                    console.log(
                        `[Screenshot] letterbox 完成: ${outPath} (${LETTERBOX_W}x${LETTERBOX_H}) `
                        + `原图缩放至 ${drawW}x${drawH},左右各留 ${offsetX}px 黑边`,
                    );
                    resolve(readFileAsBase64(wxAny, outPath));
                } catch (e) {
                    console.error('[Screenshot] 画图/写出错,降级直传原图', e);
                    resolve(readFileAsBase64(wxAny, srcTempPath));
                }
            };
            img.onerror = (e: any) => {
                console.error('[Screenshot] 加载原图失败,降级直传原图', e);
                resolve(readFileAsBase64(wxAny, srcTempPath));
            };
            img.src = srcTempPath;
        } catch (err) {
            console.error('[Screenshot] captureWxCanvas 抛错', err);
            resolve('');
        }
    });
}

function readFileAsBase64(wxAny: any, filePath: string): string {
    const fs = wxAny?.getFileSystemManager?.();
    if (!fs?.readFileSync) {
        console.warn('[Screenshot] wx fs.readFileSync 不可用');
        return '';
    }
    try {
        return fs.readFileSync(filePath, 'base64') as string;
    } catch (e) {
        console.error('[Screenshot] readFileSync 失败', e);
        return '';
    }
}
