import { CCBusiness } from 'db://oops-framework/module/common/CCBusiness';
import { classname } from 'db://oops-framework/module/decorator/ClassNameDecorator';
import { gsm } from '../../../game/common/GameSingletonModule';
import { Share } from '../Share';
import {
    ShareEventName,
    type IShareEventDataMap
} from '../ShareEvent';

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
     * 截图分享 - 跨平台统一流程：
     *  1. screenshotData 为空 → 调 sdk.captureScreen() 截图
     *  2. 调 sdk.saveBase64ToFile() 存为本地文件
     *  3. 拿到文件路径 → 调 sdk.shareAppMessage(imageUrl=路径) 完成分享
     *  4. 任意环节失败 → 降级为无图分享（调 shareAppMessage 不带图）
     *
     * 流程编排全部在业务层，平台 SDK 只暴露"截图/写文件/分享"三个原子能力，
     * 避免每个平台 SDK 都重复实现"保存+分享+降级"逻辑。
     */
    private async onShareScreenshot<K extends ShareEventName.ShareScreenshot>(
        event: K,
        data: IShareEventDataMap[K]
    ): Promise<void> {
        try {
            // 1. 没有现成截图 → 走 SDK 截图
            if (!data.screenshotData) {
                data.screenshotData = await this.sdk.captureScreen();
            }

            // 2. 有 base64 → 尝试存为本地文件再分享
            if (data.screenshotData) {
                const filePath = await this.sdk.saveBase64ToFile({
                    data: data.screenshotData,
                    ext: 'png',
                });

                if (filePath) {
                    this.sdk.shareAppMessage({
                        title: data.title,
                        imageUrl: filePath,
                        path: data.query,
                        withShareTicket: data.withShareTicket,
                    });
                    return;
                }
                console.warn('[Share] 写文件失败，降级为无图分享');
            }
            else {
                console.warn('[Share] 截图数据为空，降级为无图分享');
            }

            // 3. 降级路径：直接分享无图
            this.sdk.shareAppMessage({
                title: data.title,
                path: data.query,
                withShareTicket: data.withShareTicket,
            });
        }
        catch (err) {
            console.error('[Share] 截图分享失败', err);
        }
    }

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
