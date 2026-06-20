import { oops } from 'db://oops-framework/core/Oops';
import { CCBusiness } from 'db://oops-framework/module/common/CCBusiness';
import { classname } from 'db://oops-framework/module/decorator/ClassNameDecorator';
import { Sdk } from '../Sdk';
import { SdkEventName } from '../SdkEvent';
import { SdkManager } from '../SdkManager';
import { ISdk } from '../ISdk';
import type { INetworkStatusChangeEvent } from '../model/data/SdkData';

/**
 * SDK 模块主业务逻辑
 *
 * 职责：
 * 1. 初始化 {@link SdkManager}（探测平台并创建对应实现）。
 * 2. 监听原生 SDK 生命周期事件（onShow/onHide/onError/网络变化），
 *    转发到 oops 全局事件系统，便于其它模块订阅。
 * 3. 对外暴露 {@link getSdk} / {@link login} 等便捷方法。
 */
@classname('B_Sdk_Main')
export class B_Sdk_Main extends CCBusiness<Sdk> {
    /** 缓存的原生事件回调，便于 destroy 时解绑 */
    private _onShowCb?: (res: any) => void;
    private _onHideCb?: () => void;
    private _onErrorCb?: (err: string) => void;
    private _onNetworkChangeCb?: (res: INetworkStatusChangeEvent) => void;

    protected init() {
        // 1. 初始化 SDK 管理器（自动识别平台）
        SdkManager.init();

        const sdk = SdkManager.getSdk();
        oops.log.logBusiness(`[SDK] 平台=${sdk.getPlatform()}, ready=${sdk.isReady()}`);

        // 2. 转发原生事件到全局事件系统
        this._onShowCb = (res: any) => oops.message.emit(SdkEventName.Show, res);
        sdk.onShow(this._onShowCb);

        this._onHideCb = () => oops.message.emit(SdkEventName.Hide);
        sdk.onHide(this._onHideCb);

        this._onErrorCb = (err: string) => oops.message.emit(SdkEventName.Error, err);
        sdk.onError(this._onErrorCb);

        this._onNetworkChangeCb = (res: INetworkStatusChangeEvent) =>
            this.event.emit(SdkEventName.NetworkChange, res);
        sdk.onNetworkStatusChange(this._onNetworkChangeCb);

        // 3. 通知初始化完成
        this.event.emit(SdkEventName.InitComplete);
    }

    /** 获取当前平台的 SDK 实现接口 */
    getSdk(): ISdk {
        return SdkManager.getSdk();
    }

    /** 当前平台枚举 */
    getPlatform() {
        return SdkManager.platform;
    }

    /** 便捷方法：登录 */
    login() {
        return this.getSdk().login();
    }

    /** 便捷方法：获取系统信息 */
    getSystemInfo() {
        return this.getSdk().getSystemInfo();
    }

    destroy() {
        const sdk = SdkManager.getSdk();
        if (this._onShowCb) sdk.offShow(this._onShowCb);
        if (this._onHideCb) sdk.offHide(this._onHideCb);
        if (this._onErrorCb) sdk.offError(this._onErrorCb);
        if (this._onNetworkChangeCb) sdk.offNetworkStatusChange(this._onNetworkChangeCb);
        this._onShowCb = this._onHideCb = this._onErrorCb = this._onNetworkChangeCb = undefined;
        super.destroy();
    }
}
