import { AudioClip, Button as CCButton } from 'cc';
import { oops } from 'db://oops-framework/core/Oops';
import { ecs } from 'db://oops-framework/libs/ecs/ECS';
import { ButtonInterceptor } from 'db://oops-framework/libs/gui/button/ButtonInterceptor';
import ButtonSimple from 'db://oops-framework/libs/gui/button/ButtonSimple';
import { CCEntity } from 'db://oops-framework/module/common/CCEntity';

/** 通用按钮模块 */
@ecs.register('Button')
export class Button extends CCEntity {
    protected init() {
        this.registerButtonSounds();
    }

    /**
     * 注册按钮音效
     */
    private async registerButtonSounds(): Promise<void> {
        const audioClip = await oops.res.load('audios/Gravel', AudioClip);
        if (!audioClip) {
            console.error('按钮通用音效资源加载失败');
            return;
        }

        ButtonInterceptor.instance.registerSound({ class: CCButton, clip: audioClip });
        ButtonInterceptor.instance.registerSound({ class: ButtonSimple, clip: audioClip });
        ButtonInterceptor.instance.activate();
    }

    destroy() {
        ButtonInterceptor.instance.deactivate();
        super.destroy();
    }
}
