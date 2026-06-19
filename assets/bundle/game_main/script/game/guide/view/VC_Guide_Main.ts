import { EventTouch, Node, _decorator, find, isValid } from 'cc';
import { oops } from 'db://oops-framework/core/Oops';
import { ecs } from 'db://oops-framework/libs/ecs/ECS';
import { CCView } from 'db://oops-framework/module/common/CCView';
import { Guide } from '../Guide';
import { GuideEvent } from '../GuideEvent';
import { GuideModelComp } from '../model/M_Guide_Main';
import { GuideStepData, GuideStepDataBox, GuideViewItem } from './V_Guide_Item';
import { GuideViewMaskComp } from './VC_Guide_Mask';
import { GuideViewPromptComp } from './VC_Guide_Prompt';

const { ccclass, property } = _decorator;

/** 新手引导界面管理 */
@ccclass('GuideViewComp')
@ecs.register('GuideView', false)
export class GuideViewComp extends CCView<Guide> {
    /** 保存引导进度回调 */
    onSave: Function = null!;
    /** 点击引导回调 */
    onClick: Function = null!;

    /** 引导遮罩 */
    private mask: GuideViewMaskComp = null!;
    /** 引导提示动画 */
    private prompt: GuideViewPromptComp = null!;

    protected onLoad(): void {
        if (!Guide.Editor) this.event.setEvent(GuideEvent.GuideAutoBind);
    }

    private onGuideAutoBind(event: string, scene: Node) {
        if (this.ent.GuideModel.step >= this.ent.GuideModel.last) return;

        oops.gui.guide.active = true;

        this.prompt = this.getComponent(GuideViewPromptComp)!;
        this.mask = this.getComponent(GuideViewMaskComp)!;
        let data = this.ent.GuideModel.prompts[scene.name];
        if (!data) return;
        data.forEach(d => {
            if (d.step >= this.ent.GuideModel.step) {
                let node = find(d.node, scene);
                if (node) {
                    let gvi = node.getComponent(GuideViewItem);
                    if (gvi == null) gvi = node.addComponent(GuideViewItem);

                    // 设置引导配置数据
                    let gsd: GuideStepData = {
                        scene: scene,
                        step: d.step,
                        offsetW: d.offsetW != null ? d.offsetW : 0,
                        offsetH: d.offsetH != null ? d.offsetH : 0,
                        tips: d.tips != null ? d.tips : '',
                        tipsX: d.tipsX != null ? d.tipsX : 0,
                        tipsY: d.tipsY != null ? d.tipsY : 0,
                        handAngle: d.handAngle != null ? d.handAngle : 0,
                        handAPX: d.handAPX != null ? d.handAPX : 0,
                        handAPY: d.handAPY != null ? d.handAPY : 0,
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
                    if (this.ent.GuideModel.step == gsd.step) {
                        this.ent.GuideView.check();
                    }
                } else {
                    console.error(`新手引导${scene.name}场景${d.node}节点不存在`);
                }
            }
        });
    }

    /** 下一个引导 */
    next(btn: Node) {
        var gvi = btn.getComponent(GuideViewItem)!;
        var gm = this.ent.get(GuideModelComp)!;
        var step = gvi.step.get(gm.step)!;
        if (step) {
            gvi.step.delete(gm.step);
            if (gvi.step.size == 0) gvi.destroy();
        }

        // 引导进行到下一步
        if (step.next) this.ent.GuideModel.step++;

        // 当前引导进度回调
        if (step.save) this.onSave && this.onSave(step.save ?? this.ent.GuideModel.step);
        // oops.log.logView(`验证下一个引擎【${this.model.step}】`);

        if (this.ent.GuideModel.step >= this.ent.GuideModel.last) {
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
            let btn = this.ent.GuideModel.current;
            if (btn == null || !isValid(btn)) {
                this.mask.hide();
                this.prompt.hide();

                oops.log.logView(`暂无引导`);
            } else {
                this.mask.draw(btn);
                this.prompt.show(btn);

                // 引导节点加触摸事件，跳到下一步
                btn.on(Node.EventType.TOUCH_END, this.onTouchEnd, this, true);
                btn.on(Node.EventType.TRANSFORM_CHANGED, this.onTransformChanged, this);
            }
        });
    }

    private onTransformChanged() {
        this.refresh();
    }

    private onTouchEnd(event: EventTouch) {
        var btn = event.target as Node;
        btn.off(Node.EventType.TOUCH_END, this.onTouchEnd, this, true);
        btn.off(Node.EventType.TRANSFORM_CHANGED, this.onTransformChanged, this);

        var gvi = btn.getComponent(GuideViewItem)!;
        // if (gvi) {
        //     // 触发按钮组件
        //     var button = btn.getComponent(Button);
        //     if (button) {
        //         button.clickEvents.forEach(e => {
        //             e.emit([event]);
        //         });

        //         // 点击引导回调
        //         this.onClick && this.onClick(this.guide.GuideModel.step);
        //     }
        //     this.onClick && this.onClick(this.guide.GuideModel.step);
        //     this.next(btn);
        // }
        if (gvi) {
            this.onClick && this.onClick(this.ent.GuideModel.step);
            this.next(btn);
        }
    }

    /** 刷新引导位置 */
    refresh() {
        let btn = this.ent.GuideModel.current;
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
