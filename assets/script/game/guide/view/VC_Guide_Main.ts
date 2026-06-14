import { Button, EventTouch, Node, _decorator } from 'cc';
import { ecs } from 'db://oops-framework/libs/ecs/ECS';
import { oops } from 'db://oops-framework/core/Oops';
import { CCView } from 'db://oops-framework/module/common/CCView';
import type { Guide } from '../Guide';
import { GuideEventName } from '../GuideEvent';
import type { IGuideEventDataMap } from '../GuideEventData';
import type { M_Guide_Main } from '../model/M_Guide_Main';
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
    private current: Node | null = null;
    /** checkInternal 的定时器 id */
    private _checkTimer: ReturnType<typeof setTimeout> | null = null;

    async onLoad() {
        this.event.setEvent(GuideEventName.UIDraw, GuideEventName.UIShowPrompt, GuideEventName.UIHide);
        this.res.loadDir('gui/guide', this.onCompleteCallback.bind(this));
    }

    private onCompleteCallback() {
        this.mask = this.node.addComponent(V_Guide_Mask);
        this.mask.init(this.ent.M_Guide_Main);
        this.prompt = this.node.addComponent(V_Guide_Prompt);
        this.prompt.init(this.ent.M_Guide_Main);
    }

    //#region 引导控制
    /** 注册引导项 */
    register(step: number, node: Node): void {
        this.ent.M_Guide_Main.guides.set(step, node);
    }

    /** 检查指定引导是否触发 */
    check(step?: number): void {
        if (step !== undefined) {
            this.ent.M_Guide_Main.step = step;
        }
        this.checkInternal();
    }

    /** 下一个引导 */
    next(): void {
        this.ent.M_Guide_Main.step++;
        oops.log.logBusiness(`验证下一个引导【${this.ent.M_Guide_Main.step}】`, 'Guide');

        if (this.ent.M_Guide_Main.step > this.ent.M_Guide_Main.last) {
            this.event.emit(GuideEventName.UIHide, {});
            this.ent.destroy();
            oops.log.logBusiness(`全部结束`, 'Guide');
        }
        else {
            this.checkInternal();
        }
    }

    /** 刷新引导位置 */
    refresh(): void {
        const btn = this.ent.M_Guide_Main.current;
        if (btn) {
            this.event.emit(GuideEventName.UIDraw, { node: btn });
            this.event.emit(GuideEventName.UIShowPrompt, { node: btn });
        }
    }

    /** 验证当前引导 */
    private checkInternal(): void {
        this._clearCheckTimer();
        const model = this.ent.M_Guide_Main;
        this._checkTimer = setTimeout(() => {
            this._checkTimer = null;
            this._cleanInvalidGuides(model);
            const btn = model.guides.get(model.step);
            if (btn == null) {
                this.event.emit(GuideEventName.UIHide, {});
                oops.log.logBusiness(`暂无引导`, 'Guide');
            }
            else {
                this.event.emit(GuideEventName.UIDraw, { node: btn });
                this.event.emit(GuideEventName.UIShowPrompt, { node: btn });
            }
        });
    }

    /** 清除 checkInternal 的定时器 */
    private _clearCheckTimer() {
        if (this._checkTimer !== null) {
            clearTimeout(this._checkTimer);
            this._checkTimer = null;
        }
    }

    /** 清理已销毁的引导节点引用 */
    private _cleanInvalidGuides(model: M_Guide_Main) {
        model.guides.forEach((node, step) => {
            if (!node.isValid) {
                model.guides.delete(step);
            }
        });
    }
    //#endregion

    //#region 事件处理
    /** UI绘制遮罩 */
    private onGuideUIDraw<K extends GuideEventName.UIDraw>(event: K, data: IGuideEventDataMap[K]): void {
        this.current = data.node;
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
        if (this.current) {
            this.mask.draw(this.current);
            this.prompt.show(this.current);
        }
    }

    private onTouchEnd(event: EventTouch) {
        const btn = event.target as Node;
        btn.off(Node.EventType.TOUCH_END, this.onTouchEnd, this, true);
        btn.off(Node.EventType.TRANSFORM_CHANGED, this.onTransformChanged, this);
        this.current = null;

        // 1. 先走引导下一步（由 next() 统一控制进度和销毁）
        this.next();

        // 2. 再触发按钮业务回调
        const button = btn.getComponent(Button);
        if (button) {
            button.clickEvents.forEach(e => {
                e.emit([event]);
            });
        }
    }

    reset(): void {
        this._clearCheckTimer();

        // 销毁 instantiate 创建的节点，防止内存泄漏
        if (this.mask) {
            this.mask.destroyNode();
            this.mask = null!;
        }
        if (this.prompt) {
            this.prompt.destroyNode();
            this.prompt = null!;
        }
        this.current = null;
    }
}
