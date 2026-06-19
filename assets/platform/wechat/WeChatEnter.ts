import { _decorator, AssetManager, assetManager, Component, director } from 'cc';
const { ccclass } = _decorator;

/** 微信小游戏游戏入口 */
@ccclass('WeChatEnter')
export class WeChatEnter extends Component {
    async onLoad() {
        await this.loadBundle('game_main');
        director.loadScene('main');
    }

    private loadBundle(name: string): Promise<void> {
        return new Promise((resolve, reject) => {
            assetManager.loadBundle(name, (err: Error | null, data: AssetManager.Bundle) => {
                if (err) {
                    console.error(`加载 bundle ${name} 失败`, err);
                    reject(err);
                    return;
                }
                resolve();
            });
        })
    }
}