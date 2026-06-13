import { _decorator, AssetManager, assetManager, Component, director } from 'cc';
const { ccclass } = _decorator;

/** 微信小游戏游戏入口 */
@ccclass('WeChatEnter')
export class WeChatEnter extends Component {
    async onLoad() {
        director.loadScene('main');
    }

    private loadBundle(name: string): Promise<void> {
        return new Promise((resolve, reject) => {
            assetManager.loadBundle(name, (err: Error | null, data: AssetManager.Bundle) => {
                resolve();
            });
        })
    }
}