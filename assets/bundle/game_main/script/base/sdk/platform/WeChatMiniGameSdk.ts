/// <reference path="../../../libs/wechat-minigame-typings/index.d.ts" />

import { SdkNetworkType, SdkPlatform, SdkVibrateType } from '../SdkEnum';
import type {
    IAdError,
    IBannerAd,
    IBannerAdOption,
    IChannelsOption,
    ICustomAd,
    ICustomAdOption,
    ICustomerServiceConversationOption,
    ICustomerServiceOption,
    IGameRecorderManager,
    IGridAd,
    IGridAdOption,
    IInterstitialAd,
    IInterstitialAdOption,
    IKVData,
    ILaunchOptions,
    ILoginResult,
    INetworkStatusChangeEvent,
    INetworkTypeResult,
    IPayOption,
    IPayResult,
    IPrivacySetting,
    IRealtimeLogManager,
    IRewardedVideoAd,
    IRewardedVideoAdOption,
    ISceneOption,
    ISceneResult,
    IShareOption,
    IShareToTimelineOption,
    ISubscribeMessageResult,
    ISystemInfo,
    IUpdateManager,
    IUserCloudStorageResult,
    IUserInfoButton,
    IUserInfoResult,
} from '../SdkTypes';
import { ISdk } from '../ISdk';
import { DefaultSdk } from './DefaultSdk';

/**
 * 微信小游戏 SDK 实现
 *
 * 基于 `wx` 全局 API（基础库 v3.8.x），实现 {@link ISdk} 接口。
 * 类型定义来自 `libs/wechat-minigame-typings`。
 *
 * 调用方式：
 * ```ts
 * // 通过 SDK 单例模块获取（推荐）
 * const sdk = gsm.base.sdk.platformSdk;
 * const result = await sdk.login();
 * ```
 *
 * 注意事项：
 * - 所有异步方法返回 Promise，原生回调已被包装。
 * - 广告/按钮对象返回平台无关接口（{@link IBannerAd} 等），
 *   内部仍持有原生 wx 对象。
 * - 部分接口（如分享到朋友圈、视频号、虚拟支付）仅微信支持，
 *   其它平台会回退到 {@link DefaultSdk}。
 */
export class WeChatMiniGameSdk extends DefaultSdk implements ISdk {
    constructor() {
        super(SdkPlatform.WeChatMiniGame);
        // 延迟注册隐私监听器，确保在游戏层之后执行
        setTimeout(() => {
            this._initPrivacyListener();
        }, 0);
    }

    /** 是否在微信小游戏环境 */
    static isAvailable(): boolean {
        return typeof wx !== 'undefined';
    }

    //#region ========== 内部辅助 ==========

    /**
     * 将 wx 回调式 API 包装成 Promise
     * @param fn  形如 (option) => void 的 wx 接口
     * @param option 入参
     */
    protected promisify<T = any>(
        fn: (option: any) => void,
        option: Record<string, any> = {}
    ): Promise<T> {
        return new Promise<T>((resolve, reject) => {
            fn({
                ...option,
                success: (res: T) => resolve(res),
                fail: (err: any) => reject(err),
            });
        });
    }

    //#endregion

    //#region ========== 平台与生命周期 ==========

    getSystemInfo(): Promise<ISystemInfo> {
        try {
            const deviceInfo = wx.getDeviceInfo();
            const windowInfo = wx.getWindowInfo();
            const appBaseInfo = wx.getAppBaseInfo();
            return Promise.resolve({
                brand: deviceInfo.brand,
                model: deviceInfo.model,
                platform: SdkPlatform.WeChatMiniGame,
                system: deviceInfo.system,
                version: appBaseInfo.version,
                screenWidth: windowInfo.screenWidth,
                screenHeight: windowInfo.screenHeight,
                pixelRatio: windowInfo.pixelRatio,
                language: 'zh', // 新 API 不包含 language 字段，使用默认值
                SDKVersion: appBaseInfo.SDKVersion,
                raw: { deviceInfo, windowInfo, appBaseInfo },
            });
        }
        catch (e) {
            return Promise.reject(e);
        }
    }

    getLaunchOptions(): ILaunchOptions {
        const opt = wx.getLaunchOptionsSync();
        return {
            scene: opt.scene,
            query: opt.query || {},
            referrerInfo: opt.referrerInfo
                ? { appId: opt.referrerInfo.appId, extraData: opt.referrerInfo.extraData }
                : undefined,
            raw: opt,
        };
    }

    onShow(callback: (res: any) => void): void {
        wx.onShow(callback);
    }
    offShow(callback?: (res: any) => void): void {
        if (callback) wx.offShow(callback);
    }
    onHide(callback: () => void): void {
        wx.onHide(callback);
    }
    offHide(callback?: () => void): void {
        if (callback) wx.offHide(callback);
    }
    onError(callback: (err: string) => void): void {
        wx.onError((error: WechatMinigame.ListenerError) => callback(error.message));
    }
    offError(callback?: (err: string) => void): void {
        if (callback) wx.offError(callback as any);
    }

    exitMiniProgram(): Promise<void> {
        return this.promisify<void>(wx.exitMiniProgram.bind(wx)).then(() => undefined);
    }

    //#endregion

    //#region ========== 登录与用户 ==========

    login(): Promise<ILoginResult> {
        return this.promisify<WechatMinigame.LoginSuccessCallbackResult>(wx.login.bind(wx)).then(
            (res) => ({ code: res.code, raw: res })
        );
    }

    checkSession(): Promise<boolean> {
        return this.promisify<void>(wx.checkSession.bind(wx))
            .then(() => true)
            .catch(() => false);
    }

