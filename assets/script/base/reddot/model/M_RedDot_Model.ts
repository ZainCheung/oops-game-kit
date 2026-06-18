import { ecs } from 'db://oops-framework/libs/ecs/ECS';
import type { IM_RedDot_Node } from './interface/IM_RedDot_Node';

/**
 * 红点数据对象 - 记录游戏红点状态数据
 * @ecs.register M_RedDot_Model
 */
@ecs.register('M_RedDot_Model')
export class M_RedDot_Model extends ecs.Comp {
    /** 红点树结构配置 */
    config: any = null;
    /** 游戏红点集合 */
    rdns: Map<string, IM_RedDot_Node> = new Map();
    /** 红点确认状态本地存储功能 */
    confirm: { [key: string]: number } = {};

    reset() {
        this.config = null;
        this.rdns.clear();
        this.confirm = {};
    }
}
