import { CCBusiness } from 'db://oops-framework/module/common/CCBusiness';
import { classname } from 'db://oops-framework/module/decorator/ClassNameDecorator';
import { gsm } from '../../../game/common/GameSingletonModule';
import { Share } from '../Share';
import {
    ShareEventName,
    type IShareEventDataMap
} from '../ShareEvent';

/** 截图缩放倍率 - 0.5表示长宽各缩一半，体积约1/4 */
const SCREENSHOT_SCALE = 0.5;

/** Share模块主业务逻辑 */
@classname('B_Share_Main')
export class B_Share_Main extends CCBusiness<Share> {
    protected init() {
        this.event.setEvent(
            ShareEventName.Share,
            ShareEventName.ShareWithImage,
            ShareEventName.ShareScreenshot,
            ShareEventName.ShareTimeline,
            ShareEventName.RegisterShareMenu,
            ShareEventName.ShowShareMenu,
            ShareEventName.HideShareMenu,
            ShareEventName.CanShareTimeline
        );
    }

    /** 获取SDK实例 */
    private get sdk() {
        return gsm.base.sdk.platform;
    }

    /** 主动分享给好友 */
    private onShareShare<K extends ShareEventName.Share>(
        event: K,
        data: IShareEventDataMap[K]
    ): void {
        this.sdk.shareAppMessage({
            title: data.title,
            path: data.path,
            presetImageUrl: data.presetImageUrl,
            withShareTicket: data.withShareTicket,
        });
    }

    /** 使用自定义图片分享给好友 */
    private onShareWithImage<K extends ShareEventName.ShareWithImage>(
        event: K,
        data: IShareEventDataMap[K]
    ): void {
        if (!data.presetImageUrl) {
            console.warn('[Share] ShareWithImage 需要提供 presetImageUrl');
            return;
        }
        this.sdk.shareAppMessage({
            title: data.title,
            path: data.path,
            presetImageUrl: data.presetImageUrl,
            withShareTicket: data.withShareTicket,
        });
    }

    /**
     * 截图分享 - 自动截取当前画面并分享
     * 如果已传入 screenshotData 则直接使用，否则自动截图
     */
    private async onShareScreenshot<K extends ShareEventName.ShareScreenshot>(
        event: K,
        data: IShareEventDataMap[K]
    ): Promise<void> {
        try {
            // 如果没有传入截图数据，自动截取当前画面
            if (!data.screenshotData) {
                data.screenshotData = await B_Share_Main.captureScreen();
                if (!data.screenshotData) {
                    console.warn('[Share] 截图失败，无法分享');
                    return;
                }
            }

            await this.sdk.shareWithScreenshot({
                title: data.title,
                query: data.query,
                withShareTicket: data.withShareTicket,
                screenshotData: data.screenshotData,
            });
        } catch (err) {
            console.error('[Share] 截图分享失败', err);
        }
    }

    //#region 截图功能

    /**
     * 截取当前画面并返回 base64 格式
     * @returns 截图的 base64 字符串，失败返回空字符串
     */
    public static async captureScreen(): Promise<string> {
        return new Promise((resolve) => {
            try {
                const g = globalThis as any;
                const wx = g.wx;
                const canvas = g.GameGlobal?.canvas || g.canvas;

                if (!canvas) {
                    console.warn('[Share] 找不到 canvas');
                    resolve('');
                    return;
                }

                const srcW = canvas.width || 0;
                const srcH = canvas.height || 0;
                if (!srcW || !srcH) {
                    console.warn('[Share] canvas 尺寸异常:', srcW, srcH);
                    resolve('');
                    return;
                }

                // 按缩放比例计算目标尺寸
                const destW = Math.max(1, Math.round(srcW * SCREENSHOT_SCALE));
                const destH = Math.max(1, Math.round(srcH * SCREENSHOT_SCALE));

                // 截取当前画面为临时文件
                const tempPath = canvas.toTempFilePathSync({
                    x: 0,
                    y: 0,
                    width: srcW,
                    height: srcH,
                    destWidth: destW,
                    destHeight: destH,
                    fileType: 'png',
                    quality: 1,
                });

                console.log(`[Share] 截图完成: ${srcW}x${srcH} -> ${destW}x${destH}`);

                // 读取临时文件为 base64
                resolve(B_Share_Main.readFileAsBase64(wx, tempPath));
            } catch (err) {
                console.error('[Share] 截图异常', err);
                resolve('');
            }
        });
    }

    /**
     * 读取文件为 base64 格式
     */
    private static readFileAsBase64(wx: any, filePath: string): string {
        const fs = wx?.getFileSystemManager?.();
        if (!fs?.readFileSync) {
            console.warn('[Share] 文件系统不可用');
            return '';
        }

        try {
            return fs.readFileSync(filePath, 'base64') as string;
        } catch (e) {
            console.error('[Share] 读取文件失败', e);
            return '';
        }
    }

    //#endregion

    /**
     * 分享到朋友圈（仅微信支持）
     * 注意：微信小游戏需在后台配置"分享到朋友圈"能力
     */
    private onShareTimeline<K extends ShareEventName.ShareTimeline>(
        event: K,
        data: IShareEventDataMap[K]
    ): void {
        if (!this.sdk.canShareToTimeline()) {
            console.warn('[Share] 当前平台不支持分享到朋友圈');
            return;
        }
        this.sdk.shareToTimeline({
            title: data.title,
            imageUrl: data.imageUrl,
            query: data.query,
        });
    }

    /** 注册右上角转发回调 */
    private onShareRegisterMenu<K extends ShareEventName.RegisterShareMenu>(
        event: K,
        data: IShareEventDataMap[K]
    ): void {
        this.sdk.onShareAppMessage(data.callback);
    }

    /** 开启分享菜单 */
    private onShareShowMenu<K extends ShareEventName.ShowShareMenu>(
        event: K,
        data: IShareEventDataMap[K]
    ): void {
        this.sdk.showShareMenu({
            withShareTicket: data.withShareTicket,
            menus: data.menus,
        });
    }

    /** 隐藏分享菜单 */
    private onShareHideMenu<K extends ShareEventName.HideShareMenu>(
        event: K,
        data: IShareEventDataMap[K]
    ): void {
        this.sdk.hideShareMenu({
            menus: data.menus,
        });
    }

    /** 查询是否支持朋友圈转发 */
    private onShareCanShareTimeline<K extends ShareEventName.CanShareTimeline>(
        event: K
    ): boolean {
        return this.sdk.canShareToTimeline();
    }
}
