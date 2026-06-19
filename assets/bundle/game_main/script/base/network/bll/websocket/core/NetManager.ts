import type { NetConnectOptions, NetNode } from './NetNode';

/*
 * 网络节点管理类
 */
export class NetManager {
    private static _instance: NetManager;
    static get instance(): NetManager {
        if (!this._instance) {
            this._instance = new NetManager();
        }
        return this._instance;
    }

    protected _channels: { [key: number]: NetNode } = {};

    /**
     * 添加网络节点
     * @param node       网络节点
     * @param channelId  通道编号
     * @example
    let net = new NetNodeGame();
    let ws = new WebSock();        // WebSocket 网络连接对象
    let gp = new GameProtocol();   // 网络通讯协议对象
    let gt = new NetGameTips()     // 网络提示对象
    net.init(ws, gp, gt);
    NetManager.getInstance().setNetNode(net, NetChannelType.Game);
     */
    setNetNode(node: NetNode, channelId = 0) {
        this._channels[channelId] = node;
    }

    /** 移除Node */
    removeNetNode(channelId: number) {
        delete this._channels[channelId];
    }

    /**
     * 网络节点连接服务器
     * @param options      连接参数
     * @param channelId    通道编号
     * @example
    let options = {
        url: 'ws://127.0.0.1:3000',
        autoReconnect: 0            // -1 永久重连，0不自动重连，其他正整数为自动重试次数
    }
    NetManager.getInstance().connect(options, NetChannelType.Game);
     */
    connect(options: NetConnectOptions, channelId = 0): boolean {
        if (this._channels[channelId]) {
            return this._channels[channelId].connect(options);
        }
        return false;
    }

    /**
     * 节点网络断开
     * @param code        关闭码
     * @param reason      关闭原因
     * @param channelId   通道编号
     * @example
     * NetManager.getInstance().close(undefined, undefined, NetChannelType.Game);
     */
    close(code?: number, reason?: string, channelId = 0) {
        if (this._channels[channelId]) {
            return this._channels[channelId].closeSocket(code, reason);
        }
    }
}
