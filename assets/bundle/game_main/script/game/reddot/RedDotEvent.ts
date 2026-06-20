import type { Node } from 'cc';
import type { EM_RedDotType } from './model/enum/EM_RedDot';

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

/** 红点节点数据添加事件数据 */
export interface IRedDotAddData {
    /** 红点配置名称 */
    key: string;
    /** 红点路径关系名 */
    path: string;
}

/** 红点节点数据删除事件数据 */
export interface IRedDotRemoveData {
    /** 红点配置名称 */
    key: string;
}

/** 红点节点数据更新事件数据 */
export interface IRedDotUpdateData {
    /** 红点配置名称 */
    key: string;
    /** 红点数量 / 红点数量变化量 */
    count?: number;
    /** 是否直接赋值，默认true; false:变化量，true:直接赋值 */
    assign?: boolean;
}

/** 绑定红点显示对象事件数据 */
export interface IRedDotBindData {
    /** 红点配置名称 */
    key: string;
    /** 红点所在节点 */
    node: Node;
    /** 显示方式 */
    type?: EM_RedDotType;
}

/** 红点确认逻辑事件数据 */
export interface IRedDotConfirmData {
    /** 红点配置名称 */
    key: string;
    /** 是否保存到本地存储 */
    save: boolean;
}

/**
 * 红点事件数据映射
 * 用于强类型事件系统，将事件名与对应的数据类型关联
 */
export interface IRedDotEventDataMap {
    /** 红点节点数据添加事件 */
    onRedDotAdd: IRedDotAddData;
    /** 红点节点数据删除事件 */
    onRedDotRemove: IRedDotRemoveData;
    /** 红点节点数据更新事件 */
    onRedDotUpdate: IRedDotUpdateData;
    /** 绑定红点显示对象事件 */
    onRedDotBind: IRedDotBindData;
    /** 红点确认逻辑事件 */
    onRedDotConfirm: IRedDotConfirmData;
}

// 扩展全局事件类型
declare global {
    namespace OopsFramework {
        interface TypedEventMap extends IRedDotEventDataMap { }
    }
}
