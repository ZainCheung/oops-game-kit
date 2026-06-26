import { find, NodeEventType } from 'cc';
import { gsm } from '../../../../common/GameSingletonModule';
import { LoginProcessType } from '../LoginEnum';
import { LoginProcessBase } from '../LoginProcessBase';
import { IUserInfo } from '../../../../../../../../bundle/game_main/script/base/sdk/SdkTypes';
import { oops } from 'db://oops-framework/core/Oops';

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
 * **平台访问**：所有平台 API 通过 gsm.base.sdk.platform（ISdk 接口）访问，
 *  禁止直接调用 wx。这样 H5/编辑器环境可由 DefaultSdk 兜底。
 */
const CACHE_KEY = 'RequestSdkUserInfo_Cache_v1';

export class RequestSdkUserInfo extends LoginProcessBase {

    constructor() {
        super(LoginProcessType.SdkUserInfo);
    }

    /** 获取 SDK 接口（ISdk） */
    private get sdk() {
        return gsm.base.sdk.platform;
    }

    /**
     * 初始化微信隐私授权监听器（在 execute 首次执行时调用一次）
     *
     * 做两件事：
     *  1. 覆盖 SDK 默认的 onNeedPrivacyAuthorization 监听器
     *     SDK 默认用 showModal 半原生框，必须用我们自己的 handler 覆盖
     *     覆盖式注册：最后一次生效，所以必须在 SDK 之后调
     *  2. 主动拉一次 requirePrivacyAuthorize，触发隐私监听器
     *     （新用户：弹自定义弹窗；老用户：直接 success）
     *
     * 用 setTimeout 替代 scheduleOnce，因为本类不是 Component
     */
    private initPrivacyAuthorization(): void {
        const sdk = this.sdk;

        // 1. 覆盖 onNeedPrivacyAuthorization（用我们的自定义弹窗）
        const registerPrivacy = () => {
            sdk.onNeedPrivacyAuthorization((res: { contractName: string;[k: string]: any }) => {
                const contractName = res?.contractName || '用户隐私协议';
                console.log(`【Main】SDK 触发隐私授权，协议名: ${contractName}`);
                // 弹我们的自定义弹窗 VC_Account_Login
                // 注意：onNeedPrivacyAuthorization 的回调签名在不同平台不一致
                // 微信原生是 (resolveFn, eventInfo)，ISdk 这里已统一为 (res)
                // 因此需要从 res 中取出 resolveFn
                const resolveFn = (res as any)?.resolveFn ?? (() => { /* ignore */ });
                RequestSdkUserInfo.showPrivacyDialog(contractName, resolveFn, res);
            });
            console.log('【Main】已覆盖 onNeedPrivacyAuthorization（自定义弹窗版）');
        };

        // 等 SDK 初始化完成后再覆盖（必须在 SDK 之后）
        // 用 setTimeout 延迟到下一帧，确保 SDK 注册完
        setTimeout(registerPrivacy, 0);

        // 2. 主动拉一次 requirePrivacyAuthorize，触发隐私监听器
        setTimeout(() => {
            sdk.requirePrivacyAuthorize()
                .then(() => console.log('【Main】requirePrivacyAuthorize: 用户已同意隐私'))
                .catch(() => console.log('【Main】requirePrivacyAuthorize: 用户拒绝隐私'));
        }, 300);
    }

    protected async execute() {
        const label = '【登录流程】获取用户头像';
        console.time(label);
        try {
            // 初始化隐私授权监听器（首次执行时注册一次，幂等）
            this.initPrivacyAuthorization();

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
        }
        catch (err) {
            console.timeEnd(label);
            console.error('【登录流程】获取用户头像失败', err);
            this.applyDefaultAndFinish();
        }
    }

    /** 读取本地缓存的用户信息 */
    private readCache(): IUserInfo | null {
        const raw = oops.storage.getJson<IUserInfo>(CACHE_KEY, null!);
        if (raw && raw.nickName) {
            return {
                nickName: raw.nickName,
                avatarUrl: raw.avatarUrl || '',
                gender: raw.gender ?? 0,
            };
        }
        return null;
    }

    /** 写入本地缓存 */
    private writeCache(userInfo: IUserInfo): void {
        oops.storage.set(CACHE_KEY, userInfo);
        console.log('【登录流程】用户信息已写入本地缓存:', userInfo.nickName);
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
        }
        else {
            console.warn('【登录流程】找不到 btnRequestSdkUserInfo 节点');
        }

