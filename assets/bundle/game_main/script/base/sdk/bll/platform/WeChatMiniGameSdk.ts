/// <reference path="../../../../libs/wechat-minigame-typings/index.d.ts" />

import { SdkNetworkType, SdkPlatform, SdkVibrateType } from '../../model/enum/EM_Sdk';
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
} from '../../model/IM_Sdk_Data';
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
 * // 通过 SdkManager 获取（推荐）
 * const sdk = oops.sdk.manager.getSdk();
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
            const info = wx.getSystemInfoSync();
            return Promise.resolve({
                brand: info.brand,
                model: info.model,
                platform: SdkPlatform.WeChatMiniGame,
                system: info.system,
                version: info.version,
                screenWidth: info.screenWidth,
                screenHeight: info.screenHeight,
                pixelRatio: info.pixelRatio,
                language: info.language,
                SDKVersion: info.SDKVersion,
                raw: info,
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
        return this.promisify<WechatMinigame.GetUserInfoSuccessCallbackResult>(
            wx.getUserInfo.bind(wx),
            {
                lang: option?.lang ?? 'zh_CN',
                withCredentials: option?.withCredentials ?? false,
            }
        ).then((res) => ({
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
        }));
    }

    createUserInfoButton(option: {
        type?: 'text' | 'image';
        text?: string;
        image?: string;
        style?: { left: number; top: number; width: number; height: number; [k: string]: any };
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

    shareAppMessage(option?: IShareOption): void {
        wx.shareAppMessage({
            title: option?.title,
            imageUrl: option?.imageUrl,
            query: option?.path,
            ...(option?.withShareTicket ? { withShareTicket: true } : {}),
        });
    }

    onShareAppMessage(
        callback: (option?: IShareOption) => IShareOption | void
    ): void {
        wx.onShareAppMessage(() => {
            const result = callback() || {};
            return {
                title: result.title,
                imageUrl: result.imageUrl,
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

    //#region ========== 本地存储 ==========

    getStorageInfo(): Promise<{ keys: string[]; currentSize: number; limitSize: number }> {
        return Promise.resolve(wx.getStorageInfoSync());
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
        return this.promisify<void>(fn.bind(wx), option ?? {}).then(() => undefined);
    }

    onNeedPrivacyAuthorization(
        callback: (res: { contractName: string; [k: string]: any }) => void
    ): void {
        const fn = (wx as any).onNeedPrivacyAuthorization;
        if (typeof fn === 'function') fn(callback);
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
                complete: () => {},
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
