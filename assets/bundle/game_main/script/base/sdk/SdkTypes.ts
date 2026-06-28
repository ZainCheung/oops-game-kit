import { SdkNetworkType } from './SdkEnum';

/**
 * 系统信息（平台无关的精简版，各平台实现时自行映射）
 */
export interface ISystemInfo {
    /** 品牌 */
    brand: string;
    /** 型号 */
    model: string;
    /** 平台 */
    platform: string;
    /** 系统 */
    system: string;
    /** 客户端版本 */
    version: string;
    /** 屏幕宽度（逻辑像素） */
    screenWidth: number;
    /** 屏幕高度（逻辑像素） */
    screenHeight: number;
    /** 设备像素比 */
    pixelRatio: number;
    /** 语言 */
    language: string;
    /** 微信基础库版本（仅微信） */
    SDKVersion?: string;
    /** 原始数据（保留各平台原始返回，便于扩展） */
    raw?: any;
}

/**
 * 登录返回结果
 */
export interface ILoginResult {
    /** 登录凭证（用于换取 openid/session_key） */
    token: string;
    /** 微信 OpenID（有云函数时通过云函数获取） */
    openid: string | null;
    /** 微信 UnionID（有云函数时通过云函数获取，需满足条件才有） */
    unionid: string | null;
    /** 原始数据 */
    raw?: any;
}

/**
 * 用户信息
 */
export interface IUserInfo {
    /** 昵称 */
    nickName: string;
    /** 头像 URL */
    avatarUrl: string;
    /** 性别 0-未知 1-男 2-女 */
    gender: 0 | 1 | 2;
    /** 语言 */
    language?: string;
    /** 国家 */
    country?: string;
    /** 省份 */
    province?: string;
    /** 城市 */
    city?: string;
    /** 原始数据 */
    raw?: any;
}

/**
 * 获取用户信息返回结果
 */
export interface IUserInfoResult {
    /** 用户信息（用户拒绝授权或基础库行为变化时可能为空） */
    userInfo?: IUserInfo;
    /** 不包含敏感信息的原始数据字符串（用于签名校验） */
    rawData?: string;
    /** 签名 */
    signature?: string;
    /** 加密数据 */
    encryptedData?: string;
    /** 加密算法初始向量 */
    iv?: string;
    /** 云 ID */
    cloudID?: string;
}

/**
 * 启动参数
 */
export interface ILaunchOptions {
    /** 场景值 */
    scene: number;
    /** 启动参数 */
    query: Record<string, any>;
    /** 转发来源 */
    referrerInfo?: { appId: string; extraData?: any };
    /** 原始数据 */
    raw?: any;
}

/**
 * 分享参数
 */
export interface IShareOption {
    /** 标题 */
    title?: string;
    /** 转发路径（小游戏通常为查询字符串） */
    path?: string;
    /**
     * 分享封面图（运行期生成的临时文件 URL，例如 `canvas.toTempFilePath` 的结果）。
     *
     * 注意：本字段保留给"截图分享"使用场景，但当前 SDK 默认行为**不**使用此字段。
     * 默认分享流程见 {@link presetImageUrl}。
     */
    imageUrl?: string;
    /**
     * 预设分享封面图 URL（远端 CDN 图片或小游戏本地资源）。
     *
     * 业务调用 `sdk.shareAppMessage({ presetImageUrl })` 时，微信/抖音会用这张图作为
     * 转发卡片的封面，**不会**触发 `canvas.toTempFilePath`，因此不会把 Cocos 当前画面
     * 截成游戏截图分享出去。
     *
     * 如果同时传了 `imageUrl`，以 `presetImageUrl` 为准（更明确的语义）。
     */
    presetImageUrl?: string;
    /** 是否带 shareTicket */
    withShareTicket?: boolean;
    /** 额外参数 */
    [key: string]: any;
}

/**
 * 朋友圈分享参数（仅微信支持）
 */