        // btnPrimarily：仅同意，不拿昵称（零原生框）
        const btnPrimarily = find('btnPrimarily', uiNode);
        if (btnPrimarily) {
            btnPrimarily.on(NodeEventType.TOUCH_END, () => {
                console.log('【登录流程】玩家点 btnPrimarily（仅同意，不拿昵称，零原生框）');
                this.handlePrimarilyClick();
            });
        }
        else {
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

        // linkPrivacyContract：协议链接（可选，调 sdk.openPrivacyContract）
        const linkPrivacy = find('linkPrivacyContract', uiNode);
        if (linkPrivacy) {
            linkPrivacy.on(NodeEventType.TOUCH_END, () => {
                console.log('【登录流程】玩家点《隐私保护指引》链接');
                gsm.base.sdk.platform.openPrivacyContract().catch((err: any) =>
                    console.warn('【登录流程】openPrivacyContract 失败:', err)
                );
            });
        }
    }

    /**
     * 处理"同意 + 拿昵称头像"按钮
     * 流程：调 sdk.getUserProfile 弹 1 次原生框拿真昵称头像
     */
    private async handleRequestClick(): Promise<void> {
        // 微信规定：拿昵称头像必须用 getUserProfile 或 createUserInfoButton
        // 这俩 API 都会弹 1 次原生框（不可避免）
        try {
            const res = await gsm.base.sdk.platform.getUserProfile({
                desc: '用于在游戏中展示你的身份信息',
            });
            console.log('【登录流程】getUserProfile 成功:', res?.userInfo?.nickName);
            if (res?.userInfo) {
                this.applyAndFinish(res.userInfo);
            }
            else {
                this.applyDefaultAndFinish();
            }
        }
        catch (err) {
            console.warn('【登录流程】getUserProfile 失败/取消:', err);
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
     * 由 initPrivacyAuthorization 覆盖 onNeedPrivacyAuthorization 时调用
     *
     * 三个按钮的事件上报：
     *  - btnRequestSdkUserInfo → resolveFn({ event: 'agree' })
     *  - btnPrimarily          → resolveFn({ event: 'agree' })
     *  - btnRejectSdkUserInfo  → resolveFn({ event: 'disagree' })
     */
    static showPrivacyDialog(
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
                    try {
                        resolveFn({ event: 'disagree' });
                    }
                    catch (e) { /* ignore */ }
                    return;
                }

                // 上报曝光
                console.log('【登录流程】弹窗已曝光，上报 exposureAuthorization');
                try {
                    resolveFn({ event: 'exposureAuthorization' });
                }
                catch (e) { /* ignore */ }

                // btnRequestSdkUserInfo → agree
                const btnRequest = find('btnRequestSdkUserInfo', uiNode);
                if (btnRequest) {
                    btnRequest.on(NodeEventType.TOUCH_END, () => {
                        console.log('【登录流程】玩家点 btnRequestSdkUserInfo，上报 agree');
                        gsm.account.B_Account_ViewUI.removeLogin();
                        try {
                            resolveFn({ event: 'agree' });
                        }
                        catch (e) { /* ignore */ }
                    });
                }
                else {
                    console.warn('【登录流程】showPrivacyDialog: 找不到 btnRequestSdkUserInfo，按拒绝处理');
                    gsm.account.B_Account_ViewUI.removeLogin();
                    try {
                        resolveFn({ event: 'disagree' });
                    }
                    catch (e) { /* ignore */ }
                }

                // btnPrimarily → agree
                const btnPrimarily = find('btnPrimarily', uiNode);
                if (btnPrimarily) {
                    btnPrimarily.on(NodeEventType.TOUCH_END, () => {
                        console.log('【登录流程】玩家点 btnPrimarily，上报 agree');
                        gsm.account.B_Account_ViewUI.removeLogin();
                        try {
                            resolveFn({ event: 'agree' });
                        }
                        catch (e) { /* ignore */ }
                    });
                }

                // btnRejectSdkUserInfo → disagree
                const btnReject = find('btnRejectSdkUserInfo', uiNode);
                if (btnReject) {
                    btnReject.on(NodeEventType.TOUCH_END, () => {
                        console.log('【登录流程】玩家点 btnRejectSdkUserInfo，上报 disagree');
                        gsm.account.B_Account_ViewUI.removeLogin();
                        try {
                            resolveFn({ event: 'disagree' });
                        }
                        catch (e) { /* ignore */ }
                    });
                }

                // 协议链接
                const linkPrivacy = find('linkPrivacyContract', uiNode);
                if (linkPrivacy) {
                    linkPrivacy.on(NodeEventType.TOUCH_END, () => {
                        gsm.base.sdk.platform.openPrivacyContract().catch((err: any) =>
                            console.warn('openPrivacyContract 失败:', err)
                        );
                    });
                }
            }
            catch (e) {
                console.error('【登录流程】showPrivacyDialog 处理异常，按拒绝处理:', e);
                try {
                    resolveFn({ event: 'disagree' });
                }
                catch (e2) { /* ignore */ }
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
        gsm.account.B_Account_ViewUI.removeLogin();
        this.success();
    }
}
