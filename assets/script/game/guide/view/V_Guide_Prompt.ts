import { Component, Label, Node, Prefab, UITransform, Vec3, _decorator, instantiate } from 'cc';
import { oops } from 'db://oops-framework/core/Oops';
import type { M_Guide_Main } from '../model/M_Guide_Main';

const { ccclass } = _decorator;

/** 复用 Vec3 减少 GC */
const _tempPos = new Vec3();
const _tempOffset = new Vec3();

/** 新手引导提示逻辑 */
@ccclass('V_Guide_Prompt')
export class V_Guide_Prompt extends Component {
    private model: M_Guide_Main = null!;
    private prompt: Node = null!;
    private content: Label = null!;

    /** 初始化（资源加载完成后立即调用，不等 start） */
    init(model: M_Guide_Main) {
        this.model = model;
        const prefab: Prefab = oops.res.get('gui/guide/prefab/Prompt', Prefab)!;
        this.prompt = instantiate(prefab);
        this.prompt.parent = oops.gui.guide;
        this.content = this.prompt.getChildByName('content')!.getComponent(Label)!;
        this.hide();
    }

    /** 显示引导提示动画 */
    show(btn: Node) {
        // 提示位置修正到显示对象中心
        Vec3.copy(_tempPos, btn.worldPosition);
        const uit = btn.getComponent(UITransform)!;
        _tempOffset.x = uit.contentSize.width * 0.5 - uit.contentSize.width * uit.anchorX;
        _tempOffset.y = uit.contentSize.height * 0.5 - uit.contentSize.height * uit.anchorY;
        _tempOffset.z = 0;
        Vec3.add(_tempPos, _tempPos, _tempOffset);

        this.prompt.active = true;
        this.prompt.worldPosition = _tempPos;
        this.prompt.setSiblingIndex(this.prompt.parent!.children.length);
    }

    /** 显示提示词 */
    showPrompt() {
        const p = this.model.prompts[this.model.step];
        this.content.string = p;
    }

    /** 隐藏提示 */
    hide() {
        this.prompt.active = false;
    }

    /** 销毁 instantiate 创建的节点 */
    destroyNode() {
        if (this.prompt && this.prompt.isValid) {
            this.prompt.destroy();
        }
    }
}
