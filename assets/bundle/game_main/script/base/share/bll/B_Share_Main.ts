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
     * 截图分享
     * 注意：截图功能需要游戏层自行调用截图API获取base64数据
     * 示例：使用 oops.tools.captureScreen() 或类似方法
     */
    private async onShareScreenshot<K extends ShareEventName.ShareScreenshot>(
        event: K,
        data: IShareEventDataMap[K]
    ): Promise<void> {
        await this.sdk.shareWithScreenshot({
            title: data.title,
            query: data.query,
            withShareTicket: data.withShareTicket,
            screenshotData: data.screenshotData,
        });
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
