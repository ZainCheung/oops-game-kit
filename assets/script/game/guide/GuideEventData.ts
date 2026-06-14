import type { Node } from 'cc';

/** 验证引导事件数据 */
export interface IGuideCheckData {
}

/** 下一个引导事件数据 */
export interface IGuideNextData {
}

/** 注册引导项事件数据 */
export interface IGuideRegisterData {
    /** 引导步骤 */
    step: number;
    /** 引导节点 */
    node: Node;
}

/** 刷新引导位置事件数据 */
export interface IGuideRefreshData {
}

/** UI绘制遮罩事件数据 */
export interface IGuideUIDrawData {
    /** 引导目标节点 */
    node: Node;
}

/** UI显示提示事件数据 */
export interface IGuideUIShowPromptData {
    /** 引导目标节点 */
    node: Node;
}

/** UI隐藏事件数据 */
export interface IGuideUIHideData {
}

/** 引导模块事件数据映射 */
export interface IGuideEventDataMap {
    onGuideCheck: IGuideCheckData;
    onGuideNext: IGuideNextData;
    onGuideRegister: IGuideRegisterData;
    onGuideRefresh: IGuideRefreshData;
    onGuideUIDraw: IGuideUIDrawData;
    onGuideUIShowPrompt: IGuideUIShowPromptData;
    onGuideUIHide: IGuideUIHideData;
}

// 扩展全局事件类型
declare global {
    namespace OopsFramework {
        interface TypedEventMap extends IGuideEventDataMap {}
    }
}
