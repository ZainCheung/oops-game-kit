import { ecs } from 'db://oops-framework/libs/ecs/ECS';
import { CCEntity } from 'db://oops-framework/module/common/CCEntity';
import { B_Account_Event } from './bll/B_Account_Event';
import { B_Account_Login } from './bll/B_Account_Login';
import { B_Account_Module } from './bll/B_Account_Module';
import { M_Account_Model } from './model/M_Account_Model';

/** 账号模块 */
@ecs.register('Account')
export class Account extends CCEntity {
    M_Account_Model!: M_Account_Model;
    B_Account_Module!: B_Account_Module;
    B_Account_Event!: B_Account_Event;
    B_Account_Login!: B_Account_Login;

    protected init() {
        this.addComponents(M_Account_Model);
        this.B_Account_Module = this.addBusiness(B_Account_Module);
        this.B_Account_Event = this.addBusiness(B_Account_Event);
        this.B_Account_Login = this.addBusiness(B_Account_Login);
    }
}
