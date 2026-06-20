import './InitializeEventData';

/** 初始化模块事件枚举 */
export enum InitializeEventName {
    /** 登录完成 */
    LoginComplete = 'onInitializeLoginComplete',
    /** 初始化资源加载完成 */
    LoadComplete = 'onInitializeLoadComplete',
}

export {
    type IInitializeLoginCompleteData,
    type IInitializeLoadCompleteData,
    type IInitializeEventDataMap,
} from './InitializeEventData';
