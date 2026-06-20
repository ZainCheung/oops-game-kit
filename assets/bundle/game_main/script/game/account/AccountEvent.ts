import './AccountEventData';

/** 账号模块事件枚举 */
export enum AccountEventName {
    /** 网络重连接 */
    Reconnect = 'onReconnect',
    /** 平台 SDK 登录成功 */
    LoginSuccessSdk = 'onLoginSuccessSdk',
    /** 游戏服务器登录成功 */
    LoginSuccessGame = 'onLoginSuccessGame',
    /** 添加子单例实体 */
    AddChildSingletons = 'onAddChildSingletons',
}

export {
    type IAccountReconnectData,
    type IAccountLoginSuccessSdkData,
    type IAccountLoginSuccessGameData,
    type IAccountAddChildSingletonsData,
    type IAccountEventDataMap,
} from './AccountEventData';
