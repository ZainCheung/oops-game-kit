import type { INetworkStatusChangeEvent } from './model/data/SdkData';

/** SDK 模块事件数据映射 */
export interface ISdkEventDataMap {
    /** SDK 初始化完成 */
    onSdkInitComplete: void;
    /** 切到前台（data 为平台原始 onShow 返回值） */
    onSdkShow: any;
    /** 切到后台 */
    onSdkHide: void;
    /** 全局错误 */
    onSdkError: string;
    /** 网络状态变化 */
    onSdkNetworkChange: INetworkStatusChangeEvent;
}

// 扩展全局事件类型（与 InitializeEventData.ts 风格一致）
declare global {
    namespace OopsFramework {
        interface TypedEventMap extends ISdkEventDataMap {}
    }
}
