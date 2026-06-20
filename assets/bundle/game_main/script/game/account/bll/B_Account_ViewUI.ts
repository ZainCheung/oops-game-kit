import type { Node } from 'cc';
import { CCBusiness } from 'db://oops-framework/module/common/CCBusiness';
import { classname } from 'db://oops-framework/module/decorator/ClassNameDecorator';
import type { Account } from '../Account';
import { VC_Account_Login } from '../view/VC_Account_Login';

/** Account视图管理逻辑 */
@classname('B_Account_ViewUI')
export class B_Account_ViewUI extends CCBusiness<Account> {
    /** 打开Login界面 */
    openLogin(): Promise<Node | null> {
        return this.ent.addUi(VC_Account_Login);
    }

    /** 关闭Login界面 */
    removeLogin(): void {
        this.ent.removeUi(VC_Account_Login);
    }
}
