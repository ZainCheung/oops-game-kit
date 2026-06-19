import { _decorator, Component, Node } from 'cc';

const { ccclass, property } = _decorator;

/** 引导提示框数据 */
export interface GuideStepDataBox {
    /** 提示框节点 */
    node: Node;
    /** 左右扩大的宽度 */
    offsetW?: number;
    /** 上下扩大的高度 */
    offsetH?: number;
}

/** 引导配置数据（JSON配置，node为路径字符串） */
export interface GuidePromptDataBox {
    /** 提示框节点路径 */
    node: string;
    /** 左右扩大的宽度 */
    offsetW?: number;
    /** 上下扩大的高度 */
    offsetH?: number;
}

/** 引导配置数据（JSON配置，node为路径字符串） */
export interface GuidePromptData {
    /** 引导步骤 */
    step: number;
    /** 引导节点路径 */
    node: string;
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
    /** 附加提示框 */
    box?: GuidePromptDataBox[];
}

/** 引导数据 */
export interface GuideStepData {
    /** 引导场景 */
    scene: Node;
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
    /** 附加提示框 */
    box?: GuideStepDataBox[];
}

/** 新手引导数据（绑定到引导节点上） */
@ccclass('GuideViewItem')
export class GuideViewItem extends Component {
    /** 引导步骤 */
    step: Map<number, GuideStepData> = new Map();
}
