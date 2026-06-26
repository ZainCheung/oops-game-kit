import { SdkVibrateType } from './SdkEnum';
import type {
    ICustomAd,
    ICustomAdOption,
    ICustomPrivacyDialog,
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
    ISceneOption,
    ISceneResult,
    IShareOption,
    IShareToTimelineOption,
    ISystemInfo,
    IUpdateManager,
    IUserCloudStorageResult,
    IUserInfoResult,
    IBannerAd,
    IBannerAdOption,
} from './SdkTypes';

/**
 * 平台无关 SDK 接口
 *
 * 设计原则：
 * 1. 所有异步方法返回 Promise，回调型 API（onXxx）保留以便监听生命周期事件。
 * 2. 数据结构使用 {@link SdkData} 中定义的平台无关类型，
 *    各平台实现负责把原生返回值映射为这些统一类型。
 * 3. 每接入一个新平台，继承此接口实现一个具体类，
 *    并在 {@link SdkManager} 中注册。
 *
 * 默认实现见 {@link DefaultSdk}，所有方法返回 reject 或空操作，
 * 平台未支持时由 SdkManager 自动回退到 DefaultSdk。
 *
 * 微信小游戏实现见 {@link WeChatMiniGameSdk}。
 */
export interface ISdk {
    //#region ========== 平台与生命周期 ==========

    /** 获取系统信息 */
    getSystemInfo(): Promise<ISystemInfo>;

    /** 获取启动参数 */
    getLaunchOptions(): ILaunchOptions;

    /** 监听切到前台（onShow） */
    onShow(callback: (res: any) => void): void;
    offShow(callback?: (res: any) => void): void;

    /** 监听切到后台（onHide） */
    onHide(callback: () => void): void;
    offHide(callback?: () => void): void;

    /** 监听错误（onError） */
    onError(callback: (err: string) => void): void;
    offError(callback?: (err: string) => void): void;

    /** 退出小游戏（仅小游戏平台有效） */
    exitMiniProgram(): Promise<void>;

    //#endregion

    //#region ========== 登录与用户 ==========

    /** 登录，返回 code 用于换取 openid/session_key */
    login(): Promise<ILoginResult>;

    /** 校验登录态是否过期 */
    checkSession(): Promise<boolean>;

    /**
     * 获取用户信息（统一入口，各平台实现差异由 SDK 内部处理）
     * - 微信：弹 1 次原生框拿真昵称头像（wx.getUserProfile）
     * - 抖音：静默授权（tt.getUserInfo）
     * - H5/编辑器：返回模拟数据
     * @param option.desc 用途说明（展示给用户，仅微信会显示）
     */
    getUserProfile(option: { desc: string; lang?: 'en' | 'zh_CN' | 'zh_TW' }): Promise<IUserInfoResult>;

    //#endregion

    //#region ========== 分享 ==========

    /** 主动拉起转发（分享给好友） */
    shareAppMessage(option?: IShareOption): void;

    /**
     * 使用截图分享（自动处理截图保存和分享）
     * @param option 包含 title、query、screenshotData（base64）
     */
    shareWithScreenshot(option: {
        title?: string;
        query?: string;
        withShareTicket?: boolean;
        screenshotData: string;
    }): Promise<void>;

    /** 被动监听用户点击右上角转发 */
    onShareAppMessage(callback: (option?: IShareOption) => IShareOption | void): void;

    /** 分享到朋友圈（仅微信支持） */
    shareToTimeline(option?: IShareToTimelineOption): void;

    /** 显示右上角转发菜单 */
    showShareMenu(option?: { withShareTicket?: boolean; menus?: string[] }): void;

    /** 隐藏右上角转发菜单 */
    hideShareMenu(option?: { menus?: string[] }): void;

    /** 验证是否支持转发到朋友圈 */
    canShareToTimeline(): boolean;

    //#endregion

    //#region ========== 广告 ==========

    /** 创建 Banner 广告 */
    createBannerAd(option: IBannerAdOption): IBannerAd | null;

    /** 创建激励视频广告 */
    createRewardedVideoAd(option: IRewardedVideoAdOption): IRewardedVideoAd | null;

    /** 创建插屏广告 */
    createInterstitialAd(option: IInterstitialAdOption): IInterstitialAd | null;

    /** 创建格子广告 */
    createGridAd(option: IGridAdOption): IGridAd | null;

    /** 创建原生/自定义广告 */
    createCustomAd(option: ICustomAdOption): ICustomAd | null;

    //#endregion

    //#region ========== 虚拟支付 ==========

    /**
     * 拉起虚拟支付（微信 midas）。
     * mode='game' 时 quantity 必填，mode='item' 时 itemId 必填。
     */
    pay(option: IPayOption): Promise<IPayResult>;

    //#endregion


    //#region ========== 设备能力 ==========

    /** 短振动 */
    vibrateShort(type?: SdkVibrateType): Promise<void>;

    /** 长振动 */
    vibrateLong(): Promise<void>;

    /** 设置剪贴板 */
    setClipboardData(data: string): Promise<void>;

