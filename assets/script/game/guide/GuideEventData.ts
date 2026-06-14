import type { Node } from 'cc';

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
