import { ecs } from 'db://oops-framework/libs/ecs/ECS';
import { Button } from './button/Button';
import { Network } from './network/Network';
import { Prompt } from './prompt/Prompt';
import { Sdk } from './sdk/Sdk';
import { Share } from './share/Share';

/** 基础模块 */
export class Base {
    /** 网络模块 */
    readonly network: Network;
    /** 平台 SDK 模块（单例，不再使用 ECS） */
    readonly sdk: Sdk;

    constructor() {
        ecs.getEntity(Button);
        ecs.getEntity(Prompt);
        ecs.getEntity(Share);

        this.network = ecs.getEntity(Network);
        this.sdk = Sdk.instance;
    }
}
