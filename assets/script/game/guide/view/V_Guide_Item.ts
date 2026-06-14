import { CCInteger, _decorator } from 'cc';
import { GameComponent } from 'db://oops-framework/module/common/GameComponent';
import { gsm } from '../../common/GameSingletonModule';

const { ccclass, property } = _decorator;

/** 新手引导数据（绑定到引导节点上） */
@ccclass('V_Guide_Item')
export class V_Guide_Item extends GameComponent {
    @property({
        type: [CCInteger]
    })
    step: Array<number> = [];

    start() {
        const guide = gsm.guide;
        if (!guide) return;

        this.step.forEach((step: number) => {
            // 注册引导数据
            guide.B_Guide_Main.register(step, this.node);

            // 验证当前是否触发这个引导
            if (guide.M_Guide_Main.step === step) {
                guide.B_Guide_Main.check();
            }
        });
    }

    update(dt: number) {
        const guide = gsm.guide;
        if (!guide) return;

        this.step.forEach((step: number) => {
            // 验证当前是否触发这个引导
            if (guide.M_Guide_Main.step === step) {
                guide.B_Guide_Main.refresh();
            }
        });
    }
}
