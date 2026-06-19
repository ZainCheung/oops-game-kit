import { Label, Node, Prefab, Vec3, _decorator, find, instantiate } from 'cc';
import { oops } from 'db://oops-framework/core/Oops';
import { ecs } from 'db://oops-framework/libs/ecs/ECS';
import { CCView } from 'db://oops-framework/module/common/CCView';
import { Guide } from '../Guide';
import { GuideViewItem } from './V_Guide_Item';
import { ViewUtil } from 'db://oops-framework/core/utils/ViewUtil';

const { ccclass, property } = _decorator;

/** 新手引导提示逻辑 */
@ccclass('GuideViewPromptComp')
@ecs.register('GuideViewPrompt', false)
export class GuideViewPromptComp extends CCView<Guide> {
    private prompt: Node = null!;
    private content: Label = null!;

    start() {
        this.prompt = ViewUtil.createPrefabNode('gui/guide/prefab/prompt');
        this.prompt.parent = oops.gui.guide;
        this.content = find('bg_text/content', this.prompt)!.uiLabel;
        this.hide();
    }

    /** 显示引导提示动画 */
    show(btn: Node) {
        var gvi = btn.getComponent(GuideViewItem)!;
        var step = gvi.step.get(this.ent.GuideModel.step)!;
        if (step.tips) {
            // 提示位置修正到显示对象中心
            var pos = btn.worldPosition.clone();
            var offset: Vec3 = new Vec3();
            // var uit = btn.getComponent(UITransform)!;
            // offset.x = uit.contentSize.width * 0.5 - uit.contentSize.width * uit.anchorX;
            // offset.y = uit.contentSize.height * 0.5 - uit.contentSize.height * uit.anchorY;
            // offset.y = uit.contentSize.height * 0.5 + 50;
            offset.x = step.tipsX!;
            offset.y = step.tipsY!;
            pos = pos.add(offset);

            this.prompt.active = true;
            this.prompt.worldPosition = pos;
            this.prompt.setSiblingIndex(this.prompt.parent!.children.length);

            // 显示提示词
            this.content.string = step.tips!;
        } else {
            this.hide();
        }
    }

    hide() {
        if (this.prompt) this.prompt.active = false;
    }

    reset(): void {
        this.prompt = null!;
        this.content = null!;
    }
}
