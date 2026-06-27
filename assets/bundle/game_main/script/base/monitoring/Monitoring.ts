import { ecs } from 'db://oops-framework/libs/ecs/ECS';
import { CCEntity } from 'db://oops-framework/module/common/CCEntity';
import { B_Monitoring_Main as B_Monitoring_Main } from './bll/B_Monitoring_Main';

/** 错误监控模块实体 */
@ecs.register('Monitoring')
export class Monitoring extends CCEntity {
    B_Error_Main!: B_Monitoring_Main;

    protected init() {
        this.addBusinesss(B_Monitoring_Main);
    }
}