export interface IShareToTimelineOption {
    /** 标题 */
    title?: string;
    /** 封面图 URL */
    imageUrl?: string;
    /** 查询字符串 */
    query?: string;
    [key: string]: any;
}

/**
 * Banner 广告参数
 */
export interface IBannerAdOption {
    /** 广告单元 id */
    adUnitId: string;
    /** 顶部坐标 */
    top?: number;
    /** 左侧坐标 */
    left?: number;
    /** 宽度 */
    width?: number;
    /** 高度 */
    height?: number;
    /** 风格 */
    style?: Record<string, any>;
}

/**
 * 激励视频广告参数
 */
export interface IRewardedVideoAdOption {
    /** 广告单元 id */
    adUnitId: string;
    /** 是否静音 */
    muted?: boolean;
}

/**
 * 插屏广告参数
 */
export interface IInterstitialAdOption {
    /** 广告单元 id */
    adUnitId: string;
}

/**
 * 格子广告参数
 */
export interface IGridAdOption {
    /** 广告单元 id */
    adUnitId: string;
    /** 左侧坐标 */
    left?: number;
    /** 顶部坐标 */
    top?: number;
    /** 宽度 */
    width?: number;
    /** 格子个数 */
    gridCount?: number;
}

/**
 * 原生/自定义广告参数
 */
export interface ICustomAdOption {
    /** 广告单元 id */
    adUnitId: string;
    /** 顶部坐标 */
    top?: number;
    /** 左侧坐标 */
    left?: number;
    /** 宽度 */
    width?: number;
    /** 高度 */
    height?: number;
    style?: Record<string, any>;
}

/**
 * 广告错误事件
 */
export interface IAdError {
    errCode: number;
    errMsg: string;
}

/**
 * Banner 广告实例接口（平台无关）
 */
export interface IBannerAd {
    /** 显示广告 */
    show(): Promise<void>;
    /** 隐藏广告 */
    hide(): void;
    /** 销毁广告实例 */
    destroy(): void;
    /** 监听广告错误事件 */
    onError(callback: (err: IAdError) => void): void;
    /** 取消监听广告错误事件 */
    offError(callback?: (err: IAdError) => void): void;
    /** 监听广告加载成功事件 */
    onLoad?(callback: () => void): void;
    /** 取消监听广告加载成功事件 */
    offLoad?(callback?: () => void): void;
    /** 监听广告尺寸变化事件 */
    onResize?(callback: (res: { width: number; height: number }) => void): void;
    /** 取消监听广告尺寸变化事件 */
    offResize?(callback?: (res: { width: number; height: number }) => void): void;
    /** 广告样式（位置与尺寸） */
    style: { top: number; left: number; width?: number; height?: number };
}

/**
 * 激励视频广告实例接口
 */
export interface IRewardedVideoAd {
    /** 加载广告 */
    load(): Promise<void>;
    /** 播放广告 */
    show(): Promise<void>;
    /** 监听广告关闭事件（可获取是否完整观看） */
    onClose(callback: (res: { isEnded: boolean }) => void): void;
    /** 取消监听广告关闭事件 */
    offClose(callback?: (res: { isEnded: boolean }) => void): void;
    /** 监听广告错误事件 */
    onError(callback: (err: IAdError) => void): void;
    /** 取消监听广告错误事件 */
    offError(callback?: (err: IAdError) => void): void;
    /** 监听广告加载成功事件 */
    onLoad?(callback: () => void): void;
    /** 取消监听广告加载成功事件 */
    offLoad?(callback?: () => void): void;
}

/**
 * 插屏广告实例接口
 */
export interface IInterstitialAd {
    /** 加载广告 */
    load(): Promise<void>;
    /** 播放广告 */
    show(): Promise<void>;
    /** 销毁广告实例 */
    destroy(): void;
    /** 监听广告错误事件 */
    onError(callback: (err: IAdError) => void): void;
    /** 取消监听广告错误事件 */
    offError(callback?: (err: IAdError) => void): void;
    /** 监听广告加载成功事件 */
    onLoad?(callback: () => void): void;
    /** 取消监听广告加载成功事件 */
    offLoad?(callback?: () => void): void;
    /** 监听广告关闭事件 */
    onClose?(callback: () => void): void;
    /** 取消监听广告关闭事件 */
    offClose?(callback?: () => void): void;
}

