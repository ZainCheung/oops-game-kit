import { Node } from 'cc';
import { ecs } from 'db://oops-framework/libs/ecs/ECS';
import { CCEntity } from 'db://oops-framework/module/common/CCEntity';
import { B_Guide_Main } from './bll/B_Guide_Main';
import { M_Guide_Main } from './model/M_Guide_Main';
import type { VC_Guide_Main } from './view/VC_Guide_Main';

/**
 * 新手引导
 * 1、组件方式绑定到引导 Node 上自动注册引导数据
 * 2、通过设置引导步骤可回复到上次引导点
 * 3、触发引导分为穿透模式与事件模拟模式（模拟模式不会导致不规则图形在引导区域中导致误点）
 */
@ecs.register('Guide')
export class Guide extends CCEntity {
    M_Guide_Main!: M_Guide_Main;
    VC_Guide_Main!: VC_Guide_Main;
    B_Guide_Main!: B_Guide_Main;

    protected init() {
        this.addComponents<ecs.Comp>(M_Guide_Main);
        this.addBusinesss(B_Guide_Main);
    }

    /**
     * 注册引导项
     * @param step 引导步骤
     * @param Node 引导节点
     */
    register(step: number, Node: Node) {
        this.M_Guide_Main.guides.set(step, Node);
    }

    /**
     * 检查指定引导是否触发
     * @param step 引导步骤
     */
    check(step: number): void {
        this.M_Guide_Main.step = step;
        this.VC_Guide_Main.check();
    }
}
