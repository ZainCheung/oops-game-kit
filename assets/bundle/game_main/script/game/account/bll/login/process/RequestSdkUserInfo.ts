import { oops } from 'db://oops-framework/core/Oops';
import type { ICustomPrivacyDialog, IPrivacyEventInfo, PrivacyResolveCallback } from '../../../../../../../../bundle/game_main/script/base/sdk/SdkTypes';
import { IUserInfo } from '../../../../../../../../bundle/game_main/script/base/sdk/SdkTypes';
import { gsm } from '../../../../common/GameSingletonModule';
import { V_Account_Authorization } from '../../../view/V_Account_Authorization';
import { LoginProcessType } from '../LoginEnum';
import { LoginProcessBase } from '../LoginProcessBase';

/**
 * 登录流程 —— 获取用户名
 *
 * 本脚本职责（**只做这些**，其它都不在这写）：
 *   1. 命中本地缓存 → 直接 finish（零弹窗）
 *   2. 注入自定义隐私弹窗（prefab 按钮 → SDK resolve）
 *   3. 调 sdk.requirePrivacyAuthorize() 触发 SDK 内的微信隐私流程
 *   4. 协议同意 → 调 sdk.getUserProfile() 拿昵称头像（**原生弹窗就这一次**）
 *   5. 弹窗打开异常 → resolve({event:'disagree'}) → Promise reject（框架自动处理）
 *   6. 写本地缓存 + finish
 *
 * 不在本脚本写：
 *   - 微信原生 API 调用（写 WeChatMiniGameSdk）
 *   - 接口签名 / 类型定义（写 ISdk.ts / SdkTypes.ts）
 *   - 隐私交互流程的整体编排（写 WeChatMiniGameSdk.requirePrivacyAuthorize）
 *
 * 全流程弹窗次数：
 *   - 第一次启动：最多 3 轮（自定义弹窗 + wx.getUserProfile），getUserProfile 被取消时会重试
 *   - 第二次启动：0 次（缓存命中）
 *
 * 微信环境注意：
 *   wx.getUserProfile 必须由用户点击事件触发。若用户在原生弹窗中取消，下一轮重试时
 *   requirePrivacyAuthorize 可能直接 resolve（隐私协议已同意），导致 getUserProfile 因
 *   缺少点击上下文而再次失败。如遇到此问题，需将 getUserProfile 调用前移到按钮点击
 *   回调中（V_Account_Authorization.btnRequestSdkUserInfo）。
 */
const CACHE_KEY = 'RequestSdkUserInfo_Cache';

export class RequestSdkUserInfo extends LoginProcessBase {
    constructor() {
        super(LoginProcessType.SdkUserInfo);
    }

    protected async execute() {
        // 0. 命中缓存直接 finish
        const raw = oops.storage.getJson<IUserInfo | null>(CACHE_KEY, null);
        if (raw?.nickName) {
            this.finish(raw);
            return;
        }

        let retries = 0;
        const MAX_RETRIES = 3;

        while (retries < MAX_RETRIES) {
            // 1. 注入自定义隐私弹窗（业务层 prefab 按钮 → SDK resolve）
            gsm.base.sdk.platform.setCustomPrivacyDialog(this.buildPrivacyDialog());

            // 2. 触发 SDK 内的微信隐私流程
            // 注意：拒绝按钮不再触发 disagree，Promise 只会 resolve（用户点击同意）
            //       或永久 pending（用户未操作）。异常仅来自弹窗打开失败/组件获取失败。
            await gsm.base.sdk.platform.requirePrivacyAuthorize();

            // 3. 协议已同意 → 调 SDK 拿真实昵称头像（**唯一一次原生弹窗**）
            // 注意：getUserProfile 在各平台 SDK 内部已兜底（失败时返回默认用户信息，不会抛异常），无需 try/catch
            const realUserInfo = await gsm.base.sdk.platform.getUserProfile({
                desc: '用于在游戏中展示你的身份信息',
            });

            // 检查是否成功获取（微信取消/失败时 rawData 不存在，开发模式有 rawData: 'mock'）
            if (realUserInfo.rawData) {
                this.finish(realUserInfo.userInfo ?? { nickName: 'Player', avatarUrl: '', gender: 0 }, true);
                return;
            }

            // getUserProfile 被取消或失败 → toast 提示，继续循环重新授权
            oops.gui.toast('必须同意才可以玩');
            retries++;
        }

        // 超过最大重试次数，用户始终拒绝授权，退出小游戏
        oops.gui.toast('必须同意授权才能继续游戏');
        await gsm.base.sdk.platform.exitMiniProgram();
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
     * 弹业务侧自定义隐私弹窗（V_Account_Authorization prefab）。
     *
     * 按钮行为：
     *   btnRequestSdkUserInfo  → onPrivacyAction('agree') + this.remove()  同意并关闭弹窗
     *   btnPrimarily           → onPrivacyAction('agree')（不关闭弹窗）    同意，弹窗保持打开
     *   btnRejectSdkUserInfo   → oops.gui.toast('必须同意才可以玩')         拒绝，仅提示，不触发 resolve
     *
     * 说明：拒绝按钮不触发 disagree，目的是强制用户必须点击同意才能继续，弹窗不可跳过。
     */
    private async showPrivacyDialog(resolve: PrivacyResolveCallback): Promise<void> {
        const uiNode = await gsm.account.B_Account_ViewUI.openAuthorization();
        if (!uiNode) {
            console.error('【登录流程】打开登录界面失败');
            resolve({ event: 'disagree' });
            return;
        }

        const vc = uiNode.getComponent(V_Account_Authorization);
        if (!vc) {
            console.error('【登录流程】获取 V_Account_Authorization 组件失败');
            resolve({ event: 'disagree' });
            return;
        }

        vc.onPrivacyAction = (action) => {
            resolve({ event: action });
        };

        // 通知平台：弹窗页面已曝光
        resolve({ event: 'exposureAuthorization' });
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