/**
 * 格子广告实例接口
 */
export interface IGridAd {
    /** 显示广告 */
    show(): Promise<void>;
    /** 隐藏广告 */
    hide(): void;
    /** 销毁广告实例 */
    destroy(): void;
    /** 监听广告错误事件 */
    onError(callback: (err: IAdError) => void): void;
    /** 取消监听广告错误事件 */
    offError(callback?: (err: IAdError) => void): void;
    /** 监听广告加载成功事件 */
    onLoad?(callback: () => void): void;
    /** 取消监听广告加载成功事件 */
    offLoad?(callback?: () => void): void;
    /** 监听广告尺寸变化事件 */
    onResize?(callback: (res: { width: number; height: number }) => void): void;
    /** 取消监听广告尺寸变化事件 */
    offResize?(callback?: (res: { width: number; height: number }) => void): void;
}

/**
 * 原生/自定义广告实例接口
 */
export interface ICustomAd {
    /** 显示广告 */
    show(): Promise<void>;
    /** 隐藏广告 */
    hide(): void;
    /** 销毁广告实例 */
    destroy(): void;
    /** 监听广告错误事件 */
    onError(callback: (err: IAdError) => void): void;
    /** 取消监听广告错误事件 */
    offError(callback?: (err: IAdError) => void): void;
    /** 监听广告加载成功事件 */
    onLoad?(callback: () => void): void;
    /** 取消监听广告加载成功事件 */
    offLoad?(callback?: () => void): void;
}

/**
 * 网络状态返回结果
 */
export interface INetworkTypeResult {
    networkType: SdkNetworkType;
    /** 是否连接网络 */
    isConnected?: boolean;
}

/**
 * 网络状态变化事件
 */
export interface INetworkStatusChangeEvent {
    networkType: SdkNetworkType;
    isConnected: boolean;
}

/**
 * 托管 KV 数据
 */
export interface IKVData {
    key: string;
    value: string;
}

/**
 * 用户托管数据查询结果
 */
export interface IUserCloudStorageResult {
    kvDataList: IKVData[];
    raw?: any;
}

/**
 * 客服会话参数
 */
export interface ICustomerServiceOption {
    /** 消息扩展信息 */
    extInfo?: string;
    /** 会话来源 */
    source?: string;
    [key: string]: any;
}

/**
 * 客服聊天入口参数（小游戏客服会话）
 */
export interface ICustomerServiceConversationOption extends ICustomerServiceOption {
    /** 是否进入会话 */
    enterFrom?: string;
}

/**
 * 隐私设置返回结果
 */
export interface IPrivacySetting {
    /** 是否需要授权 */
    needAuthorization: boolean;
    /** 隐私接口名称 */
    privacyContractName?: string;
    [key: string]: any;
}

/**
 * 隐私授权结果 resolve 入参
 * - agree      : 用户同意隐私协议
 * - disagree   : 用户拒绝隐私协议
 * - exposureAuthorization : 弹窗页面已曝光（用于上报）
 */
export type PrivacyResolveEvent = 'agree' | 'disagree' | 'exposureAuthorization';

/**
 * resolve 回调签名（在用户点击事件里调用）
 */
export type PrivacyResolveCallback = (result: { event: PrivacyResolveEvent }) => void;

/**
 * 触发本次 onNeedPrivacyAuthorization 事件的关联信息
 */
export interface IPrivacyEventInfo {
    /** 触发事件的接口或组件名（如 'getUserInfo'、'UserInfoButton.onTap'） */
    referrer?: string;
    [key: string]: any;
}

