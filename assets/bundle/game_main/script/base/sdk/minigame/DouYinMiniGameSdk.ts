import { sys } from 'cc';
import { ISdk } from '../ISdk';
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
    IPrivacySetting,
    IRewardedVideoAd,
    IRewardedVideoAdOption,
    ISceneOption,
    ISceneResult,
    IShareOption,
    IShareToTimelineOption,
    ISystemInfo,
    IUpdateManager,
    IUserCloudStorageResult,
    IUserInfoResult,
} from '../SdkTypes';
import { DefaultSdk } from './DefaultSdk';

/**
 * 抖音小游戏（ByteDance）SDK 实现
 *
 * 基于 `tt` 全局 API，实现 {@link ISdk} 接口。
 * 抖音 API 与微信小游戏高度相似，但有以下差异：
 * 1. 全局对象为 `tt`（而非 `wx`）。
 * 2. 不支持 `createBannerAd`（抖音 banner 没有兜底广告，审核无法通过）。
 * 3. 不支持 `createCustomAd` / `createGridAd`（抖音平台 bug，一般不加自定义广告）。
 * 4. 额外支持抖音侧边栏场景相关 API（{@link checkScene} / {@link navigateToScene}）。
 * 5. 分享使用 `tt.shareAppMessage`。
 *
 * 调用方式：通过 {@link SdkManager} 自动识别平台后获取。
 */
export class DouYinMiniGameSdk extends DefaultSdk implements ISdk {
    constructor() {
        super(sys.Platform.BYTEDANCE_MINI_GAME);
    }

    /** 抖音小游戏全局对象 */
    private get tt(): any {
        return (typeof globalThis !== 'undefined' ? (globalThis as any) : (window as any))['tt'];
    }

    /** 是否在抖音小游戏环境 */
    static isAvailable(): boolean {
        const g: any = typeof globalThis !== 'undefined' ? (globalThis as any) : (window as any);
        return typeof g['tt'] !== 'undefined';
    }

    //#region ========== 内部辅助 ==========

