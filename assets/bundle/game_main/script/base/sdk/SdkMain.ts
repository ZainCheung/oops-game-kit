import { oops } from 'db://oops-framework/core/Oops';
import { SdkEventName } from './SdkEvent';
import { SdkAdsManager } from './SdkAdsManager';
import { SdkManager } from './SdkManager';
import { ISdk } from './ISdk';
import type { Sdk } from './Sdk';
import type { INetworkStatusChangeEvent } from './SdkTypes';

/**
 * 平台 SDK 主业务逻辑
 *
 * 职责：
 * 1. 通过 {@link SdkManager} 识别平台并创建对应 {@link ISdk} 实现。
 * 2. 转发原生生命周期事件（onShow/onHide/onError/网络变化）到全局事件系统。
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

    constructor(sdkModule: Sdk) {
        this.sdkModule = sdkModule;
        this.init();
    }

    private init() {
        oops.log.logBusiness(`[SDK] 平台 = ${this.manager.platform}, 准备就绪 = ${this.sdk.isReady()}`);

        // 转发原生事件到全局事件系统
        this.onShowCb = (res: any) => {
            // 抖音侧边栏进入检测：launch_from == 'homepage' && location == 'sidebar_card'
            if (
                res &&
                res.launch_from === 'homepage' &&
                res.location === 'sidebar_card'
            ) {
                this.sdkModule.model.isFromBytedanceSideBar = true;
            }
            oops.message.emit(SdkEventName.Show, res);
        };
        this.sdk.onShow(this.onShowCb);

        this.onHideCb = () => oops.message.emit(SdkEventName.Hide);
        this.sdk.onHide(this.onHideCb);

        this.onErrorCb = (err: string) => oops.message.emit(SdkEventName.Error, err);
        this.sdk.onError(this.onErrorCb);

        this.onNetworkChangeCb = (res: INetworkStatusChangeEvent) => oops.message.emit(SdkEventName.NetworkChange, res);
        this.sdk.onNetworkStatusChange(this.onNetworkChangeCb);
    }

    /** 销毁，解绑原生事件并释放广告资源 */
    destroy() {
        if (this.onShowCb) this.sdk.offShow(this.onShowCb);
        if (this.onHideCb) this.sdk.offHide(this.onHideCb);
        if (this.onErrorCb) this.sdk.offError(this.onErrorCb);
        if (this.onNetworkChangeCb) this.sdk.offNetworkStatusChange(this.onNetworkChangeCb);
        this.onShowCb = this.onHideCb = this.onErrorCb = this.onNetworkChangeCb = undefined;
        this.adsManager.destroyAll();
        this.manager.destroy();
    }
}
