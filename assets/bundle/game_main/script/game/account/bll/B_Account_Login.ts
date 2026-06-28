import { oops } from 'db://oops-framework/core/Oops';
import type { BTNodeJson } from 'db://oops-framework/libs/behavior-tree';
import { BehaviorTree } from 'db://oops-framework/libs/behavior-tree';
import { CCBusiness } from 'db://oops-framework/module/common/CCBusiness';
import { classname } from 'db://oops-framework/module/decorator/ClassNameDecorator';
import { gsm } from '../../common/GameSingletonModule';
import type { Account } from '../Account';
import { RequestConnectNet } from './login/process/RequestConnectNet';
import { RequestEnterGame } from './login/process/RequestEnterGame';
import { RequestGameData } from './login/process/RequestGameData';
import { RequestGameTable } from './login/process/RequestGameTable';
import { RequestSdkLogin } from './login/process/RequestSdkLogin';
import { RequestSdkUserInfo } from './login/process/RequestSdkUserInfo';

// 行为树节点类型 → 构造器映射
const nodeFactoryMap: Record<string, new () => any> = {
    RequestSdkLogin,
    RequestSdkUserInfo,
    RequestGameTable,
    RequestConnectNet,
    RequestGameData,
    RequestEnterGame,
};

// 登录流程节点列表（增删节点只需改这里）
const loginFlowNodes = ['RequestSdkLogin', 'RequestSdkUserInfo', 'RequestGameTable', 'RequestGameData', 'RequestEnterGame'] as const;

/** 登录流程配置 */
const LoginProcessConfig: BTNodeJson = {
    type: 'Sequence',
    children: loginFlowNodes.map(type => ({ type })),
};

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
        // 通过映射统一注册所有节点工厂
        for (const [type, cls] of Object.entries(nodeFactoryMap)) {
            BehaviorTree.registerFactory(type, () => new cls());
        }

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

    /** 退出登录流程 */
    async logout() {
        // 清除统计 SDK 用户标识
        await gsm.base.sdk.analysis.logout();
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
