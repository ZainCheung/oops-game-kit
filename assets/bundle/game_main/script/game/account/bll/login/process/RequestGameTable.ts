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
        const label = '【登录流程】请求游戏远程配置表数据';
        console.time(label);
        try {
            await this.loadTable();
            console.timeEnd(label);
            this.success();
        }
        catch (err) {
            console.timeEnd(label);
            console.error('【登录流程】加载配置表失败', err);
            this.fail();
        }
    }

    /** 加载 Zip 配置表 */
    private loadTable(): Promise<void> {
        return JsonUtil.loadDir();
    }
}
