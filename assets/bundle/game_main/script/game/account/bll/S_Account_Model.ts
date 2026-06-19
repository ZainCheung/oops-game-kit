import { ecs } from 'db://oops-framework/libs/ecs/ECS';
import { VM } from 'db://oops-framework/libs/model-view/ViewModel';
import type { Account } from '../Account';
import { AccountMvvmKey } from '../model/M_Account_Enum';
import { M_Account_Model } from '../model/M_Account_Model';

/** 账号数据组件添加移除逻辑 */
@ecs.register('S_Account_Model')
export class S_Account_Model extends ecs.ComblockSystem implements ecs.IEntityEnterSystem, ecs.IEntityRemoveSystem {
    filter(): ecs.IMatcher {
        return ecs.allOf(M_Account_Model);
    }

    entityEnter(e: Account): void {
        VM.add(e.M_Account_Model.base, AccountMvvmKey.AccountBase);
        VM.add(e.M_Account_Model.currency, AccountMvvmKey.AccountCurrency);
    }

    entityRemove(e: Account): void {
        VM.remove(AccountMvvmKey.AccountBase);
        VM.remove(AccountMvvmKey.AccountCurrency);
    }
}
