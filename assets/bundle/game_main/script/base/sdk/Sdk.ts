import { ecs } from 'db://oops-framework/libs/ecs/ECS';
import { CCEntity } from 'db://oops-framework/module/common/CCEntity';
import { B_Sdk_Main } from './bll/B_Sdk_Main';
import { M_Sdk_Main } from './model/M_Sdk_Main';
import './SdkEventData';

@ecs.register('Sdk')
export class Sdk extends CCEntity {
    M_Sdk_Main!: M_Sdk_Main;

    B_Sdk_Main!: B_Sdk_Main;

    protected init() {
        this.addComponents(M_Sdk_Main);
        this.addBusinesss(B_Sdk_Main);
    }
}
