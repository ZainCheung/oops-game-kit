import { oops } from 'db://oops-framework/core/Oops';
import { CCBusiness } from 'db://oops-framework/module/common/CCBusiness';
import type { Network } from '../Network';
import { NetManager } from './websocket/core/NetManager';
import { NetNodeGame } from './websocket/NetNodeGame';

/** WebSocket 渠道类型 */
export enum NetChannelType {
    /** 游戏服务器 */
    Game = 0,
}

/** WebSocket 网络业务逻辑 */
export class B_Network_WebSocket extends CCBusiness<Network> {
    /** 游戏逻辑服务器 */
    game: NetNodeGame = null!;

    /** 获取游戏服务器实例 */
    getGame(): NetNodeGame | null {
        return this.game;
    }

    /** 创建游戏服务器 */
    gameCreate(): void {
        if (!this.game) {
            this.game = new NetNodeGame();
            this.game.init();
            NetManager.instance.setNetNode(this.game, NetChannelType.Game);
        }
    }

    /** 连接游戏服务器 */
    gameConnect(token: string): void {
        if (this.game) {
            this.game.connect({
                url: `${oops.config.game.webSocketServer}wsbridge?Authorization=${token}`,
                autoReconnect: 3
            });
        }
    }

    /** 断开游戏服务器 */
    gameClose(): void {
        if (this.game) {
            this.game.close();
        }
    }

    /** 销毁游戏服务器 */
    gameDestroy(): void {
        if (this.game) {
            this.game.close();
            this.game.cleanListeners();
            NetManager.instance.removeNetNode(NetChannelType.Game);
            this.game = null!;
        }
    }
}
