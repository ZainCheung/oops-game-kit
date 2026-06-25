import { find, NodeEventType } from 'cc';
import { IUserInfo, IUserInfoResult } from '../../../../../../../../bundle/game_main/script/base/sdk/SdkTypes';
import { gsm } from '../../../../common/GameSingletonModule';
import { LoginProcessType } from '../LoginEnum';
import { LoginProcessBase } from '../LoginProcessBase';

/**
 * 登录流程 —— 获取用户头像/昵称
 *
 * 通过 SDK 的 getUserInfo 获取，在微信平台内部依次尝试
 * wx.getUserProfile → wx.getUserInfo，非微信平台直接兜底。
 */
export class RequestSdkUserInfo extends LoginProcessBase {
    constructor() {
        super(LoginProcessType.SdkUserInfo);
    }

    protected async execute() {
        const label = '【登录流程】获取用户头像';
        console.time(label);

        const uiNode = await gsm.account.B_Account_ViewUI.openLogin();
        if (!uiNode) {
            console.error('【登录流程】打开登录界面失败，无法获取用户头像/昵称');
            return;
        }

        const btnNode = find('btnRequestSdkUserInfo', uiNode);
        if (!btnNode) {
            console.error('【登录流程】找不到 btnRequestSdkUserInfo 节点');
            return;
        }

        // 用户点击按钮时，在点击事件里同步调用 SDK.getUserInfo
        btnNode.on(NodeEventType.TOUCH_END, async () => {
            const result: IUserInfoResult = await gsm.base.sdk.platform.getUserInfo();
            this.handleUserInfoResult(result?.userInfo);
        });
    }

    /** 处理用户信息 */
    private handleUserInfoResult(userInfo?: IUserInfo): void {
        if (userInfo?.nickName) {
            gsm.base.sdk.userInfo = {
                nickName: userInfo.nickName,
                avatarUrl: userInfo.avatarUrl,
                gender: userInfo.gender ?? 0,
            };
            console.log('【登录流程】获取用户头像成功', userInfo);
        }
        this.finish(true);
    }

    /** 结束流程 */
    private finish(success: boolean): void {
        gsm.account.B_Account_ViewUI.removeLogin();
        success ? this.success() : this.fail();
    }
}
