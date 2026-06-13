import { ecs } from 'db://oops-framework/libs/ecs/ECS';
import { oops } from 'db://oops-framework/core/Oops';
import type { BTNodeJson } from 'db://oops-framework/libs/behavior-tree';
import { BehaviorTree } from 'db://oops-framework/libs/behavior-tree';
import { CCBusiness } from 'db://oops-framework/module/common/CCBusiness';
import type { Account } from '../Account';
import { ConnectNet } from './login/process/ConnectNet';
import { LoginSdk } from './login/process/LoginSdk';
import { RequestGameData } from './login/process/RequestGameData';
import { RequestGameTable } from './login/process/RequestGameTable';

/** 登录流程配置 */
const LoginProcessConfig: BTNodeJson = {
    type: 'Sequence',
    children: [
        { type: 'LoginSdk' },
        { type: 'RequestGameTable' },
        // { type: 'ConnectNet' },
        { type: 'RequestGameData' }
    ]
};

/** 重连流程配置 */
const ReconnectProcessConfig: BTNodeJson = {
    type: 'Sequence',
    children: [
        { type: 'RequestGameData' }
    ]
};

/** 账号登录流程逻辑 */
@ecs.register('B_Account_Login')
export class B_Account_Login extends CCBusiness<Account> {
    /** 登录流程 */
    private loginProcess!: BehaviorTree;
    /** 网络重连流程 */
    private reconnectProcess!: BehaviorTree;

    protected init() {
        // 注册自定义登录流程节点工厂
        BehaviorTree.registerFactory('LoginSdk', () => new LoginSdk());
        BehaviorTree.registerFactory('RequestGameTable', () => new RequestGameTable());
        BehaviorTree.registerFactory('ConnectNet', () => new ConnectNet());
        BehaviorTree.registerFactory('RequestGameData', () => new RequestGameData());

        // 通过配置创建行为树
        this.loginProcess = new BehaviorTree(BehaviorTree.fromJSON(LoginProcessConfig));
        this.reconnectProcess = new BehaviorTree(BehaviorTree.fromJSON(ReconnectProcessConfig));
    }

    /** 登录流程 */
    login() {
        if (this.loginProcess.started) return;
        oops.log.logBusiness('启动登录流程');
        this.loginProcess.run();
    }

    /** 游戏网络重连接流程 */
    reconnect() {
        if (this.reconnectProcess.started) return;
        oops.log.logBusiness('启动网络重连接流程');
        this.reconnectProcess.run();
    }

    destroy() {
        this.loginProcess = null!;
        this.reconnectProcess = null!;
        super.destroy();
    }
}
