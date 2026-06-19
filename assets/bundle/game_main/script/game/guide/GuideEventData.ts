import type { Node } from 'cc';

/** 新手引导自动绑定事件数据 */
export interface IGuideAutoBindData {
    /** 当前界面根节点 */
    ui: Node;
}

/** 新手引导事件数据映射 */
export interface IGuideEventDataMap {
    onGuideAutoBind: IGuideAutoBindData;
}

// 扩展全局事件类型
declare global {
    namespace OopsFramework {
        interface TypedEventMap extends IGuideEventDataMap { }
    }
}
