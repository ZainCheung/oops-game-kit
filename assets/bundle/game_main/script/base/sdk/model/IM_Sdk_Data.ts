import { SdkNetworkType, SdkPlatform } from './enum/EM_Sdk';

/**
 * 系统信息（平台无关的精简版，各平台实现时自行映射）
 */
export interface ISystemInfo {
    /** 品牌 */
    brand: string;
    /** 型号 */
    model: string;
    /** 平台 */
    platform: SdkPlatform;
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
    code: string;
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
    /** 用户信息 */
    userInfo: IUserInfo;
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
 * 用户信息按钮（创建后由平台返回，统一接口）
 */
export interface IUserInfoButton {
    show(): void;
    hide(): void;
    destroy(): void;
    onTap(callback: (res: IUserInfoResult) => void): void;
    offTap(callback?: (res: IUserInfoResult) => void): void;
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
    /** 封面图 URL */
    imageUrl?: string;
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
    show(): Promise<void>;
    hide(): void;
    destroy(): void;
    onError(callback: (err: IAdError) => void): void;
    offError(callback?: (err: IAdError) => void): void;
    onLoad?(callback: () => void): void;
    offLoad?(callback?: () => void): void;
    onResize?(callback: (res: { width: number; height: number }) => void): void;
    offResize?(callback?: (res: { width: number; height: number }) => void): void;
    style: { top: number; left: number; width?: number; height?: number };
}

/**
 * 激励视频广告实例接口
 */
export interface IRewardedVideoAd {
    load(): Promise<void>;
    show(): Promise<void>;
    onClose(callback: (res: { isEnded: boolean }) => void): void;
    offClose(callback?: (res: { isEnded: boolean }) => void): void;
    onError(callback: (err: IAdError) => void): void;
    offError(callback?: (err: IAdError) => void): void;
    onLoad?(callback: () => void): void;
    offLoad?(callback?: () => void): void;
}

/**
 * 插屏广告实例接口
 */
export interface IInterstitialAd {
    load(): Promise<void>;
    show(): Promise<void>;
    destroy(): void;
    onError(callback: (err: IAdError) => void): void;
    offError(callback?: (err: IAdError) => void): void;
    onLoad?(callback: () => void): void;
    offLoad?(callback?: () => void): void;
    onClose?(callback: () => void): void;
    offClose?(callback?: () => void): void;
}

/**
 * 格子广告实例接口
 */
export interface IGridAd {
    show(): Promise<void>;
    hide(): void;
    destroy(): void;
    onError(callback: (err: IAdError) => void): void;
    offError(callback?: (err: IAdError) => void): void;
    onLoad?(callback: () => void): void;
    offLoad?(callback?: () => void): void;
    onResize?(callback: (res: { width: number; height: number }) => void): void;
    offResize?(callback?: (res: { width: number; height: number }) => void): void;
}

/**
 * 原生/自定义广告实例接口
 */
export interface ICustomAd {
    show(): Promise<void>;
    hide(): void;
    destroy(): void;
    onError(callback: (err: IAdError) => void): void;
    offError(callback?: (err: IAdError) => void): void;
    onLoad?(callback: () => void): void;
    offLoad?(callback?: () => void): void;
}

/**
 * 虚拟支付参数（微信 midas 支付）
 */
export interface IPayOption {
    /** 支付模式：'game' 游戏币 / 'item' 道具直购 */
    mode: 'game' | 'item';
    /** 道具 id（mode='item' 时必填） */
    itemId?: string;
    /** 游戏币数量（mode='game' 时必填） */
    quantity?: number;
    /** 应用内购商品 id */
    offerId?: string;
    /** 货币类型（默认 CNY） */
    currencyType?: string;
    /** 平台（android/ios） */
    env?: number;
    /** 业务自定义透传参数 */
    extraInfo?: string;
    [key: string]: any;
}

/**
 * 支付返回结果
 */
export interface IPayResult {
    errMsg: string;
    raw?: any;
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
 * 订阅消息返回结果
 */
export interface ISubscribeMessageResult {
    [tmplId: string]: 'accept' | 'reject' | 'ban' | 'filter';
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
 * 视频号参数
 */
export interface IChannelsOption {
    /** 视频号 username/finderUsername */
    finderUserName?: string;
    /** feed id */
    feedId?: string;
    /** nonceId */
    nonceId?: string;
    [key: string]: any;
}

/**
 * 录屏管理接口
 */
export interface IGameRecorderManager {
    start(option?: { duration?: number; fps?: number; bitRate?: number }): void;
    stop(): void;
    pause(): void;
    resume(): void;
    onStart?(callback: () => void): void;
    onStop?(callback: (res: { duration: number; videoPath: string; videoSize: number }) => void): void;
    onError?(callback: (err: IAdError) => void): void;
}

/**
 * 实时日志管理接口
 */
export interface IRealtimeLogManager {
    info(...args: any[]): void;
    warn(...args: any[]): void;
    error(...args: any[]): void;
    debug(...args: any[]): void;
    setFilterMsg(msg: string): void;
    addFilterMsg(msg: string): void;
}

/**
 * 更新管理接口
 */
export interface IUpdateManager {
    onCheckForUpdate(callback: (res: { hasUpdate: boolean }) => void): void;
    onUpdateReady(callback: () => void): void;
    onUpdateFailed(callback: () => void): void;
    applyUpdate(): void;
}
