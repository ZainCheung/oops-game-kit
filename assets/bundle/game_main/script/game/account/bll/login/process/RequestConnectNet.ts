import { oops } from 'db://oops-framework/core/Oops';
import { gsm } from '../../../../common/GameSingletonModule';
import { LoginProcessType } from '../LoginEnum';
import { LoginProcessBase } from '../LoginProcessBase';
import { ProtocolHttp } from '../../../../../base/network/model/enum/EM_Network_Http';

/**
 * 连接游戏服务器
 * 1. 如果成功进入下个流程
 * 2. 如果失败，重复尝试连接 3 次，失败后给提示是否重试
 */
export class RequestConnectNet extends LoginProcessBase {
    constructor() {
        super(LoginProcessType.ConnectNet);
    }

    protected async execute() {
        // 请求登录通行证
        const param: Record<string, unknown> = {
            serverId: 10,
            authType: 'testAccount',
            authBody: {
                marToken: undefined,
                marUserId: undefined,
                password: 'test6263',
                username: 'link001'
            },
            deviceId: 'web_50b3d1db-3740-489d-8599-34a7ba62a7b6'
        };
        const res = await gsm.base.network.B_Network_Http.post<{ userId: string; token: string }>(ProtocolHttp.LoginAuth, param);
        if (res) {
            // 登录成功，保存账号信息
            const am = gsm.account.M_Account_Model;
            am.base.userId = res.userId;

            // 连接游戏服务器
            const ws = gsm.base.network.B_Network_WebSocket;
            ws.gameCreate();
            ws.game.onConneced = this.onConneced.bind(this);
            ws.game.onClose = this.onClose.bind(this);
            ws.gameConnect(res.token);
        }
        else {
            console.warn('请求通行证失败');
            this.fail();
        }

        this.success();
    }

    private onConneced() {
        oops.log.trace('【登录流程】连接游戏服务器成功');
        this.clear();
        this.success();
    }

    private onClose() {
        this.clear();
        this.fail();
    }

    /** 清理网络回调事件 */
    private clear() {
        const ws = gsm.base.network.B_Network_WebSocket;
        ws.game.onConneced = null!;
        ws.game.onClose = null!;
    }
}
