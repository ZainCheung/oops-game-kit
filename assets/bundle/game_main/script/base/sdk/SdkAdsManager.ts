import { SdkPlatform } from './SdkEnum';
import type {
    IBannerAd,
    ICustomAd,
    IInterstitialAd,
    IRewardedVideoAd,
} from './SdkTypes';
import { ISdk } from './ISdk';

/**
 * 广告单元 ID 配置表
 *
 * 使用前替换为各平台后台申请的真实广告单元 ID。
 * `wx` 前缀为微信小游戏，`tt` 前缀为抖音小游戏。
 */
export interface ISdkAdsUnitIdConfig {
    /** Banner 广告 */
    banner: { wx: string; tt: string };
    /** 激励视频广告 */
    rewardedVideo: { wx: string; tt: string };
    /** 插屏广告 */
    interstitial: { wx: string; tt: string };
    /** 自定义网格广告 */
    customGrid: { wx: string; tt: string };
    /** 自定义多格子广告 - 左边 */
    customLeft: { wx: string; tt: string };
    /** 自定义多格子广告 - 右边 */
    customRight: { wx: string; tt: string };
    /** 自定义多格子广告 - 顶部 */
    customTop: { wx: string; tt: string };
    /** 自定义横幅广告 - 底部 */
    customBanner: { wx: string; tt: string };
}

/**
 * 广告类型枚举
 */
export enum SdkAdsType {
    /** Banner 广告 */
    Banner,
    /** 激励视频广告 */
    Rewarded,
    /** 插屏广告 */
    Interstitial,
    /** 自定义网格广告 */
    CustomGrid,
    /** 自定义多格子广告 - 左边 */
    CustomLeft,
    /** 自定义多格子广告 - 右边 */
    CustomRight,
    /** 自定义多格子广告 - 顶部 */
    CustomTop,
    /** 自定义横幅广告 - 底部 */
    CustomBanner,
}

/**
 * 默认广告单元 ID 配置（占位，需替换为真实 ID）
 */
const DEFAULT_ADS_UNIT_ID_CONFIG: ISdkAdsUnitIdConfig = {
    banner: { wx: '', tt: '' },
    rewardedVideo: { wx: '', tt: '' },
    interstitial: { wx: '', tt: '' },
    customGrid: { wx: '', tt: '' },
    customLeft: { wx: '', tt: '' },
    customRight: { wx: '', tt: '' },
    customTop: { wx: '', tt: '' },
    customBanner: { wx: '', tt: '' },
};

/**
 * 高级广告管理器
 *
 * 参考 gameAdsCtrl 设计，封装各广告的创建、预加载、显示/隐藏、回调等逻辑，
 * 对外提供静态风格的便捷调用，屏蔽各平台广告实例管理细节。
 *
 * 使用方式：
 * ```ts
 * const ads = gsm.base.sdk.adsManager;
 * ads.setUnitIdConfig(myConfig);
 * ads.preInitAllAds();
 * ads.showRewardedVideoAds((isRewarded) => { ... });
 * ```
 *
 * 能力说明：
 * - Banner 广告：仅微信支持（抖音无兜底广告，审核不通过）
 * - 激励视频 / 插屏广告：微信和抖音均支持
 * - 自定义网格 / 多格子广告：仅微信支持（抖音无自定义广告 API）
 */
export class SdkAdsManager {
    /** 当前平台 SDK */
    private sdk: ISdk;
    /** 当前平台类型 */
    private platform: SdkPlatform;
    /** 广告单元 ID 配置 */
    private config: ISdkAdsUnitIdConfig = DEFAULT_ADS_UNIT_ID_CONFIG;
    /** Banner 广告刷新间隔（秒） */
    private adIntervals: number = 30;

    // 广告实例缓存
    private bannerAd: IBannerAd | null = null;
    private interstitialAd: IInterstitialAd | null = null;
    private rewardedVideoAd: IRewardedVideoAd | null = null;
    private customGridAd: ICustomAd | null = null;
    private customAdsLeft: ICustomAd | null = null;
    private customAdsRight: ICustomAd | null = null;
    private customAdsTop: ICustomAd | null = null;
    private customAdsBanner: ICustomAd | null = null;

    constructor(sdk: ISdk, platform: SdkPlatform) {
        this.sdk = sdk;
        this.platform = platform;
    }

    //#region ========== 配置 ==========

    /**
     * 设置广告单元 ID 配置表。
     * 需在 {@link preInitAllAds} 之前调用。
     */
    setUnitIdConfig(config: Partial<ISdkAdsUnitIdConfig>): void {
        this.config = { ...this.config, ...config };
    }

    /** 获取当前配置 */
    getUnitIdConfig(): ISdkAdsUnitIdConfig {
        return this.config;
    }

