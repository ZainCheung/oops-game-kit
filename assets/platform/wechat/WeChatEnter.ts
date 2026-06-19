import { _decorator, AssetManager, assetManager, Component, director, sys } from 'cc';
const { ccclass } = _decorator;

declare const wx: any;

/** 微信小游戏游戏入口 */
@ccclass('WeChatEnter')
export class WeChatEnter extends Component {
    async onLoad() {
        this.initWeChatEnv();
        await this.loadBundle('game_main');
        director.loadScene('main');
    }

    /** 微信环境初始化（域名校验等需在 project.config.json 中配置） */
    private initWeChatEnv() {
        if (sys.platform !== sys.Platform.WECHAT_GAME || typeof wx === 'undefined') return;

        const accountInfo = wx.getAccountInfoSync?.();
        const appId = accountInfo?.miniProgram?.appId;
        if (!appId || appId === 'wx6ac3f5090a6b99c5' || appId === 'touristappid') {
            console.warn(
                '[WeChat] 当前 AppID 无效或为 Cocos 默认测试号，请在 Cocos 构建面板填写你自己的小游戏 AppID，' +
                '或在微信开发者工具中使用测试号。否则可能出现 webapi_getwxaasyncsecinfo:fail (-80002) 报错。'
            );
        }
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