    getUserInfo(option?: {
        lang?: 'en' | 'zh_CN' | 'zh_TW';
        withCredentials?: boolean;
    }): Promise<IUserInfoResult> {
        const lang = option?.lang ?? 'zh_CN';
        const sdkVersion = this.getSDKVersion();
        console.log(`[WeChatSdk-zw3] getUserInfo: 基础库版本=${sdkVersion}, lang=${lang}`);

        // ========== 2026-06-25 最终方案:双弹窗连续模式 ==========
        // 思路：在 onNeedPrivacyAuthorization 的 showModal "同意" 按钮回调里
        //      同步创建并 tap createUserInfoButton，让两个弹窗接连出现
        // 流程：
        //   1. requirePrivacyAuthorize → onNeedPrivacyAuthorization
        //   2. 弹 showModal（隐私协议）
        //   3. 用户点"同意" → resolve({event:'agree'})
        //   4. 同步创建 createUserInfoButton 并立即 tap()
        //   5. 微信连续弹出 scope.userInfo 授权弹窗
        //   6. 用户点"允许" → onTap 返回 userInfo
        // 老库走 getUserProfile 兜底
        const isOldSDK = this.compareSDKVersion(sdkVersion, '2.27.1') < 0;

        if (isOldSDK) {
            console.warn(`[WeChatSdk-zw3] 基础库 ${sdkVersion} < 2.27.1,直接走 getUserProfile 兜底`);
            return this.tryWxGetUserProfile(lang);
        }

        console.log('[WeChatSdk-zw3] getUserInfo: 走双弹窗连续模式');
        return this.getUserInfoWithContinuousDialogs(lang, 60000);
    }

    /**
     * 双弹窗连续模式获取用户信息
     *
     * 在 showModal 的"同意"按钮回调里，同步创建并 tap createUserInfoButton，
     * 让微信连续弹出隐私协议 + scope.userInfo 授权弹窗。
     */
    private getUserInfoWithContinuousDialogs(
        lang: 'en' | 'zh_CN' | 'zh_TW',
        timeoutMs: number = 60000
    ): Promise<IUserInfoResult> {
        return new Promise((resolve) => {
            const wxAny = wx as any;
            let resolved = false;
            let userInfoBtn: any = null;

            const safeResolve = (result: IUserInfoResult) => {
                if (resolved) return;
                resolved = true;
                try { if (userInfoBtn) userInfoBtn.destroy(); } catch { /* ignore */ }
                resolve(result);
            };

            // 创建 createUserInfoButton 的函数（会在 showModal 同意回调里调用）
            const createAndTapUserInfoButton = () => {
                try {
                    let screenW = 0, screenH = 0;
                    try {
                        const windowInfo = wx.getWindowInfo();
                        screenW = windowInfo.screenWidth;
                        screenH = windowInfo.screenHeight;
                    } catch {
                        screenW = 375; screenH = 667;
                    }

                    userInfoBtn = wx.createUserInfoButton({
                        type: 'text',
                        text: '',
                        style: {
                            left: 0, top: 0,
                            width: screenW, height: screenH,
                            backgroundColor: 'rgba(0,0,0,0)',
                            borderColor: 'rgba(0,0,0,0)',
                            color: 'rgba(0,0,0,0)',
                            textAlign: 'center',
                            fontSize: 1,
                            borderRadius: 0,
                            lineHeight: 1,
                        },
                        lang: lang ?? 'zh_CN',
                        withCredentials: false,
                    });

                    userInfoBtn.onTap((res: any) => {
                        console.log('[WeChatSdk-zw3] createUserInfoButton onTap 触发, res=' + JSON.stringify(res));
                        if (res && res.userInfo && res.userInfo.nickName) {
                            const info = res.userInfo;
                            safeResolve({
                                userInfo: {
                                    nickName: info.nickName,
                                    avatarUrl: info.avatarUrl,
                                    gender: info.gender,
                                    language: info.language,
                                    country: info.country,
                                    province: info.province,
                                    city: info.city,
                                    raw: info,
                                },
                                rawData: res.rawData,
                                signature: res.signature,
                                encryptedData: res.encryptedData,
                                iv: res.iv,
                                cloudID: res.cloudID,
                            });
                        } else {
                            console.warn('[WeChatSdk-zw3] onTap 但 userInfo 为空（用户拒绝）');
                            safeResolve({ userInfo: undefined });
                        }
                    });

                    userInfoBtn.show();

                    // 关键：立即调用 tap()，触发 scope.userInfo 授权弹窗
                    // 此时还在 showModal 的 success 回调（用户交互事件）中，满足微信要求
                    if (typeof userInfoBtn.tap === 'function') {
                        console.log('[WeChatSdk-zw3] 同步调用 createUserInfoButton.tap()');
                        userInfoBtn.tap();
                    } else {
                        console.warn('[WeChatSdk-zw3] createUserInfoButton 不支持 tap()，等待用户点击');
                    }
                } catch (e) {
                    console.warn('[WeChatSdk-zw3] createAndTapUserInfoButton 失败:', e);
                    safeResolve({ userInfo: undefined });
                }
            };

            // 注册 onNeedPrivacyAuthorization：弹 showModal，同意后同步 tap createUserInfoButton
            if (typeof wxAny.onNeedPrivacyAuthorization === 'function') {
                wxAny.onNeedPrivacyAuthorization((resolveFn: (res: { event: string }) => void, eventInfo: any) => {
                    console.log('[WeChatSdk] 隐私授权回调触发:', eventInfo);

                    if (typeof wxAny.showModal === 'function') {
                        wxAny.showModal({
                            title: '隐私保护提示',
                            content: '为了向您提供游戏服务，我们需要获取您的昵称和头像信息。是否同意？',
                            confirmText: '同意',
                            cancelText: '拒绝',
                            success: (modalRes: any) => {
                                if (modalRes.confirm) {
                                    console.log('[WeChatSdk] 用户同意隐私协议');
                                    resolveFn({ event: 'agree' });
                                    // 关键：同步创建并 tap createUserInfoButton
                                    // showModal 的 success 回调算用户交互事件，满足微信要求
                                    createAndTapUserInfoButton();
                                } else {
                                    console.log('[WeChatSdk] 用户拒绝隐私协议');
                                    resolveFn({ event: 'disagree' });
                                    safeResolve({ userInfo: undefined });
                                }
                            },
                        });
                    } else {
                        resolveFn({ event: 'agree' });
                        createAndTapUserInfoButton();
                    }
                });
                console.log('[WeChatSdk] 隐私授权监听器已注册（双弹窗连续模式）');
            } else {
                // 不支持隐私授权，直接走 createUserInfoButton
                createAndTapUserInfoButton();
            }

            // 触发 requirePrivacyAuthorize
            if (typeof wxAny.requirePrivacyAuthorize === 'function') {
                wxAny.requirePrivacyAuthorize({
                    success: () => {
                        console.log('[WeChatSdk-zw3] requirePrivacyAuthorize 成功');
                        // 如果 onNeedPrivacyAuthorization 没触发（已授权），直接创建按钮
                        if (!resolved && !userInfoBtn) {
                            console.log('[WeChatSdk-zw3] 隐私已授权，直接创建按钮');
                            createAndTapUserInfoButton();
                        }
                    },
                    fail: (err: any) => {
                        console.warn('[WeChatSdk-zw3] requirePrivacyAuthorize 失败', err);
                        if (!resolved && !userInfoBtn) {
                            createAndTapUserInfoButton();
                        }
                    },
                });
            } else {
                // 不支持 requirePrivacyAuthorize，直接创建按钮
                createAndTapUserInfoButton();
            }

            // 超时兜底
            setTimeout(() => {
                if (!resolved) {
                    console.warn(`[WeChatSdk-zw3] 双弹窗连续模式超时 (${timeoutMs}ms)`);
                    safeResolve({ userInfo: undefined });
                }
            }, timeoutMs);
        });
    }

