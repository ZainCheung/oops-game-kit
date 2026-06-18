import { oops } from 'db://oops-framework/core/Oops';
import { LayerType } from 'db://oops-framework/core/gui/layer/LayerEnum';
import type { UIConfig } from 'db://oops-framework/core/gui/layer/UIConfig';
import { PromptSkip } from 'db://oops-framework/libs/gui/window/PromptSkip';
import { CCBusiness } from 'db://oops-framework/module/common/CCBusiness';
import { classname } from 'db://oops-framework/module/decorator/ClassNameDecorator';
import { GuiAnimUtil } from '../../../utils/GuiAnimUtil';
import { Prompt } from '../Prompt';
import { IPromptEventDataMap, PromptEventName } from '../PromptEvent';

/** Alert窗口配置 */
const UIAlert: UIConfig = {
    layer: LayerType.Dialog,
    bundle: 'game_common',
    prefab: 'gui/window/prefab/PB_Alert',
    mask: true,
};

/** Confirm窗口配置 */
const UIConfirm: UIConfig = {
    layer: LayerType.Dialog,
    bundle: 'game_common',
    prefab: 'gui/window/prefab/PB_Confirm',
    mask: true,
};

/** 可跳过的Confirm窗口配置 */
const UIConfirmSkip: UIConfig = {
    layer: LayerType.Dialog,
    bundle: 'game_common',
    prefab: 'gui/window/prefab/ConfirmSkip',
    mask: true,
};

/** Prompt模块主业务逻辑 */
@classname('B_Prompt_Main')
export class B_Prompt_Main extends CCBusiness<Prompt> {
    protected init() {
        this.event.setEvent(
            PromptEventName.Alert,
            PromptEventName.Confirm,
            PromptEventName.ConfirmSkip,
            PromptEventName.NetError
        );
    }

    //#region 全局事件处理
    /** 处理Alert提示事件 */
    private onPromptAlert<K extends PromptEventName.Alert>(event: K, data: IPromptEventDataMap[K]): void {
        const uip = GuiAnimUtil.getAnimUIParam();
        uip.data = {
            title: data.title || 'common_prompt_title',
            content: data.content,
            okWord: data.okWord || 'common_prompt_ok',
            onOk: data.onOk,
            needCancel: false,
        };
        oops.gui.open(UIAlert, uip);
    }

    /** 处理Confirm确认事件 */
    private onPromptConfirm<K extends PromptEventName.Confirm>(event: K, data: IPromptEventDataMap[K]): void {
        const uip = GuiAnimUtil.getAnimUIParam();
        uip.data = {
            title: data.title || 'common_prompt_title',
            content: data.content,
            okWord: data.okWord || 'common_prompt_ok',
            cancelWord: data.cancelWord || 'common_prompt_cancal',
            onOk: data.onOk,
            onCancel: data.onCancel,
            needCancel: true,
        };
        oops.gui.open(UIConfirm, uip);
    }

    /** 处理可跳过的Confirm事件 */
    private onPromptConfirmSkip<K extends PromptEventName.ConfirmSkip>(event: K, data: IPromptEventDataMap[K]): void {
        // 检查是否已跳过
        if (!PromptSkip.isPrompt(data.skipId)) {
            // 已跳过，直接执行确认回调
            data.onOk?.();
            return;
        }

        const uip = GuiAnimUtil.getAnimUIParam();
        uip.data = {
            id: data.skipId,
            skipDay: data.skipDay || 1,
            title: data.title || 'common_prompt_title',
            content: data.content,
            okWord: data.okWord || 'common_prompt_ok',
            cancelWord: data.cancelWord || 'common_prompt_cancal',
            onOk: data.onOk,
            onCancel: data.onCancel,
            needCancel: true,
        };
        oops.gui.open(UIConfirmSkip, uip);
    }

    /** 处理网络错误提示事件 */
    private onPromptNetError<K extends PromptEventName.NetError>(event: K, data: IPromptEventDataMap[K]): void {
        const uip = GuiAnimUtil.getAnimUIParam();
        uip.data = {
            title: 'common_prompt_title',
            content: data.msg || 'common_net_error',
            okWord: 'common_prompt_ok',
            onOk: data.onOk,
            needCancel: false,
        };
        oops.gui.open(UIAlert, uip);
    }
    //#endregion
}
