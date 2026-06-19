/*
 * @Author: dgflash
 * @Date: 2022-03-21 11:12:03
 * @LastEditors: dgflash
 * @LastEditTime: 2022-09-06 10:12:03
 */
import { Node } from "cc";
import { ecs } from "db://oops-framework/libs/ecs/ECS";
import { GuidePromptData, GuideViewItem } from "../view/GuideViewItem";

/** 引导数据 */
@ecs.register('GuideModel')
export class GuideModelComp extends ecs.Comp {
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
            if (node.isValid) node.getComponent(GuideViewItem)!.destroy();
        });
        this.guides.clear();
    }

    /** 提示词数据 */
    prompts: Record<string, GuidePromptData[]> = null!;
}