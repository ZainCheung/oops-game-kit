import { ISdk } from './ISdk';
import type { IUserInfoResult, ILoginResult } from './SdkTypes';

/**
 * 用户信息请求结果
 */
export interface IRequestUserInfoResult {
    /** 用户信息（可能为 null 表示拒绝授权） */
    userInfo: IUserInfoResult['userInfo'];
    /** 登录凭证（用于换取 openid/session_key） */
    code: string | null;
    /** 是否成功获取用户信息 */
    success: boolean;
    /** 拒绝原因或错误信息 */
    message?: string;
}

/**
 * 请求用户信息选项
 */
export interface IRequestUserInfoOption {
    /** 登录接口地址（code 换 openid 的后台地址） */
    loginUrl: string;
    /** 保存用户信息接口地址 */
    saveUrl: string;
    /** 基础 URL（用于拼接其他接口） */
    baseUrl?: string;
    /** 隐私授权描述文案 */
    privacyDesc?: string;
    /** 语言设置 */
    lang?: 'en' | 'zh_CN' | 'zh_TW';
}

/**
 * SDK 用户信息请求器
 *
 * 委托模式：用户信息获取功能已移植到 {@link ISdk.getUserInfo}（具体实现见
 * {@link WeChatMiniGameSdk}），内部封装了完整的三层隐私合规降级 + showModal 弹窗。
 * 本类仅负责编排"获取用户信息 → 获取 code → 同步到后台"三步流程。
 *
 * 使用方式：
 * ```ts
 * const requester = new RequestSdkUserInfo(sdk);
 * const result = await requester.request({
 *     loginUrl: 'http://192.168.10.5:3000/api/wx-login',
 *     saveUrl: 'http://192.168.10.5:3000/api/save-userinfo'
 * });
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
     * 请求用户信息（完整流程）
     *
     * 包含三个步骤：
     * 1. 隐私合规获取用户信息（弹窗需用户同意）
     * 2. 获取登录 code
     * 3. 同步用户信息到后台（可选）
     *
     * @param option 请求选项
     * @param syncBackend 是否同步到后台，默认 false
     */
    async request(option: IRequestUserInfoOption, syncBackend: boolean = false): Promise<IRequestUserInfoResult> {
        // 步骤 1：隐私合规获取用户信息
        const userInfo = await this.requestUserProfile(option.privacyDesc, option.lang);
        if (!userInfo?.userInfo) {
            return {
                userInfo: undefined,
                code: null,
                success: false,
                message: userInfo?.message || '用户拒绝授权或获取失败',
            };
        }

        // 步骤 2：获取登录 code
        let code: string | null = null;
        try {
            const loginResult = await this.sdk.login();
            code = loginResult.code;
            console.log('[RequestSdkUserInfo-zw1] 拿到 code:', code);
        } catch (e) {
            console.warn('[RequestSdkUserInfo-zw1] wx.login 失败:', e);
        }

        // 步骤 3：同步到后台（可选）
        if (syncBackend && userInfo.userInfo && code) {
            await this.syncToBackend(option, code, userInfo.userInfo);
        }

        return {
            userInfo: userInfo.userInfo,
            code,
            success: true,
        };
    }

    /**
     * 仅获取用户信息（不获取 code，不同步后台）
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
        try {
            // 直接调 SDK 的 getUserInfo，隐私弹窗由 SDK 内部控制
            const result = await this.sdk.getUserInfo({ lang });
            if (!result?.userInfo) {
                return { userInfo: undefined, message: '用户拒绝授权或获取失败' };
            }
            return result;
        } catch (e: any) {
            console.warn('[RequestSdkUserInfo-zw1] requestUserProfile 失败:', e);
            return { userInfo: undefined, message: e?.message || String(e) };
        }
    }

    /**
     * 获取登录 code
     */
    async requestLoginCode(): Promise<ILoginResult> {
        return this.sdk.login();
    }

    /**
     * 同步用户信息到后台
     */
    async syncToBackend(
        option: IRequestUserInfoOption,
        code: string,
        userInfo: NonNullable<IUserInfoResult['userInfo']>
    ): Promise<boolean> {
        try {
            const baseUrl = option.baseUrl || this.extractBaseUrl(option.loginUrl);
            const loginUrl = this.buildUrl(baseUrl, '/api/wx-login');
            const saveUrl = this.buildUrl(baseUrl, '/api/save-userinfo');

            // 步骤 1：用 code 换 token
            const loginResp = await this.httpRequest(loginUrl, 'POST', { code });
            if (!loginResp.ok || !loginResp.data?.token) {
                console.warn('[RequestSdkUserInfo-zw1] 后台登录失败');
                return false;
            }
            const token = loginResp.data.token;

            // 步骤 2：保存用户信息
            const saveResp = await this.httpRequest(saveUrl, 'POST', {
                token,
                nickName: userInfo.nickName,
                avatarUrl: userInfo.avatarUrl,
            });

            console.log('[RequestSdkUserInfo-zw1] 用户信息已同步到后台:', saveResp);
            return saveResp.ok;
        } catch (e) {
            console.error('[RequestSdkUserInfo] 同步到后台失败:', e);
            return false;
        }
    }

    //#region ========== 私有方法 ==========

    /**
     * 从 URL 提取基础地址
     */
    private extractBaseUrl(url: string): string {
        try {
            const urlObj = new URL(url);
            return `${urlObj.protocol}//${urlObj.host}`;
        } catch {
            // 手动解析
            const match = url.match(/^(https?:\/\/[^\/]+)/);
            return match ? match[1] : '';
        }
    }

    /**
     * 构建完整 URL
     */
    private buildUrl(baseUrl: string, path: string): string {
        const separator = baseUrl.endsWith('/') ? '' : '/';
        return `${baseUrl}${separator}${path.replace(/^\//, '')}`;
    }

    /**
     * 发送 HTTP 请求（微信小程序环境）
     */
    private httpRequest(
        url: string,
        method: 'GET' | 'POST',
        data?: any
    ): Promise<{ ok: boolean; data?: any }> {
        return new Promise((resolve) => {
            if (typeof wx === 'undefined' || typeof wx.request !== 'function') {
                console.warn('[RequestSdkUserInfo-zw1] 非微信环境或 wx.request 不可用');
                resolve({ ok: false });
                return;
            }

            wx.request({
                url,
                method,
                data,
                success: (resp: any) => {
                    resolve({
                        ok: resp.statusCode === 200,
                        data: resp.data,
                    });
                },
                fail: (err: any) => {
                    console.error('[RequestSdkUserInfo] HTTP 请求失败:', err);
                    resolve({ ok: false });
                },
            });
        });
    }

    //#endregion
}
