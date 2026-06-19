import { Node } from 'cc';
import { oops } from 'db://oops-framework/core/Oops';
import { ecs } from 'db://oops-framework/libs/ecs/ECS';
import { CCEntity } from 'db://oops-framework/module/common/CCEntity';
import { GuideModelComp } from './model/GuideModelComp';
import { GuideViewComp } from './view/GuideViewComp';

/**
 * 新手引导
 * 1、组件方式绑定到引导 Node 上自动注册引导数据
 * 2、通过设置引导步骤可回复到上次引导点
 * 3、触发引导分为穿透模式与事件模拟模式（模拟模式不会导致不规则图形在引导区域中导致误点）
 */
@ecs.register('Guide')
export class Guide extends CCEntity {
    GuideModel!: GuideModelComp;
    GuideView!: GuideViewComp;

    static Editor: boolean = false;

    protected init() {
        this.addComponents<ecs.Comp>(GuideModelComp);

        const comp = oops.gui.guide.addComponent(GuideViewComp);
        this.add(comp);
    }

    /**
     * 注册引导项
     * @param step 引导步骤
     * @param Node 引导节点
     */
    register(step: number, Node: Node) {
        this.GuideModel.guides.set(step, Node);
    }

    /**
     * 检查指定引导是否触发
     * @param step 引导步骤
     */
    check(step: number): void {
        this.GuideModel.step = step;
        this.GuideView.check();
    }

    destroy(): void {
        oops.res.releaseDir('gui/guide');
        super.destroy();
    }
}
