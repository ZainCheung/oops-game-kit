/*
 * 网络相关接口定义
 */
export type NetData = (string | ArrayBufferLike | Blob | ArrayBufferView);
export type NetCallFunc<T = unknown> = (data: T) => void;

/** 请求协议 */
export interface IRequestProtocol<T = unknown> {
    /** 协议编号 */
    cmd: number;
    /** 消息标记 */
    msgId?: number;
    /** 协议类型 0心跳、1业务、2推送 */
    cmdType?: number;
    /** 消息内容 */
    params?: T;
    /** 请求二进制数据 */
    buffer?: NetData;
    /** 等待响应的回调对象 */
    callback: CallbackObject;
}

/** 响应协议 */
export interface IResponseProtocol<T = unknown> {
    /** 协议编号*/
    cmd: number;
    /** 消息标记 */
    msgId: number;
    /** 协议类型 0心跳、1业务*/
    cmdType: number;
    /** 消息状态码 */
    code: number;
    /** 协议数据 */
    data?: T;
}

/** 回调对象 */
export interface CallbackObject<T = unknown> {
    /** 回调对象 */
    target: object | null;
    /** 回调函数 */
    callback: NetCallFunc<T>;
}

const REQUEST_ID_MAX = 30000;

/** 心跳发送回调，由网络节点注入，协议层不依赖具体节点实现 */
export type HeartbeatSender = () => void;

/** 协议辅助接口 */
export abstract class IProtocolHelper {
    protected _requestId = 0; // 请求唯一编号
    protected _sessionId = 0; // UnixTime 和 Session ID 和 沙子一起都是后面加密为了防挂使用的

    /** 获取请求唯一编号 */
    protected getRequestId(): number {
        if (this._requestId === REQUEST_ID_MAX) {
            this._requestId = 1;
        }
        this._requestId++;
        return this._requestId;
    }

    /** UnixTime 和 Session ID 和 沙子一起都是后面加密为了防挂使用的 */
    protected getSessionId(): number {
        return this._sessionId;
    }

    /** 处理请求包数据 */
    abstract encode(ireqp: IRequestProtocol): void;

    /** 解析通用响应数据 */
    abstract decodeCommon(msg: NetData): IResponseProtocol;

    /** 返回一个心跳包 */
    abstract onHearbeat(): void;
}

export type SocketFunc = (event: Event) => void;
export type SocketCloseFunc = (event: CloseEvent) => void;
export type MessageFunc = (msg: NetData) => void;

/** Socket连接选项 */
export interface SocketConnectOptions {
    url?: string;
    ip?: string;
    port?: number;
    protocol?: string;
    binaryType?: BinaryType;
}

/** Socket接口 */
export interface ISocket {
    get connected(): boolean;

    /** 连接回调 */
    onConnected: SocketFunc | null;
    /** 消息回调 */
    onMessage: MessageFunc | null;
    /** 错误回调 */
    onError: SocketFunc | null;
    /** 关闭回调 */
    onClosed: SocketCloseFunc | null;
    /** 连接状态 */
    connect(options: SocketConnectOptions): boolean;
    /** 数据发送接口 */
    send(buffer: NetData): number;
    /** 关闭接口 */
    close(code?: number, reason?: string): void;
}

/** 网络提示接口 */
export interface INetworkTips {
    /**
     * 连接提示回调
     * @param isShow false为准备触发连接,true为已连接
     */
    connectTips(isShow: boolean): void;
    /**
     * 断开连接提示回调
     * @param isShow false为准备触发断开连接,true为已断开连接
     */
    disconnectTips(isShow: boolean): void;
    /** 重连接开始提示回调 */
    reconnectTips(): void;
    /**
     * 请求提示回调
     * @param isShow false为所有请求结束,true为有请求等待返回
     */
    requestTips(isShow: boolean): void;
    /** 错误码处理 */
    requestTipsErrorCode(iresp: IResponseProtocol): void;
}
