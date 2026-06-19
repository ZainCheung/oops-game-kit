/** SDK 模块事件枚举 */
export enum SdkEventName {
    /** SDK 初始化完成 */
    InitComplete = 'onSdkInitComplete',
    /** 切到前台 */
    Show = 'onSdkShow',
    /** 切到后台 */
    Hide = 'onSdkHide',
    /** 全局错误 */
    Error = 'onSdkError',
    /** 网络状态变化 */
    NetworkChange = 'onSdkNetworkChange',
    /** 登录成功 */
    LoginSuccess = 'onSdkLoginSuccess',
    /** 登录失败 */
    LoginFail = 'onSdkLoginFail',
}
