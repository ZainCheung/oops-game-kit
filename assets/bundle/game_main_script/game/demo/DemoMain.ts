import { _decorator } from 'cc';
import { oops } from 'db://oops-framework/core/Oops';
import { GameComponent } from 'db://oops-framework/module/common/GameComponent';
import { PromptEventName } from '../../base/prompt/PromptEvent';
import { gsm } from '../common/GameSingletonModule';
import { Guide } from '../guide/Guide';

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
        await this.registerGuide();
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
    private async registerGuide(): Promise<void> {
        this.guide = gsm.account.getChildSingleton(Guide);
        if (!this.guide) return;

        await this.guide.GuideView.loadRes();

        this.guide.GuideModel.last = 2;
        this.guide.GuideView.bindScene(this.node);
        this.guide.check(1);
    }

    reset(): void {
        this.guide = null!;
    }
}
