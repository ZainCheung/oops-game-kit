import { ecs } from 'db://oops-framework/libs/ecs/ECS';
import { Network } from './network/Network';
import { Prompt } from './prompt/Prompt';

/** 基础模块 */
export class Base {
    /** 网络模块 */
    readonly network: Network;
    /** 提示模块 */
    readonly prompt: Prompt;

    constructor() {
        this.network = ecs.getEntity(Network);
        this.prompt = ecs.getEntity(Prompt);
    }
}
