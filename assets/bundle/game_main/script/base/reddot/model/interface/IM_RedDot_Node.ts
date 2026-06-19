import type { Node } from 'cc';
import type { EM_RedDotType } from '../enum/EM_RedDot';

/**
 * Model 层接口 - 红点节点数据
 */
export interface IM_RedDot_Node {
    /** 红点关系路径 */
    path: string;
    /** 红点显示对象 */
    node: Node;
    /** 数量 */
    count: number;
    /** 自定义可扩展显示类型 */
    type: EM_RedDotType;
}
