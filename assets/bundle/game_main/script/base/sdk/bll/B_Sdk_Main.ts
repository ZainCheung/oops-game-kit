import { oops } from 'db://oops-framework/core/Oops';
import { CCBusiness } from 'db://oops-framework/module/common/CCBusiness';
import { Sdk } from '../Sdk';
import { SdkEventName } from '../SdkEvent';
import { SdkManager } from '../SdkManager';
import { ISdk } from '../ISdk';
import type { INetworkStatusChangeEvent } from '../model/data/SdkData';

export class B_Sdk_Main extends CCBusiness<Sdk> {
    /** 缓存的原生事件回调，便于 destroy 时解绑 */
    private onShowCb?: (res: any) => void;
    private onHideCb?: () => void;
    private onErrorCb?: (err: string) => void;
    private onNetworkChangeCb?: (res: INetworkStatusChangeEvent) => void;

    protected init() {
        // 1. 初始化 SDK 管理器（自动识别平台）
        SdkManager.init();

        const sdk = SdkManager.getSdk();

        // 2. 更新 Model 数据
        this.ent.M_Sdk_Main.platform = sdk.getPlatform();
        this.ent.M_Sdk_Main.isReady = sdk.isReady();

        oops.log.logBusiness(`[SDK] 平台 = ${sdk.getPlatform()}, 准备就绪 = ${sdk.isReady()}`);

        // 3. 转发原生事件到全局事件系统
        this.onShowCb = (res: any) => this.event.emit(SdkEventName.Show, res);
        sdk.onShow(this.onShowCb);

        this.onHideCb = () => this.event.emit(SdkEventName.Hide);
        sdk.onHide(this.onHideCb);

        this.onErrorCb = (err: string) => this.event.emit(SdkEventName.Error, err);
        sdk.onError(this.onErrorCb);

        this.onNetworkChangeCb = (res: INetworkStatusChangeEvent) => this.event.emit(SdkEventName.NetworkChange, res);
        sdk.onNetworkStatusChange(this.onNetworkChangeCb);

        // 4. 通知初始化完成
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
        if (this.onShowCb) sdk.offShow(this.onShowCb);
        if (this.onHideCb) sdk.offHide(this.onHideCb);
        if (this.onErrorCb) sdk.offError(this.onErrorCb);
        if (this.onNetworkChangeCb) sdk.offNetworkStatusChange(this.onNetworkChangeCb);
        this.onShowCb = this.onHideCb = this.onErrorCb = this.onNetworkChangeCb = undefined;
        super.destroy();
    }
}
