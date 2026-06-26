import { find, Node, NodeEventType } from 'cc';
import { oops } from 'db://oops-framework/core/Oops';
import { IUserInfo } from '../../../../../../../../bundle/game_main/script/base/sdk/SdkTypes';
import { gsm } from '../../../../common/GameSingletonModule';
import { LoginProcessType } from '../LoginEnum';
import { LoginProcessBase } from '../LoginProcessBase';
import type { ICustomPrivacyDialog, IPrivacyEventInfo, PrivacyResolveCallback } from '../../../../../../../../bundle/game_main/script/base/sdk/SdkTypes';

/**
 * 登录流程 —— 获取用户名
 *
 * 本脚本职责（**只做这些**，其它都不在这写）：
 *   1. 命中本地缓存 → 直接 finish（零弹窗）
 *   2. 注入自定义隐私弹窗（prefab 按钮 → SDK resolve）
 *   3. 调 sdk.requirePrivacyAuthorize() 触发 SDK 内的微信隐私流程
 *   4. 协议同意 → 调 sdk.getUserProfile() 拿昵称头像（**原生弹窗就这一次**）
 *   5. 协议拒绝 / 异常 → 走 fallback Player（保证游戏主流程不被阻断）
 *   6. 写本地缓存 + finish
 *
 * 不在本脚本写：
 *   - 微信原生 API 调用（写 WeChatMiniGameSdk）
 *   - 接口签名 / 类型定义（写 ISdk.ts / SdkTypes.ts）
 *   - 隐私交互流程的整体编排（写 WeChatMiniGameSdk.requirePrivacyAuthorize）
 *
 * 全流程弹窗次数：
 *   - 第一次启动：1 次自定义弹窗（prefab） + 1 次原生弹窗（wx.getUserProfile）
 *   - 第二次启动：0 次（缓存命中）
 */
const CACHE_KEY = 'RequestSdkUserInfo_Cache';

export class RequestSdkUserInfo extends LoginProcessBase {
    constructor() {
        super(LoginProcessType.SdkUserInfo);
    }

    protected async execute() {
        // 0. 命中缓存直接 finish
        const cached = this.readCache();
        if (cached) {
            this.finish(cached);
            return;
        }

        // 1. 注入自定义隐私弹窗（业务层 prefab 按钮 → SDK resolve）
        gsm.base.sdk.platform.setCustomPrivacyDialog(this.buildPrivacyDialog());

        // 2. 触发 SDK 内的微信隐私流程
        try {
            await gsm.base.sdk.platform.requirePrivacyAuthorize();
        }
        catch (err) {
            // 拒绝 / 异常 → 不阻断游戏主流程，走 fallback Player
            console.warn('【登录流程】隐私协议未同意，使用兜底用户信息', err);
            this.finish(this.fallbackUserInfo(), true);
            return;
        }

        // 3. 协议已同意 → 调 SDK 拿真实昵称头像（**唯一一次原生弹窗**）
        try {
            const realUserInfo = await gsm.base.sdk.platform.getUserProfile({
                desc: '用于在游戏中展示你的身份信息',
            });
            this.finish(realUserInfo.userInfo ?? this.fallbackUserInfo(), true);
        }
        catch (err) {
            console.warn('【登录流程】获取用户信息失败，使用兜底用户信息', err);
            this.finish(this.fallbackUserInfo(), true);
        }
    }

    /**
     * 构造自定义隐私弹窗实现（prefab 按钮绑定）
     *
     * SDK 在触发隐私事件时调 dialog.onTrigger(resolve, eventInfo)，
     * 我们在 prefab 里弹按钮，玩家点按钮时在点击回调里调 resolve。
     *
     * 职责严格划分：
     * - SDK 层（WeChatMiniGameSdk） 负责：调 wx.requirePrivacyAuthorize / 调 wx.onNeedPrivacyAuthorization / 上报结果给微信
     * - 业务层（本方法）       负责：prefab UI、按钮事件、把按钮点击映射到 resolve 事件
     */
    private buildPrivacyDialog(): ICustomPrivacyDialog {
        return {
            onTrigger: (resolve: PrivacyResolveCallback, _eventInfo: IPrivacyEventInfo) => {
                this.showPrivacyDialog(resolve);
            },
            onOpenContract: () => {
                // 《隐私保护指引》链接点击 → SDK 内部调 wx.openPrivacyContract
                gsm.base.sdk.platform.openPrivacyContract().catch(() => { /* 失败不阻断 */ });
            },
        };
    }

    /**
     * 弹业务侧自定义隐私弹窗（VC_Account_Login prefab）。
     *
     * 按钮 → resolve 事件映射：
     *   btnRequestSdkUserInfo  → resolve({ event: 'agree' })     同意协议 + 授权拿昵称头像
     *   btnPrimarily           → resolve({ event: 'agree' })     同意协议但不授权拿昵称头像（走 fallback）
     *   btnRejectSdkUserInfo   → resolve({ event: 'disagree' })  拒绝协议（走 fallback，不阻断游戏）
     */
    private async showPrivacyDialog(resolve: PrivacyResolveCallback): Promise<void> {
        let uiNode: Node | null = null;
        try {
            uiNode = await gsm.account.B_Account_ViewUI.openLogin();
            if (!uiNode) {
                console.error('【登录流程】打开登录界面失败');
                resolve({ event: 'disagree' });
                return;
            }

            // 绑定按钮：点击即 resolve 对应事件
            const bindBtn = (name: string, event: 'agree' | 'disagree') => {
                const btn = find(name, uiNode!);
                if (!btn) {
                    console.error(`【登录流程】找不到按钮 ${name}`);
                    return;
                }
                btn.once(NodeEventType.TOUCH_END, () => {
                    gsm.account.B_Account_ViewUI.removeLogin();
                    resolve({ event });
                });
            };

            bindBtn('btnRequestSdkUserInfo', 'agree');
            bindBtn('btnPrimarily', 'agree');
            bindBtn('btnRejectSdkUserInfo', 'disagree');

            // 通知平台：弹窗页面已曝光
            resolve({ event: 'exposureAuthorization' });
        }
        catch (err) {
            console.error('【登录流程】自定义隐私弹窗异常', err);
            if (uiNode) gsm.account.B_Account_ViewUI.removeLogin();
            resolve({ event: 'disagree' });
        }
    }

    /** 兜底用户信息（拒绝 / 异常时使用，保证游戏主流程不被阻断） */
    private fallbackUserInfo(): IUserInfo {
        return {
            nickName: 'Player',
            avatarUrl: '',
            gender: 0,
            country: '',
            province: '',
            city: '',
            language: '',
        };
    }

    /** 读取本地缓存 */
    private readCache(): IUserInfo | null {
        const raw = oops.storage.getJson<IUserInfo | null>(CACHE_KEY, null);
        return raw?.nickName ? raw : null;
    }

    /** 结束流程 */
    private finish(userInfo: IUserInfo, writeCache = false): void {
        gsm.base.sdk.userInfo = userInfo;
        if (writeCache) {
            oops.storage.set(CACHE_KEY, userInfo);
        }
        console.log('【登录流程】用户信息:', userInfo);
        this.success();
    }
}
