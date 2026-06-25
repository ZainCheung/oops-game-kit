import { Node, find } from 'cc';
import type { ISdk } from '../../../../../base/sdk/ISdk';
import { gsm } from '../../../../common/GameSingletonModule';
import { LoginProcessType } from '../LoginEnum';
import { LoginProcessBase } from '../LoginProcessBase';

/**
 * 获取用户头像/昵称
 * 1. 打开登录界面
 * 2. 监听 Cocos 按钮触摸事件，用户点击后调用 sdk.getUserInfo() 获取用户信息
 * 3. 获取失败时回退到默认测试数据
 */
export class RequestSdkUserInfo extends LoginProcessBase {
    constructor() {
        super(LoginProcessType.SdkUserInfo);
    }

    protected async execute() {
        const label = `【登录流程】获取用户头像_${Date.now()}`;
        console.time(label);
        try {
            // 1. 打开登录界面
            const uiNode = await gsm.account.B_Account_ViewUI.openLogin();
            if (!uiNode) {
                console.timeEnd(label);
                this.fail();
                return;
            }

            // 2. 等待用户点击按钮获取用户信息（阻塞直到点击完成）
            const sdk = gsm.base.sdk.main.sdk;
            await this.requestUserInfo(sdk, uiNode);

            console.timeEnd(label);
            this.success();
        }
        catch (err) {
            console.timeEnd(label);
            console.error('【登录流程】获取用户头像失败', err);
            this.fail();
        }
    }

    /**
     * 获取用户头像/昵称
     *
     * 监听 Cocos 节点触摸事件，用户点击后调用 sdk.getUserInfo() 获取用户信息。
     * 获取失败时回退到默认测试数据。
     */
    private requestUserInfo(sdk: ISdk, uiNode: Node): Promise<void> {
        return new Promise<void>(resolve => {
            const btnNode = find('btnRequestSdkUserInfo', uiNode);
            if (!btnNode) return;

            let resolved = false;
            const cleanup = () => {
                if (resolved) return;
                resolved = true;
                btnNode.off(Node.EventType.TOUCH_END, onBtnTap, this);
                gsm.account.B_Account_ViewUI.removeLogin();
                resolve();
            };

            const onBtnTap = async () => {
                console.log('【登录流程】按钮被点击，调用 getUserInfo');
                const res = await sdk.getUserInfo();
                console.log('【登录流程】getUserInfo 返回:', res);
                if (res?.userInfo) {
                    gsm.base.sdk.model.userInfo = res.userInfo;
                }
                cleanup();
            };
            btnNode.on(Node.EventType.TOUCH_END, onBtnTap, this);
        });
    }
}
