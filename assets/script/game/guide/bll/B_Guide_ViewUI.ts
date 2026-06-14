import { oops } from 'db://oops-framework/core/Oops';
import { CCBusiness } from 'db://oops-framework/module/common/CCBusiness';
import type { Guide } from '../Guide';
import { VC_Guide_Main } from '../view/VC_Guide_Main';

/** 引导视图管理业务 */
export class B_Guide_ViewUI extends CCBusiness<Guide> {
    /** 加载引导资源并创建视图 */
    load(callback: Function): void {
        oops.res.loadDir(this.ent.M_Guide_Main.resDir, (err: Error | null) => {
            if (err) {
                oops.log.logBusiness(`引导资源加载失败`, 'Guide');
            }
            const gv = oops.gui.guide.addComponent(VC_Guide_Main);
            this.ent.add(gv);
            callback();
        });
    }

    /** 移除引导视图 */
    removeMain(): void {
        this.ent.remove(VC_Guide_Main);
    }

    /** 释放引导资源 */
    release(): void {
        oops.res.releaseDir(this.ent.M_Guide_Main.resDir);
    }
}
