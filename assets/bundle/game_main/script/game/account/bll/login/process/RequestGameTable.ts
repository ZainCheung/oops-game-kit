import { JsonUtil } from 'db://oops-framework/core/utils/JsonUtil';
import { LoginProcessBase } from '../LoginProcessBase';
import { LoginProcessType } from '../LoginEnum';

/**
 * 请求游戏远程配置表数据
 * 1. 如果成功进入下个流程
 * 2. 如果失败，提示请求游戏配置表数据失败
 */
export class RequestGameTable extends LoginProcessBase {
    constructor() {
        super(LoginProcessType.GameTable);
    }

    protected async execute() {
        const label = '【登录流程】请求游戏远程配置表数据耗时';
        console.time(label);
        await JsonUtil.loadDir();
        console.timeEnd(label);
        this.success();
    }
}
