import { oops } from 'db://oops-framework/core/Oops';
import { LoginProcessType } from '../LoginEnum';
import { LoginProcessBase } from '../LoginProcessBase';
import { gsm } from '../../../../common/GameSingletonModule';
import { VC_Initialize_Loading } from '../../../../initialize/view/VC_Initialize_Loading';

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
            oops.log.trace('【登录流程】进入游戏加载界面成功');
            gsm.initialize.get(VC_Initialize_Loading)?.enterGame();
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
