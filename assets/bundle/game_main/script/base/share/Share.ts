import { ecs } from 'db://oops-framework/libs/ecs/ECS';
import { CCEntity } from 'db://oops-framework/module/common/CCEntity';
import { B_Share_Main } from './bll/B_Share_Main';

/**
 * 分享功能模块
 *
 * 功能：
 * 1. 主动分享给好友（sdk.shareAppMessage）
 * 2. 自定义图片分享（sdk.shareAppMessage + presetImageUrl）
 * 3. 截图分享（sdk.shareWithScreenshot）
 * 4. 分享到朋友圈（仅微信支持）
 * 5. 注册右上角转发回调
 * 6. 显示/隐藏分享菜单
 *
 * 使用方式：
 * ```ts
 * // 方式1：通过事件触发
 * oops.event.emit(ShareEventName.Share, { title: '一起来玩！' });
 * oops.event.emit(ShareEventName.ShareWithImage, { title: '一起来玩！', presetImageUrl: '...' });
 * oops.event.emit(ShareEventName.ShareTimeline, { title: '来看看我的战绩！' });
 *
 * // 方式2：直接调用便捷方法（推荐）
 * gsm.base.share.B_Share_Main.share({ title: '一起来玩！' });
 * gsm.base.share.B_Share_Main.shareWithImage({ title: '一起来玩！', presetImageUrl: '...' });
 * gsm.base.share.B_Share_Main.shareTimeline({ title: '来看看我的战绩！' });
 *
 * // 截图分享
 * gsm.base.share.B_Share_Main.shareScreenshot({
 *     title: '来看看我的战绩',
 *     screenshotData: base64String,
 * });
 *
 * // 注册右上角转发回调
 * gsm.base.share.B_Share_Main.registerShareMenu(() => ({
 *     title: '一起来玩！',
 *     presetImageUrl: '...'
 * }));
 *
 * // 查询是否支持朋友圈转发
 * if (gsm.base.share.B_Share_Main.canShareToTimeline()) {
 *     // 支持
 * }
 * ```
 */
@ecs.register('Share')
export class Share extends CCEntity {
    B_Share_Main!: B_Share_Main;

    protected init() {
        this.addBusinesss(B_Share_Main);
    }
}
