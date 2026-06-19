import './GuideEventData';

export {
    type IGuideEventDataMap,
    type IGuideUIDrawData,
    type IGuideUIShowPromptData,
    type IGuideUIHideData,
} from './GuideEventData';

/** 引导模块事件枚举 */
export enum GuideEventName {
    /** UI绘制遮罩 */
    UIDraw = 'onGuideUIDraw',
    /** UI显示提示 */
    UIShowPrompt = 'onGuideUIShowPrompt',
    /** UI隐藏 */
    UIHide = 'onGuideUIHide',
}
