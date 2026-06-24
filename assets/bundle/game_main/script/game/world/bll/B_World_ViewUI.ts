import type { Node } from 'cc';
import { CCBusiness } from 'db://oops-framework/module/common/CCBusiness';
import type { World } from '../World';
import { VC_World_Main } from '../view/VC_World_Main';

/** World视图管理逻辑 */
export class B_World_ViewUI extends CCBusiness<World> {
    /** 打开Main界面 */
    openMain(): Promise<Node | null> {
        return this.ent.addUi(VC_World_Main);
    }

    /** 关闭Main界面 */
    removeMain(): void {
        this.ent.removeUi(VC_World_Main);
    }
}
