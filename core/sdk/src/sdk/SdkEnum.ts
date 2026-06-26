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
