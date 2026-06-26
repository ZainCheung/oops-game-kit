import { ecs } from 'db://oops-framework/libs/ecs/ECS';
import { Advertising } from './advertising/Advertising';
import { Button } from './button/Button';
import { Network } from './network/Network';
import { Prompt } from './prompt/Prompt';
import { Sdk } from './sdk/Sdk';
import { Share } from './share/Share';

/** 基础模块 */
export class Base {
    /** 网络模块 */
    readonly network: Network;
    /** 平台 SDK 模块 */
    readonly sdk: Sdk;

    constructor() {
        ecs.getEntity(Button);
        ecs.getEntity(Prompt);
        ecs.getEntity(Share);
        ecs.getEntity(Advertising);

        this.network = ecs.getEntity(Network);
        this.sdk = new Sdk();
    }
}
