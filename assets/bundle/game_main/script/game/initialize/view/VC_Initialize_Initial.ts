import { _decorator } from 'cc';
import { oops } from 'db://oops-framework/core/Oops';
import { ecs } from 'db://oops-framework/libs/ecs/ECS';
import { CCView } from 'db://oops-framework/module/common/CCView';
import { gsm } from '../../common/GameSingletonModule';
import type { Initialize } from '../Initialize';
import { VC_Initialize_Loading } from './VC_Initialize_Loading';

const { ccclass } = _decorator;

/** 游戏初始画面 - 避免加载框架通用资源与自定义游戏资源过长时的过度画面 */
@ccclass('VC_Initialize_Initial')
@ecs.register('VC_Initialize_Initial', false)
export class VC_Initialize_Initial extends CCView<Initialize> {
    /** 是否加载多语言包（不需要多语言的游戏可关掉） */
    private useLanguage = false;

    start() {
        this.loadRes();
    }

    /** 游戏必备资源加载 */
    private async loadRes() {
        // 并行加载必备资源
        if (this.useLanguage) {
            const promises: Promise<void>[] = [];
            promises.push(this.loadLanguage());
            await Promise.all(promises);
        }

        // 窗口打开失败事件
        oops.gui.setOpenFailure(this.onOpenFailure);

        await gsm.initialize.addUi(VC_Initialize_Loading);

        // 移除初始画面
        this.remove();
    }

    /** 窗口打开失败事件 */
    private onOpenFailure() {
        oops.gui.toast('网络异常请稍后重试');
    }

    /** 加载化语言包（可选） */
    private loadLanguage(): Promise<void> {
        return new Promise((resolve, reject) => {
            // 设置默认语言
            let lan = oops.storage.get('OopsFrameworkLanguage');
            if (lan == null || lan == '') {
                lan = oops.config.game.languageDefault;
                oops.storage.set('OopsFrameworkLanguage', lan);
            }

            // 加载语言包资源
            oops.language.setLanguage(lan, resolve);
        });
    }

    reset(): void {
        this.node.destroy();
    }
}
