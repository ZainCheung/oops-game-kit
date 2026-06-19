
import { oops } from 'db://oops-framework/core/Oops';
import { AccountEvent } from '../../../../game/account/AccountEvent';
import type { INetworkTips, IResponseProtocol } from './core/NetInterface';

/** 游戏网络事件界面提示逻辑 */
export class NetGameTips implements INetworkTips {
    /** 连接提示 */
    connectTips(isShow: boolean) {
        if (isShow) {
            oops.log.logNet('游戏服务器正在连接');
        }
        else {
            oops.log.logNet('游戏服务器连接成功');
        }
    }

    /** 网络断开提示 */
    disconnectTips(isShow: boolean): void {
        console.log('与游戏服务器连接断开', isShow);
    }

    /** 重连接提示 */
    reconnectTips(): void {
        oops.message.dispatchEvent(AccountEvent.Reconnect);
    }

    /** 请求提示 */
    requestTips(isShow: boolean): void {
    }

    /** 请求错误码提示 */
    requestTipsErrorCode(iresp: IResponseProtocol): void {
        console.log(iresp.code);
    }
}
