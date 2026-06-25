import { ecs } from 'db://oops-framework/libs/ecs/ECS';
import { CCEntity } from 'db://oops-framework/module/common/CCEntity';
import { B_Share_Main } from './bll/B_Share_Main';

/**
 * 分享功能
 * 1. 分享指定图片
 * 2. 使用截图分享
 */
@ecs.register('Share')
export class Share extends CCEntity {
    B_Share_Main!: B_Share_Main;

    protected init() {
        this.addBusinesss(B_Share_Main);

    }
}
