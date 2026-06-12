import { ecs } from 'db://oops-framework/libs/ecs/ECS';
import { AccountBase } from './AccountBase';
import { AccountCurrency } from './AccountCurrency';

/**
 * 游戏账号数据
 */
@ecs.register('M_Account_Model')
export class M_Account_Model extends ecs.Comp {
    /** 账号基础信息 */
    base: AccountBase = new AccountBase();
    /** 账号金币 */
    currency: AccountCurrency = new AccountCurrency();

    reset() {
        this.base.reset();
        this.currency.reset();
    }
}
