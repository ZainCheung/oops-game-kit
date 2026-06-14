import './GuideEventData';

export {
    type IGuideEventDataMap,
    type IGuideCheckData,
    type IGuideNextData,
    type IGuideRegisterData,
    type IGuideRefreshData,
    type IGuideUIDrawData,
    type IGuideUIShowPromptData,
    type IGuideUIHideData,
} from './GuideEventData';

/** 引导模块事件枚举 */
export enum GuideEventName {
    /** 验证引导 */
    Check = 'onGuideCheck',
    /** 下一个引导 */
    Next = 'onGuideNext',
    /** 注册引导项 */
    Register = 'onGuideRegister',
    /** 刷新引导位置 */
    Refresh = 'onGuideRefresh',
    /** UI绘制遮罩 */
    UIDraw = 'onGuideUIDraw',
    /** UI显示提示 */
    UIShowPrompt = 'onGuideUIShowPrompt',
    /** UI隐藏 */
    UIHide = 'onGuideUIHide',
}
