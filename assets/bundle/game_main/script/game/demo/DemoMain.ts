import { _decorator } from 'cc';
import { oops } from 'db://oops-framework/core/Oops';
import { GameComponent } from 'db://oops-framework/module/common/GameComponent';
import { PromptEventName } from '../../base/prompt/PromptEvent';
import { GuideEventName } from '../guide/GuideEvent';

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
    }

    /** 点击按钮触发全部 ECS 功能演示（控制台输出） */
    Button() {
        // runAllEcsDemos();
        oops.gui.toast('ABC');

        console.log("Button")
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
