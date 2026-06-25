import { Button, Node, find, NodeEventType } from 'cc';
import { gsm } from '../../../../common/GameSingletonModule';
import { LoginProcessType } from '../LoginEnum';
import { LoginProcessBase } from '../LoginProcessBase';

/**
 * 登录流程 —— 获取用户头像/昵称（直接硬调 wx.getUserProfile，绕过 SDK）
 *
 * 时间戳: 2026-06-25 21:00:00  重建版本 v3
 *
 * 之前几版为什么失败（给后面的人留个底）：
 *  - v1：用 SDK 的 createUserInfoButton。2.32.3+ 基础库要求必须先同意隐私协议，
 *    SDK 里的 ensurePrivacyAuthorized 拿不到 onNeedPrivacyAuthorization 回调，
 *    onTap 拿到的 userInfo 为空。
 *  - v2：在业务层先调 wx.requirePrivacyAuthorize，再调 SDK.getUserInfo。
 *    同样卡在 SDK 内部的 showModal / onNeedPrivacyAuthorization 上。
 *  - v3（当前）：完全绕开 SDK，**在用户点击事件里同步调 wx.getUserProfile**。
 *    wx.getUserProfile 是微信官方 2021 年的 API，自带弹窗（你看到的那张
 *    「申请获取你的昵称、头像」就是它弹的），不受 SDK 监听器 bug 影响。
 *    这是微信官方推荐替代 wx.getUserInfo 的姿势，2.13.2 ~ 最新基础库都能用。
 *
 * 流程（按用户看到的顺序）：
 *   1. Cocos 登录 UI 打开（第一张图）
 *   2. 用户点「点击请求用户信息」按钮 → 同步调 wx.getUserProfile
 *   3. 微信自动弹「申请获取你的昵称、头像」原生弹窗（第二张图）
 *   4. 用户点「允许」→ success 拿到真实 userInfo → 存进 SdkModel → 进游戏
 *      用户点「拒绝」→ fail → 用默认 Player 兜底 → 进游戏
 *
 * 关键点：
 *   - wx.getUserProfile 必须在**用户点击事件回调里同步调用**（异步/setTimeout 里调会失败）
 *   - 不需要业务代码自己画弹窗，不需要自己处理隐私弹窗（基础库 2.32.3+ 微信会自动弹）
 *   - 非微信平台：直接给按钮挂 onClick，用默认 Player 兜底
 */
export class RequestSdkUserInfo extends LoginProcessBase {
    constructor() {
        super(LoginProcessType.SdkUserInfo);
        // 时间戳 log 用来判断 build 是不是最新的（看控制台这行结尾的时间）
        console.log('========== RequestSdkUserInfo v3 2026-06-25 21:00:00 硬调 wx.getUserProfile ==========');
    }

    protected async execute() {
        const label = '【登录流程】获取用户头像';
        console.time(label);
        try {
            // 1. 打开登录界面
            const uiNode = await gsm.account.B_Account_ViewUI.openLogin();
            if (!uiNode) {
                console.timeEnd(label);
                this.fail();
                return;
            }

            // 2. 找到「点击请求用户信息」按钮
            const btnNode = find('btnRequestSdkUserInfo', uiNode);
            if (!btnNode) {
                console.error('【登录流程】找不到 btnRequestSdkUserInfo 节点');
                this.useDefaultAndSuccess();
                return;
            }

            // 3. 微信平台：直接在按钮的点击事件里同步调 wx.getUserProfile
            //    不走 SDK.getUserInfo, 避免 SDK 内部监听器问题
            if (this.isWeChatPlatform()) {
                this.bindWxGetUserProfile(btnNode);
            } else {
                // 非微信平台：用 Cocos Button.onClick + 默认数据
                this.bindDefaultClick(btnNode);
            }
        } catch (err) {
            console.timeEnd(label);
            console.error('【登录流程】获取用户头像失败', err);
            gsm.account.B_Account_ViewUI?.removeLogin?.();
            this.fail();
        }
    }

    /**
     * 判断当前是不是微信小游戏
     */
    private isWeChatPlatform(): boolean {
        try {
            return typeof (globalThis as any).wx !== 'undefined';
        } catch {
            return false;
        }
    }

