import { sys } from 'cc';
import { ISdk } from '../ISdk';
import { SdkNetworkType, SdkVibrateType } from '../SdkEnum';
import type {
    IAdError,
    ICustomAd,
    ICustomAdOption,
    ICustomPrivacyDialog,
    ICustomerServiceConversationOption,
    ICustomerServiceOption,
    IGameRecorderManager,
    IInterstitialAd,
    IInterstitialAdOption,
    IKVData,
    ILaunchOptions,
    ILoginResult,
    INetworkStatusChangeEvent,
    INetworkTypeResult,
    IPrivacySetting,
    IRewardedVideoAd,
    IRewardedVideoAdOption,
    IShareOption,
    IShareToTimelineOption,
    ISystemInfo,
    IUpdateManager,
    IUserCloudStorageResult,
    IUserInfoResult,
} from '../SdkTypes';
import { DefaultSdk } from './DefaultSdk';
import { WeChatSdkCfg } from '../SdkConfig';

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
 * - 广告/按钮对象返回平台无关接口（{@link IRewardedVideoAd} 等），
 *   内部仍持有原生 wx 对象。
 * - 部分接口（如分享到朋友圈、视频号、虚拟支付）仅微信支持，
 *   其它平台会回退到 {@link DefaultSdk}。
 */
