import { AudioClip, Button as CCButton } from 'cc';
import { oops } from 'db://oops-framework/core/Oops';
import { ButtonInterceptor } from 'db://oops-framework/libs/gui/button/ButtonInterceptor';
import ButtonSimple from 'db://oops-framework/libs/gui/button/ButtonSimple';
import { CCBusiness } from 'db://oops-framework/module/common/CCBusiness';
import { InitializeEventName } from '../../../game/initialize/InitializeEvent';
import type { IInitializeEventDataMap } from '../../../game/initialize/InitializeEventData';
import { Button } from '../Button';

/** 按钮音效资源包名 */
const audio_bundle = 'game_common';
/** 按钮音效资源路径 */
const audio_path = 'gui/button/audio/click';

/** 通用按钮主业务逻辑 */
export class B_Button_Main extends CCBusiness<Button> {
    protected init() {
        this.event.setEvent(InitializeEventName.LoadComplete);
    }

    /** 初始化资源加载完成，注册按钮音效 */
    private onInitializeLoadComplete<K extends InitializeEventName.LoadComplete>(
        event: K,
        data: IInitializeEventDataMap[K]
    ): void {
        this.registerButtonSounds();
    }

    /** 注册按钮音效 */
    private async registerButtonSounds(): Promise<void> {
        const ac = await oops.res.load(audio_bundle, audio_path, AudioClip);
        if (!ac) {
            oops.log.logBusiness('按钮音效资源加载失败');
            return;
        }

        ButtonInterceptor.instance.registerSound({ class: CCButton, clip: ac });
        ButtonInterceptor.instance.registerSound({ class: ButtonSimple, clip: ac });
        ButtonInterceptor.instance.activate();
    }

    /** 销毁业务逻辑 */
    destroy() {
        ButtonInterceptor.instance.deactivate();
        super.destroy();
    }
}
