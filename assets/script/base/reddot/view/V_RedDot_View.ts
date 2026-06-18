import { _decorator, CCString, Enum, Label } from 'cc';
import { EDITOR_NOT_IN_PREVIEW } from 'cc/env';
import { BhvFrameIndex } from 'db://oops-framework/libs/model-view/ui/BhvFrameIndex';
import { GameComponent } from 'db://oops-framework/module/common/GameComponent';
import { EM_RedDotType } from '../model/enum/EM_RedDot';
import type { IM_RedDot_Node } from '../model/interface/IM_RedDot_Node';
import { RedDotEventName, type IRedDotAddData, type IRedDotUpdateData, type IRedDotBindData, type IRedDotConfirmData } from '../RedDotEvent';

const { ccclass, property } = _decorator;

const Style = Enum(EM_RedDotType);

/**
 * 红点组件
 * 1、绑定到自定义红点预制上控制红点样式与是否显示逻辑
 */
@ccclass('V_RedDot_View')
export class V_RedDot_View extends GameComponent {
    @property(Label)
        count: Label = null!;

    @property(CCString)
    /** 红点唯一关键字 */
        key = '';
    /** 红点样式 */
    @property({ type: Style })
        style = Style.Default;

    onLoad() {
        // 静态红点数据通过组件检查器设置
        if (!EDITOR_NOT_IN_PREVIEW) this.bind();
    }

    init(key: string, path: string) {
        this.key = key;
        const addData: IRedDotAddData = { key, path };
        const updateData: IRedDotUpdateData = { key, count: 1 };
        this.emit(RedDotEventName.Add, addData);
        this.emit(RedDotEventName.Update, updateData);
    }

    /**
     * 初始化红点
     * @param count     红点数量
     */
    bind() {
        if (this.key != '') {
            const bindData: IRedDotBindData = { key: this.key, node: this.node, type: this.style };
            this.emit(RedDotEventName.Bind, bindData);
        }
    }

    /**
     * 红点自定义显示效果，可扩展
     * @param rdn  红点数据
     */
    setState(rdn: IM_RedDot_Node) {
        // 是否显示红点
        this.node.active = rdn.count > 0;

        // 不同类型的红点显示效果
        switch (rdn.type) {
            case EM_RedDotType.Default:
                this.count.string = rdn.count < 100 ? rdn.count.toString() : '99+';
                break;
            default:
                this.count.node.active = false;
                break;
        }

        // 红点图标类型
        const bfi = this.node.getComponent(BhvFrameIndex);
        if (bfi) bfi.index = rdn.type;
    }

    /** 红点确认 */
    confirm(save: boolean) {
        const confirmData: IRedDotConfirmData = { key: this.key, save };
        this.emit(RedDotEventName.Confirm, confirmData);
    }
}
