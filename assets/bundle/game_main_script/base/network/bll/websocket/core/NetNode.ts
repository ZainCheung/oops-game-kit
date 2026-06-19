import { error } from 'cc';
import { oops } from 'db://oops-framework/core/Oops';
import type { CallbackObject, INetworkTips, IProtocolHelper, IRequestProtocol, IResponseProtocol, ISocket, NetCallFunc, NetData } from './NetInterface';

export enum NetCmdType {
    /** 心跳数据 */
    Heart = 0,
    /** 业务数据 */
    Business = 1,
    /** 推送数据 */
    Push = 2
}

/*
*   CocosCreator网络节点基类，以及网络相关接口定义
*   1. 网络连接、断开、请求发送、数据接收等基础功能
*   2. 心跳机制
*   3. 断线重连 + 请求重发
*   4. 调用网络屏蔽层
*/

type ExecuterFunc = (callback: CallbackObject, iresp: IResponseProtocol) => void;
type CheckFunc = (checkedFunc: VoidFunc) => void;
type VoidFunc = () => void;
type BoolFunc = () => boolean;
type ConnectedCallback = () => void;
type CloseCallback = () => void;

const NetNodeStateStrs = ['已关闭', '连接中', '验证中', '可传输数据'];

export class WebSocketReturn<T> {
    /** 是否请求成功 */
    isSucc = false;
    /** 请求返回数据 */
    res?: T;
    /** 请求错误数据 */
    err?: any;
}

/** 网络提示类型枚举 */
export enum NetTipsType {
    /** 连接中 */
    Connecting,
    /** 重连接 */
    ReConnecting,
    /** 请求中 */
    Requesting,
    /** 断开中 */
    Disconnecting
}

/** 网络状态枚举 */
export enum NetNodeState {
    Closed, // 已关闭
    Connecting, // 连接中
    Checking, // 验证中
    Working, // 可传输数据
}

/** 网络连接参数 */
export interface NetConnectOptions {
    host?: string, // 地址
    port?: number, // 端口
    url?: string, // url，与地址+端口二选一
    autoReconnect?: number, // -1 永久重连，0不自动重连，其他正整数为自动重试次数
}

/** 网络节点 */
export class NetNode {
    /** 网络连接事件 */
    onConneced: ConnectedCallback = null!;
    /** 网络连接关闭 */
    onClose: CloseCallback = null!;

    protected _connectOptions: NetConnectOptions | null = null;
    protected _autoReconnectMax = 0;
    protected _autoReconnect = 0;
    protected _isSocketInit = false; // Socket是否初始化过
    protected _isSocketOpen = false; // Socket是否连接成功过
    protected _state: NetNodeState = NetNodeState.Closed; // 节点当前状态
    protected _socket: ISocket | null = null; // Socket对象（可能是原生socket、websocket、wx.socket...)

    protected _networkTips: INetworkTips | null = null; // 网络提示ui对象（请求提示、断线重连提示等）
    protected _protocolHelper: IProtocolHelper | null = null; // 包解析对象
    protected _connectedCallback: CheckFunc | null = null; // 连接完成回调
    protected _disconnectCallback: BoolFunc | null = null; // 断线回调
    protected _callbackExecuter: ExecuterFunc | null = null; // 回调执行

    protected _keepAliveTimer: number | null = null; // 心跳定时器
    protected _receiveMsgTimer: number | null = null; // 接收数据定时器
    protected _reconnectTimer: number | null = null; // 重连定时器
    protected _heartTime = 10000; // 心跳间隔
    protected _receiveTime = 30000; // 多久没收到数据断开
    protected _reconnetTimeOut = 5000; // 重连间隔
    protected _requests: IRequestProtocol[] = []; // 请求列表
    protected _listener: Map<number, IRequestProtocol[]> = new Map(); // 监听者列表

    /** 是否已连接状态 */
    get connected(): boolean {
        return this._socket !== null && this._socket.connected;
    }

    /********************** 网络相关处理 *********************/
    init(socket: ISocket, protocol: IProtocolHelper, networkTips: INetworkTips | null = null, execFunc: ExecuterFunc | null = null): void {
        oops.log.logNet('网络初始化');
        this._socket = socket;
        this._protocolHelper = protocol;
        this._networkTips = networkTips;
        this._callbackExecuter = execFunc || ((callback: CallbackObject, iresp: IResponseProtocol) => {
            if (callback.target) {
                callback.callback.call(callback.target, iresp);
            }
            else {
                callback.callback(iresp);
            }
        });
    }

