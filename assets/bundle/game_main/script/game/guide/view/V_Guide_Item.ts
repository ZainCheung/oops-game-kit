import { _decorator, Component, Node } from 'cc';

const { ccclass, property } = _decorator;

/** 提示框吸附方位 */
export enum GuideDirection {
    /** 自动（根据目标在屏幕上半/下半部分自动选择上方或下方） */
    Auto = 'auto',
    /** 上方 */
    Top = 'top',
    /** 下方 */
    Bottom = 'bottom',
}

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
    /** 提示吸附方位（默认自动） */
    tipsDirection?: GuideDirection;
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
    /** 提示吸附方位（默认自动） */
    tipsDirection?: GuideDirection;
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
