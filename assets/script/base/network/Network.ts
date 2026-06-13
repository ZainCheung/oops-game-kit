import { ecs } from 'db://oops-framework/libs/ecs/ECS';
import { CCEntity } from 'db://oops-framework/module/common/CCEntity';
import { B_Network_Http } from './bll/B_Network_Http';
import { B_Network_WebSocket } from './bll/B_Network_WebSocket';

/** 网络模块 */
@ecs.register('Network')
export class Network extends CCEntity {
    B_Network_Http!: B_Network_Http;
    B_Network_WebSocket!: B_Network_WebSocket;

    protected init() {
        this.B_Network_Http = this.addBusiness(B_Network_Http);
        this.B_Network_WebSocket = this.addBusiness(B_Network_WebSocket);
    }
}