    /**
     * 将 tt 回调式 API 包装成 Promise
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
            // 优先使用新 API（基础库 2.20.1+）
            try {
                const deviceInfo = this.tt.getDeviceInfo();
                const windowInfo = this.tt.getWindowInfo();
                const appBaseInfo = this.tt.getAppBaseInfo();
                return Promise.resolve({
                    brand: deviceInfo.brand,
                    model: deviceInfo.model,
                    platform: 'DouYinMiniGame',
                    system: deviceInfo.system,
                    version: appBaseInfo.version,
                    screenWidth: windowInfo.screenWidth,
                    screenHeight: windowInfo.screenHeight,
                    pixelRatio: windowInfo.pixelRatio,
                    language: 'zh',
                    SDKVersion: appBaseInfo.SDKVersion,
                    raw: { deviceInfo, windowInfo, appBaseInfo },
                });
            }
            catch {
                // 新 API 不存在，回退到旧 API
                const info = this.tt.getSystemInfoSync();
                return Promise.resolve({
                    brand: info.brand,
                    model: info.model,
                    platform: 'DouYinMiniGame',
                    system: info.system,
                    version: info.version,
                    screenWidth: info.screenWidth,
                    screenHeight: info.screenHeight,
                    pixelRatio: info.pixelRatio,
                    language: info.language || 'zh',
                    SDKVersion: info.SDKVersion,
                    raw: info,
                });
            }
        }
        catch (e) {
            return Promise.reject(e);
        }
    }

    getLaunchOptions(): ILaunchOptions {
        const opt = this.tt.getLaunchOptionsSync();
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
        this.tt.onShow(callback);
    }
    offShow(callback?: (res: any) => void): void {
        if (callback) this.tt.offShow(callback);
    }
    onHide(callback: () => void): void {
        this.tt.onHide(callback);
    }
    offHide(callback?: () => void): void {
        if (callback) this.tt.offHide(callback);
    }
    onError(callback: (err: string) => void): void {
        this.tt.onError((error: any) => callback(error?.message ?? String(error)));
    }
    offError(callback?: (err: string) => void): void {
        if (callback) this.tt.offError(callback as any);
    }

    exitMiniProgram(): Promise<void> {
        return this.promisify<void>(this.tt.exitMiniProgram.bind(this.tt)).then(
            () => undefined
        );
    }

    //#endregion

    //#region ========== 登录与用户 ==========

    login(): Promise<ILoginResult> {
        return this.promisify<any>(this.tt.login.bind(this.tt)).then((res) => ({
            token: res.code,
            openid: null,
            unionid: null,
            raw: res,
        }));
    }

    checkSession(): Promise<boolean> {
        return this.promisify<void>(this.tt.checkSession.bind(this.tt))
            .then(() => true)
            .catch(() => false);
    }

    /**
     * 获取用户信息（静默授权，不弹原生框）
     * 抖音对应 tt.getUserInfo，用户进入游戏时已同意授权。
     * option.desc 仅用于统一签名，抖音不会展示给用户。
     */
    getUserProfile(option: { desc: string; lang?: 'en' | 'zh_CN' | 'zh_TW' }): Promise<IUserInfoResult> {
        return this.promisify<any>(this.tt.getUserInfo.bind(this.tt), {
            lang: option.lang ?? 'zh_CN',
            withCredentials: false,
        })
            .then((res) => ({
                userInfo: {
                    nickName: res.userInfo?.nickName || 'Player',
                    avatarUrl: res.userInfo?.avatarUrl || '',
                    gender: res.userInfo?.gender ?? 0,
                    language: res.userInfo?.language,
                    country: res.userInfo?.country,
                    province: res.userInfo?.province,
                    city: res.userInfo?.city,
                    raw: res.userInfo,
                },
                rawData: res.rawData,
                signature: res.signature,
                encryptedData: res.encryptedData,
                iv: res.iv,
            }))
            .catch((err) => {
                console.warn('[DouYinSdk] getUserProfile 失败，返回默认用户信息:', err);
                return { userInfo: { nickName: 'Player', avatarUrl: '', gender: 0 } };
            });
    }

    //#endregion

    //#region ========== 分享 ==========

    shareAppMessage(option?: IShareOption): void {
        this.tt.shareAppMessage({
            title: option?.title,
            desc: (option as any)?.desc,
            imageUrl: option?.imageUrl,
            query: option?.path,
        });
    }

