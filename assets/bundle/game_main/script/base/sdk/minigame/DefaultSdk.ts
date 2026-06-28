import { ISdk } from '../ISdk';
import { SdkVibrateType } from '../SdkEnum';
import type {
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
    ISceneOption,
    ISceneResult,
    IShareOption,
    IShareToTimelineOption,
    ISystemInfo,
    IUpdateManager,
    IUserCloudStorageResult,
    IUserInfoResult,
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
    protected _platform: string = 'Unknown';
    protected _ready: boolean = true;

    constructor(platform: string = 'Unknown') {
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
            brand: 'devtools',
            model: 'Simulator',
            platform: this._platform,
            system: 'iOS 16.0',
            version: '8.0.0',
            screenWidth: 750,
            screenHeight: 1334,
            pixelRatio: 2,
            language: 'zh_CN',
            SDKVersion: '2.30.0',
        });
    }

    getLaunchOptions(): ILaunchOptions {
        return { scene: 1001, query: { debug: '1' } };
    }

    onShow(_callback: (res: any) => void): void {}
    offShow(_callback?: (res: any) => void): void {}
    onHide(_callback: () => void): void {}
    offHide(_callback?: () => void): void {}
    onError(_callback: (err: string) => void): void {}
    offError(_callback?: (err: string) => void): void {}

    exitMiniProgram(): Promise<void> {
        console.log('[SDK] 开发模式: exitMiniProgram');
        return Promise.resolve();
    }

    //#endregion

    //#region ========== 登录与用户 ==========

    login(): Promise<ILoginResult> {
        // 默认平台用于测试环境（H5/编辑器），返回测试登录凭证
        return Promise.resolve({ token: 'test_login_code', openid: 'test_openid', unionid: null });
    }

    checkSession(): Promise<boolean> {
        return Promise.resolve(false);
    }

    /**
     * 开发模式：返回模拟用户信息（不弹原生框）
     * 微信小游戏会覆写为 wx.getUserProfile
     */
    getUserProfile(_option: { desc: string; lang?: 'en' | 'zh_CN' | 'zh_TW' }): Promise<IUserInfoResult> {
        console.log(`[SDK] 开发模式: getUserProfile(${_option.desc})`);
        return Promise.resolve({
            userInfo: {
                nickName: '测试用户',
                avatarUrl: '',
                gender: 0,
                language: 'zh_CN',
                country: '中国',
            },
            rawData: 'mock',
            signature: '',
        });
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
        console.warn('[SDK] 开发模式: shareToTimeline 模拟成功');
    }
    showShareMenu(_option?: { withShareTicket?: boolean; menus?: string[] }): void {
        console.log('[SDK] 开发模式: showShareMenu');
    }
    hideShareMenu(_option?: { menus?: string[] }): void {
        console.log('[SDK] 开发模式: hideShareMenu');
    }
    canShareToTimeline(): boolean {
        return false;
    }

    //#endregion

    //#region ========== 广告 ==========

    createRewardedVideoAd(_option: IRewardedVideoAdOption): IRewardedVideoAd | null {
        this.notSupported('createRewardedVideoAd');
        return null;
    }
    createInterstitialAd(_option: IInterstitialAdOption): IInterstitialAd | null {
        this.notSupported('createInterstitialAd');
        return null;
    }
    createCustomAd(_option: ICustomAdOption): ICustomAd | null {
        this.notSupported('createCustomAd');
        return null;
    }

    //#endregion


    //#region ========== 设备能力 ==========

    vibrateShort(_type?: SdkVibrateType): Promise<void> {
        return Promise.resolve();
    }
    vibrateLong(): Promise<void> {
        return Promise.resolve();
    }
    setClipboardData(data: string): Promise<void> {
        console.log(`[SDK] 开发模式: setClipboardData(${data})`);
        return Promise.resolve();
    }
    getClipboardData(): Promise<string> {
        return Promise.resolve('test_clipboard_data');
    }
    getNetworkType(): Promise<INetworkTypeResult> {
        return Promise.resolve({ networkType: 'wifi' as any, isConnected: true });
    }
    onNetworkStatusChange(_callback: (res: INetworkStatusChangeEvent) => void): void {}
    offNetworkStatusChange(_callback?: (res: INetworkStatusChangeEvent) => void): void {}
    setKeepScreenOn(_keepScreenOn: boolean): Promise<void> {
        return Promise.resolve();
    }

    //#endregion

    //#region ========== 开放数据域托管数据 ==========

    setUserCloudStorage(kvDataList: IKVData[]): Promise<void> {
        console.log('[SDK] 开发模式: setUserCloudStorage', kvDataList);
        return Promise.resolve();
    }
    removeUserCloudStorage(keys: string[]): Promise<void> {
        console.log('[SDK] 开发模式: removeUserCloudStorage', keys);
        return Promise.resolve();
    }
    getUserCloudStorage(keys: string[]): Promise<IUserCloudStorageResult> {
        return Promise.resolve({
            kvDataList: keys.map((k) => ({ key: k, value: JSON.stringify({ score: 100, level: 1 }) })),
            raw: {},
        });
    }

    //#endregion

    //#region ========== 客服与反馈 ==========

    openCustomerServiceConversation(_option: ICustomerServiceConversationOption): Promise<void> {
        console.log('[SDK] 开发模式: openCustomerServiceConversation');
        return Promise.resolve();
    }
    openCustomerServiceChat(_option: ICustomerServiceOption): Promise<void> {
        console.log('[SDK] 开发模式: openCustomerServiceChat');
        return Promise.resolve();
    }

    //#endregion

    //#region ========== 隐私合规 ==========

    getPrivacySetting(): Promise<IPrivacySetting> {
        return Promise.resolve({ needAuthorization: false });
    }

    protected _customPrivacyDialog: ICustomPrivacyDialog | null = null;

    /**
     * 开发/编辑器/浏览器平台：
     * - 已注入自定义弹窗 → 通过 dialog.onTrigger 弹出（与真机行为一致）
     * - 未注入 → 直接 resolve（向后兼容）
     */
    requirePrivacyAuthorize(_option?: { demandList?: string[]; [k: string]: any }): Promise<void> {
        if (this._customPrivacyDialog) {
            console.log('[SDK][开发模式] requirePrivacyAuthorize → 弹出自定义隐私弹窗');
            return new Promise<void>((resolve, reject) => {
                const dialog = this._customPrivacyDialog!;
                dialog.onTrigger(
                    (result) => {
                        if (result.event === 'agree') {
                            console.log('[SDK][开发模式] 用户同意隐私协议');
                            resolve();
                        }
                        else if (result.event === 'disagree') {
                            console.log('[SDK][开发模式] 用户拒绝隐私协议');
                            reject(new Error('用户拒绝隐私协议'));
                        }
                        // 'exposureAuthorization' 仅通知曝光，不做处理
                    },
                    { contractName: '' },
                );
            });
        }
        console.log('[SDK][开发模式] requirePrivacyAuthorize → 直接通过');
        return Promise.resolve();
    }

    /**
     * 开发模式：保存自定义弹窗引用，供 requirePrivacyAuthorize 触发。
     */
    setCustomPrivacyDialog(dialog: ICustomPrivacyDialog): void {
        this._customPrivacyDialog = dialog;
        console.log('[SDK][开发模式] setCustomPrivacyDialog → 已保存自定义弹窗');
    }

    /** 开发模式：模拟打开隐私协议 */
    openPrivacyContract(): Promise<void> {
        console.log('[SDK][开发模式] openPrivacyContract');
        return Promise.resolve();
    }

    resetPrivacyAuthorization(): void {}

    //#endregion

    //#region ========== 更新、子包、录屏 ==========

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

    //#endregion

    //#region ========== 抖音侧边栏场景 ==========

    checkScene(option: ISceneOption): Promise<ISceneResult> {
        console.log('[SDK] 开发模式: checkScene', option);
        return Promise.resolve({ success: true, raw: {} });
    }

    navigateToScene(option: ISceneOption): Promise<ISceneResult> {
        console.log('[SDK] 开发模式: navigateToScene', option);
        return Promise.resolve({ success: true, raw: {} });
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