    /**
     * 获取微信基础库版本号(形如 "2.30.4")
     */
    private getSDKVersion(): string {
        try {
            const appBase = wx.getAppBaseInfo();
            return appBase?.SDKVersion || '0.0.0';
        }
        catch {
            return '0.0.0';
        }
    }

    /**
     * 确保隐私授权已通过
     *
     * 微信新版基础库（2.32.3+）要求：createUserInfoButton 必须在用户同意隐私协议后才能拿到 userInfo。
     * 如果用户尚未同意隐私协议，onTap 会返回空 userInfo。
     *
     * 此方法会：
     * 1. 检查是否需要隐私授权（wx.getPrivacySetting）
     * 2. 如果需要，调用 wx.requirePrivacyAuthorize 触发隐私授权弹窗
     * 3. 用户同意后继续后续流程
     *
     * 如果平台不支持隐私授权 API 或用户已授权，直接 resolve。
     */
    private ensurePrivacyAuthorized(): Promise<void> {
        return new Promise((resolve) => {
            const wxAny = wx as any;

            // 不支持隐私授权 API，直接跳过
            if (typeof wxAny.getPrivacySetting !== 'function') {
                console.log('[WeChatSdk-zw3] 隐私授权: 不支持 getPrivacySetting，跳过');
                resolve();
                return;
            }

            wxAny.getPrivacySetting({
                success: (res: any) => {
                    if (!res.needAuthorization) {
                        console.log('[WeChatSdk-zw3] 隐私授权: 已授权，无需弹窗');
                        resolve();
                        return;
                    }

                    console.log('[WeChatSdk-zw3] 隐私授权: 需要用户同意隐私协议');
                    this._registerCorrectPrivacyListener();

                    if (typeof wxAny.requirePrivacyAuthorize !== 'function') {
                        console.warn('[WeChatSdk-zw3] 隐私授权: 不支持 requirePrivacyAuthorize');
                        resolve();
                        return;
                    }

                    wxAny.requirePrivacyAuthorize({
                        success: () => {
                            console.log('[WeChatSdk-zw3] 隐私授权: 用户已同意');
                            resolve();
                        },
                        fail: (err: any) => {
                            console.warn('[WeChatSdk-zw3] 隐私授权: 用户拒绝或失败', err);
                            resolve(); // 即使拒绝也继续，让 createUserInfoButton 自己处理
                        },
                    });
                },
                fail: () => {
                    console.warn('[WeChatSdk-zw3] 隐私授权: getPrivacySetting 失败');
                    resolve();
                },
            });
        });
    }

    /**
     * 比较两个版本号(v1 < v2 返回 -1,v1 === v2 返回 0,v1 > v2 返回 1)
     */
    private compareSDKVersion(v1: string, v2: string): number {
        const p1 = v1.split('.').map((n) => parseInt(n, 10) || 0);
        const p2 = v2.split('.').map((n) => parseInt(n, 10) || 0);
        const len = Math.max(p1.length, p2.length);
        for (let i = 0; i < len; i++) {
            const a = p1[i] ?? 0;
            const b = p2[i] ?? 0;
            if (a < b) return -1;
            if (a > b) return 1;
        }
        return 0;
    }

    /**
     * 老基础库兜底:用 wx.getUserProfile(已废弃但 2.13.2 ~ 2.32.3 都能 work)
     * 2026-06-25 新增:给老基础库用
     */
    private tryWxGetUserProfile(lang: 'en' | 'zh_CN' | 'zh_TW'): Promise<IUserInfoResult> {
        return new Promise((resolve) => {
            const fn = (wx as any).getUserProfile;
            if (typeof fn !== 'function') {
                console.warn('[WeChatSdk-zw3] wx.getUserProfile 也不可用,放弃');
                resolve({ userInfo: undefined });
                return;
            }
            console.log('[WeChatSdk-zw3] 调用 wx.getUserProfile');
            fn({
                lang,
                desc: '用于完善用户资料',
                success: (res: any) => {
                    console.log('[WeChatSdk-zw3] getUserProfile 成功:', JSON.stringify(res));
                    const info = res?.userInfo;
                    if (info && info.nickName) {
                        resolve({
                            userInfo: {
                                nickName: info.nickName,
                                avatarUrl: info.avatarUrl,
                                gender: info.gender,
                                language: info.language,
                                country: info.country,
                                province: info.province,
                                city: info.city,
                                raw: info,
                            },
                            rawData: res.rawData,
                            signature: res.signature,
                            encryptedData: res.encryptedData,
                            iv: res.iv,
                            cloudID: res.cloudID,
                        });
                    }
                    else {
                        console.warn('[WeChatSdk-zw3] getUserProfile 返回但 userInfo 为空');
                        resolve({ userInfo: undefined });
                    }
                },
                fail: (e: any) => {
                    console.warn('[WeChatSdk-zw3] getUserProfile 失败:', e);
                    resolve({ userInfo: undefined });
                },
            });
        });
    }

