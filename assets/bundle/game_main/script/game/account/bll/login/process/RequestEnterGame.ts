import { oops } from 'db://oops-framework/core/Oops';
import { gsm } from '../../../../common/GameSingletonModule';
import { LoginProcessType } from '../LoginEnum';
import { LoginProcessBase } from '../LoginProcessBase';
import { AccountEventName } from '../../../AccountEvent';

/**
 * 进入游戏加载界面
 * 登录流程完成后，打开加载界面并移除初始画面
 */
export class RequestEnterGame extends LoginProcessBase {
    constructor() {
        super(LoginProcessType.EnterGame);
    }

    protected async execute() {
        const label = '【登录流程】进入游戏加载界面';
        console.time(label);
        try {
            // 统计登录成功事件
            const accountModel = gsm.account.M_Account_Model;
            const userId = accountModel.base.userId;
            await gsm.base.sdk.analysis.trackEvent('LoginSuccess', {
                userId: userId ?? '',
                username: accountModel.base.username ?? '',
                channel: gsm.base.sdk.analysis.getChannel() ?? 'unknown',
            });


            oops.message.emit(AccountEventName.LoginSuccessGame);
            console.timeEnd(label);
            this.success();
        }
        catch (err) {
            console.timeEnd(label);
            console.error('【登录流程】进入游戏加载界面失败', err);
            this.fail();
        }
    }
}
