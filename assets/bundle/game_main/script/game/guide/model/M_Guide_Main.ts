import { Node } from "cc";
import { ecs } from "db://oops-framework/libs/ecs/ECS";
import { GuidePromptData, V_Guide_Item } from "../view/V_Guide_Item";

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

    reset(): void {
        this.step = 1;
        this.last = Number.MAX_VALUE;

        this.guides.forEach(node => {
            if (node.isValid) {
                const gvi = node.getComponent(V_Guide_Item);
                if (gvi) gvi.destroy();
            }
        });
        this.guides.clear();
    }

    /** 提示词数据 */
    prompts: Record<string, GuidePromptData[]> = null!;
}
