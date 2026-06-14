import { Button, EventTouch, Node, _decorator } from 'cc';
import { ecs } from 'db://oops-framework/libs/ecs/ECS';
import { CCView } from 'db://oops-framework/module/common/CCView';
import type { Guide } from '../Guide';
import { GuideEventName } from '../GuideEvent';
import type { IGuideEventDataMap } from '../GuideEventData';
import { V_Guide_Mask } from './V_Guide_Mask';
import { V_Guide_Prompt } from './V_Guide_Prompt';

const { ccclass } = _decorator;

/**
 * 新手引导界面管理
 */
@ccclass('VC_Guide_Main')
@ecs.register('VC_Guide_Main', false)
export class VC_Guide_Main extends CCView<Guide> {
    /** 引导遮罩 */
    private mask: V_Guide_Mask = null!;
    /** 引导提示动画 */
    private prompt: V_Guide_Prompt = null!;
    /** 当前引导目标节点 */
    private currentBtn: Node | null = null;

    onLoad() {
        super.onLoad();
        this.event.setEvent(GuideEventName.UIDraw, GuideEventName.UIShowPrompt, GuideEventName.UIHide);

        this.mask = this.node.addComponent(V_Guide_Mask);
        this.mask.init(this.ent.M_Guide_Main);
        this.prompt = this.node.addComponent(V_Guide_Prompt);
        this.prompt.init(this.ent.M_Guide_Main);
    }

    //#region 事件处理
    /** UI绘制遮罩 */
    private onGuideUIDraw<K extends GuideEventName.UIDraw>(event: K, data: IGuideEventDataMap[K]): void {
        this.currentBtn = data.node;
        this.mask.draw(data.node);

        // 引导节点加触摸事件
        data.node.on(Node.EventType.TOUCH_END, this.onTouchEnd, this, true);
        data.node.on(Node.EventType.TRANSFORM_CHANGED, this.onTransformChanged, this);
    }

    /** UI显示提示 */
    private onGuideUIShowPrompt<K extends GuideEventName.UIShowPrompt>(event: K, data: IGuideEventDataMap[K]): void {
        this.prompt.show(data.node);
        this.prompt.showPrompt();
    }

    /** UI隐藏 */
    private onGuideUIHide<K extends GuideEventName.UIHide>(event: K, data: IGuideEventDataMap[K]): void {
        this.mask.hide();
        this.prompt.hide();
    }
    //#endregion

    private onTransformChanged() {
        if (this.currentBtn) {
            this.mask.draw(this.currentBtn);
            this.prompt.show(this.currentBtn);
        }
    }

    private onTouchEnd(event: EventTouch) {
        const btn = event.target as Node;
        btn.off(Node.EventType.TOUCH_END, this.onTouchEnd, this, true);
        btn.off(Node.EventType.TRANSFORM_CHANGED, this.onTransformChanged, this);
        this.currentBtn = null;

        // 触发按钮组件
        const button = btn.getComponent(Button);
        if (button) {
            button.clickEvents.forEach(e => {
                e.emit([event]);
            });
        }

        // 调用业务层进入下一步
        this.ent.B_Guide_Main.next();
    }

    reset(): void {
        this.mask = null!;
        this.prompt = null!;
        this.currentBtn = null;
    }
}
