import { ecs } from 'db://oops-framework/libs/ecs/ECS';

@ecs.register('M_Sdk_Main')
export class M_Sdk_Main extends ecs.Comp {
    /** SDK 登录凭证 */
    token: string = null!;

    reset() {
        this.token = null!;
    }
}
