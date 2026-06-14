import { CCInteger, Component, _decorator } from 'cc';
import { gsm } from '../../common/GameSingletonModule';
import { Guide } from '../Guide';

const { ccclass, property } = _decorator;

/** 新手引导数据（绑定到引导节点上） */
@ccclass('V_Guide_Item')
export class V_Guide_Item extends Component {
    @property({
        type: [CCInteger],
    })
    step: Array<number> = [];

    private guide: Guide = null!;

    start() {
        this.guide = gsm.account.getChildSingleton(Guide);
        if (!this.guide) return;

        this.step.forEach((step: number) => {
            // 注册引导数据
            this.guide.B_Guide_Main.register(step, this.node);

            // 验证当前是否触发这个引导
            if (this.guide.M_Guide_Main.step === step) {
                this.guide.B_Guide_Main.check();
            }
        });
    }

    update(dt: number) {
        if (!this.guide) return;

        this.step.forEach((step: number) => {
            // 验证当前是否触发这个引导
            if (this.guide.M_Guide_Main.step === step) {
                this.guide.B_Guide_Main.refresh();
            }
        });
    }

    onDestroy(): void {
        this.guide = null!;
    }
}
