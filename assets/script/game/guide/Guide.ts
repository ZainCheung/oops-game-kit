import { ecs } from 'db://oops-framework/libs/ecs/ECS';
import { CCEntity } from 'db://oops-framework/module/common/CCEntity';
import { B_Guide_Main } from './bll/B_Guide_Main';
import { B_Guide_ViewUI } from './bll/B_Guide_ViewUI';
import { M_Guide_Main } from './model/M_Guide_Main';

/**
 * 新手引导
 * 1、组件方式绑定到引导 Node 上自动注册引导数据
 * 2、通过设置引导步骤可回复到上次引导点
 * 3、触发引导分为穿透模式与事件模拟模式（模拟模式不会导致不规则图形在引导区域中导致误点）
 */
@ecs.register('Guide')
export class Guide extends CCEntity {
    M_Guide_Main!: M_Guide_Main;

    B_Guide_Main!: B_Guide_Main;
    B_Guide_ViewUI!: B_Guide_ViewUI;

    protected init() {
        this.addComponents(M_Guide_Main);
        this.addBusinesss(B_Guide_Main, B_Guide_ViewUI);
    }

    destroy(): void {
        this.B_Guide_ViewUI.release();
        this.B_Guide_ViewUI.removeMain();
        super.destroy();
    }
}
