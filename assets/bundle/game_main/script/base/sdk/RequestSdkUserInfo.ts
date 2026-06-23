import { ISdk } from './ISdk';
import type { IUserInfoResult } from './SdkTypes';

/**
 * 用户信息请求结果
 */
export interface IRequestUserInfoResult {
    /** 用户信息（可能为 null 表示拒绝授权） */
    userInfo: IUserInfoResult['userInfo'];
    /** 是否成功获取用户信息 */
    success: boolean;
    /** 拒绝原因或错误信息 */
    message?: string;
}

/**
 * 请求用户信息选项
 *
 * 注：本工具类**不依赖业务后台**，仅做客户端获取（昵称 + 头像）。
 * 用户隐私保护指引需要在 mp 后台预先配置好（昵称、头像）。
 */
export interface IRequestUserInfoOption {
    /** 隐私授权描述文案 */
    privacyDesc?: string;
    /** 语言设置 */
    lang?: 'en' | 'zh_CN' | 'zh_TW';
}

/**
 * SDK 用户信息请求器
 *
 * 委托模式：用户信息获取功能已移植到 {@link ISdk.getUserInfo}（具体实现见
 * {@link WeChatMiniGameSdk}），内部封装了完整的两层降级（`wx.getUserInfo` →
 * 全屏透明原生按钮兜底）。本类仅负责"获取用户信息 + 写入 SdkModel"两步流程。
 *
 * **客户端获取，不依赖后台**：只拿昵称和头像，不做 code 换 token / 同步用户信息等
 * 服务端动作。如果业务需要后端登录态，请使用 {@link ISdk.login()} 自行处理。
 *
 * 使用方式：
 * ```ts
 * const requester = new RequestSdkUserInfo(sdk);
 * const result = await requester.request();
 * if (result.success) {
 *     console.log('昵称:', result.userInfo?.nickName);
 * }
 * ```
 */
export class RequestSdkUserInfo {
    /** SDK 实例 */
    private sdk: ISdk;

    constructor(sdk: ISdk) {
        this.sdk = sdk;
    }

    /**
     * 请求用户信息（客户端获取，不依赖后台）
     *
     * 包含两个步骤：
     * 1. 隐私合规获取用户信息（弹窗需用户同意）
     * 2. 返回用户信息（昵称 + 头像 URL）
     *
     * @param option 请求选项
     */
    async request(option: IRequestUserInfoOption = {}): Promise<IRequestUserInfoResult> {
        // 步骤 1：隐私合规获取用户信息
        const result = await this.requestUserProfile(option.privacyDesc, option.lang);
        if (!result?.userInfo) {
            return {
                userInfo: undefined,
                success: false,
                message: result?.message || '用户拒绝授权或获取失败',
            };
        }

        return {
            userInfo: result.userInfo,
            success: true,
        };
    }

    /**
     * 仅获取用户信息（不写入 SdkModel，不依赖后台）
     *
     * 委托给 sdk.getUserInfo()，由 SDK 内部处理完整隐私弹窗流程。
     *
     * @param privacyDesc 隐私授权描述文案（透传给 SDK）
     * @param lang 语言设置
     */
    async requestUserProfile(
        privacyDesc?: string,
        lang: 'en' | 'zh_CN' | 'zh_TW' = 'zh_CN'
    ): Promise<IUserInfoResult & { message?: string }> {
        // privacyDesc 字段当前 SDK 实现未直接使用（保留接口位供后续扩展），
        // 这里仅留个引用，避免 IDE 报 unused。
        void privacyDesc;

        try {
            const result = await this.sdk.getUserInfo({ lang });
            if (!result?.userInfo) {
                return { userInfo: undefined, message: '用户拒绝授权或获取失败' };
            }
            return result;
        } catch (e: any) {
            console.warn('[RequestSdkUserInfo] requestUserProfile 失败:', e);
            return { userInfo: undefined, message: e?.message || String(e) };
        }
    }
}