    /**
     * 调用 wx.getUserInfo，加空保护（未授权时 res.userInfo 可能为空）
     */
    private tryWxGetUserInfo(lang: 'en' | 'zh_CN' | 'zh_TW'): Promise<IUserInfoResult> {
        return this.promisify<WechatMinigame.GetUserInfoSuccessCallbackResult>(
            wx.getUserInfo.bind(wx),
            { lang, withCredentials: false }
        ).then((res) => {
            if (!res || !res.userInfo || !res.userInfo.nickName) {
                console.warn('[WeChatSdk-zw3] wx.getUserInfo 返回但 userInfo 为空');
                return { userInfo: undefined };
            }
            return {
                userInfo: {
                    nickName: res.userInfo.nickName,
                    avatarUrl: res.userInfo.avatarUrl,
                    gender: res.userInfo.gender,
                    language: res.userInfo.language,
                    country: res.userInfo.country,
                    province: res.userInfo.province,
                    city: res.userInfo.city,
                    raw: res.userInfo,
                },
                rawData: res.rawData,
                signature: res.signature,
                encryptedData: res.encryptedData,
                iv: res.iv,
                cloudID: res.cloudID,
            };
        }).catch((e) => {
            console.warn('[WeChatSdk-zw3] wx.getUserInfo 调用失败:', e);
            return { userInfo: undefined };
        });
    }

    /**
     * 通过创建全屏透明原生按钮 + onTap 获取真实用户信息
     *
     * 背景：微信新基础库下，wx.getUserInfo / wx.getUserProfile 在用户未授权时
     * resolve 但 userInfo 为空。唯一能拿到真实数据的方式是 createUserInfoButton
     * + 用户点击触发 onTap（用户点击原生按钮自带"用户行为上下文"，不会被基础库拒绝）。
     *
     * 此方法会创建一个全屏透明原生按钮，等用户点击后销毁并返回用户信息。
     * 业务层只需调用 sdk.getUserInfo() 即可，无需自己管理原生按钮生命周期。
     */
    private getUserInfoViaButton(
        lang: 'en' | 'zh_CN' | 'zh_TW',
        timeoutMs: number = 60000
    ): Promise<IUserInfoResult> {
        return new Promise((resolve) => {
            console.log('[WeChatSdk-zw3] getUserInfoViaButton: 开始创建全屏透明原生按钮');
            if (typeof wx === 'undefined' || typeof wx.createUserInfoButton !== 'function') {
                console.warn('[WeChatSdk-zw3] createUserInfoButton 不可用');
                resolve({ userInfo: undefined });
                return;
            }

            let resolved = false;
            let btn: any = null;
            const safeResolve = (result: IUserInfoResult) => {
                if (resolved) return;
                resolved = true;
                try {
                    if (btn) btn.destroy();
                }
                catch { /* ignore */ }
                resolve(result);
            };

            // 全屏透明按钮，覆盖整个屏幕
            let screenW = 0, screenH = 0;
            try {
                const windowInfo = wx.getWindowInfo();
                screenW = windowInfo.screenWidth;
                screenH = windowInfo.screenHeight;
            }
            catch {
                screenW = 375;
                screenH = 667;
            }

            try {
                btn = wx.createUserInfoButton({
                    type: 'text',
                    text: '',
                    style: {
                        left: 0,
                        top: 0,
                        width: screenW,
                        height: screenH,
                        backgroundColor: 'rgba(0,0,0,0)',
                        borderColor: 'rgba(0,0,0,0)',
                        color: 'rgba(0,0,0,0)',
                        textAlign: 'center',
                        fontSize: 1,
                        borderRadius: 0,
                        lineHeight: 1,
                    },
                    lang: lang ?? 'zh_CN',
                    withCredentials: false,
                });
            }
            catch (e) {
                console.warn('[WeChatSdk-zw3] createUserInfoButton 创建失败:', e);
                resolve({ userInfo: undefined });
                return;
            }

            if (!btn) {
                console.warn('[WeChatSdk-zw3] createUserInfoButton 返回 null');
                resolve({ userInfo: undefined });
                return;
            }

            try {
                btn.show();
            }
            catch (e) {
                console.warn('[WeChatSdk-zw3] btn.show 失败:', e);
            }
            console.log('[WeChatSdk-zw3] getUserInfoViaButton: 全屏透明按钮已 show，等待用户点击');

            btn.onTap((res: any) => {
                console.log('[WeChatSdk-zw3] createUserInfoButton onTap 触发, res=' + JSON.stringify(res));
                if (res && res.userInfo && res.userInfo.nickName) {
                    const info = res.userInfo;
                    safeResolve({
                        userInfo: {
                            nickName: info.nickName,
                            avatarUrl: info.avatarUrl,
                            gender: info.gender,
                            language: info.language,
                            country: info.country,
                            province: info.province,
                            city: info.city,
                            raw: info,
                        },
                        rawData: res.rawData,
                        signature: res.signature,
                        encryptedData: res.encryptedData,
                        iv: res.iv,
                        cloudID: res.cloudID,
                    });
                }
                else {
                    console.warn('[WeChatSdk-zw3] onTap 但 userInfo 为空（用户拒绝）');
                    safeResolve({ userInfo: undefined });
                }
            });

            // 超时兜底
            setTimeout(() => {
                if (!resolved) {
                    console.warn(`[WeChatSdk-zw3] getUserInfoViaButton 超时 (${timeoutMs}ms)`);
                    safeResolve({ userInfo: undefined });
                }
            }, timeoutMs);
        });
    }

