/**
 * SDK 支持的平台类型
 *
 * 与 Cocos Creator 3.8 `sys.Platform` 枚举一一对应（{@link SdkManager.detectPlatform}）。
 * 每接入一个新平台需要在此处新增枚举值，并在
 * {@link SdkManager} 中注册该平台的 {@link ISdk} 实现。
 */
export enum SdkPlatform {
    /** 未知平台（编辑器/PC 预览等） */
    Unknown = 'Unknown',
    /** 微信小游戏（sys.Platform.WECHAT_GAME） */
    WeChatMiniGame = 'WeChatMiniGame',
    /** H5 网页（MOBILE_BROWSER / DESKTOP_BROWSER） */
    H5 = 'H5',
    /** 抖音小游戏（sys.Platform.BYTEDANCE_MINI_GAME） */
    DouYinMiniGame = 'DouYinMiniGame',
    /** OPPO 小游戏（sys.Platform.OPPO_MINI_GAME） */
    OPPO = 'OPPO',
    /** vivo 小游戏（sys.Platform.VIVO_MINI_GAME） */
    Vivo = 'Vivo',
    /** 小米快游戏（sys.Platform.XIAOMI_QUICK_GAME） */
    XiaoMi = 'XiaoMi',
    /** 华为快游戏（sys.Platform.HUAWEI_QUICK_GAME） */
    Huawei = 'Huawei',
    /** 支付宝小游戏（sys.Platform.ALIPAY_MINI_GAME） */
    Alipay = 'Alipay',
    /** 开源鸿蒙小游戏（sys.Platform.OPENHARMONY） */
    OpenHarmony = 'OpenHarmony',
    /** 百度小游戏（sys.Platform.BAIDU_MINI_GAME） */
    BaiDu = 'BaiDu',
    /** Cocos 原生（WIN32/MACOS/ANDROID/IOS/OHOS） */
    Native = 'Native',
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
