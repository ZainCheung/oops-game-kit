import type { Node } from 'cc';
import { CCBusiness } from 'db://oops-framework/module/common/CCBusiness';
import { classname } from 'db://oops-framework/module/decorator/ClassNameDecorator';
import type { Account } from '../Account';
import { V_Account_Authorization } from '../view/V_Account_Authorization';

/** Account视图管理逻辑 */
@classname('B_Account_ViewUI')
export class B_Account_ViewUI extends CCBusiness<Account> {
    // /** 打开Login界面 */
    // openLogin(): Promise<Node | null> {
    //     return this.ent.addUi(VC_Account_Login);
    // }

    // /** 关闭Login界面 */
    // removeLogin(): void {
    //     this.ent.removeUi(VC_Account_Login);
    // }

    /** 打开Authorization界面 */
    openAuthorization(): Promise<Node | null> {
        return this.ent.addUi(V_Account_Authorization);
    }

    /** 关闭Authorization界面 */
    removeAuthorization(): void {
        this.ent.removeUi(V_Account_Authorization);
    }
}
