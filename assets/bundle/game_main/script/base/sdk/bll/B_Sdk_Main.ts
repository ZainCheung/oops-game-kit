import { oops } from 'db://oops-framework/core/Oops';
import { CCBusiness } from 'db://oops-framework/module/common/CCBusiness';
import { classname } from 'db://oops-framework/module/decorator/ClassNameDecorator';
import { Sdk } from '../Sdk';
import { SdkEventName } from '../SdkEvent';
import { SdkManager } from './SdkManager';
import { ISdk } from './ISdk';
import type { INetworkStatusChangeEvent } from '../model/IM_Sdk_Data';

/** 平台 SDK 主业务逻辑 */
@classname('B_Sdk_Main')
export class B_Sdk_Main extends CCBusiness<Sdk> {
    /** SDK 管理器 */
    private readonly manager: SdkManager = new SdkManager();
    /** 当前平台的 SDK 实现接口 */
    readonly sdk: ISdk = this.manager.init();

    /** 缓存的原生事件回调，便于 destroy 时解绑 */
    private onShowCb?: (res: any) => void;
    private onHideCb?: () => void;
    private onErrorCb?: (err: string) => void;
    private onNetworkChangeCb?: (res: INetworkStatusChangeEvent) => void;

    protected init() {
        oops.log.logBusiness(`[SDK] 平台 = ${this.sdk.getPlatform()}, 准备就绪 = ${this.sdk.isReady()}`);

        // 转发原生事件到全局事件系统
        this.onShowCb = (res: any) => this.event.emit(SdkEventName.Show, res);
        this.sdk.onShow(this.onShowCb);

        this.onHideCb = () => this.event.emit(SdkEventName.Hide);
        this.sdk.onHide(this.onHideCb);

        this.onErrorCb = (err: string) => this.event.emit(SdkEventName.Error, err);
        this.sdk.onError(this.onErrorCb);

        this.onNetworkChangeCb = (res: INetworkStatusChangeEvent) => this.event.emit(SdkEventName.NetworkChange, res);
        this.sdk.onNetworkStatusChange(this.onNetworkChangeCb);
    }

    destroy() {
        if (this.onShowCb) this.sdk.offShow(this.onShowCb);
        if (this.onHideCb) this.sdk.offHide(this.onHideCb);
        if (this.onErrorCb) this.sdk.offError(this.onErrorCb);
        if (this.onNetworkChangeCb) this.sdk.offNetworkStatusChange(this.onNetworkChangeCb);
        this.onShowCb = this.onHideCb = this.onErrorCb = this.onNetworkChangeCb = undefined;
        this.manager.destroy();
        super.destroy();
    }
}