/**
 * 自定义隐私弹窗契约 —— SDK 不内置任何 UI，由调用方注入
 *
 * 触发时机：玩家首次进入游戏 / 协议更新 / 主动调 requirePrivacyAuthorize
 * 注入时机：业务层第一次需要用到用户信息前（任意游戏脚本皆可注入）
 *
 * 工作流：
 *   1. SDK 内部监听 onNeedPrivacyAuthorization 事件 → 调 dialog.onTrigger
 *   2. dialog.onTrigger 弹起自定义 UI（prefab / DOM / native）
 *   3. 玩家点了"同意"→ 在点击回调里调 resolve({ event: 'agree' })
 *      玩家点了"拒绝"→ 在点击回调里调 resolve({ event: 'disagree' })
 *      弹窗页面打开时 → 调 resolve({ event: 'exposureAuthorization' })
 *   4. SDK 把 resolve 结果上报给平台，平台恢复被挂起的隐私接口
 *
 * 注意：resolve 必须**在用户点击事件中**调用（异步直接调会被微信 errno:104 拒绝）
 */
export interface ICustomPrivacyDialog {
    /**
     * SDK 触发隐私弹窗时回调。
     * @param resolve  必须由游戏层在用户点击事件中调用
     * @param eventInfo 触发事件的接口信息
     */
    onTrigger(resolve: PrivacyResolveCallback, eventInfo: IPrivacyEventInfo): void;

    /**
     * 玩家点了"《隐私保护指引》"链接时调用 → SDK 内部调 wx.openPrivacyContract
     * （微信 2.2.1 要求必须用 wx.openPrivacyContract 打开，不能用普通跳转）
     */
    onOpenContract?(): void;
}

/**
 * 录屏管理接口
 */
export interface IGameRecorderManager {
    /** 开始录屏 */
    start(option?: { duration?: number; fps?: number; bitRate?: number }): void;
    /** 停止录屏 */
    stop(): void;
    /** 暂停录屏 */
    pause(): void;
    /** 恢复录屏 */
    resume(): void;
    /** 监听录屏开始事件 */
    onStart?(callback: () => void): void;
    /** 监听录屏结束事件（返回视频路径、时长、大小） */
    onStop?(callback: (res: { duration: number; videoPath: string; videoSize: number }) => void): void;
    /** 监听录屏错误事件 */
    onError?(callback: (err: IAdError) => void): void;
}

/**
 * 更新管理接口
 */
export interface IUpdateManager {
    /** 监听检查更新结果事件 */
    onCheckForUpdate(callback: (res: { hasUpdate: boolean }) => void): void;
    /** 监听更新准备就绪事件 */
    onUpdateReady(callback: () => void): void;
    /** 监听更新失败事件 */
    onUpdateFailed(callback: () => void): void;
    /** 应用更新并重启小游戏 */
    applyUpdate(): void;
}

/**
 * 场景跳转/检测参数（主要用于抖音侧边栏场景）
 */
export interface ISceneOption {
    /** 场景标识，如 'sidebar' */
    scene: string;
    /** 额外参数 */
    [key: string]: any;
}

/**
 * 场景跳转/检测结果
 */
export interface ISceneResult {
    /** 是否支持/成功 */
    success: boolean;
    /** 原始数据 */
    raw?: any;
}

//#region ========== SDK 事件回调 ==========

/** SDK 切到前台回调 */
export type SdkShowCallback = (res: any) => void;

/** SDK 切到后台回调 */
export type SdkHideCallback = () => void;

/** SDK 全局错误回调 */
export type SdkErrorCallback = (err: string) => void;

/** SDK 网络状态变化回调 */
export type SdkNetworkChangeCallback = (res: INetworkStatusChangeEvent) => void;

/** SDK 事件回调集合 */
export interface ISdkEventCallbacks {
    /** 切到前台回调 */
    onShow?: SdkShowCallback;
    /** 切到后台回调 */
    onHide?: SdkHideCallback;
    /** 全局错误回调 */
    onError?: SdkErrorCallback;
    /** 网络状态变化回调 */
    onNetworkChange?: SdkNetworkChangeCallback;
}

//#endregion
