import { _decorator } from 'cc';
import { gui } from 'db://oops-framework/core/gui/Gui';
import { LayerType } from 'db://oops-framework/core/gui/layer/LayerEnum';
import { ecs } from 'db://oops-framework/libs/ecs/ECS';
import { CCView } from 'db://oops-framework/module/common/CCView';
import { Account } from '../Account';

const { ccclass } = _decorator;

/** VC_Account_Login 界面视图组件 */
@ccclass('VC_Account_Login')
@ecs.register('VC_Account_Login', false)
@gui.register('VC_Account_Login', { layer: LayerType.PopUp, prefab: 'gui/account/prefab/VC_Account_Login' })
export class VC_Account_Login extends CCView<Account> {
    protected mvvm = true;
    protected data: any = {};

    /** 隐私操作回调（由外部注入） */
    onPrivacyAction?: (action: 'agree' | 'disagree') => void;

    onLoad() {
        super.onLoad();
        this.setWatch();
        this.button.bind();
    }

    //#region 按钮事件
    private btnRequestSdkUserInfo(): void {
        this.onPrivacyAction?.('agree');
        this.remove();
    }

    private btnPrimarily(): void {
        this.onPrivacyAction?.('agree');
        this.remove();
    }

    private btnRejectSdkUserInfo(): void {
        this.onPrivacyAction?.('disagree');
        this.remove();
    }
    //#endregion

    //#region 全局事件
    private setWatch() {
        // 本界面无全局事件监听
    }
    //#endregion

    //#region 资源加载
    //#endregion

    reset(): void { }
}