    createUserInfoButton(option: {
        type?: 'text' | 'image';
        text?: string;
        image?: string;
        style?: { left: number; top: number; width: number; height: number;[k: string]: any };
        lang?: 'en' | 'zh_CN' | 'zh_TW';
        withCredentials?: boolean;
    }): IUserInfoButton | null {
        try {
            const btn = wx.createUserInfoButton({
                type: option.type ?? 'text',
                text: option.text,
                image: option.image,
                style: option.style as any,
                lang: option.lang ?? 'zh_CN',
                withCredentials: option.withCredentials ?? false,
            });

            // 维护外部 callback 到 wx 内部包装监听的映射，保证 offTap 能正确移除
            const listeners = new Map<(res: IUserInfoResult) => void, (res: any) => void>();

            return {
                show: () => btn.show(),
                hide: () => btn.hide(),
                destroy: () => {
                    listeners.clear();
                    btn.destroy();
                },
                onTap: (callback) => {
                    const wrapped = (res: any) => {
                        // 新版基础库可能返回空 userInfo（用户拒绝或未授权）
                        const info = res?.userInfo;
                        if (!info) {
                            console.warn('[WeChatSdk] createUserInfoButton onTap: userInfo 为空', res);
                            callback({ userInfo: undefined });
                            return;
                        }
                        callback({
                            userInfo: {
                                nickName: info.nickName,
                                avatarUrl: info.avatarUrl,
                                gender: info.gender,
                                language: info.language,
                                raw: info,
                            },
                            rawData: res.rawData,
                            signature: res.signature,
                            encryptedData: res.encryptedData,
                            iv: res.iv,
                            cloudID: res.cloudID,
                        });
                    };
                    listeners.set(callback, wrapped);
                    (btn as any).onTap(wrapped);
                },
                offTap: (callback) => {
                    if (!callback) return;
                    const wrapped = listeners.get(callback);
                    if (wrapped) {
                        (btn as any).offTap(wrapped);
                        listeners.delete(callback);
                    }
                },
            };
        }
        catch (e) {
            console.error('[WeChatSdk] createUserInfoButton 失败', e);
            return null;
        }
    }

    //#endregion

    //#region ========== 分享 ==========

    /**
     * 主动拉起转发（分享给好友）
     *
     * 设计：
     * - 如果传入了 screenshotData（截图数据），会自动保存为临时文件并分享
     * - 如果传入了 presetImageUrl（预制图片 URL），直接使用
     * - 否则使用默认分享
     *
     * 调用示例：
     * ```ts
     * // 使用预制图片分享
     * sdk.shareAppMessage({
     *     title: '一起来玩',
     *     presetImageUrl: 'https://example.com/share.png',
     * });
     *
     * // 使用截图分享（Cocos 层截取画面后传入 base64 数据）
     * sdk.shareWithScreenshot({
     *     title: '一起来玩',
     *     screenshotData: base64String, // Cocos 截图的 base64 数据
     * });
     * ```
     */
    shareAppMessage(option?: IShareOption): void {
        const imageUrl = option?.presetImageUrl ?? option?.imageUrl;
        wx.shareAppMessage({
            title: option?.title,
            imageUrl,
            query: option?.path,
            ...(option?.withShareTicket ? { withShareTicket: true } : {}),
        });
    }

    /**
     * 使用截图分享（自动处理截图保存和分享）
     *
     * @param option 分享选项，包含 title、screenshotData 等
     * @returns Promise，resolve 表示分享成功，reject 表示失败
     */
    async shareWithScreenshot(option: {
        title?: string;
        query?: string;
        withShareTicket?: boolean;
        screenshotData: string; // base64 截图数据
    }): Promise<void> {
        return new Promise((resolve, reject) => {
            // 获取临时文件保存路径
            const fs = wx.getFileSystemManager?.();
            if (!fs) {
                console.warn('[WeChatSdk] shareWithScreenshot: getFileSystemManager 不可用');
                // 降级：直接分享无图
                this.shareAppMessage({ title: option.title, query: option.query });
                resolve();
                return;
            }

            const envPath = wx.env?.USER_DATA_PATH;
            if (!envPath) {
                console.warn('[WeChatSdk] shareWithScreenshot: USER_DATA_PATH 不可用');
                this.shareAppMessage({ title: option.title, query: option.query });
                resolve();
                return;
            }

            const filePath = `${envPath}/share_${Date.now()}.png`;

            // 保存 base64 数据为临时文件
            fs.writeFile({
                filePath,
                data: option.screenshotData,
                encoding: 'base64',
                success: () => {
                    console.log('[WeChatSdk] shareWithScreenshot: 截图保存成功', filePath);
                    // 分享
                    wx.shareAppMessage({
                        title: option.title,
                        imageUrl: filePath,
                        query: option.query,
                        ...(option.withShareTicket ? { withShareTicket: true } : {}),
                    });
                    resolve();
                },
                fail: (err: any) => {
                    console.warn('[WeChatSdk] shareWithScreenshot: 截图保存失败', err);
                    // 降级：直接分享无图
                    this.shareAppMessage({ title: option.title, query: option.query });
                    resolve();
                },
            });
        });
    }

    /**
     * 监听用户点击右上角转发
     *
     * 回调返回 {@link IShareOption} 时，使用 `presetImageUrl` 作为转发卡片封面。
     * 不返回 / 返回空对象时，微信会展示通用转发卡片（不含自定义封面）。
     */
    onShareAppMessage(
        callback: (option?: IShareOption) => IShareOption | void
    ): void {
        wx.onShareAppMessage(() => {
            const result = callback() || {};
            const imageUrl = result.presetImageUrl ?? result.imageUrl;
            return {
                title: result.title,
                imageUrl,
                query: result.path,
                ...(result.withShareTicket ? { withShareTicket: true } : {}),
            } as any;
        });
    }

    shareToTimeline(option?: IShareToTimelineOption): void {
        if (typeof (wx as any).shareToTimeline === 'function') {
            (wx as any).shareToTimeline({
                title: option?.title,
                imageUrl: option?.imageUrl,
                query: option?.query,
            });
        }
        else {
            this.notSupported('shareToTimeline');
        }
    }

    showShareMenu(option?: { withShareTicket?: boolean; menus?: string[] }): void {
        wx.showShareMenu({
            withShareTicket: option?.withShareTicket,
            menus: option?.menus,
        });
    }

    hideShareMenu(option?: { menus?: string[] }): void {
        wx.hideShareMenu({ menus: option?.menus });
    }

    canShareToTimeline(): boolean {
        return typeof (wx as any).shareToTimeline === 'function';
    }

    //#endregion

    //#region ========== 广告 ==========

