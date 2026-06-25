import { ecs } from 'db://oops-framework/libs/ecs/ECS';
import { CCEntity } from 'db://oops-framework/module/common/CCEntity';
import { B_Advertising_Main } from './bll/B_Advertising_Main';

/**
 * 广告模块
 * 1. 激励广告
 * 2. 插屏广告
 * 3. 横幅广告
 */
@ecs.register('Advertising')
export class Advertising extends CCEntity {
    B_Advertising_Main!: B_Advertising_Main;

    protected init() {
        this.addBusinesss(B_Advertising_Main);

    }
}
