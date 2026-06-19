import './GuideEventData';

export {
    type IGuideAutoBindData,
    type IGuideRegisterData,
    type IGuideCheckData,
    type IGuideEventDataMap,
} from './GuideEventData';

/** 新手引导事件枚举 */
export enum GuideEventName {
    /** 新手引导自动绑定触发组件 */
    AutoBind = 'onGuideAutoBind',
    /** 注册引导项 */
    Register = 'onGuideRegister',
    /** 检查指定引导是否触发 */
    Check = 'onGuideCheck',
}
