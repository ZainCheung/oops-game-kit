import { SdkMain } from './SdkMain';
import { SdkModel } from './SdkModel';
import type {
    ISdkEventCallbacks,
    SdkErrorCallback,
    SdkHideCallback,
    SdkNetworkChangeCallback,
    SdkShowCallback,
} from './SdkTypes';

/**
 * 平台 SDK 单例模块
 *
 * 不再依赖 ECS，改为普通单例类。通过 {@link Sdk.instance} 获取全局唯一实例。
 *
 * 外部访问方式：
 * - `Sdk.instance.main.sdk`        当前平台 SDK 实现接口
 * - `Sdk.instance.main.adsManager` 高级广告管理器
 * - `Sdk.instance.model.token`     SDK 登录凭证
 * - `Sdk.instance.model.userInfo`  用户信息
 *
 * 事件回调注册：
 * - `Sdk.instance.onShow(cb)`      注册切到前台回调
 * - `Sdk.instance.onHide(cb)`     注册切到后台回调
 * - `Sdk.instance.onError(cb)`     注册全局错误回调
 * - `Sdk.instance.onNetworkChange(cb)` 注册网络状态变化回调
 */
export class Sdk {
    /** 数据模型 */
    readonly model: SdkModel;
    /** 主业务逻辑 */
    readonly main: SdkMain;

    constructor() {
        this.model = new SdkModel();
        this.main = new SdkMain(this);
    }

    //#region ========== 事件回调代理 ==========

    /**
     * 批量注册事件回调
     * @param callbacks 回调集合
     */
    on(callbacks: ISdkEventCallbacks): void {
        this.main.on(callbacks);
    }

    /**
     * 批量注销事件回调
     * @param callbacks 回调集合
     */
    off(callbacks: ISdkEventCallbacks): void {
        this.main.off(callbacks);
    }

    /** 注册切到前台回调 */
    onShow(callback: SdkShowCallback): void {
        this.main.onShow(callback);
    }

    /** 注销切到前台回调 */
    offShow(callback?: SdkShowCallback): void {
        this.main.offShow(callback);
    }

    /** 注册切到后台回调 */
    onHide(callback: SdkHideCallback): void {
        this.main.onHide(callback);
    }

    /** 注销切到后台回调 */
    offHide(callback?: SdkHideCallback): void {
        this.main.offHide(callback);
    }

    /** 注册全局错误回调 */
    onError(callback: SdkErrorCallback): void {
        this.main.onError(callback);
    }

    /** 注销全局错误回调 */
    offError(callback?: SdkErrorCallback): void {
        this.main.offError(callback);
    }

    /** 注册网络状态变化回调 */
    onNetworkChange(callback: SdkNetworkChangeCallback): void {
        this.main.onNetworkChange(callback);
    }

    /** 注销网络状态变化回调 */
    offNetworkChange(callback?: SdkNetworkChangeCallback): void {
        this.main.offNetworkChange(callback);
    }

    //#endregion
}
