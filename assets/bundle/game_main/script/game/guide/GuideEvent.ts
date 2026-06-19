import './GuideEventData';

export {
    type IGuideAutoBindData,
    type IGuideEventDataMap,
} from './GuideEventData';

/** 新手引导事件枚举 */
export enum GuideEventName {
    /** 新手引导自动绑定触发组件 */
    AutoBind = 'onGuideAutoBind',
}
