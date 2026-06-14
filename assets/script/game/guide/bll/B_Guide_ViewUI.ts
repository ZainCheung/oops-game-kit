import { CCBusiness } from 'db://oops-framework/module/common/CCBusiness';
import type { Guide } from '../Guide';
import { VC_Guide_Main } from '../view/VC_Guide_Main';

/** 引导视图管理业务 */
export class B_Guide_ViewUI extends CCBusiness<Guide> {
    /** 打开引导主界面 */
    openMain(): void {
        this.ent.addUi(VC_Guide_Main);
    }

    /** 关闭引导主界面 */
    removeMain(): void {
        this.ent.removeUi(VC_Guide_Main);
    }
}
