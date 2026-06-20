import { Task } from 'db://oops-framework/libs/behavior-tree';
import { LoginProcessType } from './LoginEnum';

/**
 * 登录流程基础类
 */
export class LoginProcessBase extends Task {
    protected type: LoginProcessType = LoginProcessType.None;

    constructor(type: LoginProcessType) {
        super();
        this.type = type;
    }

    run(blackboard: unknown) {
        this.execute();
    }

    fail() {
        switch (this.type) {
            case LoginProcessType.SdkLogin:
                break;
            case LoginProcessType.SdkUserInfo:
                break;
            case LoginProcessType.GameTable:
                break;
            case LoginProcessType.ConnectNet:
                break;
            case LoginProcessType.GameData:
                break;
            case LoginProcessType.EnterGame:
                break;
        }
        console.log('登录失败', this.type);
    }

    protected execute() {}
}