    /** 设置 Banner 广告刷新间隔（秒） */
    setAdIntervals(seconds: number): void {
        this.adIntervals = seconds;
    }

    //#endregion

    //#region ========== 平台判断 ==========

    /** 是否微信小游戏 */
    get isWx(): boolean {
        return this.platform === SdkPlatform.WeChatMiniGame;
    }

    /** 是否抖音小游戏 */
    get isByteDance(): boolean {
        return this.platform === SdkPlatform.DouYinMiniGame;
    }

    /** 是否支持广告（微信或抖音） */
    get isAdsSupported(): boolean {
        return this.isWx || this.isByteDance;
    }

    //#endregion

    //#region ========== 广告 ID 获取 ==========

    /**
     * 根据广告类型获取对应平台的广告单元 ID
     */
    private getAdsUnitByType(adsType: SdkAdsType): string {
        if (!this.isAdsSupported) {
            return '';
        }
        const isWx = this.isWx;
        switch (adsType) {
            case SdkAdsType.Banner:
                return isWx ? this.config.banner.wx : this.config.banner.tt;
            case SdkAdsType.Rewarded:
                return isWx ? this.config.rewardedVideo.wx : this.config.rewardedVideo.tt;
            case SdkAdsType.Interstitial:
                return isWx ? this.config.interstitial.wx : this.config.interstitial.tt;
            case SdkAdsType.CustomGrid:
                return isWx ? this.config.customGrid.wx : this.config.customGrid.tt;
            case SdkAdsType.CustomLeft:
                return isWx ? this.config.customLeft.wx : this.config.customLeft.tt;
            case SdkAdsType.CustomRight:
                return isWx ? this.config.customRight.wx : this.config.customRight.tt;
            case SdkAdsType.CustomTop:
                return isWx ? this.config.customTop.wx : this.config.customTop.tt;
            case SdkAdsType.CustomBanner:
                return isWx ? this.config.customBanner.wx : this.config.customBanner.tt;
            default:
                return '';
        }
    }

    /** 获取屏幕尺寸 */
    private getScreenSize(): { width: number; height: number } {
        let width = 375, height = 667;
        try {
            if (this.isWx) {
                const windowInfo = (wx as any).getWindowInfo();
                width = windowInfo.screenWidth;
                height = windowInfo.screenHeight;
            }
            else if (this.isByteDance) {
                const g: any = typeof globalThis !== 'undefined' ? globalThis : window;
                const info = g['tt'].getSystemInfoSync();
                width = info.screenWidth;
                height = info.screenHeight;
            }
        }
        catch { /* ignore */ }
        return { width, height };
    }

    //#endregion

    //#region ========== 预初始化 ==========

    /**
     * 统一提前加载创建各种广告。
     *
     * 建议在游戏启动后调用一次，后续按需 show/hide。
     */
    preInitAllAds(): void {
        if (!this.isAdsSupported) {
            return;
        }
        this.initBannerAd();
        this.initInterstitialAd();
        this.initRewardedVideoAd();
        this.initCustomGridAd();
        this.initCustomMoreCellAds();
    }

    //#endregion

    //#region ========== Banner 广告 ==========

    /**
     * 初始化 Banner 广告（仅微信）。
     *
     * 抖音 banner 没有兜底广告，审核无法通过，故不创建。
     */
    private initBannerAd(): void {
        if (!this.isWx) {
            return;
        }
        if (this.bannerAd) {
            this.bannerAd.destroy();
            this.bannerAd = null;
        }
        const adUnitId = this.getAdsUnitByType(SdkAdsType.Banner);
        if (!adUnitId) {
            return;
        }
        const { width } = this.getScreenSize();
        const ad = this.sdk.createBannerAd({
            adUnitId,
            left: 0,
            top: 0,
            width,
        });
        if (!ad) {
            return;
        }
        this.bannerAd = ad;
        ad.onError((err) => {
            console.error('[SdkAds] Banner 广告错误', err.errMsg);
        });
        ad.onResize?.((res) => {
            const { height: sh } = this.getScreenSize();
            ad.style.top = sh - res.height;
        });
    }

    /**
     * 显示或隐藏 Banner 广告（仅微信）。
     */
    showOrHideBanner(isShow: boolean): void {
        if (!this.isWx || !this.bannerAd) {
            return;
        }
        if (isShow) {
            this.bannerAd.show().catch((err) => {
                console.log('[SdkAds] Banner 显示失败', err);
            });
        }
        else {
            this.bannerAd.hide();
        }
    }

    //#endregion

    //#region ========== 插屏广告 ==========

    /**
     * 初始化插屏广告（微信 / 抖音）。
     */
    private initInterstitialAd(): void {
        if (!this.isAdsSupported) {
            return;
        }
        const adUnitId = this.getAdsUnitByType(SdkAdsType.Interstitial);
        if (!adUnitId) {
            return;
        }
        const ad = this.sdk.createInterstitialAd({ adUnitId });
        if (!ad) {
            return;
        }
        this.interstitialAd = ad;
        ad.onError?.((err) => {
            console.log('[SdkAds] 插屏广告错误', err);
        });
    }

