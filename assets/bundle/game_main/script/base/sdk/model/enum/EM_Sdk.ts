/**
 * SDK 支持的平台类型
 *
 * 每接入一个新平台需要在此处新增枚举值，并在
 * {@link SdkManager} 中注册该平台的 {@link ISdk} 实现。
 */
export enum SdkPlatform {
    /** 未知平台（编辑器/PC 预览等） */
    Unknown = 'Unknown',
    /** 微信小游戏 */
    WeChatMiniGame = 'WeChatMiniGame',
    /** H5 网页（浏览器） */
    H5 = 'H5',
    /** 抖音小游戏 */
    DouYinMiniGame = 'DouYinMiniGame',
    /** OPPO 小游戏 */
    OPPO = 'OPPO',
    /** vivo 小游戏 */
    Vivo = 'Vivo',
}

/**
 * 广告类型
 */
export enum SdkAdType {
    /** Banner 横幅广告 */
    Banner = 'Banner',
    /** 激励视频广告 */
    RewardedVideo = 'RewardedVideo',
    /** 插屏广告 */
    Interstitial = 'Interstitial',
    /** 格子广告 */
    Grid = 'Grid',
    /** 原生模板广告 */
    Custom = 'Custom',
}

/**
 * 振动类型
 */
export enum SdkVibrateType {
    /** 轻振动 */
    Light = 'light',
    /** 中等振动 */
    Medium = 'medium',
    /** 重振动 */
    Heavy = 'heavy',
}

/**
 * 网络类型
 */
export enum SdkNetworkType {
    Wifi = 'wifi',
    TwoG = '2g',
    ThreeG = '3g',
    FourG = '4g',
    FiveG = '5g',
    Unknown = 'unknown',
    None = 'none',
}
