import { _decorator } from 'cc';
import { oops } from 'db://oops-framework/core/Oops';
import { GameComponent } from 'db://oops-framework/module/common/GameComponent';
import { PromptEventName } from '../../base/prompt/PromptEvent';
import { GuideEventName } from '../guide/GuideEvent';
import { debounce } from 'db://oops-framework/module/decorator/DebounceDecorator';
import { RedDotEventName } from '../reddot/RedDotEvent';

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
        oops.message.emit(PromptEventName.Alert, {
            title: '加载中',
            content: '请稍后...',
        });
        console.log('loading');
    }

    /** 插屏广告 */
    btnA1() {}

    /** 激励广告 */
    btnA2() {}

    /** banner广告 */
    btnA3() {}

    reset(): void {}
}
