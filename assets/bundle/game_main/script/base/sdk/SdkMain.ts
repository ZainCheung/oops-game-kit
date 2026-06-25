import {
    ISdkEventCallbacks,
    SdkErrorCallback,
    SdkHideCallback,
    SdkNetworkChangeCallback,
    SdkShowCallback,
    INetworkStatusChangeEvent,
} from './SdkTypes';
import { SdkAdsManager } from './SdkAdsManager';
import { SdkManager } from './SdkManager';
import { ISdk } from './ISdk';
import type { Sdk } from './Sdk';

/**
 * 平台 SDK 主业务逻辑
 *
 * 职责：
 * 1. 通过 {@link SdkManager} 识别平台并创建对应 {@link ISdk} 实现。
 * 2. 转发原生生命周期事件（onShow/onHide/onError/网络变化）到注册的回调。
 * 3. 提供 {@link SdkAdsManager} 高级广告管理能力。
 */
export class SdkMain {
    /** 所属 SDK 模块（用于回写模型数据） */
    private readonly sdkModule: Sdk;
    /** SDK 管理器 */
    private readonly manager: SdkManager = new SdkManager();
    /** 当前平台的 SDK 实现接口 */
    readonly sdk: ISdk = this.manager.init();
    /** 高级广告管理器（封装各广告的创建、显示/隐藏、回调） */
    readonly adsManager: SdkAdsManager = new SdkAdsManager(this.sdk, this.manager.platform);

    /** 缓存的原生事件回调，便于 destroy 时解绑 */
    private onShowCb?: (res: any) => void;
    private onHideCb?: () => void;
    private onErrorCb?: (err: string) => void;
    private onNetworkChangeCb?: (res: INetworkStatusChangeEvent) => void;

    /** 注册的切到前台回调列表 */
    private showCallbacks: SdkShowCallback[] = [];
    /** 注册的切到后台回调列表 */
    private hideCallbacks: SdkHideCallback[] = [];
    /** 注册的全局错误回调列表 */
    private errorCallbacks: SdkErrorCallback[] = [];
    /** 注册的网络状态变化回调列表 */
    private networkChangeCallbacks: SdkNetworkChangeCallback[] = [];

    constructor(sdkModule: Sdk) {
        this.sdkModule = sdkModule;
        this.init();
    }

    private init() {
        console.log(`[SDK] 平台 = ${this.manager.platform}, 准备就绪 = ${this.sdk.isReady()}`);

        // 转发原生事件到注册的回调
        this.onShowCb = (res: any) => {
            // 抖音侧边栏进入检测：launch_from == 'homepage' && location == 'sidebar_card'
            if (res && res.launch_from === 'homepage' && res.location === 'sidebar_card') {
                this.sdkModule.model.isFromBytedanceSideBar = true;
            }
            this.showCallbacks.forEach(cb => cb(res));
        };
        this.sdk.onShow(this.onShowCb);

        this.onHideCb = () => this.hideCallbacks.forEach(cb => cb());
        this.sdk.onHide(this.onHideCb);

        this.onErrorCb = (err: string) => this.errorCallbacks.forEach(cb => cb(err));
        this.sdk.onError(this.onErrorCb);

        this.onNetworkChangeCb = (res: INetworkStatusChangeEvent) => this.networkChangeCallbacks.forEach(cb => cb(res));
        this.sdk.onNetworkStatusChange(this.onNetworkChangeCb);
    }

    //#region ========== 事件回调注册/注销 ==========

    /**
     * 批量注册事件回调
     * @param callbacks 回调集合
     */
    on(callbacks: ISdkEventCallbacks): void {
        if (callbacks.onShow) this.showCallbacks.push(callbacks.onShow);
        if (callbacks.onHide) this.hideCallbacks.push(callbacks.onHide);
        if (callbacks.onError) this.errorCallbacks.push(callbacks.onError);
        if (callbacks.onNetworkChange) this.networkChangeCallbacks.push(callbacks.onNetworkChange);
    }

    /**
     * 批量注销事件回调
     * @param callbacks 回调集合
     */
    off(callbacks: ISdkEventCallbacks): void {
        if (callbacks.onShow) this.offShow(callbacks.onShow);
        if (callbacks.onHide) this.offHide(callbacks.onHide);
        if (callbacks.onError) this.offError(callbacks.onError);
        if (callbacks.onNetworkChange) this.offNetworkChange(callbacks.onNetworkChange);
    }

    /** 注册切到前台回调 */
    onShow(callback: SdkShowCallback): void {
        this.showCallbacks.push(callback);
    }

    /** 注销切到前台回调 */
    offShow(callback?: SdkShowCallback): void {
        if (callback) {
            const idx = this.showCallbacks.indexOf(callback);
            if (idx !== -1) this.showCallbacks.splice(idx, 1);
        }
        else {
            this.showCallbacks.length = 0;
        }
    }

    /** 注册切到后台回调 */
    onHide(callback: SdkHideCallback): void {
        this.hideCallbacks.push(callback);
    }

    /** 注销切到后台回调 */
    offHide(callback?: SdkHideCallback): void {
        if (callback) {
            const idx = this.hideCallbacks.indexOf(callback);
            if (idx !== -1) this.hideCallbacks.splice(idx, 1);
        }
        else {
            this.hideCallbacks.length = 0;
        }
    }

    /** 注册全局错误回调 */
    onError(callback: SdkErrorCallback): void {
        this.errorCallbacks.push(callback);
    }

    /** 注销全局错误回调 */
    offError(callback?: SdkErrorCallback): void {
        if (callback) {
            const idx = this.errorCallbacks.indexOf(callback);
            if (idx !== -1) this.errorCallbacks.splice(idx, 1);
        }
        else {
            this.errorCallbacks.length = 0;
        }
    }

    /** 注册网络状态变化回调 */
    onNetworkChange(callback: SdkNetworkChangeCallback): void {
        this.networkChangeCallbacks.push(callback);
    }

    /** 注销网络状态变化回调 */
    offNetworkChange(callback?: SdkNetworkChangeCallback): void {
        if (callback) {
            const idx = this.networkChangeCallbacks.indexOf(callback);
            if (idx !== -1) this.networkChangeCallbacks.splice(idx, 1);
        }
        else {
            this.networkChangeCallbacks.length = 0;
        }
    }

    //#endregion

    /** 销毁，解绑原生事件并释放广告资源 */
    destroy() {
        if (this.onShowCb) this.sdk.offShow(this.onShowCb);
        if (this.onHideCb) this.sdk.offHide(this.onHideCb);
        if (this.onErrorCb) this.sdk.offError(this.onErrorCb);
        if (this.onNetworkChangeCb) this.sdk.offNetworkStatusChange(this.onNetworkChangeCb);
        this.onShowCb = this.onHideCb = this.onErrorCb = this.onNetworkChangeCb = undefined;
        this.showCallbacks.length = 0;
        this.hideCallbacks.length = 0;
        this.errorCallbacks.length = 0;
        this.networkChangeCallbacks.length = 0;
        this.adsManager.destroyAll();
        this.manager.destroy();
    }
}
