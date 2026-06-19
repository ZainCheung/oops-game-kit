import { _decorator, EventTouch, Graphics, Mask, Node, UITransform, v2, Widget } from 'cc';
import { ViewUtil } from 'db://oops-framework/core/utils/ViewUtil';
import { ecs } from 'db://oops-framework/libs/ecs/ECS';
import { CCView } from 'db://oops-framework/module/common/CCView';
import { Guide } from '../Guide';
import { GuideStepData, GuideViewItem } from './V_Guide_Item';

const { ccclass, property } = _decorator;

/** 新后引导遮罩逻辑 */
@ccclass('GuideViewMaskComp')
@ecs.register('GuideViewMask', false)
export class GuideViewMaskComp extends CCView<Guide> {
    private bg: Node = null!;
    private mask: Node = null!;
    private mask_widget: Widget = null!;
    private holes: { cx: number; cy: number; width: number; height: number }[] = [];

    start() {
        this.mask = ViewUtil.createPrefabNode('gui/guide/prefab/mask');
        this.mask.parent = this.node;
        this.bg = this.mask.getChildByName('bg')!;
        this.mask_widget = this.bg.getComponent(Widget)!;

        this.node.active = false;
    }

    /** 显示引导 */
    show(gsd: GuideStepData) {
        this.node.active = true;
        this.mask_widget.target = this.node;
        this.node.on(Node.EventType.TOUCH_END, this.onTouchEnd, this);
        this.node.on(Node.EventType.TOUCH_START, this.onTouchEnd, this);

        // 弱引导不显示遮罩
        if (gsd.weak) {
            this.mask.active = false;
        }
        // 强引导显示遮罩
        else {
            this.mask.active = true;
        }
    }

    /** 隐藏引导 */
    hide() {
        this.node.off(Node.EventType.TOUCH_END, this.onTouchEnd, this);
        this.node.off(Node.EventType.TOUCH_START, this.onTouchEnd, this);

        this.node.active = false;
    }

    /** 绘制遮罩 */
    draw(btn: Node) {
        // 清理旧数据
        this.holes.splice(0, this.holes.length);
        for (let i = this.node.children.length - 1; i >= 0; i--) {
            const node = this.node.children[i];
            node.name == 'box' && node.destroy();
        }
        // 绘制引导可点击区域
        var gvi = btn.getComponent(GuideViewItem)!;

        // 引导步骤
        var step = gvi.step.get(this.ent.GuideModel.step)!;

        // 主提示框架
        var box = this.createBox(btn, step.offsetW!, step.offsetH!);

        // 手势
        var hand = box.getChildByName('hand')!;
        hand.angle = step.handAngle!;
        hand.setScale(step.handScale!.x, step.handScale!.y);
        hand.setPosition(step.handAPX!, step.handAPY!);

        // 附引导框架
        if (step.box) {
            step.box.forEach(b => {
                box = this.createBox(b.node, b.offsetW!, b.offsetH!);
                box.getChildByName('hand')?.destroy();
            });
        }

        const g: Graphics = this.mask.getComponent(Graphics)!;
        g.clear();
        for (let i = 0; i < this.holes.length; i++) {
            const data = this.holes[i];
            g.rect(data.cx - data.width / 2, data.cy - data.height / 2, data.width, data.height);
        }

        if (this.holes.length > 0) {
            g.close();
            g.stroke();
            g.fill();

            const mask = this.mask.getComponent(Mask)!;
            mask.enabled = true; // 通过禁用再启用来刷新
        }

        this.show(step);
    }

    /** 创建引导框 */
    private createBox(btn: Node, offsetW: number, offsetH: number) {
        var uit = btn.getComponent(UITransform)!;
        var w = uit.contentSize.width + offsetW!;
        var h = uit.contentSize.height + offsetH!;

        var offset = 50; // 边框宽度偏移
        var box = ViewUtil.createPrefabNode('gui/guide/prefab/box');
        box.parent = this.node;
        box.uiTransform.setContentSize(w + offset, h + offset);
        let pos = btn.worldPosition.clone();
        if (uit.anchorY == 0) pos.y += box.uiTransform.height * 0.5 - offset / 2;
        if (uit.anchorY == 1) pos.y -= box.uiTransform.height * 0.5 - offset / 2;
        if (uit.anchorX == 0) pos.x += box.uiTransform.width * 0.5 - offset / 2;
        if (uit.anchorX == 1) pos.x -= box.uiTransform.width * 0.5 + offset / 2;
        box.setWorldPosition(pos);

        const position = this.node.uiTransform.convertToNodeSpaceAR(pos);
        this.holes.push({ cx: position.x, cy: position.y, width: w, height: h });

        return box;
    }

    /** 事件模拟触发目标按钮触摸事件 */
    private onTouchEnd(event: EventTouch) {
        var gm = this.ent.GuideModel;
        var btn = gm.current;
        if (btn) {
            var touchPos = ViewUtil.calculateScreenPosToSpacePos(event, this.node);
            touchPos = ViewUtil.calculateASpaceToBSpacePos(this.node, btn.parent!, touchPos);
            var uiPos = v2(touchPos.x, touchPos.y);

            // 判断触摸点是否在按钮上
            var rect = btn.uiTransform.getBoundingBox();
            var gvi = btn.getComponent(GuideViewItem)!;
            var step = gvi.step.get(gm.step)!;
            rect.x -= step.offsetW! / 2;
            rect.y -= step.offsetH! / 2;
            rect.width += step.offsetW!;
            rect.height += step.offsetH!;

            // 触摸引导节点范围内
            if (rect.contains(uiPos)) {
                btn.dispatchEvent(event);
                event.preventSwallow = true;
            }
            // 点击任意地方跳过
            else {
                event.preventSwallow = false;
                if (step.weak) {
                    const gv = this.ent.GuideView;
                    gv.next(btn);
                }
            }
        }
    }

    reset(): void {
        this.bg.destroy();
        this.bg = null!;
        this.mask = null!;
        this.mask_widget = null!;
        this.holes = null!;
    }
}
