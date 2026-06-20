import { ecs } from 'db://oops-framework/libs/ecs/ECS';
import { SdkPlatform } from './enum/EM_Sdk';

@ecs.register('M_Sdk_Main')
export class M_Sdk_Main extends ecs.Comp {
    /** 当前平台类型 */
    platform: SdkPlatform = SdkPlatform.Unknown;

    /** SDK 是否已就绪 */
    isReady: boolean = false;

    reset() {
        this.platform = SdkPlatform.Unknown;
        this.isReady = false;
    }
}
