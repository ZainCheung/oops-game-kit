import type { INetworkStatusChangeEvent } from './model/data/SdkData';
import { SdkEventName } from './SdkEvent';

/** SDK 初始化完成事件数据 */
export type ISdkInitCompleteData = void;

/** 切到前台事件数据 */
export type ISdkShowData = any;

/** 切到后台事件数据 */
export type ISdkHideData = void;

/** 全局错误事件数据 */
export type ISdkErrorData = string;

/** 网络状态变化事件数据 */
export type ISdkNetworkChangeData = INetworkStatusChangeEvent;

/** SDK 模块事件数据映射 */
export interface ISdkEventDataMap {
    [SdkEventName.InitComplete]: ISdkInitCompleteData;
    [SdkEventName.Show]: ISdkShowData;
    [SdkEventName.Hide]: ISdkHideData;
    [SdkEventName.Error]: ISdkErrorData;
    [SdkEventName.NetworkChange]: ISdkNetworkChangeData;
}

// 扩展全局事件类型
declare global {
    namespace OopsFramework {
        interface TypedEventMap extends ISdkEventDataMap {}
    }
}
