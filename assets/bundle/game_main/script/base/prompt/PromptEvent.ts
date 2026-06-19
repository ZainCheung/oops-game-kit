/** Prompt模块事件枚举 */
export enum PromptEventName {
    /** 打开Alert提示窗口 */
    Alert = 'onPromptAlert',
    /** 打开Confirm确认窗口 */
    Confirm = 'onPromptConfirm',
    /** 打开可跳过的Confirm窗口 */
    ConfirmSkip = 'onPromptConfirmSkip',
    /** 网络错误提示 */
    NetError = 'onPromptNetError',
}

export {
    type IPromptAlertData,
    type IPromptConfirmData,
    type IPromptConfirmSkipData,
    type IPromptNetErrorData,
    type IPromptEventDataMap,
} from './PromptEventData';
