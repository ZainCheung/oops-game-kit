import { ecs } from 'db://oops-framework/libs/ecs/ECS';
import { CCEntity } from 'db://oops-framework/module/common/CCEntity';
import { B_Button_Main } from './bll/B_Button_Main';

/** 通用按钮模块 */
@ecs.register('Button')
export class Button extends CCEntity {
    B_Button_Main!: B_Button_Main;

    protected init() {
        this.addBusinesss(B_Button_Main);
    }
}
