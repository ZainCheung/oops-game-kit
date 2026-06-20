import { oops } from 'db://oops-framework/core/Oops';
import { AccountEventName } from '../../../AccountEvent';
import { LoginProcessType } from '../LoginEnum';
import { LoginProcessBase } from '../LoginProcessBase';

/**
 * 请求游戏账号数据
 * 1. 如果成功进入下个流程
 * 2. 如果失败，提示游戏服务器登录失败
 */
export class RequestGameData extends LoginProcessBase {
    constructor() {
        super(LoginProcessType.GameData);
    }

    protected async execute() {
        oops.message.dispatchEvent(AccountEventName.LoginSuccessGame);
        this.success();
    }
}
