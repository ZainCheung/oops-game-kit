import type { IUserInfo } from './SdkTypes';

/**
 * SDK 数据模型
 *
 * 保存 SDK 登录凭证、用户信息及抖音侧边栏场景相关状态。
 */
export class SdkModel {
    /** SDK 登录凭证 */
    token: string = null!;
    /** 用户信息（昵称、头像等，登录授权后填充） */
    userInfo: IUserInfo | null = null;

    /** 是否从抖音侧边栏进入游戏 */
    isFromBytedanceSideBar: boolean = false;
    /** 是否已领取过抖音侧边栏进入奖励 */
    isByteDanceGetSideReward: boolean = false;

    /** 重置模型数据 */
    reset() {
        this.token = null!;
        this.userInfo = null;
        this.isFromBytedanceSideBar = false;
        this.isByteDanceGetSideReward = false;
    }
}
