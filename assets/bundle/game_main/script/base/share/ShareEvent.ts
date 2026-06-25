/** Share 事件枚举 - 用于强制约束事件名和数据类型的对应关系 */
export enum ShareEventName {

}

/**
 * Share事件数据映射
 * 使用字符串字面量作为 key，与 TypedEventMap 兼容
 */
export interface IShareEventDataMap {

}

declare global {
    namespace OopsFramework {
        interface TypedEventMap extends IShareEventDataMap {}
    }
}
