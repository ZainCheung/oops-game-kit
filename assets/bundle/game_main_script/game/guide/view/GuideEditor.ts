import { _decorator, Node } from 'cc';
import { GameComponent } from 'db://oops-framework/module/common/GameComponent';
const { ccclass, property } = _decorator;

// export const editor_main: UIConfig = { prefab: "gui/guide/prefab/editor/editor_main", layer: LayerType.UI };
const steps: GuideStepData[] = [];

/**
 * 1. 点击按钮处罚是否添加引导点
 * 2. 需要弹出引导属性设置弹窗
 * 3. 引导信息输入完后，添加到引导队列中
 * 4. 点击保存按钮，将引导数据输出到控制台
 * 5. 事件触发类引导，通过事件参数触发，不会自动触发
 */
@ccclass('GuideEditor')
export class GuideEditor extends GameComponent {
    protected start() {
        this.event.setEvent('onButtonClick');
    }

    private onButtonClick(event: string, node: Node) {
        this.addGuide(node);
    }

    /** 添加引导节点配置 */
    private addGuide(node: Node) {
        let path = this.getFullPath(node);
        let step: GuideStepData = {
            step: steps.length + 1,
            node: path,
        };
        steps.push(step);
        console.log('引导数据', JSON.stringify(steps));
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

    // private btnOnOff() {
    //     oops.gui.open(editor_main);
    // }
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
