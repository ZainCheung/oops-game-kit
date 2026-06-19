import { EventTouch, Node, _decorator, find, isValid } from 'cc';
import { oops } from 'db://oops-framework/core/Oops';
import { ecs } from 'db://oops-framework/libs/ecs/ECS';
import { CCView } from 'db://oops-framework/module/common/CCView';
import { GuideConst } from '../GuideConst';
import type { Guide } from '../Guide';
import { GuideEventName, type IGuideAutoBindData } from '../GuideEvent';
import { M_Guide_Main } from '../model/M_Guide_Main';
import { VC_Guide_Mask } from './VC_Guide_Mask';
import { VC_Guide_Prompt } from './VC_Guide_Prompt';
import { GuideDirection, GuideStepData, GuideStepDataBox, V_Guide_Item } from './V_Guide_Item';

const { ccclass, property } = _decorator;

/** 新手引导界面管理 */
@ccclass('VC_Guide_Main')
@ecs.register('VC_Guide_Main', false)
export class VC_Guide_Main extends CCView<Guide> {
    /** 保存引导进度回调 */
    onSave: Function = null!;
    /** 点击引导回调 */
    onClick: Function = null!;

    /** 引导遮罩 */
    private mask: VC_Guide_Mask = null!;
    /** 引导提示动画 */
    private prompt: VC_Guide_Prompt = null!;

    protected onLoad(): void {
        if (!GuideConst) this.event.setEvent(GuideEventName.AutoBind);
    }

    private onGuideAutoBind<K extends GuideEventName.AutoBind>(event: K, data: IGuideAutoBindData) {
        const scene = data.ui;
        if (this.ent.M_Guide_Main.step >= this.ent.M_Guide_Main.last) return;

        oops.gui.guide.active = true;

        this.prompt = this.getComponent(VC_Guide_Prompt)!;
        this.mask = this.getComponent(VC_Guide_Mask)!;
        let guideData = this.ent.M_Guide_Main.prompts[scene.name];
        if (!guideData) return;
        guideData.forEach(d => {
            if (d.step >= this.ent.M_Guide_Main.step) {
                let node = find(d.node, scene);
                if (node) {
                    let gvi = node.getComponent(V_Guide_Item);
                    if (gvi == null) gvi = node.addComponent(V_Guide_Item);

                    // 设置引导配置数据
                    let gsd: GuideStepData = {
                        scene: scene,
                        step: d.step,
                        offsetW: d.offsetW != null ? d.offsetW : 0,
                        offsetH: d.offsetH != null ? d.offsetH : 0,
                        tipsDirection: d.tipsDirection != null ? d.tipsDirection : GuideDirection.Auto,
                        tips: d.tips != null ? d.tips : '',
                        handAngle: d.handAngle != null ? d.handAngle : 0,
                        handScale: d.handScale != null ? d.handScale : { x: 1, y: 1 },
                        next: d.next != null ? d.next : true,
                        save: d.save != null ? d.save : 0,
                        weak: d.weak != null ? d.weak : false,
                    };

                    // 设置自定义提示框数据
                    if (d.box) {
                        gsd.box = [];
                        d.box.forEach(bData => {
                            let node = find(bData.node, scene)!;
                            const bd: GuideStepDataBox = {
                                node,
                                offsetW: bData.offsetW != null ? bData.offsetW : 0,
                                offsetH: bData.offsetH != null ? bData.offsetH : 0,
                            };
                            gsd.box!.push(bd);
                        });
                    }

                    // 注册引导数据
                    this.ent.register(gsd.step, node);

                    // 注册引导节点上的步骤
                    gvi.step.set(gsd.step, gsd);

                    // 验证当前是否触发这个引导
                    if (this.ent.M_Guide_Main.step == gsd.step) {
                        this.ent.VC_Guide_Main.check();
                    }
                } else {
                    console.error(`新手引导${scene.name}场景${d.node}节点不存在`);
                }
            }
        });
    }

    /** 下一个引导 */
    next(btn: Node) {
        var gvi = btn.getComponent(V_Guide_Item)!;
        var gm = this.ent.get(M_Guide_Main)!;
        var step = gvi.step.get(gm.step)!;
        if (step) {
            gvi.step.delete(gm.step);
            if (gvi.step.size == 0) gvi.destroy();
        }

        // 引导进行到下一步
        if (step.next) this.ent.M_Guide_Main.step++;

        // 当前引导进度回调
        if (step.save) this.onSave && this.onSave(step.save ?? this.ent.M_Guide_Main.step);
        // oops.log.logView(`验证下一个引擎【${this.model.step}】`);

        if (this.ent.M_Guide_Main.step >= this.ent.M_Guide_Main.last) {
            this.mask.hide();
            this.prompt.hide();
            this.ent.destroy();
            oops.log.logView(`全部结束`);
        } else {
            this.check();
        }
    }

    /** 验证引导 */
    check() {
        // 延时处理是为了避免与cc.Widget组件冲突，引导遮罩出现后，组件位置变了
        this.scheduleOnce(() => {
            let btn = this.ent.M_Guide_Main.current;
            if (btn == null || !isValid(btn)) {
                this.mask.hide();
                this.prompt.hide();

                oops.log.logView(`暂无引导`);
            } else {
                this.mask.draw(btn);
                this.prompt.show(btn);

                // 记录按钮初始位置，避免 draw 引起的 TRANSFORM_CHANGED 无效刷新
                this._lastBtnPos = { x: btn.worldPosition.x, y: btn.worldPosition.y };

                // 引导节点加触摸事件，跳到下一步
                btn.on(Node.EventType.TOUCH_END, this.onTouchEnd, this, true);
                btn.on(Node.EventType.TRANSFORM_CHANGED, this.onTransformChanged, this);
            }
        });
    }

    /** 上一次按钮的世界坐标，用于判断是否真正发生了位移 */
    private _lastBtnPos: { x: number; y: number } | null = null;

    private onTransformChanged() {
        let btn = this.ent.M_Guide_Main.current;
        if (btn) {
            const pos = btn.worldPosition;
            if (this._lastBtnPos) {
                const dx = Math.abs(pos.x - this._lastBtnPos.x);
                const dy = Math.abs(pos.y - this._lastBtnPos.y);
                // 位置未发生实际变化，跳过刷新
                if (dx < 0.5 && dy < 0.5) return;
            }
            this._lastBtnPos = { x: pos.x, y: pos.y };
            this.refresh();
        }
    }

    private onTouchEnd(event: EventTouch) {
        var btn = event.target as Node;
        btn.off(Node.EventType.TOUCH_END, this.onTouchEnd, this, true);
        btn.off(Node.EventType.TRANSFORM_CHANGED, this.onTransformChanged, this);

        var gvi = btn.getComponent(V_Guide_Item)!;
        if (gvi) {
            this.onClick && this.onClick(this.ent.M_Guide_Main.step);
            this.next(btn);
        }
    }

    /** 刷新引导位置 */
    refresh() {
        let btn = this.ent.M_Guide_Main.current;
        if (btn) {
            this.mask.draw(btn);
            this.prompt.show(btn);
        }
    }

    reset(): void {
        this.mask.node.destroy();
        this.prompt.destroy();
        this.mask = null!;
        this.prompt = null!;
        this.destroy();
    }
}
