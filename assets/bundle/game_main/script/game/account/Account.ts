import { ecs } from 'db://oops-framework/libs/ecs/ECS';
import { CCEntity } from 'db://oops-framework/module/common/CCEntity';
import { B_Account_Event } from './bll/B_Account_Event';
import { B_Account_Login } from './bll/B_Account_Login';
import { B_Account_Module } from './bll/B_Account_Module';
import { M_Account_Model } from './model/M_Account_Model';
import { B_Account_ViewUI } from './bll/B_Account_ViewUI';

/** 账号模块 */
@ecs.register('Account')
export class Account extends CCEntity {
    M_Account_Model!: M_Account_Model;
    B_Account_Module!: B_Account_Module;
    B_Account_Event!: B_Account_Event;
    B_Account_Login!: B_Account_Login;
    B_Account_ViewUI!: B_Account_ViewUI;

    protected init() {
        this.addComponents(M_Account_Model);
        this.addBusinesss(
            B_Account_Module, 
            B_Account_Event, 
            B_Account_Login, B_Account_ViewUI);
    }
}
