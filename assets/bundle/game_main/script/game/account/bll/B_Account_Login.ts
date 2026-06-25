import { oops } from 'db://oops-framework/core/Oops';
import type { BTNodeJson } from 'db://oops-framework/libs/behavior-tree';
import { BehaviorTree } from 'db://oops-framework/libs/behavior-tree';
import { CCBusiness } from 'db://oops-framework/module/common/CCBusiness';
import { classname } from 'db://oops-framework/module/decorator/ClassNameDecorator';
import type { Account } from '../Account';
import { RequestConnectNet } from './login/process/RequestConnectNet';
import { RequestEnterGame } from './login/process/RequestEnterGame';
import { RequestGameData } from './login/process/RequestGameData';
import { RequestGameTable } from './login/process/RequestGameTable';
import { RequestSdkLogin } from './login/process/RequestSdkLogin';
import { RequestSdkUserInfo } from './login/process/RequestSdkUserInfo';

/** 登录流程配置 */
const LoginProcessConfig: BTNodeJson = {
    type: 'Sequence',
    children: [
        { type: 'RequestSdkLogin' },
        { type: 'RequestSdkUserInfo' },
        { type: 'RequestGameTable' },
        // { type: 'RequestConnectNet' },
        { type: 'RequestGameData' },
        { type: 'RequestEnterGame' },
    ],
};
console.log('========== B_Account_Login 2026-06-25 版本: 行为树中已启用 RequestSdkUserInfo 节点 ==========');

/** 重连流程配置 */
const ReconnectProcessConfig: BTNodeJson = {
    type: 'Sequence',
    children: [{ type: 'RequestGameData' }],
};

/** 账号登录流程逻辑 */
@classname('B_Account_Login')
export class B_Account_Login extends CCBusiness<Account> {
    /** 登录流程 */
    private loginProcess!: BehaviorTree;
    /** 网络重连流程 */
    private reconnectProcess!: BehaviorTree;

    protected init() {
        // 注册自定义登录流程节点工厂
        BehaviorTree.registerFactory('RequestSdkLogin', () => new RequestSdkLogin());
        BehaviorTree.registerFactory('RequestSdkUserInfo', () => new RequestSdkUserInfo());
        BehaviorTree.registerFactory('RequestGameTable', () => new RequestGameTable());
        BehaviorTree.registerFactory('RequestConnectNet', () => new RequestConnectNet());
        BehaviorTree.registerFactory('RequestGameData', () => new RequestGameData());
        BehaviorTree.registerFactory('RequestEnterGame', () => new RequestEnterGame());

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