    createBannerAd(option: IBannerAdOption): IBannerAd | null {
        try {
            const ad = wx.createBannerAd({
                adUnitId: option.adUnitId,
                style: {
                    left: option.left ?? 0,
                    top: option.top ?? 0,
                    width: option.width ?? 300,
                } as any,
            });
            return this.wrapBannerAd(ad, option);
        }
        catch (e) {
            console.error('[WeChatSdk] createBannerAd 失败', e);
            return null;
        }
    }

    private wrapBannerAd(ad: WechatMinigame.BannerAd, option: IBannerAdOption): IBannerAd {
        return {
            style: {
                get top() {
                    return (ad.style as any).top;
                },
                set top(v: number) {
                    (ad.style as any).top = v;
                },
                get left() {
                    return (ad.style as any).left;
                },
                set left(v: number) {
                    (ad.style as any).left = v;
                },
                get width() {
                    return (ad.style as any).width;
                },
                set width(v: number) {
                    (ad.style as any).width = v;
                },
                get height() {
                    return (ad.style as any).height;
                },
            },
            show: () => ad.show(),
            hide: () => ad.hide(),
            destroy: () => ad.destroy(),
            onError: (cb) => ad.onError((err) => cb(this.mapAdError(err))),
            offError: (cb?) => {
                if (cb) (ad as any).offError(cb as any);
            },
            onLoad: (cb) => (ad as any).onLoad(cb),
            offLoad: (cb?) => {
                if (cb) (ad as any).offLoad(cb);
            },
            onResize: (cb) => (ad as any).onResize(cb),
            offResize: (cb?) => {
                if (cb) (ad as any).offResize(cb);
            },
        };
    }

    createRewardedVideoAd(option: IRewardedVideoAdOption): IRewardedVideoAd | null {
        try {
            const ad = wx.createRewardedVideoAd({ adUnitId: option.adUnitId });
            if (option.muted !== undefined && (ad as any).setMuted) {
                (ad as any).setMuted(option.muted);
            }
            return {
                load: () => ad.load(),
                show: () => ad.show(),
                onClose: (cb) =>
                    ad.onClose((res: any) => cb({ isEnded: !!(res && res.isEnded) })),
                offClose: (cb?) => {
                    if (cb) (ad as any).offClose(cb as any);
                },
                onError: (cb) => ad.onError((err) => cb(this.mapAdError(err))),
                offError: (cb?) => {
                    if (cb) (ad as any).offError(cb as any);
                },
                onLoad: (cb) => (ad as any).onLoad(cb),
                offLoad: (cb?) => {
                    if (cb) (ad as any).offLoad(cb);
                },
            };
        }
        catch (e) {
            console.error('[WeChatSdk] createRewardedVideoAd 失败', e);
            return null;
        }
    }

    createInterstitialAd(option: IInterstitialAdOption): IInterstitialAd | null {
        try {
            const ad = wx.createInterstitialAd({ adUnitId: option.adUnitId });
            return {
                load: () => ad.load(),
                show: () => ad.show(),
                destroy: () => ad.destroy(),
                onError: (cb) => ad.onError((err) => cb(this.mapAdError(err))),
                offError: (cb?) => {
                    if (cb) (ad as any).offError(cb as any);
                },
                onLoad: (cb) => (ad as any).onLoad(cb),
                offLoad: (cb?) => {
                    if (cb) (ad as any).offLoad(cb);
                },
                onClose: (cb) => (ad as any).onClose(cb),
                offClose: (cb?) => {
                    if (cb) (ad as any).offClose(cb);
                },
            };
        }
        catch (e) {
            console.error('[WeChatSdk] createInterstitialAd 失败', e);
            return null;
        }
    }

    createGridAd(option: IGridAdOption): IGridAd | null {
        try {
            const ad = (wx as any).createGridAd({
                adUnitId: option.adUnitId,
                style: {
                    left: option.left ?? 0,
                    top: option.top ?? 0,
                    width: option.width ?? 300,
                },
                gridCount: option.gridCount,
            });
            if (!ad) return null;
            return {
                show: () => ad.show(),
                hide: () => ad.hide(),
                destroy: () => ad.destroy(),
                onError: (cb) => ad.onError((err: any) => cb(this.mapAdError(err))),
                offError: (cb?) => {
                    if (cb) ad.offError(cb);
                },
                onLoad: (cb) => ad.onLoad(cb),
                offLoad: (cb?) => {
                    if (cb) ad.offLoad(cb);
                },
                onResize: (cb) => ad.onResize(cb),
                offResize: (cb?) => {
                    if (cb) ad.offResize(cb);
                },
            };
        }
        catch (e) {
            console.error('[WeChatSdk] createGridAd 失败', e);
            return null;
        }
    }

    createCustomAd(option: ICustomAdOption): ICustomAd | null {
        try {
            const ad = (wx as any).createCustomAd({
                adUnitId: option.adUnitId,
                style: {
                    left: option.left ?? 0,
                    top: option.top ?? 0,
                    width: option.width,
                    height: option.height,
                },
            });
            if (!ad) return null;
            return {
                show: () => ad.show(),
                hide: () => ad.hide(),
                destroy: () => ad.destroy(),
                onError: (cb) => ad.onError((err: any) => cb(this.mapAdError(err))),
                offError: (cb?) => {
                    if (cb) ad.offError(cb);
                },
                onLoad: (cb) => ad.onLoad(cb),
                offLoad: (cb?) => {
                    if (cb) ad.offLoad(cb);
                },
            };
        }
        catch (e) {
            console.error('[WeChatSdk] createCustomAd 失败', e);
            return null;
        }
    }

    private mapAdError(err: any): IAdError {
        return {
            errCode: err?.errCode ?? -1,
            errMsg: err?.errMsg ?? String(err),
        };
    }

    //#endregion

    //#region ========== 虚拟支付 ==========