    /**
     * 微信平台：给按钮挂点击事件，在点击里同步调 wx.getUserProfile
     */
    private bindWxGetUserProfile(btnNode: Node): void {
        // 关键：必须用 TOUCH_END（或者 Button.onClick），
        // 用户的"点击"是这个弹窗能弹出来的唯一触发器。
        btnNode.on(NodeEventType.TOUCH_END, () => {
            console.log('【登录流程】v3 用户点击按钮, 同步调 wx.getUserProfile');
            this.callWxGetUserProfile();
        });
        console.log('【登录流程】v3 已在 btnRequestSdkUserInfo 上挂 TOUCH_END');
    }

    /**
     * 同步调 wx.getUserProfile(必须在用户点击事件里)
     */
    private callWxGetUserProfile(): void {
        const wxAny: any = (globalThis as any).wx;
        if (!wxAny) {
            console.warn('【登录流程】wx 不存在, 使用默认数据');
            this.useDefaultAndSuccess();
            return;
        }

        if (typeof wxAny.getUserProfile === 'function') {
            try {
                wxAny.getUserProfile({
                    desc: '用于在游戏中展示你的身份信息',
                    success: (res: any) => {
                        console.log('【登录流程】v3 wx.getUserProfile 成功:', JSON.stringify(res));
                        this.handleUserInfoResult(res?.userInfo);
                    },
                    fail: (err: any) => {
                        console.warn('【登录流程】v3 wx.getUserProfile 失败:', err);
                        this.useDefaultAndSuccess();
                    },
                });
                return;
            } catch (e) {
                console.error('【登录流程】v3 wx.getUserProfile 抛异常', e);
            }
        }

        // 兜底：wx.getUserInfo
        if (typeof wxAny.getUserInfo === 'function') {
            try {
                wxAny.getUserInfo({
                    withCredentials: false,
                    success: (res: any) => {
                        console.log('【登录流程】v3 wx.getUserInfo 成功:', JSON.stringify(res));
                        this.handleUserInfoResult(res?.userInfo);
                    },
                    fail: (err: any) => {
                        console.warn('【登录流程】v3 wx.getUserInfo 失败:', err);
                        this.useDefaultAndSuccess();
                    },
                });
                return;
            } catch (e) {
                console.error('【登录流程】v3 wx.getUserInfo 抛异常', e);
            }
        }

        // 都没有：兜底
        console.warn('【登录流程】v3 wx.getUserProfile 和 wx.getUserInfo 都不可用');
        this.useDefaultAndSuccess();
    }

    /**
     * 处理从微信拿到的 userInfo
     */
    private handleUserInfoResult(userInfo: any): void {
        if (userInfo && userInfo.nickName) {
            gsm.base.sdk.userInfo = {
                nickName: userInfo.nickName,
                avatarUrl: userInfo.avatarUrl,
                gender: userInfo.gender ?? 0,
            };
            console.log(`【登录流程】v3 获取用户信息成功, 昵称: ${userInfo.nickName}`);
        } else {
            console.log('【登录流程】v3 userInfo 为空, 使用默认数据');
            gsm.base.sdk.userInfo = { nickName: 'Player', avatarUrl: '', gender: 0 };
        }
        gsm.account.B_Account_ViewUI.removeLogin();
        this.success();
    }

    /**
     * 非微信平台：直接给按钮挂 onClick 用默认数据
     */
    private bindDefaultClick(btnNode: Node): void {
        const ccBtn = btnNode.getComponent(Button);
        if (ccBtn) {
            ccBtn.enabled = true;
        }
        btnNode.on(NodeEventType.TOUCH_END, () => {
            console.log('【登录流程】v3 非微信平台, 使用默认用户信息');
            gsm.base.sdk.userInfo = { nickName: 'Player', avatarUrl: '', gender: 0 };
            gsm.account.B_Account_ViewUI.removeLogin();
            this.success();
        });
    }

    /**
     * 用默认 Player 兜底并 success
     */
    private useDefaultAndSuccess(): void {
        gsm.base.sdk.userInfo = { nickName: 'Player', avatarUrl: '', gender: 0 };
        gsm.account.B_Account_ViewUI.removeLogin();
        this.success();
    }
}
