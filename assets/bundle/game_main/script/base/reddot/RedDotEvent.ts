/** 红点事件枚举 - 用于强制约束事件名和数据类型的对应关系 */
export enum RedDotEventName {
    /** 红点节点数据添加 */
    Add = 'onRedDotAdd',
    /** 红点节点数据删除 */
    Remove = 'onRedDotRemove',
    /** 红点节点数据更新 */
    Update = 'onRedDotUpdate',
    /** 绑定红点显示对象 */
    Bind = 'onRedDotBind',
    /** 红点确认逻辑 */
    Confirm = 'onRedDotConfirm',
}

export {
    type IRedDotAddData,
    type IRedDotRemoveData,
    type IRedDotUpdateData,
    type IRedDotBindData,
    type IRedDotConfirmData,
    type IRedDotEventDataMap,
} from './RedDotEventData';