    /**
     * 显示插屏广告。
     * @param closeAdsCallback  关闭广告回调
     * @param loadFailCallback  加载/显示失败回调
     * @param loadSuccessCallback 加载成功回调
     */
    showInterstitialAds(
        closeAdsCallback?: () => void,
        loadFailCallback?: () => void,
        loadSuccessCallback?: () => void
    ): void {
        if (!this.isAdsSupported || !this.interstitialAd) {
            return;
        }
        const ad = this.interstitialAd;
        ad.onLoad?.(() => {
            console.log('[SdkAds] 插屏广告加载成功');
            loadSuccessCallback?.();
        });
        if (closeAdsCallback) {
            ad.onClose?.(() => {
                console.log('[SdkAds] 插屏广告关闭');
                closeAdsCallback();
            });
        }
        ad.show()
            .then(() => {
                console.log('[SdkAds] 插屏广告显示成功');
            })
            .catch((err) => {
                console.error('[SdkAds] 插屏广告显示失败', err);
                loadFailCallback?.();
            });
    }

    //#endregion

    //#region ========== 激励视频广告 ==========

    /**
     * 初始化激励视频广告（微信 / 抖音）。
     */
    private initRewardedVideoAd(): void {
        if (!this.isAdsSupported) {
            return;
        }
        const adUnitId = this.getAdsUnitByType(SdkAdsType.Rewarded);
        if (!adUnitId) {
            return;
        }
        const ad = this.sdk.createRewardedVideoAd({ adUnitId });
        if (!ad) {
            return;
        }
        this.rewardedVideoAd = ad;
        ad.onError((err) => {
            console.log('[SdkAds] 激励视频广告错误', err);
        });
    }

    /**
     * 显示激励视频广告。
     * @param closeAdsCallback  关闭广告回调，参数 isEnded 表示是否正常看完
     * @param loadFailCallback  加载/显示失败回调
     * @param loadSuccessCallback 加载成功回调
     */
    showRewardedVideoAds(
        closeAdsCallback?: (isRewarded: boolean) => void,
        loadFailCallback?: () => void,
        loadSuccessCallback?: () => void
    ): void {
        if (!this.isAdsSupported || !this.rewardedVideoAd) {
            return;
        }
        const ad = this.rewardedVideoAd;

        ad.onLoad?.(() => {
            console.log('[SdkAds] 激励视频广告加载成功');
            loadSuccessCallback?.();
        });

        ad.onClose((res) => {
            if (res.isEnded) {
                // 正常播放结束，可以下发游戏奖励
                closeAdsCallback?.(true);
            }
            else {
                // 播放中途退出，不下发游戏奖励
                closeAdsCallback?.(false);
            }
        });

        ad.show()
            .then(() => {
                console.log('[SdkAds] 激励视频广告显示');
            })
            .catch(() => {
                // 失败重试
                ad.load()
                    .then(() => {
                        ad.show().then(() => {
                            loadSuccessCallback?.();
                        });
                    })
                    .catch((err) => {
                        console.error('[SdkAds] 激励视频广告显示失败', err);
                        loadFailCallback?.();
                    });
            });
    }

    //#endregion

    //#region ========== 自定义网格广告（仅微信） ==========

    /**
     * 初始化自定义网格广告（仅微信）。
     */
    private initCustomGridAd(): void {
        if (!this.isWx) {
            return;
        }
        const adUnitId = this.getAdsUnitByType(SdkAdsType.CustomGrid);
        if (!adUnitId) {
            return;
        }
        const { width } = this.getScreenSize();
        const ad = this.sdk.createCustomAd({
            adUnitId,
            left: 0,
            top: 150,
            width,
        });
        if (!ad) {
            return;
        }
        this.customGridAd = ad;
        ad.onError?.((err) => {
            console.error('[SdkAds] 自定义网格广告错误', err.errMsg);
        });
    }

    /**
     * 显示自定义网格广告。
     * @param closeAdsCallback 关闭/隐藏回调
     * @param showOkCallback   显示成功回调
     * @param showErrorCallback 错误回调
     */
    showCustomGridAds(
        closeAdsCallback?: () => void,
        showOkCallback?: () => void,
        showErrorCallback?: () => void
    ): void {
        if (!this.isWx || !this.customGridAd) {
            return;
        }
        this.customGridAd.onError?.((err) => {
            console.error('[SdkAds] 自定义网格广告错误', err.errMsg);
            showErrorCallback?.();
        });
        this.customGridAd.show()
            .then(() => {
                showOkCallback?.();
            })
            .catch(() => {});
    }

