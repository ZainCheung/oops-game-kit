import { ecs } from 'db://oops-framework/libs/ecs/ECS';
import type { IUserInfo } from '../model/IM_Sdk_Data';

@ecs.register('M_Sdk_Main')
export class M_Sdk_Main extends ecs.Comp {
    /** SDK 登录凭证 */
    token: string = null!;
    /** 用户信息（昵称、头像等，登录授权后填充） */
    userInfo: IUserInfo | null = null;

    reset() {
        this.token = null!;
        this.userInfo = null;
    }
}
