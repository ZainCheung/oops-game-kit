import { oops } from 'db://oops-framework/core/Oops';
import type { ISocket, MessageFunc, NetData, SocketConnectOptions, SocketFunc, SocketCloseFunc } from './NetInterface';

/**
 * WebSocket 封装
 * 1. 连接/断开相关接口
 * 2. 网络异常回调
 * 3. 数据发送与接收
 */
export class WebSock implements ISocket {
    private _ws: WebSocket | null = null; // websocket对象

    get connected(): boolean {
        return this._ws !== null && this._ws.readyState === WebSocket.OPEN;
    }

    /** 网络连接成功事件 */
    onConnected: SocketFunc | null = null;
    /** 接受到网络数据事件 */
    onMessage: MessageFunc | null = null;
    /** 网络错误事件 */
    onError: SocketFunc | null = null;
    /** 网络断开事件 */
    onClosed: SocketCloseFunc | null = null;

    /** 请求连接 */
    connect(options: SocketConnectOptions): boolean {
        if (this._ws) {
            if (this._ws.readyState === WebSocket.CONNECTING) {
                oops.log.logNet('正在连接，请稍等');
                return false;
            }
        }

        let url: string;
        if (options.url) {
            url = options.url;
        }
        else {
            const ip = options.ip;
            const port = options.port;
            const protocol = options.protocol || 'ws';
            url = `${protocol}://${ip}:${port}`;
        }

        this._ws = new WebSocket(url);
        this._ws.binaryType = options.binaryType || 'arraybuffer';
        this._ws.onmessage = (event: MessageEvent) => {
            if (this.onMessage) {
                this.onMessage(event.data);
            }
        };
        this._ws.onopen = (event: Event) => {
            if (this.onConnected) {
                this.onConnected(event);
            }
        };
        this._ws.onerror = (event: Event) => {
            if (this.onError) {
                this.onError(event);
            }
        };
        this._ws.onclose = (event: CloseEvent) => {
            if (this.onClosed) {
                this.onClosed(event);
            }
        };
        return true;
    }

    /**
     * 发送数据
     * @param buffer 网络数据
     */
    send(buffer: NetData): number {
        if (this.connected && this._ws) {
            this._ws.send(buffer);
            return 1;
        }
        return -1;
    }

    /**
     * 网络断开
     * @param code      关闭码
     * @param reason    关闭原因
     */
    close(code?: number, reason?: string): void {
        if (this._ws) {
            // 清理事件监听，防止内存泄漏
            this._ws.onopen = null;
            this._ws.onmessage = null;
            this._ws.onerror = null;
            this._ws.onclose = null;

            // 关闭连接
            if (this._ws.readyState === WebSocket.OPEN || this._ws.readyState === WebSocket.CONNECTING) {
                this._ws.close(code, reason);
            }

            this._ws = null;
        }
    }
}
