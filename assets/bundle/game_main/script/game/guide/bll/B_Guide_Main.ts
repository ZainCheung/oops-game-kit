import { JsonAsset } from 'cc';
import { oops } from 'db://oops-framework/core/Oops';
import { CCBusiness } from 'db://oops-framework/module/common/CCBusiness';
import { InitializeEventName } from '../../initialize/InitializeEvent';
import type { IInitializeEventDataMap } from '../../initialize/InitializeEventData';
import type { Guide } from '../Guide';
import { GuidePromptData } from '../view/V_Guide_Item';
import { VC_Guide_Main } from '../view/VC_Guide_Main';
import { VC_Guide_Mask } from '../view/VC_Guide_Mask';
import { VC_Guide_Prompt } from '../view/VC_Guide_Prompt';

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
        this.ent.M_Guide_Main.step = 1;
        // 引导最大步数（最后一步编号 + 1，用于判断引导是否全部结束）
        this.ent.M_Guide_Main.last = 3;

        await this.load();
    }

    /** 加载引导资源 */
    private load(): Promise<void> {
        return new Promise((resolve, reject) => {
            if (this.ent.M_Guide_Main.step >= this.ent.M_Guide_Main.last) {
                resolve();
                return;
            }
            var gv = oops.gui.guide.addComponent(VC_Guide_Main);
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

                var gvm = oops.gui.guide.addComponent(VC_Guide_Mask);
                this.ent.add(gvm);

                var gvp = oops.gui.guide.addComponent(VC_Guide_Prompt);
                this.ent.add(gvp);
                
                // 新手引导配置
                this.ent.M_Guide_Main.prompts = oops.res.get('gui/guide/config', JsonAsset)!.json as Record<
                    string,
                    GuidePromptData[]
                >;

                resolve();
            });
        });
    }
}
