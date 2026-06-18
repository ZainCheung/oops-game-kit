/** 初始化模块事件数据映射 */
export interface IInitializeEventDataMap {
    onInitializeLoginComplete: void;
    onInitializeLoadComplete: void;
}

// 扩展全局事件类型
declare global {
    namespace OopsFramework {
        interface TypedEventMap extends IInitializeEventDataMap {}
    }
}
