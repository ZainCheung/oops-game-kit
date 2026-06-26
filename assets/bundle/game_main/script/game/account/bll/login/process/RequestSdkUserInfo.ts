import { find, NodeEventType } from 'cc';
import { IUserInfo, IUserInfoResult } from '../../../../../libs/sdk.js';
import { gsm } from '../../../../common/GameSingletonModule';
import { LoginProcessType } from '../LoginEnum';
import { LoginProcessBase } from '../LoginProcessBase';

declare const wx: any;

/**
 * 登录流程 —— 获取用户头像/昵称
 *
 * **缓存策略**：
 *  - 第一次启动 → 弹 VC_Account_Login prefab → 玩家点按钮 → 写入本地缓存
 *  - 第二次启动 → 直接读本地缓存 → 命中则直接 finish（**不弹任何弹窗**）
 *  - 玩家主动清除缓存 → 重新走获取流程
 *
 * **VC_Account_Login.prefab 必须包含以下按钮节点**：
 *  - btnRequestSdkUserInfo  点击 → 同意隐私 + 弹 1 次原生框拿真昵称头像
 *  - btnPrimarily           点击 → 仅同意隐私（零原生框，玩家昵称用 Player）
 *  - btnRejectSdkUserInfo   点击 → 拒绝（零原生框，兜底默认 Player）
 *
 * **不走 SDK 的隐私 API**（老 SDK 没这些方法）：
 *  - 不调 sdk.preAgreePrivacy()（SDK 老版本没有）
 *  - 不调 sdk.requestUserInfo()（SDK 老版本没有）
 *  - 直接用 wx 原生 API：wx.login / wx.getUserInfo / wx.getUserProfile
 */
const CACHE_KEY = 'RequestSdkUserInfo_Cache_v1';

export class RequestSdkUserInfo extends LoginProcessBase {
    constructor() {
        super(LoginProcessType.SdkUserInfo);
    }

    protected async execute() {
        const label = '【登录流程】获取用户头像';
        console.time(label);
        try {
            // 0. 先查本地缓存，命中则直接 finish（零弹窗）
            const cached = this.readCache();
            if (cached) {
                console.log('【登录流程】命中本地缓存，跳过弹窗:', cached.nickName);
                this.applyAndFinish(cached, false /* 不重复写缓存 */);
                return;
            }

            // 1. 未命中缓存：弹 VC_Account_Login prefab
            const uiNode = await gsm.account.B_Account_ViewUI.openLogin();
            if (!uiNode) {
                console.error('【登录流程】打开登录界面失败，使用默认用户信息');
                this.applyDefaultAndFinish();
                return;
            }

            // 2. 绑定三个按钮
            this.bindButtons(uiNode);
        } catch (err) {
            console.timeEnd(label);
            console.error('【登录流程】获取用户头像失败', err);
            this.applyDefaultAndFinish();
        }
    }

    /** 读取本地缓存的用户信息 */
    private readCache(): IUserInfo | null {
        try {
            const raw = wx?.getStorageSync?.(CACHE_KEY);
            if (raw && typeof raw === 'object' && raw.nickName) {
                return {
                    nickName: raw.nickName,
                    avatarUrl: raw.avatarUrl || '',
                    gender: raw.gender ?? 0,
                };
            }
        } catch (e) {
            console.warn('【登录流程】读缓存失败:', e);
        }
        return null;
    }

    /** 写入本地缓存 */
    private writeCache(userInfo: IUserInfo): void {
        try {
            wx?.setStorageSync?.(CACHE_KEY, userInfo);
            console.log('【登录流程】用户信息已写入本地缓存:', userInfo.nickName);
        } catch (e) {
            console.warn('【登录流程】写缓存失败:', e);
        }
    }

    /**
     * 清除本地缓存（调试用，调试时可在控制台执行）
     * wx.removeStorageSync('RequestSdkUserInfo_Cache_v1')
     */

