import { Node } from 'cc';
import { ecs } from 'db://oops-framework/libs/ecs/ECS';

/** 引导数据 */
@ecs.register('M_Guide_Main')
export class M_Guide_Main extends ecs.Comp {
    /** 当前引导步骤 */
    step: number = 1;
    /** 最后一步索引 */
    last: number = Number.MAX_VALUE;
    /** 引导的节点 */
    guides: Map<number, Node> = new Map();

    /** 当前准备引导的节点 */
    get current(): Node | undefined {
        return this.guides.get(this.step);
    }

    /** 提示词数据 */
    prompts: Record<number, string> = {
        1: '提示词1',
        2: '提示词2',
        4: '提示词3',
        5: '提示词5',
        6: '提示词6',
        8: '提示词8',
    };

    reset(): void {
        this.step = 1;
        this.last = Number.MAX_VALUE;
        this.guides.clear();
    }
}
