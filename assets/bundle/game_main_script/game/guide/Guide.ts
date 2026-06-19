import { JsonAsset, Node } from 'cc';
import { oops } from 'db://oops-framework/core/Oops';
import { ecs } from 'db://oops-framework/libs/ecs/ECS';
import { CCEntity } from 'db://oops-framework/module/common/CCEntity';
import { B_Guide_Main } from './bll/B_Guide_Main';
import { GuideModelComp } from './model/GuideModelComp';
import { GuideViewComp } from './view/GuideViewComp';
import { GuidePromptData } from './view/GuideViewItem';
import { GuideViewMaskComp } from './view/GuideViewMaskComp';
import { GuideViewPromptComp } from './view/GuideViewPromptComp';

/**
 * 新手引导
 * 1、组件方式绑定到引导 Node 上自动注册引导数据
 * 2、通过设置引导步骤可回复到上次引导点
 * 3、触发引导分为穿透模式与事件模拟模式（模拟模式不会导致不规则图形在引导区域中导致误点）
 */
@ecs.register('Guide')
export class Guide extends CCEntity {
    GuideModel!: GuideModelComp;
    GuideView!: GuideViewComp;
    B_Guide_Main!: B_Guide_Main;

    static Editor: boolean = false;

    protected init() {
        this.addComponents<ecs.Comp>(GuideModelComp);
        this.addBusinesss(B_Guide_Main);
    }

    /** 加载引导资源 */
    load(): Promise<void> {
        return new Promise((resolve, reject) => {
            if (this.GuideModel.step >= this.GuideModel.last) {
                resolve();
                return;
            }

            oops.res.loadDir('gui/guide', (err: Error | null) => {
                if (err) console.error('新手引导资源加载失败');

                // 新手引导配置
                this.GuideModel.prompts = oops.res.get('gui/guide/config', JsonAsset)!.json as Record<
                    string,
                    GuidePromptData[]
                >;

                // 注册显示对象到 ECS 实体中
                var gv = oops.gui.guide.addComponent(GuideViewComp);
                this.add(gv);

                var gvm = oops.gui.guide.addComponent(GuideViewMaskComp);
                this.add(gvm);

                var gvp = oops.gui.guide.addComponent(GuideViewPromptComp);
                this.add(gvp);

                // 引导点击事件
                gv.onClick = (step: number) => {
                    // // 显示演示动画
                    // if ([12, 22].includes(step)) {
                    //     oops.gui.open(UIID.GameDemo, step, AnimationUtil.ScaleAnim);
                    // }
                };

                // 每触发下一步存盘事件
                gv.onSave = (step: number) => {};

                resolve();
            });
        });
    }

    /**
     * 注册引导项
     * @param step 引导步骤
     * @param Node 引导节点
     */
    register(step: number, Node: Node) {
        this.GuideModel.guides.set(step, Node);
    }

    /**
     * 检查指定引导是否触发
     * @param step 引导步骤
     */
    check(step: number): void {
        this.GuideModel.step = step;
        this.GuideView.check();
    }
}