export class WeChatMiniGameSdk extends DefaultSdk implements ISdk {
    constructor() {
        super(sys.Platform.WECHAT_GAME);
        // 初始化微信云开发（供后续云函数调用）
        if (typeof wx.cloud === 'object' && wx.cloud.init) {
            try {
                wx.cloud.init({ env: (wx.cloud as any).DYNAMIC_CURRENT_ENV });
            }
            catch (e) {
                console.warn('[WeChatSdk] wx.cloud.init 初始化失败:', e);
            }
        }
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

    async login(): Promise<ILoginResult> {
        const res = await this.promisify<WechatMinigame.LoginSuccessCallbackResult>(wx.login.bind(wx));
        const result: ILoginResult = { token: res.code, openid: null, unionid: null, raw: res };

        // 如果已初始化云开发，调用云函数获取 openid（静默降级，不阻塞登录流程）
        if (typeof wx.cloud === 'object' && wx.cloud?.callFunction) {
            try {
                const cloudRes = await wx.cloud.callFunction({
                    name: 'getOpenid',
                    data: { code: res.code },
                }) as any;
                if (cloudRes?.result?.code === 0 && cloudRes?.result?.data) {
                    result.openid = cloudRes.result.data.openid ?? null;
                    result.unionid = cloudRes.result.data.unionid ?? null;
                }
            }
            catch (e) {
                console.warn('[WeChatSdk] 云函数获取 openid 失败，降级处理:', e);
            }
        }

        return result;
    }

    checkSession(): Promise<boolean> {
        return this.promisify<void>(wx.checkSession.bind(wx))
            .then(() => true)
            .catch(() => false);
    }

    /**
     * 获取用户信息（弹 1 次原生框拿真昵称头像）
     * 对应 wx.getUserProfile，必须由用户点击事件触发。
     */
    getUserProfile(option: { desc: string; lang?: 'en' | 'zh_CN' | 'zh_TW' }): Promise<IUserInfoResult> {
        const fn = (wx as any).getUserProfile;
        if (typeof fn !== 'function') {
            console.warn('[WeChatSdk] getUserProfile 不可用，返回默认用户信息');
            return Promise.resolve({ userInfo: { nickName: 'Player', avatarUrl: '', gender: 0 } });
        }
        return new Promise<IUserInfoResult>((resolve) => {
            fn({
                desc: option.desc,
                lang: option.lang ?? 'zh_CN',
                success: (res: any) => {
                    const info = res?.userInfo;
                    resolve({
                        userInfo: info
                            ? {
                                    nickName: info.nickName,
                                    avatarUrl: info.avatarUrl,
                                    gender: info.gender,
                                    language: info.language,
                                    country: info.country,
                                    province: info.province,
                                    city: info.city,
                                    raw: info,
                                }
                            : { nickName: 'Player', avatarUrl: '', gender: 0 },
                        rawData: res.rawData,
                        signature: res.signature,
                        encryptedData: res.encryptedData,
                        iv: res.iv,
                        cloudID: res.cloudID,
                    });
                },
                fail: (err: any) => {
                    console.warn('[WeChatSdk] getUserProfile 失败/取消:', err);
                    resolve({ userInfo: { nickName: 'Player', avatarUrl: '', gender: 0 } });
                },
            });
        });
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
     * 将 base64 数据写入微信临时文件目录，返回本地路径。
     * 业务流程由 B_Share_Main 编排：截图 → 本接口存文件 → shareAppMessage(imageUrl=路径)。
     */
    async saveBase64ToFile(option: { data: string; ext?: string }): Promise<string> {
        return new Promise<string>((resolve) => {
            const fs = wx.getFileSystemManager?.();
            const envPath = wx.env?.USER_DATA_PATH;
            if (!fs || !envPath) {
                console.warn('[WeChatSdk] saveBase64ToFile: 文件系统或 USER_DATA_PATH 不可用');
                resolve('');
                return;
            }

            const ext = option.ext ?? 'png';
            const filePath = `${envPath}/share_${Date.now()}.${ext}`;

            fs.writeFile({
                filePath,
                data: option.data,
                encoding: 'base64',
                success: () => {
                    console.log('[WeChatSdk] saveBase64ToFile: 临时文件已写入', filePath);
                    resolve(filePath);
                },
                fail: (err: any) => {
                    console.error('[WeChatSdk] saveBase64ToFile: 写入失败', err);
                    resolve('');
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

    /** 读取本地文件并返回 base64 字符串 */
    async readFileAsBase64(option: { path: string }): Promise<string> {
        const fs = wx.getFileSystemManager?.();
        if (!fs?.readFileSync) {
            console.warn('[WeChatSdk] readFileAsBase64: 文件系统不可用');
            return '';
        }
        try {
            return fs.readFileSync(option.path, WeChatSdkCfg.capture.encoding) as string;
        }
        catch (e) {
            console.error('[WeChatSdk] readFileAsBase64: 读取文件失败', e);
            return '';
        }
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

    /**
     * 当前 wx.onNeedPrivacyAuthorization 是否已注册"用 dialog 触发"的监听器
     * （区别于 SDK 构造时的占位监听器 —— 占位只在 dialog 未注入时启用 showModal）
     */
    private _customListenerRegistered = false;

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

    /**
     * 主动请求隐私授权。
     *
     * 触发链路：
     *   1. 业务层先调 setCustomPrivacyDialog 注入 VC_Account_Login prefab 实现
     *   2. 业务层调 requirePrivacyAuthorize
     *   3. SDK 把 wx.onNeedPrivacyAuthorization 监听器切换到"用 dialog"版本（覆盖式注册，最后一次生效）
     *   4. 调 wx.requirePrivacyAuthorize
     *      - 用户已同意 → success
     *      - 用户未同意 → 触发监听器 → 调 dialog.onTrigger(resolve, eventInfo)
     *        → 业务层的 prefab 弹出来 → 玩家点按钮 → 在点击回调里调 resolve({event})
     *        → SDK 把结果上报给微信 → 微信恢复被挂起的 wx.requirePrivacyAuthorize
     *   5. requirePrivacyAuthorize 进入 success / fail
     *
     * 全流程严格保证：
     *   - 自定义弹窗（业务层 prefab）只弹 1 次（_customListenerRegistered 标志位）
     *   - 失败/拒绝分支不进原生弹窗（业务层自己拿兜底 userInfo 继续，不阻塞游戏主流程）
     *   - 第二次启动时玩家已同意 → 不弹任何东西
     */
    requirePrivacyAuthorize(option?: {
        demandList?: string[];
        [k: string]: any;
    }): Promise<void> {
        const fn = (wx as any).requirePrivacyAuthorize;
        if (typeof fn !== 'function') return Promise.resolve();

        // 已注入 dialog → 重新注册 listener（覆盖式，后注册生效）
        if (this._customPrivacyDialog) {
            this._registerCustomPrivacyListener();
        }
        // 没注入 → 保持占位监听器（触发时走 wx.showModal 原生兜底，1 次）

        return this.promisify<void>(fn.bind(wx), option ?? {}).then(() => undefined);
    }

    /**
     * 注册自定义隐私弹窗（**唯一**给业务脚本注入的通道）。
     *
     * 调用时机：业务层在第一次需要用户信息前（如 RequestSdkUserInfo.execute）调一次。
     * 重复调用会覆盖之前的 dialog（最后注入的生效）。
     */
    setCustomPrivacyDialog(dialog: ICustomPrivacyDialog): void {
        this._customPrivacyDialog = dialog;
        // 立即重新注册 listener，让下一次 requirePrivacyAuthorize 触发时直接命中 dialog
        if (typeof (wx as any)?.onNeedPrivacyAuthorization === 'function') {
            this._registerCustomPrivacyListener();
        }
        console.log('[WeChatSdk] 自定义隐私弹窗已注入（' + (dialog ? 'dialog=' + (dialog.constructor?.name ?? 'anonymous') : 'null') + '）');
    }

    /** 打开隐私协议详情页（仅微信支持） */
    openPrivacyContract(): Promise<void> {
        const fn = (wx as any).openPrivacyContract;
        if (typeof fn !== 'function') {
            return this.reject('openPrivacyContract');
        }
        return this.promisify<void>(fn.bind(wx)).then(() => undefined);
    }

    /**
     * 注册"使用注入 dialog 触发"的隐私监听器（覆盖式注册）。
     *
     * 关键点：
     * - 必须在业务脚本调 setCustomPrivacyDialog 之后才执行此方法，否则 dialog 还没值
     * - 一旦注册，触发时一定走 dialog.onTrigger，不再走 wx.showModal
     * - resolve 必须在 prefab 按钮的点击回调里调用（异步直接调会被微信 errno:104 拒绝）
     */
    private _registerCustomPrivacyListener(): void {
        if (!this._customPrivacyDialog) return;
        if (this._customListenerRegistered) return; // 避免重复注册

        const fn = (wx as any).onNeedPrivacyAuthorization;
        if (typeof fn !== 'function') return;

        const dialog = this._customPrivacyDialog;
        fn((resolveFn: (res: { event: string }) => void, eventInfo: any) => {
            console.log('[WeChatSdk] 隐私授权回调触发:', eventInfo);

            try {
                dialog.onTrigger(
                    (result) => {
                        console.log('[WeChatSdk] 玩家点击隐私弹窗:', result.event);
                        resolveFn(result);
                    },
                    eventInfo ?? {}
                );
            }
            catch (err) {
                // dialog 抛错时不能让 requirePrivacyAuthorize 永久 pending
                console.error('[WeChatSdk] 自定义弹窗触发失败，降级为拒绝:', err);
                resolveFn({ event: 'disagree' });
            }
        });

        this._customListenerRegistered = true;
        console.log('[WeChatSdk] 隐私授权监听器已注册（自定义 dialog 版）');
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
