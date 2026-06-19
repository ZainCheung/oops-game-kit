import { JsonAsset } from 'cc';
import { oops } from 'db://oops-framework/core/Oops';
import { CCBusiness } from 'db://oops-framework/module/common/CCBusiness';
import { InitializeEventName } from '../../initialize/InitializeEvent';
import type { IInitializeEventDataMap } from '../../initialize/InitializeEventData';
import { Guide } from '../Guide';
import { GuidePromptData } from '../view/GuideViewItem';
import { GuideViewComp } from '../view/GuideViewComp';
import { GuideViewMaskComp } from '../view/GuideViewMaskComp';
import { GuideViewPromptComp } from '../view/GuideViewPromptComp';

/** 新手引导主业务逻辑 */
export class B_Guide_Main extends CCBusiness<Guide> {
    protected init() {
        this.event.setEvent(InitializeEventName.LoadComplete);
    }

    /** 初始化资源加载完成，注册新手引导 */
    private async onInitializeLoadComplete<K extends InitializeEventName.LoadComplete>(
        event: K,
        data: IInitializeEventDataMap[K]
    ): Promise<void> {
        // 引导当前位置
        this.ent.GuideModel.step = 1;
        // 引导最大步数（最后一步编号 + 1，用于判断引导是否全部结束）
        this.ent.GuideModel.last = 3;

        await this.load();
    }

    /** 加载引导资源 */
    private load(): Promise<void> {
        return new Promise((resolve, reject) => {
            if (this.ent.GuideModel.step >= this.ent.GuideModel.last) {
                resolve();
                return;
            }
            var gv = oops.gui.guide.addComponent(GuideViewComp);
            this.ent.add(gv);

            // 引导点击事件
            gv.onClick = (step: number) => {
                // // 显示演示动画
                // if ([12, 22].includes(step)) {
                //     oops.gui.open(UIID.GameDemo, step, AnimationUtil.ScaleAnim);
                // }
            };

            // 每触发下一步存盘事件
            gv.onSave = (step: number) => {};

            gv.res.loadDir('gui/guide', (err: Error | null) => {
                if (err) console.error('新手引导资源加载失败');

                var gvm = oops.gui.guide.addComponent(GuideViewMaskComp);
                this.ent.add(gvm);

                var gvp = oops.gui.guide.addComponent(GuideViewPromptComp);
                this.ent.add(gvp);
                
                // 新手引导配置
                this.ent.GuideModel.prompts = oops.res.get('gui/guide/config', JsonAsset)!.json as Record<
                    string,
                    GuidePromptData[]
                >;

                resolve();
            });
        });
    }
}
