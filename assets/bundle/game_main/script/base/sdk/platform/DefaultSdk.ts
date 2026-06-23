import { SdkPlatform, SdkVibrateType } from '../SdkEnum';
import { ISdk } from '../ISdk';
import type {
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
    IBannerAd,
    IBannerAdOption,
} from '../SdkTypes';

/**
 * 默认 SDK 实现（空实现）
 *
 * 用于非小游戏平台（H5/编辑器/PC 预览）兜底。
 * 所有异步方法返回 reject（提示该能力在当前平台不支持），
 * 同步方法返回空值，事件监听为空操作。
 *
 * 接入新平台时不需要修改本类，只需新增一个实现 {@link ISdk} 的类即可。
 */
export class DefaultSdk implements ISdk {
    protected _platform: SdkPlatform = SdkPlatform.Unknown;
    protected _ready: boolean = true;

    constructor(platform: SdkPlatform = SdkPlatform.Unknown) {
        this._platform = platform;
    }

    /** 输出不支持日志 */
    protected notSupported(api: string): void {
        console.warn(`[SDK] 当前平台(${this._platform})不支持接口: ${api}`);
    }

    /** 生成 reject promise */
    protected reject<T = void>(api: string): Promise<T> {
        this.notSupported(api);
        return Promise.reject(new Error(`[SDK] 当前平台(${this._platform})不支持接口: ${api}`));
    }

    //#region ========== 平台与生命周期 ==========

    getSystemInfo(): Promise<ISystemInfo> {
        return Promise.resolve({
            brand: 'unknown',
            model: 'unknown',
            platform: this._platform,
            system: 'unknown',
            version: 'unknown',
            screenWidth: 0,
            screenHeight: 0,
            pixelRatio: 1,
            language: 'zh_CN',
        });
    }

    getLaunchOptions(): ILaunchOptions {
        return { scene: 0, query: {} };
    }

    onShow(_callback: (res: any) => void): void {}
    offShow(_callback?: (res: any) => void): void {}
    onHide(_callback: () => void): void {}
    offHide(_callback?: () => void): void {}
    onError(_callback: (err: string) => void): void {}
    offError(_callback?: (err: string) => void): void {}

    exitMiniProgram(): Promise<void> {
        return this.reject('exitMiniProgram');
    }

    //#endregion

    //#region ========== 登录与用户 ==========

    login(): Promise<ILoginResult> {
        // 默认平台用于测试环境（H5/编辑器），返回测试登录凭证
        return Promise.resolve({ code: 'test_login_code' });
    }

    checkSession(): Promise<boolean> {
        return Promise.resolve(false);
    }

    getUserInfo(): Promise<IUserInfoResult> {
        return this.reject<IUserInfoResult>('getUserInfo');
    }

    createUserInfoButton(_option: any): IUserInfoButton | null {
        this.notSupported('createUserInfoButton');
        return null;
    }

    //#endregion

    //#region ========== 分享 ==========

    /**
     * 默认平台（H5 / 编辑器 / 未知）下不响应分享接口，只输出一次性警告。
     *
     * 注：上一版直接 `notSupported` 会打 ERROR 级别日志（高频调用时刷屏）；
     * 当前实际场景中分享按钮只在微信/抖音小游戏里点，H5 等平台调用属于正常兜底，
     * 改为 warn 级别即可。
     */
    shareAppMessage(_option?: IShareOption): void {
        console.warn(`[SDK] 当前平台(${this._platform})不支持 shareAppMessage，仅在微信/抖音小游戏有效`);
    }
    onShareAppMessage(_callback: (option?: IShareOption) => IShareOption | void): void {
        console.warn(`[SDK] 当前平台(${this._platform})不支持 onShareAppMessage`);
    }
    shareToTimeline(_option?: IShareToTimelineOption): void {
        this.notSupported('shareToTimeline');
    }
    showShareMenu(_option?: { withShareTicket?: boolean; menus?: string[] }): void {
        this.notSupported('showShareMenu');
    }
    hideShareMenu(_option?: { menus?: string[] }): void {
        this.notSupported('hideShareMenu');
    }
    canShareToTimeline(): boolean {
        return false;
    }

    //#endregion

    //#region ========== 广告 ==========

    createBannerAd(_option: IBannerAdOption): IBannerAd | null {
        this.notSupported('createBannerAd');
        return null;
    }
    createRewardedVideoAd(_option: IRewardedVideoAdOption): IRewardedVideoAd | null {
        this.notSupported('createRewardedVideoAd');
        return null;
    }
    createInterstitialAd(_option: IInterstitialAdOption): IInterstitialAd | null {
        this.notSupported('createInterstitialAd');
        return null;
    }
    createGridAd(_option: IGridAdOption): IGridAd | null {
        this.notSupported('createGridAd');
        return null;
    }
    createCustomAd(_option: ICustomAdOption): ICustomAd | null {
        this.notSupported('createCustomAd');
        return null;
    }

    //#endregion

