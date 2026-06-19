import './AccountEventData';

export {
    type IAccountEventDataMap,
    type IAccountReconnectData,
    type IAccountLoginSuccessSdkData,
    type IAccountLoginSuccessGameData,
    type IAccountAddChildSingletonsData
} from './AccountEventData';

/** 账号模块事件 */
export const AccountEvent = {
    /** 网络重连接 */
    Reconnect: 'onReconnect',
    /** 平台 SDK 登录成功 */
    LoginSuccessSdk: 'onLoginSuccessSdk',
    /** 游戏服务器登录成功 */
    LoginSuccessGame: 'onLoginSuccessGame',
    /** 添加子单例实体 */
    AddChildSingletons: 'onAddChildSingletons'
} as const;

/** 账号模块事件名类型 */
export type AccountEventName = typeof AccountEvent[keyof typeof AccountEvent];
