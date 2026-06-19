import { ecs } from 'db://oops-framework/libs/ecs/ECS';
import { Button } from './button/Button';
import { Network } from './network/Network';
import { Prompt } from './prompt/Prompt';

/** 基础模块 */
export class Base {
    /** 网络模块 */
    readonly network: Network;

    constructor() {
        ecs.getEntity(Button);
        ecs.getEntity(Prompt);

        this.network = ecs.getEntity(Network);
    }
}
