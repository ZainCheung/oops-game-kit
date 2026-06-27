import { _decorator } from 'cc';
import { gui } from 'db://oops-framework/core/gui/Gui';
import { LayerType } from 'db://oops-framework/core/gui/layer/LayerEnum';
import { GameComponent } from 'db://oops-framework/module/common/GameComponent';

const { ccclass } = _decorator;

/** V_Account_Authorization 界面视图组件 */
@ccclass('V_Account_Authorization')
@gui.register('V_Account_Authorization', { layer: LayerType.PopUp, prefab: 'gui/account/prefab/V_Account_Authorization' })
export class V_Account_Authorization extends GameComponent {
    /** 隐私操作回调（由外部注入） */
    onPrivacyAction?: (action: 'agree' | 'disagree') => void;

    onLoad() {
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
}