    /**
     * 将 base64 数据写入抖音临时文件目录，返回本地路径。
     * 业务流程由 B_Share_Main 编排：截图 → 本接口存文件 → shareAppMessage(imageUrl=路径)。
     */
    async saveBase64ToFile(option: { data: string; ext?: string }): Promise<string> {
        return new Promise<string>((resolve) => {
            const fs = this.tt.getFileSystemManager?.();
            const envPath = this.tt.env?.USER_DATA_PATH;
            if (!fs || !envPath) {
                console.warn('[DouYinSdk] saveBase64ToFile: 文件系统或 USER_DATA_PATH 不可用');
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
                    console.log('[DouYinSdk] saveBase64ToFile: 临时文件已写入', filePath);
                    resolve(filePath);
                },
                fail: (err: any) => {
                    console.error('[DouYinSdk] saveBase64ToFile: 写入失败', err);
                    resolve('');
                },
            });
        });
    }

    /** 读取本地文件并返回 base64 字符串 */
    async readFileAsBase64(option: { path: string }): Promise<string> {
        const fs = this.tt.getFileSystemManager?.();
        if (!fs?.readFileSync) {
            console.warn('[DouYinSdk] readFileAsBase64: 文件系统不可用');
            return '';
        }
        try {
            return fs.readFileSync(option.path, 'base64') as string;
        }
        catch (e) {
            console.error('[DouYinSdk] readFileAsBase64: 读取文件失败', e);
            return '';
        }
    }

    onShareAppMessage(callback: (option?: IShareOption) => IShareOption | void): void {
        this.tt.onShareAppMessage(() => {
            const result = callback() || {};
            return {
                title: result.title,
                imageUrl: result.imageUrl,
                query: result.path,
            } as any;
        });
    }

    showShareMenu(_option?: { withShareTicket?: boolean; menus?: string[] }): void {
        // 抖音默认展示分享菜单，无对应 API
    }

    hideShareMenu(_option?: { menus?: string[] }): void {
        this.notSupported('hideShareMenu');
    }

    canShareToTimeline(): boolean {
        return false;
    }

    shareToTimeline(_option?: IShareToTimelineOption): void {
        this.notSupported('shareToTimeline');
    }

    //#endregion

    //#region ========== 广告 ==========

    /**
     * 抖音 banner 广告没有兜底广告，审核无法通过，一般不加。
     * 如确需使用，可在此实现 `tt.createBannerAd`。
     */
    createBannerAd(_option: IBannerAdOption): IBannerAd | null {
        try {
            const fn = this.tt.createBannerAd;
            if (typeof fn !== 'function') {
                this.notSupported('createBannerAd');
                return null;
            }
            const ad = fn({
                adUnitId: _option.adUnitId,
                style: {
                    left: _option.left ?? 0,
                    top: _option.top ?? 0,
                    width: _option.width ?? 300,
                },
            });
            return this.wrapBannerAd(ad);
        }
        catch (e) {
            console.error('[DouYinSdk] createBannerAd 失败', e);
            return null;
        }
    }

    private wrapBannerAd(ad: any): IBannerAd {
        return {
            style: {
                get top() {
                    return ad.style.top;
                },
                set top(v: number) {
                    ad.style.top = v;
                },
                get left() {
                    return ad.style.left;
                },
                set left(v: number) {
                    ad.style.left = v;
                },
                get width() {
                    return ad.style.width;
                },
                set width(v: number) {
                    ad.style.width = v;
                },
                get height() {
                    return ad.style.height;
                },
            },
            show: () => ad.show(),
            hide: () => ad.hide(),
            destroy: () => ad.destroy(),
            onError: (cb) => ad.onError((err: any) => cb(this.mapAdError(err))),
            offError: (cb?) => {
                if (cb) ad.offError(cb);
            },
            onLoad: (cb) => ad.onLoad?.(cb),
            offLoad: (cb?) => {
                if (cb) ad.offLoad?.(cb);
            },
            onResize: (cb) => ad.onResize?.(cb),
            offResize: (cb?) => {
                if (cb) ad.offResize?.(cb);
            },
        };
    }

    createRewardedVideoAd(option: IRewardedVideoAdOption): IRewardedVideoAd | null {
        try {
            const ad = this.tt.createRewardedVideoAd({ adUnitId: option.adUnitId });
            if (option.muted !== undefined && ad.setMuted) {
                ad.setMuted(option.muted);
            }
            return {
                load: () => ad.load(),
                show: () => ad.show(),
                onClose: (cb) =>
                    ad.onClose((res: any) => cb({ isEnded: !!(res && res.isEnded) })),
                offClose: (cb?) => {
                    if (cb) ad.offClose(cb);
                },
                onError: (cb) => ad.onError((err: any) => cb(this.mapAdError(err))),
                offError: (cb?) => {
                    if (cb) ad.offError(cb);
                },
                onLoad: (cb) => ad.onLoad?.(cb),
                offLoad: (cb?) => {
                    if (cb) ad.offLoad?.(cb);
                },
            };
        }
        catch (e) {
            console.error('[DouYinSdk] createRewardedVideoAd 失败', e);
            return null;
        }
    }

    createInterstitialAd(option: IInterstitialAdOption): IInterstitialAd | null {
        try {
            const ad = this.tt.createInterstitialAd({ adUnitId: option.adUnitId });
            return {
                load: () => ad.load(),
                show: () => ad.show(),
                destroy: () => ad.destroy(),
                onError: (cb) => ad.onError((err: any) => cb(this.mapAdError(err))),
                offError: (cb?) => {
                    if (cb) ad.offError(cb);
                },
                onLoad: (cb) => ad.onLoad?.(cb),
                offLoad: (cb?) => {
                    if (cb) ad.offLoad?.(cb);
                },
                onClose: (cb) => ad.onClose?.(cb),
                offClose: (cb?) => {
                    if (cb) ad.offClose?.(cb);
                },
            };
        }
        catch (e) {
            console.error('[DouYinSdk] createInterstitialAd 失败', e);
            return null;
        }
    }

    /**
     * 抖音无格子广告 API，返回 null。
     */
    createGridAd(_option: IGridAdOption): IGridAd | null {
        this.notSupported('createGridAd');
        return null;
    }

    /**
     * 抖音无自定义原生广告 API，返回 null。
     */
    createCustomAd(_option: ICustomAdOption): ICustomAd | null {
        this.notSupported('createCustomAd');
        return null;
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
        return this.promisify<void>(this.tt.vibrateShort.bind(this.tt), {
            type: type ?? 'medium',
        }).then(() => undefined);
    }

    vibrateLong(): Promise<void> {
        return this.promisify<void>(this.tt.vibrateLong.bind(this.tt)).then(() => undefined);
    }

    setClipboardData(data: string): Promise<void> {
        return this.promisify<void>(this.tt.setClipboardData.bind(this.tt), { data }).then(
            () => undefined
        );
    }

    getClipboardData(): Promise<string> {
        return this.promisify<{ data: string }>(this.tt.getClipboardData.bind(this.tt)).then(
            (res) => res.data
        );
    }

    getNetworkType(): Promise<INetworkTypeResult> {
        return this.promisify<{ networkType: string; isConnected?: boolean }>(
            this.tt.getNetworkType.bind(this.tt)
        ).then((res) => ({
            networkType: res.networkType as SdkNetworkType,
            isConnected: res.isConnected,
        }));
    }

    onNetworkStatusChange(callback: (res: INetworkStatusChangeEvent) => void): void {
        this.tt.onNetworkStatusChange((res: any) =>
            callback({
                networkType: res.networkType as SdkNetworkType,
                isConnected: res.isConnected,
            })
        );
    }

    offNetworkStatusChange(callback?: (res: INetworkStatusChangeEvent) => void): void {
        if (callback) this.tt.offNetworkStatusChange(callback as any);
    }

    setKeepScreenOn(keepScreenOn: boolean): Promise<void> {
        return this.promisify<void>(this.tt.setKeepScreenOn.bind(this.tt), {
            keepScreenOn,
        }).then(() => undefined);
    }

    //#endregion

    //#region ========== 开放数据域托管数据 ==========

    setUserCloudStorage(kvDataList: IKVData[]): Promise<void> {
        return this.promisify<void>(this.tt.setUserCloudStorage.bind(this.tt), {
            KVDataList: kvDataList,
        }).then(() => undefined);
    }

    removeUserCloudStorage(keys: string[]): Promise<void> {
        return this.promisify<void>(this.tt.removeUserCloudStorage.bind(this.tt), {
            keyList: keys,
        }).then(() => undefined);
    }

    getUserCloudStorage(keys: string[]): Promise<IUserCloudStorageResult> {
        return this.promisify<{ KVDataList: IKVData[] }>(
            this.tt.getUserCloudStorage.bind(this.tt),
            { keyList: keys }
        ).then((res) => ({ kvDataList: res.KVDataList || [], raw: res }));
    }

    //#endregion

    //#region ========== 客服与反馈 ==========

    openCustomerServiceConversation(
        option: ICustomerServiceConversationOption
    ): Promise<void> {
        const fn = this.tt.openCustomerServiceConversation;
        if (typeof fn !== 'function') {
            return this.reject('openCustomerServiceConversation');
        }
        return this.promisify<void>(fn.bind(this.tt), {
            extInfo: option.extInfo,
            source: option.source,
            enterFrom: option.enterFrom,
        }).then(() => undefined);
    }

    openCustomerServiceChat(option: ICustomerServiceOption): Promise<void> {
        const fn = this.tt.openCustomerServiceChat;
        if (typeof fn !== 'function') {
            return this.reject('openCustomerServiceChat');
        }
        return this.promisify<void>(fn.bind(this.tt), {
            extInfo: option.extInfo,
            source: option.source,
        }).then(() => undefined);
    }

    //#endregion

    //#region ========== 隐私合规 ==========

    getPrivacySetting(): Promise<IPrivacySetting> {
        return new Promise((resolve) => {
            try {
                this.tt.getPrivacySetting({
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
        const fn = this.tt.requirePrivacyAuthorize;
        if (typeof fn !== 'function') return Promise.resolve();
        return this.promisify<void>(fn.bind(this.tt), option ?? {}).then(() => undefined);
    }

    /**
     * 抖音暂不开放自定义隐私弹窗（保留接口签名以便后续扩展）
     * 占位实现：直接 resolve，不抛错。
     */
    setCustomPrivacyDialog(_dialog: any): void {
        // TODO: 抖音侧接入自定义隐私弹窗时再实现
    }

    //#endregion

    //#region ========== 更新、子包、录屏 ==========

    getUpdateManager(): IUpdateManager | null {
        const fn = this.tt.getUpdateManager;
        if (typeof fn !== 'function') {
            this.notSupported('getUpdateManager');
            return null;
        }
        try {
            const m = fn();
            return {
                onCheckForUpdate: (cb) => m.onCheckForUpdate?.(cb as any),
                onUpdateReady: (cb) => m.onUpdateReady?.(cb),
                onUpdateFailed: (cb) => m.onUpdateFailed?.(cb),
                applyUpdate: () => m.applyUpdate?.(),
            };
        }
        catch (e) {
            console.error('[DouYinSdk] getUpdateManager 失败', e);
            return null;
        }
    }

    loadSubpackage(name: string): Promise<void> {
        return new Promise((resolve, reject) => {
            this.tt.loadSubpackage({
                name,
                success: () => resolve(),
                fail: (err: any) => reject(err),
                complete: () => { },
            });
        });
    }

    getGameRecorderManager(): IGameRecorderManager | null {
        const fn = this.tt.getGameRecorderManager;
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
                onStart: (cb) => m.onStart?.(cb),
                onStop: (cb) => m.onStop?.(cb),
                onError: (cb) => m.onError?.((err: any) => cb(this.mapAdError(err))),
            };
        }
        catch (e) {
            console.error('[DouYinSdk] getGameRecorderManager 失败', e);
            return null;
        }
    }

    //#endregion

    //#region ========== 抖音侧边栏场景 ==========

    /**
     * 检测是否支持指定场景（如抖音侧边栏）。
     *
     * 对应 `tt.checkScene`，判断用户是否支持侧边栏进入功能，
     * 旧版抖音没有侧边栏时可通过此接口隐藏"入口有礼"按钮。
     */
    checkScene(option: ISceneOption): Promise<ISceneResult> {
        const fn = this.tt.checkScene;
        if (typeof fn !== 'function') {
            return this.reject<ISceneResult>('checkScene');
        }
        return new Promise<ISceneResult>((resolve) => {
            fn({
                scene: option.scene,
                success: (res: any) => resolve({ success: true, raw: res }),
                fail: (res: any) => resolve({ success: false, raw: res }),
            });
        });
    }

    /**
     * 跳转到指定场景（如抖音侧边栏）。
     *
     * 对应 `tt.navigateToScene`，用于引导用户去侧边栏。
     */
    navigateToScene(option: ISceneOption): Promise<ISceneResult> {
        const fn = this.tt.navigateToScene;
        if (typeof fn !== 'function') {
            return this.reject<ISceneResult>('navigateToScene');
        }
        return new Promise<ISceneResult>((resolve) => {
            fn({
                scene: option.scene,
                success: (res: any) => resolve({ success: true, raw: res }),
                fail: (res: any) => resolve({ success: false, raw: res }),
            });
        });
    }

    //#endregion

    //#region ========== 能力检测 ==========

    canIUse(apiName: string): boolean {
        try {
            return this.tt.canIUse(apiName);
        }
        catch {
            return false;
        }
    }

    isReady(): boolean {
        return DouYinMiniGameSdk.isAvailable();
    }
    //#endregion
}
