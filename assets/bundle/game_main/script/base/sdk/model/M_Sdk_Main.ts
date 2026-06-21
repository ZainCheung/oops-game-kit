import { ecs } from 'db://oops-framework/libs/ecs/ECS';
import type { IUserInfo } from '../model/IM_Sdk_Data';

@ecs.register('M_Sdk_Main')
export class M_Sdk_Main extends ecs.Comp {
    /** SDK 登录凭证 */
    token: string = null!;
    /** 用户信息（昵称、头像等，登录授权后填充） */
    userInfo: IUserInfo | null = null;

    /** 是否从抖音侧边栏进入游戏 */
    isFromBytedanceSideBar: boolean = false;
    /** 是否已领取过抖音侧边栏进入奖励 */
    isByteDanceGetSideReward: boolean = false;

    reset() {
        this.token = null!;
        this.userInfo = null;
        this.isFromBytedanceSideBar = false;
        this.isByteDanceGetSideReward = false;
    }
}
