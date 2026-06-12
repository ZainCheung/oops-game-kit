import type { CCEntity } from 'db://oops-framework/module/common/CCEntity';

/** 网络重连接事件数据 */
export interface IAccountReconnectData {
    /** 是否需要重新登录 */
    needRelogin?: boolean;
    /** 重连次数 */
    retryCount?: number;
}

/** 平台 SDK 登录成功事件数据 */
export interface IAccountLoginSuccessSdkData {
    /** SDK 用户 ID */
    userId?: string;
    /** SDK Token */
    token?: string;
    /** 平台类型 */
    platform?: string;
}

/** 游戏服务器登录成功事件数据 */
export interface IAccountLoginSuccessGameData {
    /** 游戏服务器用户 ID */
    userId?: string;
    /** 会话 ID */
    sessionId?: string;
    /** 服务器时间 */
    serverTime?: number;
}

/** 添加子单例实体事件数据 */
export interface IAccountAddChildSingletonsData {
    /** 实体类 */
    entityClass: OopsFramework.EntityCtor<CCEntity>;
    /** 实体实例 */
    entity?: CCEntity;
}

/**
 * 账号模块事件数据映射
 * 用于强类型事件系统，将事件名与对应的数据类型关联
 */
export interface IAccountEventDataMap {
    /** 网络重连接事件 */
    onReconnect: IAccountReconnectData;
    /** 平台 SDK 登录成功事件 */
    onLoginSuccessSdk: IAccountLoginSuccessSdkData;
    /** 游戏服务器登录成功事件 */
    onLoginSuccessGame: IAccountLoginSuccessGameData;
    /** 添加子单例实体事件 */
    onAddChildSingletons: IAccountAddChildSingletonsData;
}

// 扩展全局事件类型
declare global {
    namespace OopsFramework {
        interface TypedEventMap extends IAccountEventDataMap {}
    }
}
