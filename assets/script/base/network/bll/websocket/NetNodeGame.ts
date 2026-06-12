import { oops } from 'db://oops-framework/core/Oops';
import { ProtocolWs } from '../../model/enum/EM_Network_Ws';
import { ResponseStatusEnum } from '../../model/enum/EM_Network';
import type { CallbackObject, IRequestProtocol, IResponseProtocol, NetCallFunc } from './core/NetInterface';
import { NetCmdType, NetNode, WebSocketReturn } from './core/NetNode';
import { WebSock } from './core/WebSock';
import { NetGameTips } from './NetGameTips';
import { NetProtocolProtobuf } from './protocol/NetProtocolProtobuf';

/** 网络节点扩展 */
export class NetNodeGame extends NetNode {
    init(): void {
        this._heartTime = oops.config.game.webSocketHeartTime;
        this._receiveTime = oops.config.game.webSocketReceiveTime;
        this._reconnetTimeOut = oops.config.game.webSocketReconnetTimeOut;
        super.init(
            new WebSock(),
            new NetProtocolProtobuf(() => { this.sendHeartbeat(); }),
            new NetGameTips(),
        );
    }

    /** 发送心跳包 */
    private sendHeartbeat(): void {
        this.req<unknown>(ProtocolWs.Heart);
    }

    /**
     * 协议请求
     * @param cmd       请求协议编号
     * @param params    请求参数
     * @returns 响应数据
     */
    req<T>(cmd: number, params?: unknown): Promise<WebSocketReturn<T>> {
        return new Promise<WebSocketReturn<T>>(resolve => {
            const protocol: IRequestProtocol<unknown> = {
                cmd,
                cmdType: cmd === ProtocolWs.Heart ? NetCmdType.Heart : NetCmdType.Business,
                params,
                callback: {
                    target: this,
                    callback: ((iresp: IResponseProtocol) => {
                        const res = new WebSocketReturn<T>();
                        res.isSucc = iresp.code === ResponseStatusEnum.SUCCESS;
                        if (res.isSucc) {
                            res.res = iresp.data as T;
                        }
                        else {
                            res.err = iresp.code;
                            if (this._networkTips) {
                                this._networkTips.requestTipsErrorCode(iresp);
                            }
                        }
                        resolve(res);
                    }) as NetCallFunc,
                },
            };
            this.request(protocol);
        });
    }

    /**
     * 确保没有同一响应的请求
     * @param cmd       请求协议编号
     * @param params    请求参数
     * @returns 响应数据
     */
    reqUnique<T>(cmd: number, params?: unknown): Promise<WebSocketReturn<T>> {
        return new Promise<WebSocketReturn<T>>(resolve => {
            const protocol: IRequestProtocol<unknown> = {
                cmd,
                cmdType: cmd === ProtocolWs.Heart ? NetCmdType.Heart : NetCmdType.Business,
                params,
                callback: {
                    target: this,
                    callback: ((iresp: IResponseProtocol) => {
                        const res = new WebSocketReturn<T>();
                        res.isSucc = iresp.code === ResponseStatusEnum.SUCCESS;
                        if (res.isSucc) {
                            res.res = iresp.data as T;
                        }
                        else {
                            res.err = iresp.code;
                            if (this._networkTips) {
                                this._networkTips.requestTipsErrorCode(iresp);
                            }
                        }
                        resolve(res);
                    }) as NetCallFunc,
                },
            };

            this.requestUnique(protocol);
        });
    }

    /**
     * 监听服务器推送
     * @param cmd       协议命令号
     * @param callback  回调方法
     * @param target    目标对象
     */
    on<T = unknown>(cmd: number, callback: NetCallFunc<T>, target?: object | null): void {
        const co: CallbackObject<T> = {
            target: target || null,
            callback,
        };
        const ireqp: IRequestProtocol = {
            cmd,
            callback: co as CallbackObject,
        };
        this.addResponeHandler(ireqp);
    }

    /**
     * 取消监听服务器推送
     * @param cmd       协议命令号
     * @param callback  回调方法
     * @param target    目标对象
     */
    off(cmd: number, callback: NetCallFunc, target?: object | null): void {
        this.removeResponeHandler(cmd, callback, target);
    }
}
