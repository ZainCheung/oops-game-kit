import { Label, Node, UITransform, Vec3, _decorator, find } from 'cc';
import { oops } from 'db://oops-framework/core/Oops';
import { ecs } from 'db://oops-framework/libs/ecs/ECS';
import { CCView } from 'db://oops-framework/module/common/CCView';
import type { Guide } from '../Guide';
import { GuideDirection, V_Guide_Item } from './V_Guide_Item';
import { ViewUtil } from 'db://oops-framework/core/utils/ViewUtil';

const { ccclass, property } = _decorator;

/** 提示框预制体路径 */
const prefabPrompt = 'gui/guide/prefab/Prompt';

/** 新手引导提示逻辑 */
@ccclass('VC_Guide_Prompt')
@ecs.register('VC_Guide_Prompt', false)
export class VC_Guide_Prompt extends CCView<Guide> {
    private prompt: Node = null!;
    private content: Label = null!;

    start() {
        this.prompt = ViewUtil.createPrefabNode(prefabPrompt);
        this.prompt.parent = oops.gui.guide;
        this.content = find('bg_text/content', this.prompt)!.uiLabel;
        this.hide();
    }

    /** 显示引导提示动画 */
    show(btn: Node) {
        var gvi = btn.getComponent(V_Guide_Item)!;
        var step = gvi.step.get(this.ent.M_Guide_Main.step)!;
        if (step.tips) {
            const direction = step.tipsDirection ?? GuideDirection.Auto;

            // 先激活提示框确保尺寸计算准确
            this.prompt.active = true;
            this.content.string = step.tips!;

            // 延时一帧确保 UITransform 尺寸已更新
            var pos = this.calcTipsPosition(btn, direction);

            this.prompt.worldPosition = pos;
            this.prompt.setSiblingIndex(this.prompt.parent!.children.length);
        } else {
            this.hide();
        }
    }

    /** 根据吸附方位自动计算提示框世界坐标 */
    private calcTipsPosition(btn: Node, direction: GuideDirection): Vec3 {
        const targetUit = btn.getComponent(UITransform)!;
        const promptUit = this.prompt.getComponent(UITransform)!;
        const pos = btn.worldPosition.clone();

        const gap = 50; // 固定间距
        const targetUitSelf = targetUit.contentSize.width / 2;
        const promptUitSelf = promptUit.contentSize.width / 2;

        // 自动检测：目标在屏幕上半部分则提示放上方，否则放下方
        if (direction === GuideDirection.Auto) {
            const localPos = this.prompt.parent!.uiTransform.convertToNodeSpaceAR(btn.worldPosition);
            direction = localPos.y > 0 ? GuideDirection.Top : GuideDirection.Bottom;
        }

        switch (direction) {
            case GuideDirection.Top:
                pos.y += targetUit.contentSize.height + gap + promptUit.contentSize.height;
                break;
            case GuideDirection.Bottom:
                pos.y -= targetUit.contentSize.height + gap + promptUit.contentSize.height;
                break;
            case GuideDirection.Left:
                pos.x -= targetUitSelf + gap + promptUitSelf;
                break;
            case GuideDirection.Right:
                pos.x += targetUitSelf + gap + promptUitSelf;
                break;
        }

        return pos;
    }

    hide() {
        this.prompt.active = false;
    }

    reset(): void {
        this.prompt = null!;
        this.content = null!;
    }
}
