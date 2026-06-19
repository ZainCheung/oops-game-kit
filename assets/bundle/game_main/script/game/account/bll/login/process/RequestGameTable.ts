import { oops } from 'db://oops-framework/core/Oops';
import { LoginProcessBase } from '../LoginProcessBase';
import { LoginProcessType } from '../LoginEnum';

/**
 * 请求游戏远程配置表数据
 */
export class RequestGameTable extends LoginProcessBase {
    constructor() {
        super(LoginProcessType.GameTable);
    }

    protected execute() {
        oops.log.trace('【登录流程】请求游戏远程配置表数据成功');
        this.success();
    }
}