    pay(option: IPayOption): Promise<IPayResult> {
        // 道具直购
        if (option.mode === 'item') {
            const fn = (wx as any).requestMidasPaymentGameItem;
            if (typeof fn !== 'function') {
                return Promise.reject(new Error('[WeChatSdk] 不支持道具直购'));
            }
            return this.promisify<any>(fn.bind(wx), {
                offerId: option.offerId,
                buyQuantity: option.quantity,
                outTradeNo: option.extraInfo || '',
                env: option.env,
            }).then((res) => ({ errMsg: res?.errMsg ?? 'ok', raw: res }));
        }
        // 游戏币
        return this.promisify<WechatMinigame.RequestMidasPaymentSuccessCallbackResult>(
            (wx.requestMidasPayment as any).bind(wx),
            {
                mode: 'game',
                offerId: option.offerId,
                buyQuantity: option.quantity,
                outTradeNo: option.extraInfo || '',
                currencyType: option.currencyType ?? 'CNY',
                env: option.env,
                zoneId: (option as any).zoneId,
            }
        ).then((res) => ({ errMsg: res?.errMsg ?? 'ok', raw: res }));
    }

    //#endregion


    //#region ========== 设备能力 ==========

    vibrateShort(type?: SdkVibrateType): Promise<void> {
        return this.promisify<void>(wx.vibrateShort.bind(wx), { type: type ?? 'medium' }).then(
            () => undefined
        );
    }

    vibrateLong(): Promise<void> {
        return this.promisify<void>(wx.vibrateLong.bind(wx)).then(() => undefined);
    }

    setClipboardData(data: string): Promise<void> {
        return this.promisify<void>(wx.setClipboardData.bind(wx), { data }).then(() => undefined);
    }

    getClipboardData(): Promise<string> {
        return this.promisify<{ data: string }>(wx.getClipboardData.bind(wx)).then(
            (res) => res.data
        );
    }

    getNetworkType(): Promise<INetworkTypeResult> {
        return this.promisify<{ networkType: string; isConnected?: boolean }>(
            wx.getNetworkType.bind(wx)
        ).then((res) => ({
            networkType: res.networkType as SdkNetworkType,
            isConnected: res.isConnected,
        }));
    }

    onNetworkStatusChange(callback: (res: INetworkStatusChangeEvent) => void): void {
        wx.onNetworkStatusChange((res: any) =>
            callback({
                networkType: res.networkType as SdkNetworkType,
                isConnected: res.isConnected,
            })
        );
    }

    offNetworkStatusChange(callback?: (res: INetworkStatusChangeEvent) => void): void {
        if (callback) (wx as any).offNetworkStatusChange(callback as any);
    }

    getScreenBrightness(): Promise<number> {
        return this.promisify<{ value: number }>(wx.getScreenBrightness.bind(wx)).then(
            (res) => res.value
        );
    }

    setScreenBrightness(value: number): Promise<void> {
        return this.promisify<void>(wx.setScreenBrightness.bind(wx), { value }).then(
            () => undefined
        );
    }

    setKeepScreenOn(keepScreenOn: boolean): Promise<void> {
        return this.promisify<void>(wx.setKeepScreenOn.bind(wx), { keepScreenOn }).then(
            () => undefined
        );
    }

    //#endregion

    //#region ========== 开放数据域托管数据 ==========

    setUserCloudStorage(kvDataList: IKVData[]): Promise<void> {
        return this.promisify<void>(wx.setUserCloudStorage.bind(wx), { KVDataList: kvDataList }).then(
            () => undefined
        );
    }

    removeUserCloudStorage(keys: string[]): Promise<void> {
        return this.promisify<void>(wx.removeUserCloudStorage.bind(wx), { keyList: keys }).then(
            () => undefined
        );
    }

    getUserCloudStorage(keys: string[]): Promise<IUserCloudStorageResult> {
        return this.promisify<{ KVDataList: IKVData[] }>(wx.getUserCloudStorage.bind(wx), {
            keyList: keys,
        }).then((res) => ({ kvDataList: res.KVDataList || [], raw: res }));
    }

    //#endregion

    //#region ========== 客服与反馈 ==========

    openCustomerServiceConversation(
        option: ICustomerServiceConversationOption
    ): Promise<void> {
        return this.promisify<void>(wx.openCustomerServiceConversation.bind(wx), {
            extInfo: option.extInfo,
            source: option.source,
            enterFrom: option.enterFrom,
        }).then(() => undefined);
    }

    openCustomerServiceChat(option: ICustomerServiceOption): Promise<void> {
        const fn = (wx as any).openCustomerServiceChat;
        if (typeof fn !== 'function') {
            return this.reject('openCustomerServiceChat');
        }
        return this.promisify<void>(fn.bind(wx), {
            extInfo: option.extInfo,
            source: option.source,
        }).then(() => undefined);
    }

    //#endregion

    //#region ========== 订阅消息 ==========

    requestSubscribeMessage(tmplIds: string[]): Promise<ISubscribeMessageResult> {
        return this.promisify<ISubscribeMessageResult>(
            wx.requestSubscribeMessage.bind(wx),
            { tmplIds }
        );
    }

    //#endregion

    //#region ========== 隐私合规 ==========

    getPrivacySetting(): Promise<IPrivacySetting> {
        return new Promise((resolve) => {
            try {
                wx.getPrivacySetting({
                    success: (res: any) =>
                        resolve({
                            needAuthorization: res.needAuthorization,
                            privacyContractName: res.privacyContractName,
                            raw: res,
                        }),
                    fail: () => resolve({ needAuthorization: false }),
                });
            }
            catch {
                resolve({ needAuthorization: false });
            }
        });
    }

    requirePrivacyAuthorize(option?: {
        demandList?: string[];
        [k: string]: any;
    }): Promise<void> {
        const fn = (wx as any).requirePrivacyAuthorize;
        if (typeof fn !== 'function') return Promise.resolve();

        // 先注册正确签名的监听器（覆盖游戏层）
        this._registerCorrectPrivacyListener();

        return this.promisify<void>(fn.bind(wx), option ?? {}).then(() => undefined);
    }

    onNeedPrivacyAuthorization(
        callback: (res: { contractName: string;[k: string]: any }) => void
    ): void {
        const fn = (wx as any).onNeedPrivacyAuthorization;
        if (typeof fn === 'function') fn(callback);
    }

