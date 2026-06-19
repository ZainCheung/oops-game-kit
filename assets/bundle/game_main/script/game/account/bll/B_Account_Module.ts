import { CCBusiness } from 'db://oops-framework/module/common/CCBusiness';
import { classname } from 'db://oops-framework/module/decorator/ClassNameDecorator';
import { CCEntity } from 'db://oops-framework/module/common/CCEntity';
import type { Account } from '../Account';
import { Guide } from '../../guide/Guide';
import { RedDot } from '../../reddot/RedDot';

/** 账号子模块管理 */
@classname('B_Account_Module')
export class B_Account_Module extends CCBusiness<Account> {
    protected init() {
        this.ent.addChildSingletons<CCEntity>(Guide, RedDot);
    }
}
