import {
    ISdkEventCallbacks,
    SdkErrorCallback,
    SdkHideCallback,
    SdkNetworkChangeCallback,
    SdkShowCallback,
    INetworkStatusChangeEvent,
} from './SdkTypes';
import { SdkManager } from './SdkManager';
import { ISdk } from './ISdk';
import { AnalysisSdkManager } from './analysis';
import type { IUserInfo } from './SdkTypes';

/**
 * 平台 SDK 单例模块
 *
 * 不再依赖 ECS，改为普通单例类。通过 {@link Sdk.instance} 获取全局唯一实例。
 *
 * 外部访问方式：
 * - `gsm.base.sdk.platformSdk`    当前平台 SDK 实现接口
 * - `gsm.base.sdk.token`          SDK 登录凭证
 * - `gsm.base.sdk.userInfo`       用户信息
 *
 * 事件回调注册：
 * - `gsm.base.sdk.onShow(cb)`      注册切到前台回调
 * - `gsm.base.sdk.onHide(cb)`     注册切到后台回调
 * - `gsm.base.sdk.onError(cb)`     注册全局错误回调
 * - `gsm.base.sdk.onNetworkChange(cb)` 注册网络状态变化回调
 */
export class Sdk {
    // ==================== 平台 SDK 实现 ====================

    /** SDK 管理器 */
    private readonly manager: SdkManager = new SdkManager();
    /** 当前平台的 SDK 实现接口 */
    readonly platform: ISdk = this.manager.init();
    /** 数据分析 SDK 管理器 */
    readonly analysis: AnalysisSdkManager = new AnalysisSdkManager();

    // ==================== 数据模型（扁平） ====================

    /** SDK 登录凭证 */
    token: string = null!;
    /** 用户信息（昵称、头像等，登录授权后填充） */
    userInfo: IUserInfo | null = null;
    /** 是否从抖音侧边栏进入游戏 */
    isFromBytedanceSideBar: boolean = false;
    /** 是否已领取过抖音侧边栏进入奖励 */
    isByteDanceGetSideReward: boolean = false;

    // ==================== 事件回调 ====================

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

    constructor() {
        this.initEvents();
    }

    private initEvents() {
        console.log(`[SDK] 平台 = ${this.manager.platform}, 准备就绪 = ${this.platform.isReady()}`);

        // 转发原生事件到注册的回调
        this.onShowCb = (res: any) => {
            // 抖音侧边栏进入检测：launch_from == 'homepage' && location == 'sidebar_card'
            if (res && res.launch_from === 'homepage' && res.location === 'sidebar_card') {
                this.isFromBytedanceSideBar = true;
            }
            this.showCallbacks.forEach(cb => cb(res));
        };
        this.platform.onShow(this.onShowCb);

        this.onHideCb = () => this.hideCallbacks.forEach(cb => cb());
        this.platform.onHide(this.onHideCb);

        this.onErrorCb = (err: string) => this.errorCallbacks.forEach(cb => cb(err));
        this.platform.onError(this.onErrorCb);

        this.onNetworkChangeCb = (res: INetworkStatusChangeEvent) => this.networkChangeCallbacks.forEach(cb => cb(res));
        this.platform.onNetworkStatusChange(this.onNetworkChangeCb);
    }

    /** 重置模型数据 */
    reset() {
        this.token = null!;
        this.userInfo = null;
        this.isFromBytedanceSideBar = false;
        this.isByteDanceGetSideReward = false;
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
        if (this.onShowCb) this.platform.offShow(this.onShowCb);
        if (this.onHideCb) this.platform.offHide(this.onHideCb);
        if (this.onErrorCb) this.platform.offError(this.onErrorCb);
        if (this.onNetworkChangeCb) this.platform.offNetworkStatusChange(this.onNetworkChangeCb);
        this.onShowCb = this.onHideCb = this.onErrorCb = this.onNetworkChangeCb = undefined;
        this.showCallbacks.length = 0;
        this.hideCallbacks.length = 0;
        this.errorCallbacks.length = 0;
        this.networkChangeCallbacks.length = 0;
        this.manager.destroy();
    }
}
