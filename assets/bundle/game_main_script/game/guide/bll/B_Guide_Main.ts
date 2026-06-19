import { CCBusiness } from 'db://oops-framework/module/common/CCBusiness';
import { InitializeEventName } from '../../initialize/InitializeEvent';
import type { IInitializeEventDataMap } from '../../initialize/InitializeEventData';
import { Guide } from '../Guide';

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
        // 引导最大步数（最后一步引导完后自动释放引导相关资源）
        this.ent.GuideModel.last = 2;

        await this.ent.load();
    }
}
