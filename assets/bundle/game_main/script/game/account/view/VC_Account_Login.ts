import { _decorator } from 'cc';
import { gui } from 'db://oops-framework/core/gui/Gui';
import { LayerType } from 'db://oops-framework/core/gui/layer/LayerEnum';
import { ecs } from 'db://oops-framework/libs/ecs/ECS';
import { CCView } from 'db://oops-framework/module/common/CCView';
import { Account } from '../Account';

const { ccclass, property } = _decorator;

/** VC_Account_Login 界面视图组件 */
@ccclass('VC_Account_Login')
@ecs.register('VC_Account_Login', false)
@gui.register('VC_Account_Login', { layer: LayerType.UI, prefab: 'gui/account/prefab/VC_Account_Login' })
export class VC_Account_Login extends CCView<Account> {
    start() {
        this.button.bind();
    }

    private btnRequestSdkUserInfo() {
        
    }

    /** 释放内存 */
    reset() {

    }
}