    /**
     * 请求连接服务器
     * @param options 连接参数
     */
    connect(options: NetConnectOptions): boolean {
        if (this._socket && this._state === NetNodeState.Closed) {
            if (!this._isSocketInit) {
                this.initSocket();
            }
            this._state = NetNodeState.Connecting;
            if (!this._socket.connect(options)) {
                this.updateNetTips(NetTipsType.Connecting, false);
                return false;
            }
            if (this._connectOptions === null && typeof options.autoReconnect === 'number') {
                this._autoReconnectMax = options.autoReconnect;
                this._autoReconnect = options.autoReconnect;
            }
            this._connectOptions = options;
            this.updateNetTips(NetTipsType.Connecting, true);
            return true;
        }
        return false;
    }

    protected updateNetTips(tipsType: NetTipsType, isShow: boolean): void {
        if (this._networkTips) {
            if (tipsType === NetTipsType.Requesting) {
                this._networkTips.requestTips(isShow);
            }
            else if (tipsType === NetTipsType.Connecting) {
                this._networkTips.connectTips(isShow);
                if (!isShow && this.onConneced) {
                    this.onConneced();
                }
            }
            else if (tipsType === NetTipsType.ReConnecting) {
                this._networkTips.reconnectTips();
                if (!isShow && this.onConneced) {
                    this.onConneced();
                }
            }
            else if (tipsType === NetTipsType.Disconnecting) {
                this._networkTips.disconnectTips(isShow);
            }
        }
    }

    /**
     * 断开网络
     * @param code      关闭码
     * @param reason    关闭原因
     */
    close(code?: number, reason?: string): void {
        if (this._state === NetNodeState.Closed) {
            oops.log.logNet('网络节点已断开');
            return;
        }

        this.clearTimer();
        this._listener.clear();
        this._requests.length = 0;

        if (this._networkTips) {
            this._networkTips.connectTips(false); // 处理连接中断开网络
            this._networkTips.requestTips(false); // 处理请求中断开网络
        }

        if (this._socket) {
            this.updateNetTips(NetTipsType.Disconnecting, false); // 准备断开
            this._socket.close(code, reason);
        }
        else {
            this._state = NetNodeState.Closed;
        }
    }

    /**
     * 只是关闭Socket套接字（仍然重用缓存与当前状态）
     * @param code      关闭码
     * @param reason    关闭原因
     */
    closeSocket(code?: number, reason?: string): void {
        if (this._socket) {
            this._socket.close(code, reason);
        }
    }

    /** 是否自动重连接 */
    isAutoReconnect(): boolean {
        return this._autoReconnect !== 0;
    }

    /** 拒绝重新连接 */
    rejectReconnect(): void {
        this._autoReconnect = 0;
        this.clearTimer();
    }

    //#region 网络事件
    protected initSocket(): void {
        if (this._socket) {
            this._socket.onConnected = (event: Event) => {
                this.onConnected(event);
            };
            this._socket.onMessage = (msg: NetData) => {
                this.onMessage(msg);
            };
            this._socket.onError = (event: Event) => {
                this.onError(event);
            };
            this._socket.onClosed = (event: CloseEvent) => {
                this.onClosed(event);
            };
            this._isSocketInit = true;
        }
    }

    /** 网络连接成功 */
    protected onConnected(event: Event): void {
        oops.log.logNet('网络已连接');
        this._isSocketOpen = true;
        // 如果设置了鉴权回调，在连接完成后进入鉴权阶段，等待鉴权结束
        if (this._connectedCallback !== null) {
            this._state = NetNodeState.Checking;
            this._connectedCallback(() => {
                this.onChecked();
            });
        }
        else {
            this.onChecked();
        }
        oops.log.logNet(`网络已连接当前状态为【${NetNodeStateStrs[this._state]}】`);

        // 重置重连次数
        this._autoReconnect = this._autoReconnectMax;
        // 接受到数据，重新定时收数据计时器
        this.resetReceiveMsgTimer();
        // 重置心跳包发送器
        this.resetHearbeatTimer();
    }

    /** 连接验证成功，进入工作状态 */
    protected onChecked(): void {
        oops.log.logNet('连接验证成功，进入工作状态');
        this._state = NetNodeState.Working;

        // 重发待发送信息
        const requests = this._requests.concat();
        if (requests.length > 0 && this._socket) {
            oops.log.logNet(`请求【${this._requests.length}】个待发送的信息`);

            for (let i = 0; i < requests.length;) {
                const req = requests[i];
                if (req.buffer) {
                    this._socket.send(req.buffer);
                }
                if (req.callback === null || req.cmdType !== 0) {
                    requests.splice(i, 1);
                }
                else {
                    ++i;
                }
            }
            // 如果还有等待返回的请求，启动网络请求层
            this.updateNetTips(NetTipsType.Requesting, this._requests.length > 0);
        }

        // 关闭连接或重连中的状态显示
        this.updateNetTips(NetTipsType.Connecting, false);
    }

