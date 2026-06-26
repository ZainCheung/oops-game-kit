import { SdkNetworkType, SdkVibrateType } from '../SdkEnum';
import type {
    IAdError,
    IBannerAd,
    IBannerAdOption,
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
    IRewardedVideoAd,
    IRewardedVideoAdOption,
    IShareOption,
    IShareToTimelineOption,
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
        super('WeChatMiniGame' as any);
        // 延迟注册隐私监听器，确保在游戏层之后执行
        this._initPrivacyListener();
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

    async getSystemInfo(): Promise<ISystemInfo> {
        const deviceInfo = wx.getDeviceInfo();
        const windowInfo = wx.getWindowInfo();
        const appBaseInfo = wx.getAppBaseInfo();
        return {
            brand: deviceInfo.brand,
            model: deviceInfo.model,
            platform: 'WeChatMiniGame',
            system: deviceInfo.system,
            version: appBaseInfo.version,
            screenWidth: windowInfo.screenWidth,
            screenHeight: windowInfo.screenHeight,
            pixelRatio: windowInfo.pixelRatio,
            language: 'zh', // 新 API 不包含 language 字段，使用默认值
            SDKVersion: appBaseInfo.SDKVersion,
            raw: { deviceInfo, windowInfo, appBaseInfo },
        };
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
        const wxAny = wx as any;

        // 依次尝试 wx.getUserProfile → wx.getUserInfo → 兜底
        const apis: Array<{ name: string; fn: any; option: any }> = [
            {
                name: 'getUserProfile',
                fn: wxAny.getUserProfile,
                option: { lang, desc: '用于在游戏中展示你的身份信息' },
            },
            {
                name: 'getUserInfo',
                fn: wxAny.getUserInfo,
                option: { lang, withCredentials: option?.withCredentials ?? false },
            },
        ];

        return new Promise<IUserInfoResult>((resolve) => {
            const tryCall = (index: number): void => {
                if (index >= apis.length) {
                    console.warn('[WeChatSdk] getUserProfile 和 getUserInfo 都不可用');
                    resolve({ userInfo: undefined });
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
                        const info = res?.userInfo;
                        if (info?.nickName) {
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
                            console.warn(`[WeChatSdk] ${api.name} 返回但 userInfo 为空`);
                            tryCall(index + 1);
                        }
                    },
                    fail: (err: any) => {
                        console.warn(`[WeChatSdk] ${api.name} 失败:`, err);
                        tryCall(index + 1);
                    },
                });
            };

            tryCall(0);
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

    //#region ========== 隐私合规 ==========

    getPrivacySetting(): Promise<IPrivacySetting> {
        const fn = (wx as any).getPrivacySetting;
        if (typeof fn !== 'function') {
            return Promise.resolve({ needAuthorization: false });
        }
        return new Promise((resolve) => {
            fn({
                success: (res: any) =>
                    resolve({
                        needAuthorization: res.needAuthorization,
                        privacyContractName: res.privacyContractName,
                        raw: res,
                    }),
                fail: () => resolve({ needAuthorization: false }),
            });
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
                        }
                        else {
                            console.log('[WeChatSdk] 用户拒绝隐私协议');
                            resolveFn({ event: 'disagree' });
                        }
                    },
                    fail: () => {
                        console.warn('[WeChatSdk] showModal 失败，默认同意');
                        resolveFn({ event: 'agree' });
                    },
                });
            }
            else {
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

    //#region ========== 更新、子包、录屏 ==========

    getUpdateManager(): IUpdateManager | null {
        const fn = (wx as any).getUpdateManager;
        if (typeof fn !== 'function') return null;
        const m = fn();
        return {
            onCheckForUpdate: (cb) => m.onCheckForUpdate(cb as any),
            onUpdateReady: (cb) => m.onUpdateReady(cb),
            onUpdateFailed: (cb) => m.onUpdateFailed(cb),
            applyUpdate: () => m.applyUpdate(),
        };
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

    //#endregion

    //#region ========== 能力检测 ==========

    canIUse(apiName: string): boolean {
        const fn = (wx as any).canIUse;
        return typeof fn === 'function' ? fn(apiName) : false;
    }

    isReady(): boolean {
        return typeof wx !== 'undefined';
    }
    //#endregion
}
