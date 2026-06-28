import { gsm } from '../../../../common/GameSingletonModule';
import { LoginProcessType } from '../LoginEnum';
import { LoginProcessBase } from '../LoginProcessBase';
import { AccountEventName } from '../../../AccountEvent';
import { oops } from 'db://oops-framework/core/Oops';

/**
 * 进入游戏加载界面
 * 登录流程完成后，打开加载界面并移除初始画面
 */
export class RequestEnterGame extends LoginProcessBase {
    constructor() {
        super(LoginProcessType.EnterGame);
    }

    protected async execute() {
        const label = '【登录流程】进入游戏加载界面耗时';
        console.time(label);

        // 统计登录成功事件
        AUTE('LoginSuccess', {
            username: gsm.account.M_Account_Model.base.username ?? '',
            channel: gsm.base.sdk.analysis.getChannel() ?? 'unknown',
        });

        oops.message.emit(AccountEventName.LoginSuccessGame);
        console.timeEnd(label);
        this.success();
    }
}
