import { _decorator } from 'cc';
import { oops } from 'db://oops-framework/core/Oops';
import { GameComponent } from 'db://oops-framework/module/common/GameComponent';
import { gsm } from '../common/GameSingletonModule';
import { Guide } from '../guide/Guide';
import { runAllEcsDemos } from './ecs/DemoEcsMain';
import { PromptEventName } from '../../base/prompt/PromptEvent';

const { ccclass } = _decorator;

// ========================================
// DemoMain 组件
// ========================================

/** 教程列表 */
@ccclass('DemoMain')
export class DemoMain extends GameComponent {
    private guide: Guide = null!;

    protected async onLoad(): Promise<void> {
        this.button.bind();

        // 注册新手引导
        // this.registerGuide();
    }

    /** 点击按钮触发全部 ECS 功能演示（控制台输出） */
    Button() {
        // runAllEcsDemos();
        oops.gui.toast('ABC');
    }

    Button001() {
        oops.message.emit(PromptEventName.Confirm, {
            title: '加载中',
            content: '请稍后...',
        });
    }

    loading() {
        oops.message.emit(PromptEventName.Alert, {
            title: '加载中',
            content: '请稍后...',
        });
    }

    // ========================================
    // 新手引导相关
    // ========================================

    /** 注册新手引导 */
    private registerGuide(): void {
        this.guide = gsm.account.getChildSingleton(Guide);
        if (!this.guide) return;

        const buttonNode = this.node.getChildByName('Button');
        const button001Node = this.node.getChildByName('Button-001');

        if (buttonNode) {
            this.guide.M_Guide_Main.prompts[1] = '点击Button按钮';
            this.guide.VC_Guide_Main.register(1, buttonNode);
        }
        if (button001Node) {
            this.guide.M_Guide_Main.prompts[2] = '点击Button-001按钮';
            this.guide.VC_Guide_Main.register(2, button001Node);
        }

        this.guide.M_Guide_Main.last = 3;
        this.guide.VC_Guide_Main.check(1);
    }

    reset(): void {
        this.guide = null!;
    }
}
