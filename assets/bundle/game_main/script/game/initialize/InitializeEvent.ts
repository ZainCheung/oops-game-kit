/** 初始化模块事件枚举 */
export enum InitializeEventName {
    /** 登录完成 */
    LoginComplete = 'onInitializeLoginComplete',
    /** 初始化资源加载完成 */
    LoadComplete = 'onInitializeLoadComplete',
}

/** 登录完成事件数据 */
export type IInitializeLoginCompleteData = void;

/** 初始化资源加载完成事件数据 */
export type IInitializeLoadCompleteData = void;

/** 初始化模块事件数据映射 */
export interface IInitializeEventDataMap {
    onInitializeLoginComplete: IInitializeLoginCompleteData;
    onInitializeLoadComplete: IInitializeLoadCompleteData;
}

// 扩展全局事件类型
declare global {
    namespace OopsFramework {
        interface TypedEventMap extends IInitializeEventDataMap {}
    }
}
