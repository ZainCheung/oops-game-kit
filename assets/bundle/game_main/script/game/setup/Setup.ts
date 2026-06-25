import { ecs } from 'db://oops-framework/libs/ecs/ECS';
import { CCEntity } from 'db://oops-framework/module/common/CCEntity';

/**
 * 游戏设置模块
 * 1. 设置游戏音乐音效
 */
@ecs.register('Setup')
export class Setup extends CCEntity {
    protected init() {

    }
}
