import { _decorator } from 'cc';
import { oops } from 'db://oops-framework/core/Oops';
import { GameComponent } from 'db://oops-framework/module/common/GameComponent';
import { PromptEventName } from '../../base/prompt/PromptEvent';
import { debounce } from 'db://oops-framework/module/decorator/DebounceDecorator';
import { RedDotEventName } from '../reddot/RedDotEvent';
import { gsm } from '../common/GameSingletonModule';

const { ccclass } = _decorator;

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

    /** 分享按钮 - 默认分享（无图片） */
    @debounce.click()
    ShareButton() {
        const sdk = gsm.base.sdk.platform;
        console.log('[Demo] ShareButton: 触发分享');

        sdk.shareAppMessage({
            title: '一起来玩！',
        });
    }

    /** 分享按钮2 - 自定义图片分享 */
    @debounce.click()
    ShareButton2() {
        const sdk = gsm.base.sdk.platform;
        console.log('[Demo] ShareButton2: 触发自定义图片分享');

        // 使用预设图片分享（替换为你的实际图片URL）
        sdk.shareAppMessage({
            title: '一起来玩！',
            presetImageUrl: 'https://example.com/share.png',
        });
    }

    /** 分享按钮3 - 分享到朋友圈（仅微信支持） */
    @debounce.click()
    ShareButton3() {
        const sdk = gsm.base.sdk.platform;
        console.log('[Demo] ShareButton3: 触发朋友圈分享');

        if (!sdk.canShareToTimeline()) {
            oops.gui.toast('当前平台不支持分享到朋友圈');
            return;
        }

        sdk.shareToTimeline({
            title: '来看看我的战绩！',
            imageUrl: 'https://example.com/share.png',
        });
    }

    //#endregion
}
