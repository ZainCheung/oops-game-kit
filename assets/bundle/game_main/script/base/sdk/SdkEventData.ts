import type { INetworkStatusChangeEvent } from './model/IM_Sdk_Data';

/** SDK 模块事件枚举 */
export enum SdkEventName {
    /** 切到前台 */
    Show = 'onSdkShow',
    /** 切到后台 */
    Hide = 'onSdkHide',
    /** 全局错误 */
    Error = 'onSdkError',
    /** 网络状态变化 */
    NetworkChange = 'onSdkNetworkChange',
    /** 登录成功 */
    LoginSuccess = 'onSdkLoginSuccess',
    /** 登录失败 */
    LoginFail = 'onSdkLoginFail',
}

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