    /** 绑定三个按钮的点击事件 */
    private bindButtons(uiNode: any): void {
        // btnRequestSdkUserInfo：同意 + 拿昵称头像（允许弹 1 次原生框）
        const btnRequest = find('btnRequestSdkUserInfo', uiNode);
        if (btnRequest) {
            btnRequest.on(NodeEventType.TOUCH_END, () => {
                console.log('【登录流程】玩家点 btnRequestSdkUserInfo（同意 + 拿昵称头像）');
                this.handleRequestClick();
            });
        } else {
            console.warn('【登录流程】找不到 btnRequestSdkUserInfo 节点');
        }

        // btnPrimarily：仅同意，不拿昵称（零原生框）
        const btnPrimarily = find('btnPrimarily', uiNode);
        if (btnPrimarily) {
            btnPrimarily.on(NodeEventType.TOUCH_END, () => {
                console.log('【登录流程】玩家点 btnPrimarily（仅同意，不拿昵称，零原生框）');
                this.handlePrimarilyClick();
            });
        } else {
            console.warn('【登录流程】找不到 btnPrimarily 节点');
        }

        // btnRejectSdkUserInfo：拒绝（零原生框）
        const btnReject = find('btnRejectSdkUserInfo', uiNode);
        if (btnReject) {
            btnReject.on(NodeEventType.TOUCH_END, () => {
                console.log('【登录流程】玩家点 btnRejectSdkUserInfo（拒绝隐私，零原生框）');
                this.applyDefaultAndFinish();
            });
        }

        // linkPrivacyContract：协议链接（可选，调 wx.openPrivacyContract）
        const linkPrivacy = find('linkPrivacyContract', uiNode);
        if (linkPrivacy) {
            linkPrivacy.on(NodeEventType.TOUCH_END, () => {
                console.log('【登录流程】玩家点《隐私保护指引》链接');
                if (typeof wx?.openPrivacyContract === 'function') {
                    wx.openPrivacyContract({
                        success: () => console.log('【登录流程】openPrivacyContract 成功'),
                        fail: (err: any) => console.warn('【登录流程】openPrivacyContract 失败:', err),
                        complete: () => { /* ignore */ },
                    });
                }
            });
        }
    }

    /**
     * 处理"同意 + 拿昵称头像"按钮
     * 流程：直接调 wx.getUserProfile 弹 1 次原生框拿真昵称头像
     */
    private handleRequestClick(): void {
        // 微信规定：拿昵称头像必须用 wx.getUserProfile 或 wx.createUserInfoButton
        // 这俩 API 都会弹 1 次原生框（不可避免）
        if (typeof wx?.getUserProfile === 'function') {
            wx.getUserProfile({
                desc: '用于在游戏中展示你的身份信息',
                success: (res: any) => {
                    console.log('【登录流程】wx.getUserProfile 成功:', res?.userInfo?.nickName);
                    if (res?.userInfo) {
                        this.applyAndFinish(res.userInfo);
                    } else {
                        this.applyDefaultAndFinish();
                    }
                },
                fail: (err: any) => {
                    console.warn('【登录流程】wx.getUserProfile 失败/取消:', err);
                    this.applyDefaultAndFinish();
                },
            });
        } else {
            console.warn('【登录流程】wx.getUserProfile 不可用，使用默认');
            this.applyDefaultAndFinish();
        }
    }

    /**
     * 处理"仅同意，不拿昵称"按钮
     * 流程：直接进游戏（零原生框），写 Player 缓存
     */
    private handlePrimarilyClick(): void {
        this.applyDefaultAndFinish();
    }

