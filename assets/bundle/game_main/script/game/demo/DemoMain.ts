import { _decorator } from 'cc';
import { oops } from 'db://oops-framework/core/Oops';
import { GameComponent } from 'db://oops-framework/module/common/GameComponent';
import { PromptEventName } from '../../base/prompt/PromptEvent';
import { GuideEventName } from '../guide/GuideEvent';
import { debounce } from 'db://oops-framework/module/decorator/DebounceDecorator';
import { RedDotEventName } from '../reddot/RedDotEvent';
import { V_RedDot_View } from '../reddot/view/V_RedDot_View';

const { ccclass } = _decorator;

// ========================================
// DemoMain 组件
// ========================================

/** 教程列表 */
@ccclass('DemoMain')
export class DemoMain extends GameComponent {
    /** 红点视图组件缓存 */
    private redDotView: V_RedDot_View | null = null;

    protected async onLoad(): Promise<void> {
        this.button.bind();

        // 注册新手引导
        this.event.emit(GuideEventName.AutoBind, { ui: this.node });

        // 获取红点视图组件
        this.redDotView = this.node.getChildByName('Button')?.getChildByName('V_RedDot_View')?.getComponent(V_RedDot_View) ?? null;

        // 显示红点（count=1）
        this.event.emit(RedDotEventName.Update, { key: 'Demo', count: 1 });
    }

    /** 点击按钮触发全部 ECS 功能演示（控制台输出） */
    @debounce.click()
    Button() {
        // runAllEcsDemos();
        oops.gui.toast('ABC');

        console.log("Button")

        // 点击后取消红点
        this.redDotView?.confirm(false);
    }

    Button001() {
        oops.message.emit(PromptEventName.Confirm, {
            title: '加载中',
            content: '请稍后...',
        });
        console.log("Button001")
    }

    loading() {
        oops.message.emit(PromptEventName.Alert, {
            title: '加载中',
            content: '请稍后...',
        });
        console.log("loading")
    }

    reset(): void { }
}
