import { CCInteger, Component, Node, _decorator } from 'cc';
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
            this.guide.VC_Guide_Main.register(step, this.node);

            // 验证当前是否触发这个引导
            if (this.guide.M_Guide_Main.step === step) {
                this.guide.VC_Guide_Main.check();
            }
        });

        // 监听节点变换，按需刷新引导位置
        this.node.on(Node.EventType.TRANSFORM_CHANGED, this.onTransformChanged, this);
    }

    private onTransformChanged() {
        if (!this.guide) return;

        const step = this.guide.M_Guide_Main.step;
        if (this.step.includes(step)) {
            this.guide.VC_Guide_Main.refresh();
        }
    }

    onDestroy(): void {
        this.node.off(Node.EventType.TRANSFORM_CHANGED, this.onTransformChanged, this);
        this.guide = null!;
    }
}
