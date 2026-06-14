import { Component, Label, Node, Prefab, UITransform, Vec3, _decorator, instantiate } from 'cc';
import { oops } from 'db://oops-framework/core/Oops';
import type { M_Guide_Main } from '../model/M_Guide_Main';

const { ccclass } = _decorator;

/** 新手引导提示逻辑 */
@ccclass('V_Guide_Prompt')
export class V_Guide_Prompt extends Component {
    private model: M_Guide_Main = null!;
    private prompt: Node = null!;
    private content: Label = null!;

    /** 初始化 */
    init(model: M_Guide_Main) {
        this.model = model;
    }

    start() {
        const prefab: Prefab = oops.res.get(this.model.resPrompt, Prefab)!;
        this.prompt = instantiate(prefab);
        this.prompt.parent = oops.gui.guide;
        this.content = this.prompt.getChildByName('content')!.getComponent(Label)!;
        this.hide();
    }

    /** 显示引导提示动画 */
    show(btn: Node) {
        // 提示位置修正到显示对象中心
        let pos = btn.worldPosition.clone();
        const offset: Vec3 = new Vec3();
        const uit = btn.getComponent(UITransform)!;
        offset.x = uit.contentSize.width * 0.5 - uit.contentSize.width * uit.anchorX;
        offset.y = uit.contentSize.height * 0.5 - uit.contentSize.height * uit.anchorY;
        pos = pos.add(offset);

        this.prompt.active = true;
        this.prompt.worldPosition = pos;
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
}
