/** Alert提示窗口数据 */
export interface IPromptAlertData {
    /** 窗口标题 */
    title?: string;
    /** 提示内容 */
    content: string;
    /** 确认按钮文本 */
    okWord?: string;
    /** 确认回调 */
    onOk?: () => void;
}

/** Confirm确认窗口数据 */
export interface IPromptConfirmData {
    /** 窗口标题 */
    title?: string;
    /** 提示内容 */
    content: string;
    /** 确认按钮文本 */
    okWord?: string;
    /** 取消按钮文本 */
    cancelWord?: string;
    /** 确认回调 */
    onOk?: () => void;
    /** 取消回调 */
    onCancel?: () => void;
}

/** 可跳过的Confirm窗口数据 */
export interface IPromptConfirmSkipData {
    /** 跳过标识ID */
    skipId: string;
    /** 窗口标题 */
    title?: string;
    /** 提示内容 */
    content: string;
    /** 确认按钮文本 */
    okWord?: string;
    /** 取消按钮文本 */
    cancelWord?: string;
    /** 确认回调 */
    onOk?: () => void;
    /** 取消回调 */
    onCancel?: () => void;
    /** 跳过提示的时间（单位：日 - 默认一日） */
    skipDay?: number;
}

/** 网络错误提示数据 */
export interface IPromptNetErrorData {
    /** 错误码 */
    code: number;
    /** 错误消息 */
    msg?: string;
    /** 确认回调 */
    onOk?: () => void;
}

/** Prompt模块事件数据映射 */
export interface IPromptEventDataMap {
    onPromptAlert: IPromptAlertData;
    onPromptConfirm: IPromptConfirmData;
    onPromptConfirmSkip: IPromptConfirmSkipData;
    onPromptNetError: IPromptNetErrorData;
}

// 扩展全局事件类型
declare global {
    namespace OopsFramework {
        interface TypedEventMap extends IPromptEventDataMap {}
    }
}
