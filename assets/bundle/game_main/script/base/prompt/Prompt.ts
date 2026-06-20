import { ecs } from 'db://oops-framework/libs/ecs/ECS';
import { CCEntity } from 'db://oops-framework/module/common/CCEntity';
import { B_Prompt_Main } from './bll/B_Prompt_Main';
import '../../game/account/AccountEvent';

/** Prompt模块实体 */
@ecs.register('Prompt')
export class Prompt extends CCEntity {
    B_Prompt_Main!: B_Prompt_Main;

    protected init() {
        this.addBusinesss(B_Prompt_Main);
    }
}
