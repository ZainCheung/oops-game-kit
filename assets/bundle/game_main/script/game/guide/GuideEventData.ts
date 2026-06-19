import type { Node } from 'cc';

/** 新手引导自动绑定事件数据 */
export interface IGuideAutoBindData {
    /** 当前界面根节点 */
    ui: Node;
}

/** 新手引导注册事件数据 */
export interface IGuideRegisterData {
    /** 引导步骤 */
    step: number;
    /** 引导节点 */
    node: Node;
}

/** 新手引导检查事件数据 */
export interface IGuideCheckData {
    /** 引导步骤 */
    step: number;
}

/** 新手引导事件数据映射 */
export interface IGuideEventDataMap {
    onGuideAutoBind: IGuideAutoBindData;
    onGuideRegister: IGuideRegisterData;
    onGuideCheck: IGuideCheckData;
}

// 扩展全局事件类型
declare global {
    namespace OopsFramework {
        interface TypedEventMap extends IGuideEventDataMap { }
    }
}
