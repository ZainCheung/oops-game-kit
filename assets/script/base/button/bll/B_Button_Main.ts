import { AudioClip, Button as CCButton } from 'cc';
import { oops } from 'db://oops-framework/core/Oops';
import { ButtonInterceptor } from 'db://oops-framework/libs/gui/button/ButtonInterceptor';
import ButtonSimple from 'db://oops-framework/libs/gui/button/ButtonSimple';
import { CCBusiness } from 'db://oops-framework/module/common/CCBusiness';
import { InitializeEventName } from '../../../game/initialize/InitializeEvent';
import type { IInitializeEventDataMap } from '../../../game/initialize/InitializeEventData';
import { Button } from '../Button';

/** 通用按钮主业务逻辑 */
export class B_Button_Main extends CCBusiness<Button> {
    protected init() {
        this.setWatch();
    }

    /** 注册事件监听 */
    private setWatch() {
        this.event.watch(InitializeEventName.LoadComplete, this.onInitializeLoadComplete, this);
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
        const audioClip = await oops.res.load('audios/Gravel', AudioClip);
        if (!audioClip) {
            oops.log.logBusiness('按钮音效资源加载失败');
            return;
        }

        ButtonInterceptor.instance.registerSound({ class: CCButton, clip: audioClip });
        ButtonInterceptor.instance.registerSound({ class: ButtonSimple, clip: audioClip });
        ButtonInterceptor.instance.activate();
    }

    /** 销毁业务逻辑 */
    destroy() {
        ButtonInterceptor.instance.deactivate();
        super.destroy();
    }
}
