import { AudioClip } from 'cc';
import { _decorator } from 'cc';
import { oops } from 'db://oops-framework/core/Oops';
import { GameComponent } from 'db://oops-framework/module/common/GameComponent';
import { ButtonInterceptor } from 'db://oops-framework/libs/gui/button/ButtonInterceptor';
import ButtonSimple from 'db://oops-framework/libs/gui/button/ButtonSimple';
import { Button } from 'cc';
import { runAllEcsDemos } from './ecs/DemoEcsMain';

const { ccclass } = _decorator;

// ========================================
// DemoMain 组件
// ========================================

/** 教程列表 */
@ccclass('DemoMain')
export class DemoMain extends GameComponent {

    protected async onLoad(): Promise<void> {
        oops.res.defaultBundleName = 'bundle';

        this.button.bind();

        // 加载按钮音效并注册到劫持器
        this.registerButtonSounds();
    }

    /** 点击按钮触发全部 ECS 功能演示（控制台输出） */
    Button() {
        runAllEcsDemos();
    }

    loading() {
        console.log('loading');
    }

    // ========================================
    // 按钮音效相关
    // ========================================

    /**
     * 注册按钮音效
     */
    private async registerButtonSounds(): Promise<void> {
        const audioClip = await this.loadAudioClip('bundle', 'audios/Gravel');
        if (!audioClip) {
            console.warn('[DemoMain] 音效资源加载失败');
            return;
        }

        ButtonInterceptor.instance.registerSound({ class: Button, clip: audioClip });
        ButtonInterceptor.instance.registerSound({ class: ButtonSimple, clip: audioClip });
        ButtonInterceptor.instance.activate();
    }

    /**
     * 加载音频资源
     */
    private async loadAudioClip(bundleName: string, path: string): Promise<AudioClip | null> {
        try {
            return await oops.res.load(bundleName, path, AudioClip);
        } catch (err) {
            console.error(`[DemoMain] 加载音效失败: ${path}`, err);
            return null;
        }
    }
}
