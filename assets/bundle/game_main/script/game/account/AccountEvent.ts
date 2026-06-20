import type { CCEntity } from 'db://oops-framework/module/common/CCEntity';

/** 账号模块事件枚举 */
export enum AccountEventName {
    /** 网络重连接 */
    Reconnect = 'onReconnect',
    /** 游戏服务器登录成功 */
    LoginSuccessGame = 'onLoginSuccessGame',
    /** 添加子单例实体 */
    AddChildSingletons = 'onAddChildSingletons',
}

/** 网络重连接事件数据 */
export interface IAccountReconnectData {
    /** 是否需要重新登录 */
    needRelogin?: boolean;
    /** 重连次数 */
    retryCount?: number;
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

/** 账号模块事件数据映射 */
export interface IAccountEventDataMap {
    [AccountEventName.Reconnect]: IAccountReconnectData;
    [AccountEventName.LoginSuccessGame]: IAccountLoginSuccessGameData;
    [AccountEventName.AddChildSingletons]: IAccountAddChildSingletonsData;
}

// 扩展全局事件类型
declare global {
    namespace OopsFramework {
        interface TypedEventMap extends IAccountEventDataMap {}
    }
}