    /** 接收到一个完整的消息包 */
    protected onMessage(msg: NetData): void {
        if (!this._protocolHelper) {
            return;
        }

        // oops.log.logNet(`接受消息状态为【${NetNodeStateStrs[this._state]}】`);
        const iresp: IResponseProtocol = this._protocolHelper.decodeCommon(msg);

        // 接受到数据，重新定时收数据计时器
        this.resetReceiveMsgTimer();
        // 重置心跳包发送器
        this.resetHearbeatTimer();
        // 触发消息执行
        const msgId = iresp.msgId;
        const cmd = iresp.cmd;
        const cmdType = iresp.cmdType;

        switch (cmdType) {
            case NetCmdType.Heart:
                if (iresp.data && typeof iresp.data === 'object' && 'st' in iresp.data) {
                    const heartData = iresp.data as { st: number };
                    oops.timer.setServerTime(heartData.st); // 服务器对时
                }
                break;
            case NetCmdType.Business:
                oops.log.logNet(`接受到命令【${cmd}】的消息`);

                // 触发请求队列中的回调函数
                if (this._requests.length > 0 && this._callbackExecuter) {
                    for (let reqIdx = 0; reqIdx < this._requests.length; reqIdx++) {
                        const ireqp = this._requests[reqIdx];
                        if (ireqp.msgId === msgId) {
                            oops.log.logNet(`触发请求命令【${cmd}】的回调`);
                            this._callbackExecuter(ireqp.callback, iresp);
                            this._requests.splice(reqIdx, 1);
                            break;
                        }
                    }

                    // 触发请求结束
                    if (this._requests.length === 0) {
                        this.updateNetTips(NetTipsType.Requesting, false);
                    }
                    else {
                        oops.log.logNet(`请求队列中还有【${this._requests.length}】个请求在等待`);
                    }
                }
                break;
            // 服务器推送回调触发
            case NetCmdType.Push:
                if (cmdType === NetCmdType.Push && this._callbackExecuter) {
                    const listeners = this._listener.get(cmd);
                    if (listeners && listeners.length > 0) {
                        for (const ireqp of listeners) {
                            oops.log.logNet(`触发监听命令【${cmd}】的回调`);
                            // 推送消息直接传递data数据，而不是整个iresp
                            const pushResp: IResponseProtocol = {
                                cmd: cmd,
                                msgId: msgId,
                                cmdType: cmdType,
                                code: iresp.code,
                                data: iresp.data
                            };
                            this._callbackExecuter(ireqp.callback, pushResp);
                        }
                    }
                }
                break;
            default:
                console.warn('协议异常，协议编号、命令号、协议类型', msgId, cmd, cmdType);
                break;
        }
    }

    protected onError(event: Event): void {
        error(event);
    }

    protected onClosed(event: CloseEvent): void {
        this._state = NetNodeState.Closed;

        this.clearTimer();

        this.updateNetTips(NetTipsType.Disconnecting, true);

        // 执行断线回调，返回false表示不进行重连
        if (this._disconnectCallback && !this._disconnectCallback()) {
            oops.log.logNet('断开连接');
            return;
        }

        // 自动重连时，不触发断开事件
        if (this.isAutoReconnect()) {
            this.updateNetTips(NetTipsType.ReConnecting, true);
            this._reconnectTimer = window.setTimeout(() => {
                if (this._connectOptions) {
                    this.connect(this._connectOptions);
                }
                if (this._autoReconnect > 0) {
                    this._autoReconnect -= 1;
                }
            }, this._reconnetTimeOut);
        }
        else {
            if (this.onClose) {
                this.onClose();
            }
        }
    }
    //#endregion

    //#region 发数据相关处理
    /**
     * 发起请求，并进入缓存列表
     * @param reqProtocol 请求协议
     * @param showTips    是否触发请求提示
     * @param force       是否强制发送
     */
    request(reqProtocol: IRequestProtocol, showTips = true, force = false): void {
        if (this._protocolHelper) {
            this._protocolHelper.encode(reqProtocol);
            this.base_request(reqProtocol, showTips, force);
        }
    }

