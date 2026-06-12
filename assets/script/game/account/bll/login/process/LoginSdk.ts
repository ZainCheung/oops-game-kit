import { oops } from 'db://oops-framework/core/Oops';
import { LoginProcessBase } from '../LoginProcessBase';
import { LoginProcessType } from '../LoginEnum';
import { AccountEvent } from '../../../AccountEvent';

/**
 * 平台 SDK 账号登录
 * 1. 如果成功进入下个流程
 * 2. 如果失败，提示用户 SDK 登录失败
 */
export class LoginSdk extends LoginProcessBase {
    constructor() {
        super(LoginProcessType.LoginSdk);
    }

    protected execute() {
        oops.log.trace('【登录流程】平台 SDK 账号登录成功');
        oops.message.dispatchEvent(AccountEvent.LoginSuccessSdk);
        this.success();
    }
}