    /** 获取剪贴板 */
    getClipboardData(): Promise<string>;

    /** 获取网络类型 */
    getNetworkType(): Promise<INetworkTypeResult>;

    /** 监听网络状态变化 */
    onNetworkStatusChange(callback: (res: INetworkStatusChangeEvent) => void): void;
    offNetworkStatusChange(callback?: (res: INetworkStatusChangeEvent) => void): void;

    /** 是否保持屏幕常亮 */
    setKeepScreenOn(keepScreenOn: boolean): Promise<void>;

    //#endregion

    //#region ========== 开放数据域托管数据 ==========

    /** 上报用户托管数据 */
    setUserCloudStorage(kvDataList: IKVData[]): Promise<void>;

    /** 删除用户托管数据 */
    removeUserCloudStorage(keys: string[]): Promise<void>;

    /** 获取当前用户托管数据 */
    getUserCloudStorage(keys: string[]): Promise<IUserCloudStorageResult>;

    //#endregion

    //#region ========== 客服与反馈 ==========

    /** 打开客服会话（带消息入口） */
    openCustomerServiceConversation(option: ICustomerServiceConversationOption): Promise<void>;

    /** 打开客服聊天页面（小游戏客服会话入口） */
    openCustomerServiceChat(option: ICustomerServiceOption): Promise<void>;

    //#endregion

    //#region ========== 隐私合规 ==========

    /**
     * 获取隐私设置。
     * - needAuthorization=true：用户尚未同意隐私协议，需要拉起弹窗
     * - needAuthorization=false：用户已同意或游戏无需隐私协议
     */
    getPrivacySetting(): Promise<IPrivacySetting>;

    /**
     * 主动请求隐私授权。
     * - 已同意且协议未变 → 直接进 success
     * - 未同意 → 触发 {@link setCustomPrivacyDialog} 注入的弹窗
     * - 还没注入自定义弹窗 → SDK 内部 fallback 到平台原生 wx.showModal（走原生弹窗链路）
     *
     * 调用顺序建议：业务层在第一次需要用户信息前（如 RequestSdkUserInfo.execute）调一次
     * {@link setCustomPrivacyDialog} 注入自定义弹窗；之后才能命中自定义链路。
     */
    requirePrivacyAuthorize(option?: { demandList?: string[]; [k: string]: any }): Promise<void>;

    /**
     * 注册自定义隐私弹窗（**唯一**给游戏层注入自定义弹窗的通道）。
     *
     * SDK 在触发隐私弹窗时会调用 dialog.onTrigger(resolve, eventInfo)：
     * - dialog.onTrigger 必须弹起自定义 UI（如 VC_Account_Login prefab）
     * - 玩家点了"同意"按钮 → 在点击回调里调 resolve({ event: 'agree' })
     * - 玩家点了"拒绝"按钮 → 在点击回调里调 resolve({ event: 'disagree' })
     * - 玩家点了《隐私保护指引》链接 → 调 dialog.onOpenContract()，SDK 内部调 wx.openPrivacyContract
     * - resolve 必须在用户点击事件中调用（不能异步直接调）
     *
     * 设计原则：
     * - 平台 SDK 只负责平台 API 调用 + 协议解析
     * - 自定义 UI 完全由游戏层提供，SDK 不内置任何弹窗
     * - 重复注册会覆盖前一次（最后注册生效）
     * - 不在 Main.ts 等无关脚本里调，**只在真正需要用户信息的业务脚本里调**（如 RequestSdkUserInfo）
     */
    setCustomPrivacyDialog(dialog: ICustomPrivacyDialog): void;

    /**
     * 打开隐私协议详情页（仅微信支持）。
     * 自定义弹窗里的《隐私保护指引》链接点击后调用此接口。
     */
    openPrivacyContract(): Promise<void>;

    /** 重置隐私授权状态（用于测试 / 切换账号） */
    resetPrivacyAuthorization(): void;

    //#endregion

    //#region ========== 更新、子包、录屏 ==========

    /** 获取更新管理器（仅微信小游戏） */
    getUpdateManager(): IUpdateManager | null;

    /** 加载子包 */
    loadSubpackage(name: string): Promise<void>;

    /** 获取录屏管理器（仅部分小游戏平台） */
    getGameRecorderManager(): IGameRecorderManager | null;

    //#endregion

    //#region ========== 抖音侧边栏场景（仅抖音小游戏支持）==========

    /**
     * 检测是否支持指定场景（如抖音侧边栏）。
     * 仅抖音小游戏有效，其它平台返回 reject。
     */
    checkScene(option: ISceneOption): Promise<ISceneResult>;

    /**
     * 跳转到指定场景（如抖音侧边栏）。
     * 仅抖音小游戏有效，其它平台返回 reject。
     */
    navigateToScene(option: ISceneOption): Promise<ISceneResult>;

    //#endregion

    //#region ========== 能力检测 ==========

    /** 判断当前平台是否支持指定能力 */
    canIUse(apiName: string): boolean;

    /** 判断当前 SDK 是否已就绪 */
    isReady(): boolean;
    //#endregion
}