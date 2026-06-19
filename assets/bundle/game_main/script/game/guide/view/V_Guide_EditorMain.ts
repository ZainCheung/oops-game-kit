import { _decorator, EventTouch, Node, Toggle } from 'cc';
import { oops } from 'db://oops-framework/core/Oops';
import { GameComponent } from 'db://oops-framework/module/common/GameComponent';
// import { editor_main } from './V_Guide_Editor';

const { ccclass, property } = _decorator;

/** 游戏步骤 */
const steps: GuideStepData[] = [];

@ccclass('GuideEditorMain')
export class GuideEditorMain extends GameComponent {
    @property({ type: Toggle })
    guide: Toggle = null!;

    protected start() {
        oops.gui.root.on(Node.EventType.TOUCH_END, this.onTouchEnd, this);
        this.event.setEvent('onButtonClick');
    }

    private onButtonClick(event: string, node: Node) {
        this.addGuide(node);
    }

    private onTouchEnd(event: EventTouch) {
        this.addGuide(event.target);
    }

    /** 添加引导节点配置 */
    private addGuide(node: Node) {
        let path = this.getFullPath(node);
        // let node = find(path, oops.root.node);
        let step: GuideStepData = {
            step: steps.length + 1,
            node: path,
        };
        steps.push(step);
        console.log(JSON.stringify(steps));
    }

    /** 获取场景中全路径 */
    private getFullPath(node: Node): string {
        let path = node.name;
        let current = node;
        while (current.parent) {
            current = current.parent;
            if (current.parent?.name == '') break;
            else path = current.name + '/' + path;
        }
        return path;
    }

    private btnClose() {
        // oops.gui.remove(editor_main);
    }
}

/** 引导数据 */
interface GuideStepData {
    /** 引导节点路径 */
    node: string;
    /** 引导步骤 */
    step: number;
    /** 左右扩大的宽度 */
    offsetW?: number;
    /** 上下扩大的高度 */
    offsetH?: number;
    /** 提示位置 X */
    tipsX?: number;
    /** 提示位置 Y */
    tipsY?: number;
    /** 提示内容（为空时不显示提示） */
    tips?: string;
    /** 手指角度 */
    handAngle?: number;
    /** 手指位置 X */
    handAPX?: number;
    /** 手指位置 Y */
    handAPY?: number;
    /** 手指缩放 */
    handScale?: { x: number; y: number };
    /** 是否点击下一步（默认点击自动下一步） */
    next?: boolean;
    /** 是否存盘（默认存盘） */
    save?: number;
    /** 是否弱引导（默认强引导） */
    weak?: boolean;
}
