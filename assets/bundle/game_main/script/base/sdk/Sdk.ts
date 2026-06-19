import { ecs } from 'db://oops-framework/libs/ecs/ECS';
import { CCEntity } from 'db://oops-framework/module/common/CCEntity';
import { B_Sdk_Main } from './bll/B_Sdk_Main';
import './SdkEventData';

/**
 * 平台 SDK 模块实体
 *
 * 负责管理各小游戏平台 SDK 的接入。
 * - 平台无关接口见 {@link ISdk}
 * - 平台自动选择见 {@link SdkManager}
 *
 * 用法：
 * ```ts
 * // 通过 Base 模块访问
 * const sdk = oops... base.sdk.B_Sdk_Main.getSdk();
 * const result = await sdk.login();
 * ```
 *
 * 监听 SDK 事件：
 * ```ts
 * oops.message.on(SdkEventName.Show, (data) => { ... });
 * ```
 */
@ecs.register('Sdk')
export class Sdk extends CCEntity {
    B_Sdk_Main!: B_Sdk_Main;

    protected init() {
        this.addBusinesss(B_Sdk_Main);
    }
}