    /**
     * 隐藏自定义网格广告。
     */
    hideCustomGridAds(): void {
        if (!this.isWx || !this.customGridAd) {
            return;
        }
        this.customGridAd.hide();
    }

    //#endregion

    //#region ========== 自定义多格子广告（仅微信） ==========

    /**
     * 创建单个自定义广告实例
     */
    private createCustomOneCellAd(
        adUnitId: string,
        left: number = 0,
        top: number = 150,
        width: number = 350
    ): ICustomAd | null {
        if (!this.isWx || !adUnitId) {
            return null;
        }
        return this.sdk.createCustomAd({ adUnitId, left, top, width });
    }

    /**
     * 初始化多格子广告（左/右/顶/底部横幅）。
     */
    private initCustomMoreCellAds(): void {
        if (!this.isWx) {
            return;
        }

        // 左边
        this.customAdsLeft = this.createCustomOneCellAd(
            this.getAdsUnitByType(SdkAdsType.CustomLeft)
        );
        this.customAdsLeft?.onError?.((err) => {
            console.error('[SdkAds] 自定义左边广告错误', err.errMsg);
        });

        // 右边
        const { width: sw, height: sh } = this.getScreenSize();
        this.customAdsRight = this.createCustomOneCellAd(
            this.getAdsUnitByType(SdkAdsType.CustomRight),
            sw - 60
        );
        this.customAdsRight?.onError?.((err) => {
            console.error('[SdkAds] 自定义右边广告错误', err.errMsg);
        });

        // 顶部
        this.customAdsTop = this.createCustomOneCellAd(
            this.getAdsUnitByType(SdkAdsType.CustomTop),
            0,
            0,
            350
        );
        this.customAdsTop?.onError?.((err) => {
            console.error('[SdkAds] 自定义顶部广告错误', err.errMsg);
        });

        // 底部横幅
        const bannerTopAlign = sh - 120;
        const bannerWidth = 350;
        const bannerLeftPos = (sw - bannerWidth) / 2;
        this.customAdsBanner = this.createCustomOneCellAd(
            this.getAdsUnitByType(SdkAdsType.CustomBanner),
            bannerLeftPos,
            bannerTopAlign
        );
        this.customAdsBanner?.onError?.((err) => {
            console.error('[SdkAds] 自定义底部广告错误', err.errMsg);
        });
    }

    /**
     * 显示或隐藏自定义多格子广告
     */
    private showOrHideCustomAds(adsType: SdkAdsType, isShow: boolean): void {
        if (!this.isWx) {
            return;
        }
        const showAdsFunc = (adsObj: ICustomAd | null, show: boolean) => {
            if (!adsObj) return;
            if (show) {
                adsObj.show().catch(() => {});
            }
            else {
                adsObj.hide();
            }
        };
        switch (adsType) {
            case SdkAdsType.CustomLeft:
                showAdsFunc(this.customAdsLeft, isShow);
                break;
            case SdkAdsType.CustomRight:
                showAdsFunc(this.customAdsRight, isShow);
                break;
            case SdkAdsType.CustomTop:
                showAdsFunc(this.customAdsTop, isShow);
                break;
            case SdkAdsType.CustomBanner:
                showAdsFunc(this.customAdsBanner, isShow);
                break;
        }
    }

    /** 显示/隐藏左边多格子广告 */
    showCustomMoreCellAdsLeft(isShow: boolean): void {
        this.showOrHideCustomAds(SdkAdsType.CustomLeft, isShow);
    }

    /** 显示/隐藏右边多格子广告 */
    showCustomMoreCellAdsRight(isShow: boolean): void {
        this.showOrHideCustomAds(SdkAdsType.CustomRight, isShow);
    }

    /** 显示/隐藏顶部多格子广告 */
    showCustomMoreCellAdsTop(isShow: boolean): void {
        this.showOrHideCustomAds(SdkAdsType.CustomTop, isShow);
    }

    /** 显示/隐藏底部自定义横幅广告 */
    showCustomBanner(isShow: boolean): void {
        this.showOrHideCustomAds(SdkAdsType.CustomBanner, isShow);
    }

    //#endregion

    //#region ========== 销毁 ==========

    /**
     * 销毁所有广告实例，释放资源。
     */
    destroyAll(): void {
        this.bannerAd?.destroy();
        this.bannerAd = null;
        this.interstitialAd?.destroy();
        this.interstitialAd = null;
        this.rewardedVideoAd = null;
        this.customGridAd?.destroy();
        this.customGridAd = null;
        this.customAdsLeft?.destroy();
        this.customAdsLeft = null;
        this.customAdsRight?.destroy();
        this.customAdsRight = null;
        this.customAdsTop?.destroy();
        this.customAdsTop = null;
        this.customAdsBanner?.destroy();
        this.customAdsBanner = null;
    }

    //#endregion
}