    /**
     * 注册正确签名的隐私授权监听器（覆盖游戏层的错误监听器）
     *
     * 关键点：resolve 必须在用户交互事件中调用，不能直接异步调用。
     * 微信 errno:104 "click action before resolve is needed" 就是因为
     * 直接 resolve({event:'agree'}) 没有用户交互上下文。
     *
     * 解决方案：用 wx.showModal 显示原生确认框，用户点"同意"/"拒绝"时
     * 在 showModal 的 success 回调里调用 resolve（showModal 回调算用户交互事件）。
     */
    private _registerCorrectPrivacyListener(): void {
        const fn = (wx as any).onNeedPrivacyAuthorization;
        if (typeof fn !== 'function') return;

        fn((resolveFn: (res: { event: string }) => void, eventInfo: any) => {
            console.log('[WeChatSdk] 隐私授权回调触发:', eventInfo);

            const wxAny = wx as any;
            if (typeof wxAny.showModal === 'function') {
                // 用 wx.showModal 显示原生确认框，让用户主动点击同意/拒绝
                wxAny.showModal({
                    title: '隐私保护提示',
                    content: '为了向您提供游戏服务，我们需要获取您的昵称和头像信息。是否同意？',
                    confirmText: '同意',
                    cancelText: '拒绝',
                    success: (modalRes: any) => {
                        if (modalRes.confirm) {
                            console.log('[WeChatSdk] 用户同意隐私协议');
                            resolveFn({ event: 'agree' });
                        } else {
                            console.log('[WeChatSdk] 用户拒绝隐私协议');
                            resolveFn({ event: 'disagree' });
                        }
                    },
                    fail: () => {
                        console.warn('[WeChatSdk] showModal 失败，默认同意');
                        resolveFn({ event: 'agree' });
                    },
                });
            } else {
                // 兜底：showModal 不可用，直接同意
                console.log('[WeChatSdk] showModal 不可用，直接同意');
                resolveFn({ event: 'agree' });
            }
        });

        console.log('[WeChatSdk] 隐私授权监听器已注册（覆盖式 showModal 版）');
    }

    /**
     * 初始化隐私授权监听器（在 SDK 创建时调用）
     */
    private _initPrivacyListener(): void {
        this._registerCorrectPrivacyListener();
        console.log('[WeChatSdk] 隐私授权监听器初始化完成');
    }

    //#endregion

    //#region ========== 视频号 ==========

    openChannelsUserProfile(option: IChannelsOption): Promise<void> {
        const fn = (wx as any).openChannelsUserProfile;
        if (typeof fn !== 'function') return this.reject('openChannelsUserProfile');
        return this.promisify<void>(fn.bind(wx), option).then(() => undefined);
    }

    openChannelsLive(option: IChannelsOption): Promise<void> {
        const fn = (wx as any).openChannelsLive;
        if (typeof fn !== 'function') return this.reject('openChannelsLive');
        return this.promisify<void>(fn.bind(wx), option).then(() => undefined);
    }

    openChannelsVideo(option: IChannelsOption): Promise<void> {
        const fn = (wx as any).openChannelsVideo;
        if (typeof fn !== 'function') return this.reject('openChannelsVideo');
        return this.promisify<void>(fn.bind(wx), option).then(() => undefined);
    }

    //#endregion

    //#region ========== 更新、子包、录屏、日志 ==========

    getUpdateManager(): IUpdateManager | null {
        try {
            const m = wx.getUpdateManager();
            return {
                onCheckForUpdate: (cb) => m.onCheckForUpdate(cb as any),
                onUpdateReady: (cb) => m.onUpdateReady(cb),
                onUpdateFailed: (cb) => m.onUpdateFailed(cb),
                applyUpdate: () => m.applyUpdate(),
            };
        }
        catch (e) {
            console.error('[WeChatSdk] getUpdateManager 失败', e);
            return null;
        }
    }

    loadSubpackage(name: string): Promise<void> {
        return new Promise((resolve, reject) => {
            wx.loadSubpackage({
                name,
                success: () => resolve(),
                fail: (err: any) => reject(err),
                complete: () => { },
            } as WechatMinigame.LoadSubpackageOption);
        });
    }

    getGameRecorderManager(): IGameRecorderManager | null {
        const fn = (wx as any).getGameRecorderManager;
        if (typeof fn !== 'function') {
            this.notSupported('getGameRecorderManager');
            return null;
        }
        try {
            const m = fn();
            return {
                start: (opt) => m.start(opt ?? {}),
                stop: () => m.stop(),
                pause: () => m.pause(),
                resume: () => m.resume(),
                onStart: (cb) => (m.onStart ? m.onStart(cb) : undefined),
                onStop: (cb) => (m.onStop ? m.onStop(cb) : undefined),
                onError: (cb) => (m.onError ? m.onError((err: any) => cb(this.mapAdError(err))) : undefined),
            };
        }
        catch (e) {
            console.error('[WeChatSdk] getGameRecorderManager 失败', e);
            return null;
        }
    }

    getRealtimeLogManager(): IRealtimeLogManager | null {
        try {
            const m = wx.getRealtimeLogManager();
            return {
                info: (...args) => m.info(...args),
                warn: (...args) => m.warn(...args),
                error: (...args) => m.error(...args),
                debug: (...args) => (m as any).debug?.(...args),
                setFilterMsg: (msg) => m.setFilterMsg(msg),
                addFilterMsg: (msg) => m.addFilterMsg(msg),
            };
        }
        catch {
            return null;
        }
    }

    //#endregion

    //#region ========== 抖音侧边栏场景 ==========

    checkScene(_option: ISceneOption): Promise<ISceneResult> {
        // 微信不支持抖音侧边栏场景
        return this.reject<ISceneResult>('checkScene');
    }

    navigateToScene(_option: ISceneOption): Promise<ISceneResult> {
        return this.reject<ISceneResult>('navigateToScene');
    }

    //#endregion

    //#region ========== 能力检测 ==========

    canIUse(apiName: string): boolean {
        try {
            return (wx as any).canIUse(apiName);
        }
        catch {
            return false;
        }
    }

    isReady(): boolean {
        return typeof wx !== 'undefined';
    }
    //#endregion
}