    //#region ========== 虚拟支付 ==========

    pay(_option: IPayOption): Promise<IPayResult> {
        return this.reject<IPayResult>('pay');
    }

    //#endregion


    //#region ========== 设备能力 ==========

    vibrateShort(_type?: SdkVibrateType): Promise<void> {
        return Promise.resolve();
    }
    vibrateLong(): Promise<void> {
        return Promise.resolve();
    }
    setClipboardData(_data: string): Promise<void> {
        return this.reject('setClipboardData');
    }
    getClipboardData(): Promise<string> {
        return this.reject<string>('getClipboardData');
    }
    getNetworkType(): Promise<INetworkTypeResult> {
        return Promise.resolve({ networkType: 'unknown' as any, isConnected: true });
    }
    onNetworkStatusChange(_callback: (res: INetworkStatusChangeEvent) => void): void {}
    offNetworkStatusChange(_callback?: (res: INetworkStatusChangeEvent) => void): void {}
    getScreenBrightness(): Promise<number> {
        return Promise.resolve(1);
    }
    setScreenBrightness(_value: number): Promise<void> {
        return Promise.resolve();
    }
    setKeepScreenOn(_keepScreenOn: boolean): Promise<void> {
        return Promise.resolve();
    }

    //#endregion

    //#region ========== 开放数据域托管数据 ==========

    setUserCloudStorage(_kvDataList: IKVData[]): Promise<void> {
        return this.reject('setUserCloudStorage');
    }
    removeUserCloudStorage(_keys: string[]): Promise<void> {
        return this.reject('removeUserCloudStorage');
    }
    getUserCloudStorage(_keys: string[]): Promise<IUserCloudStorageResult> {
        return this.reject<IUserCloudStorageResult>('getUserCloudStorage');
    }

    //#endregion

    //#region ========== 客服与反馈 ==========

    openCustomerServiceConversation(_option: ICustomerServiceConversationOption): Promise<void> {
        return this.reject('openCustomerServiceConversation');
    }
    openCustomerServiceChat(_option: ICustomerServiceOption): Promise<void> {
        return this.reject('openCustomerServiceChat');
    }

    //#endregion

    //#region ========== 订阅消息 ==========

    requestSubscribeMessage(_tmplIds: string[]): Promise<ISubscribeMessageResult> {
        return this.reject<ISubscribeMessageResult>('requestSubscribeMessage');
    }

    //#endregion

    //#region ========== 隐私合规 ==========

    getPrivacySetting(): Promise<IPrivacySetting> {
        return Promise.resolve({ needAuthorization: false });
    }
    requirePrivacyAuthorize(_option?: { demandList?: string[]; [k: string]: any }): Promise<void> {
        return Promise.resolve();
    }
    onNeedPrivacyAuthorization(_callback: (res: { contractName: string; [k: string]: any }) => void): void {}

    requestPrivacyAuthorize(_option?: { demandList?: string[]; [k: string]: any }): Promise<void> {
        return Promise.resolve();
    }

    resetPrivacyAuthorization(): void {}

    //#endregion

    //#region ========== 视频号 ==========

    openChannelsUserProfile(_option: IChannelsOption): Promise<void> {
        return this.reject('openChannelsUserProfile');
    }
    openChannelsLive(_option: IChannelsOption): Promise<void> {
        return this.reject('openChannelsLive');
    }
    openChannelsVideo(_option: IChannelsOption): Promise<void> {
        return this.reject('openChannelsVideo');
    }

    //#endregion

    //#region ========== 更新、子包、录屏、日志 ==========

    getUpdateManager(): IUpdateManager | null {
        this.notSupported('getUpdateManager');
        return null;
    }
    loadSubpackage(_name: string): Promise<void> {
        return Promise.resolve();
    }
    getGameRecorderManager(): IGameRecorderManager | null {
        this.notSupported('getGameRecorderManager');
        return null;
    }
    getRealtimeLogManager(): IRealtimeLogManager | null {
        return {
            info: (..._args: any[]) => console.log('[RealtimeLog]', ..._args),
            warn: (..._args: any[]) => console.warn('[RealtimeLog]', ..._args),
            error: (..._args: any[]) => console.error('[RealtimeLog]', ..._args),
            debug: (..._args: any[]) => console.debug('[RealtimeLog]', ..._args),
            setFilterMsg: (_msg: string) => {},
            addFilterMsg: (_msg: string) => {},
        };
    }

    //#endregion

    //#region ========== 抖音侧边栏场景 ==========

    checkScene(_option: ISceneOption): Promise<ISceneResult> {
        return this.reject<ISceneResult>('checkScene');
    }

    navigateToScene(_option: ISceneOption): Promise<ISceneResult> {
        return this.reject<ISceneResult>('navigateToScene');
    }

    //#endregion

    //#region ========== 能力检测 ==========

    canIUse(_apiName: string): boolean {
        return false;
    }

    isReady(): boolean {
        return this._ready;
    }
    //#endregion
}
