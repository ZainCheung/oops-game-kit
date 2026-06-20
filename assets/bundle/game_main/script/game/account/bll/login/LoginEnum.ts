export enum LoginProcessType {
    /** 待机 */
    None,
    /** 游戏 SDK 登录失败 */
    SdkLogin,
    /** 获取用户头像失败 */
    SdkUserInfo,
    /** 网络连接失败 */
    ConnectNet,
    /** 请求游戏配置表数据失败 */
    GameTable,
    /** 请求游戏账号数据 */
    GameData,
    /** 进入游戏失败 */
    EnterGame
}
