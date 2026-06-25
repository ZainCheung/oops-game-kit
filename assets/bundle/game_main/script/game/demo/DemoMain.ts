import { _decorator } from 'cc';
import { oops } from 'db://oops-framework/core/Oops';
import { GameComponent } from 'db://oops-framework/module/common/GameComponent';
import { PromptEventName } from '../../base/prompt/PromptEvent';
import { debounce } from 'db://oops-framework/module/decorator/DebounceDecorator';
import { RedDotEventName } from '../reddot/RedDotEvent';
import { gsm } from '../common/GameSingletonModule';
import type { IBannerAd } from '../../base/sdk/SdkTypes';

const { ccclass } = _decorator;

// ========================================
// DemoMain 组件
// ========================================

/** 教程列表 */
@ccclass('DemoMain')
export class DemoMain extends GameComponent {
    /** Banner 广告实例（用于 toggle 显示/隐藏） */
    private bannerAd: IBannerAd | null = null;

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

    /** 插屏广告 */
    btnA1() {
        const sdk = gsm.base.sdk.main.sdk;
        oops.gui.toast('创建插屏广告...');
        const ad = sdk.createInterstitialAd({ adUnitId: 'demo_interstitial_adunit' });
        if (!ad) {
            oops.gui.toast('当前平台不支持插屏广告');
            return;
        }
        ad.onError(err => {
            oops.gui.toast(`插屏广告错误: ${err.errCode}`);
            console.error('[Demo] 插屏广告错误', err);
        });
        ad.load()
            .then(() => ad.show())
            .then(() => oops.gui.toast('插屏广告展示成功'))
            .catch(err => oops.gui.toast(`插屏广告展示失败: ${err}`));
    }

    /** 激励广告 */
    btnA2() {
        const sdk = gsm.base.sdk.main.sdk;
        oops.gui.toast('创建激励广告...');
        const ad = sdk.createRewardedVideoAd({ adUnitId: 'demo_rewarded_adunit' });
        if (!ad) {
            oops.gui.toast('当前平台不支持激励广告');
            return;
        }
        const onClose = (res: { isEnded: boolean }) => {
            oops.gui.toast(res.isEnded ? '激励广告播放完成，发放奖励' : '激励广告提前关闭，不发放奖励');
            ad.offClose(onClose);
        };
        ad.onClose(onClose);
        ad.onError(err => {
            oops.gui.toast(`激励广告错误: ${err.errCode}`);
            console.error('[Demo] 激励广告错误', err);
        });
        ad.load()
            .then(() => ad.show())
            .then(() => oops.gui.toast('激励广告展示成功'))
            .catch(err => oops.gui.toast(`激励广告展示失败: ${err}`));
    }

    /** banner广告 */
    btnA3() {
        const sdk = gsm.base.sdk.main.sdk;
        if (this.bannerAd) {
            this.bannerAd.hide();
            this.bannerAd.destroy();
            this.bannerAd = null;
            oops.gui.toast('Banner 广告已关闭');
            return;
        }
        oops.gui.toast('创建 Banner 广告...');
        const ad = sdk.createBannerAd({
            adUnitId: 'demo_banner_adunit',
            left: 0,
            top: 0,
            width: 300,
        });
        if (!ad) {
            oops.gui.toast('当前平台不支持 Banner 广告');
            return;
        }
        this.bannerAd = ad;
        ad.onError(err => {
            oops.gui.toast(`Banner 广告错误: ${err.errCode}`);
            console.error('[Demo] Banner 广告错误', err);
        });
        ad.show()
            .then(() => oops.gui.toast('Banner 广告展示成功，再次点击关闭'))
            .catch(err => {
                oops.gui.toast(`Banner 广告展示失败: ${err}`);
                this.bannerAd = null;
            });
    }

    reset(): void {
        if (this.bannerAd) {
            this.bannerAd.hide();
            this.bannerAd.destroy();
            this.bannerAd = null;
        }
    }

    //#region ========== 分享功能 ==========

    /** 分享按钮 */
    @debounce.click()
    ShareButton() {
        const sdk = gsm.base.sdk.main.sdk;
        console.log('[Demo] ShareButton: 触发分享');

        sdk.shareAppMessage({
            title: '一起来玩！',
        });
    }

    //#endregion
}