    /**
     * **静态方法**：弹隐私授权对话框 + 上报 3 个事件
     * 由 Main.ts 覆盖 wx.onNeedPrivacyAuthorization 时调用
     *
     * 三个按钮的事件上报：
     *  - btnRequestSdkUserInfo → resolveFn({ event: 'agree' })
     *  - btnPrimarily          → resolveFn({ event: 'agree' })
     *  - btnRejectSdkUserInfo  → resolveFn({ event: 'disagree' })
     */
    public static showPrivacyDialog(
        contractName: string,
        resolveFn: (res: { event: 'agree' | 'disagree' | 'exposureAuthorization' }) => void,
        eventInfo?: any
    ): void {
        console.log(`【登录流程】showPrivacyDialog 触发，协议名: ${contractName}`);

        (async () => {
            try {
                const uiNode = await gsm.account.B_Account_ViewUI.openLogin();
                if (!uiNode) {
                    console.error('【登录流程】打开 VC_Account_Login 失败，按拒绝处理');
                    try { resolveFn({ event: 'disagree' }); } catch (e) { /* ignore */ }
                    return;
                }

                // 上报曝光
                console.log('【登录流程】弹窗已曝光，上报 exposureAuthorization');
                try { resolveFn({ event: 'exposureAuthorization' }); } catch (e) { /* ignore */ }

                // btnRequestSdkUserInfo → agree
                const btnRequest = find('btnRequestSdkUserInfo', uiNode);
                if (btnRequest) {
                    btnRequest.on(NodeEventType.TOUCH_END, () => {
                        console.log('【登录流程】玩家点 btnRequestSdkUserInfo，上报 agree');
                        gsm.account.B_Account_ViewUI.removeLogin();
                        try { resolveFn({ event: 'agree' }); } catch (e) { /* ignore */ }
                    });
                } else {
                    console.warn('【登录流程】showPrivacyDialog: 找不到 btnRequestSdkUserInfo，按拒绝处理');
                    gsm.account.B_Account_ViewUI.removeLogin();
                    try { resolveFn({ event: 'disagree' }); } catch (e) { /* ignore */ }
                }

                // btnPrimarily → agree
                const btnPrimarily = find('btnPrimarily', uiNode);
                if (btnPrimarily) {
                    btnPrimarily.on(NodeEventType.TOUCH_END, () => {
                        console.log('【登录流程】玩家点 btnPrimarily，上报 agree');
                        gsm.account.B_Account_ViewUI.removeLogin();
                        try { resolveFn({ event: 'agree' }); } catch (e) { /* ignore */ }
                    });
                }

                // btnRejectSdkUserInfo → disagree
                const btnReject = find('btnRejectSdkUserInfo', uiNode);
                if (btnReject) {
                    btnReject.on(NodeEventType.TOUCH_END, () => {
                        console.log('【登录流程】玩家点 btnRejectSdkUserInfo，上报 disagree');
                        gsm.account.B_Account_ViewUI.removeLogin();
                        try { resolveFn({ event: 'disagree' }); } catch (e) { /* ignore */ }
                    });
                }

                // 协议链接
                const linkPrivacy = find('linkPrivacyContract', uiNode);
                if (linkPrivacy) {
                    linkPrivacy.on(NodeEventType.TOUCH_END, () => {
                        if (typeof wx?.openPrivacyContract === 'function') {
                            wx.openPrivacyContract({
                                success: () => { /* ignore */ },
                                fail: (err: any) => console.warn('openPrivacyContract 失败:', err),
                                complete: () => { /* ignore */ },
                            });
                        }
                    });
                }
            } catch (e) {
                console.error('【登录流程】showPrivacyDialog 处理异常，按拒绝处理:', e);
                try { resolveFn({ event: 'disagree' }); } catch (e2) { /* ignore */ }
            }
        })();
    }

    /** 设置默认用户信息，结束流程（默认会写缓存） */
    private applyDefaultAndFinish(): void {
        const defaultInfo: IUserInfo = {
            nickName: 'Player',
            avatarUrl: '',
            gender: 0,
        };
        this.applyAndFinish(defaultInfo, true);
    }

    /**
     * 将指定用户信息写入 gsm + 缓存，结束流程
     * @param userInfo 用户信息
     * @param writeCache 是否写本地缓存（默认 true；缓存命中路径传 false 避免重复写）
     */
    private applyAndFinish(userInfo: IUserInfo, writeCache: boolean = true): void {
        gsm.base.sdk.userInfo = {
            nickName: userInfo.nickName,
            avatarUrl: userInfo.avatarUrl,
            gender: userInfo.gender ?? 0,
        };
        if (writeCache) {
            this.writeCache(gsm.base.sdk.userInfo);
        }
        console.log('【登录流程】用户信息已写入 gsm:', gsm.base.sdk.userInfo);
        if (gsm.account.B_Account_ViewUI?.removeLogin) {
            try { gsm.account.B_Account_ViewUI.removeLogin(); } catch {}
        }
        this.success();
    }
}