    /**
     * 唯一request，确保没有同一响应的请求（避免一个请求重复发送，netTips界面的屏蔽也是一个好的方法）
     * @param reqProtocol 请求协议
     * @param showTips    是否触发请求提示
     * @param force       是否强制发送
     */
    requestUnique(reqProtocol: IRequestProtocol, showTips = true, force = false): boolean {
        for (let i = 0; i < this._requests.length; ++i) {
            if (this._requests[i].cmd === reqProtocol.cmd) {
                oops.log.logNet(`命令【${reqProtocol.cmd}】重复请求`);
                return false;
            }
        }

        if (this._protocolHelper) {
            this._protocolHelper.encode(reqProtocol);
            this.base_request(reqProtocol, showTips, force);
        }
        return true;
    }

    private base_request(reqProtocol: IRequestProtocol, showTips = true, force = false): void {
        if (this._socket && reqProtocol.buffer) {
            if (this._state === NetNodeState.Working || force) {
                this._socket.send(reqProtocol.buffer);
            }
        }

        if (reqProtocol.cmdType === NetCmdType.Business) {
            oops.log.logNet(`队列命令为【${reqProtocol.cmd}】的请求，等待请求数据的回调`);
            // 进入发送缓存列表
            this._requests.push(reqProtocol);
        }

        // 启动网络请求层
        if (showTips) {
            this.updateNetTips(NetTipsType.Requesting, true);
        }
    }
    //#endregion

    //#region 回调相关处理
    /**
     * 监听服务器推送
     * @param reqProtocol 响应协议数据
     */
    addResponeHandler(reqProtocol: IRequestProtocol): void {
        const cmd = reqProtocol.cmd;
        const listeners = this._listener.get(cmd);
        if (!listeners) {
            this._listener.set(cmd, [reqProtocol]);
        }
        else {
            const index = this.getNetListenersIndex(cmd, reqProtocol.callback);
            if (index === -1) {
                listeners.push(reqProtocol);
            }
        }
    }

    /**
     * 删除一个监听中指定子回调
     * @param cmd       命令字串
     * @param callback  回调方法
     * @param target    目标对象
     */
    removeResponeHandler(cmd: number, callback: NetCallFunc, target?: object | null): void {
        const listeners = this._listener.get(cmd);
        if (listeners) {
            const index = this.getNetListenersIndex(cmd, { target: target || null, callback });
            if (index !== -1) {
                listeners.splice(index, 1);
                // 如果监听列表为空，删除该命令的监听映射，防止内存泄漏
                if (listeners.length === 0) {
                    this._listener.delete(cmd);
                }
            }
        }
    }

    /**
     * 清除所有监听或指定命令的监听
     * @param cmd  命令字串（默认不填为清除所有）
     */
    cleanListeners(cmd = 0): void {
        if (cmd === 0) {
            this._listener.clear();
        }
        else {
            this._listener.delete(cmd);
        }
    }

    protected getNetListenersIndex(cmd: number, rspObject: CallbackObject): number {
        const listeners = this._listener.get(cmd);
        if (!listeners) {
            return -1;
        }

        for (let i = 0; i < listeners.length; i++) {
            const iterator = listeners[i];
            if (iterator.callback.callback === rspObject.callback && iterator.callback.target === rspObject.target) {
                return i;
            }
        }
        return -1;
    }
    //#endregion

    //#region 心跳、超时相关处理
    protected resetReceiveMsgTimer(): void {
        if (this._receiveMsgTimer !== null) {
            window.clearTimeout(this._receiveMsgTimer);
        }

        this._receiveMsgTimer = window.setTimeout(() => {
            oops.log.logNet('接收消息定时器关闭网络连接');
            if (this._socket) {
                this._socket.close();
            }
        }, this._receiveTime);
    }

    protected resetHearbeatTimer(): void {
        if (this._keepAliveTimer !== null) {
            window.clearTimeout(this._keepAliveTimer);
        }

        this._keepAliveTimer = window.setTimeout(() => {
            if (this._state === NetNodeState.Working && this._protocolHelper) {
                oops.log.logNet('网络节点发送心跳信息');
                this._protocolHelper.onHearbeat();
            }
        }, this._heartTime);
    }

    protected clearTimer(): void {
        if (this._receiveMsgTimer !== null) {
            window.clearTimeout(this._receiveMsgTimer);
            this._receiveMsgTimer = null;
        }
        if (this._keepAliveTimer !== null) {
            window.clearTimeout(this._keepAliveTimer);
            this._keepAliveTimer = null;
        }
        if (this._reconnectTimer !== null) {
            window.clearTimeout(this._reconnectTimer);
            this._reconnectTimer = null;
        }
    }
    //#endregion
}
