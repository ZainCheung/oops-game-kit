import { find, NodeEventType } from 'cc';
import { gsm } from '../../../../common/GameSingletonModule';
import { LoginProcessType } from '../LoginEnum';
import { LoginProcessBase } from '../LoginProcessBase';

/**
 * 登录流程 —— 获取用户头像/昵称
 *
 * 直接调用 wx.getUserProfile，绕过 SDK 内部监听器问题。
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
            console.timeEnd(label);
            this.fail();
            return;
        }

        const btnNode = find('btnRequestSdkUserInfo', uiNode);
        if (!btnNode) {
            console.error('【登录流程】找不到 btnRequestSdkUserInfo 节点');
            this.useDefaultAndFinish();
            return;
        }

        // 统一挂点击事件：微信走 wx.getUserProfile，非微信直接兜底
        btnNode.on(NodeEventType.TOUCH_END, () => {
            if (typeof (globalThis as any).wx !== 'undefined') {
                this.callWxGetUserProfile();
            }
            else {
                this.useDefaultAndFinish();
            }
        });
    }

    /** 依次尝试 wx.getUserProfile → wx.getUserInfo → 兜底 */
    private callWxGetUserProfile(): void {
        const wxAny: any = (globalThis as any).wx;
        if (!wxAny) {
            this.useDefaultAndFinish();
            return;
        }

        const apis = [
            {
                name: 'getUserProfile',
                fn: wxAny.getUserProfile,
                option: { desc: '用于在游戏中展示你的身份信息' },
            },
            {
                name: 'getUserInfo',
                fn: wxAny.getUserInfo,
                option: { withCredentials: false },
            },
        ];

        const tryCall = (index: number): void => {
            if (index >= apis.length) {
                console.warn('【登录流程】wx.getUserProfile 和 wx.getUserInfo 都不可用');
                this.useDefaultAndFinish();
                return;
            }

            const api = apis[index];
            if (typeof api.fn !== 'function') {
                tryCall(index + 1);
                return;
            }

            api.fn({
                ...api.option,
                success: (res: any) => {
                    console.log(`【登录流程】${api.name} 成功`, res);
                    this.handleUserInfoResult(res?.userInfo);
                },
                fail: (err: any) => {
                    console.warn(`【登录流程】${api.name} 失败:`, err);
                    tryCall(index + 1);
                },
            });
        };

        tryCall(0);
    }

    /** 处理微信返回的用户信息 */
    private handleUserInfoResult(userInfo: any): void {
        if (userInfo?.nickName) {
            gsm.base.sdk.userInfo = {
                nickName: userInfo.nickName,
                avatarUrl: userInfo.avatarUrl,
                gender: userInfo.gender ?? 0,
            };
        }
        else {
            this.setDefaultUserInfo();
        }
        this.finish(true);
    }

    /** 用默认数据兜底并结束流程 */
    private useDefaultAndFinish(): void {
        this.setDefaultUserInfo();
        this.finish(true);
    }

    /** 设置默认用户信息 */
    private setDefaultUserInfo(): void {
        gsm.base.sdk.userInfo = { nickName: 'Player', avatarUrl: '', gender: 0 };
    }

    /** 结束流程 */
    private finish(success: boolean): void {
        gsm.account.B_Account_ViewUI.removeLogin();
        success ? this.success() : this.fail();
    }
}
