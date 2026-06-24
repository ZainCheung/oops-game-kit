import { ecs } from 'db://oops-framework/libs/ecs/ECS';
import { CCEntity } from 'db://oops-framework/module/common/CCEntity';
import { B_World_ViewUI } from './bll/B_World_ViewUI';

/** World模块 */
@ecs.register('World')
export class World extends CCEntity {
    B_World_ViewUI!: B_World_ViewUI;

    protected init() {
        this.addBusinesss(B_World_ViewUI);

    }
}
