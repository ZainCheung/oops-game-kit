/** 全局变量声明 */
declare const wx: any;

import { AnalysisProperties, IAnalysisInitOption } from '../AnalysisSdkTypes';
import { IAnalysisSdk } from '../IAnalysisSdk';
import { WeChatAnalysisCfg } from '../../SdkConfig';
export { WeChatAnalysisCfg };

/**
 * 友盟+ 数据分析 SDK 实现（微信小游戏平台）
 *
 * 前置条件：在 game.js 顶部按官方文档初始化 uma，初始化后可通过 wx.uma 引用。
 */
export class WechatAnalysisSdk implements IAnalysisSdk {
    private _umeng: any = null;
    private _initialized: boolean = false;
    private _accountId?: string;
    private _debug: boolean = false;
    private _channel?: string;

    async init(option: IAnalysisInitOption): Promise<void> {
        this._debug = option.debug ?? false;
        this._channel = option.channel;

        this._umeng = typeof wx !== 'undefined' ? (wx.uma ?? null) : null;

        if (!this._umeng) {
            console.warn('[友盟] wx.uma 未初始化，请在 game.js 中按官方文档初始化 uma');
            return;
        }

        this._initialized = true;
        this.log('init', option);
    }

    isInitialized(): boolean {
        return this._initialized;
    }

    destroy(): void {
        this._initialized = false;
        this._accountId = undefined;
        this._umeng = null;
        this.log('destroy');
    }

    async login(accountId: string): Promise<void> {
        this._accountId = accountId;
        this._umeng?.setUserid?.(accountId);
        this.log('login', accountId);
    }

    async logout(): Promise<void> {
        this._accountId = undefined;
        this.log('logout');
    }

    getAccountId(): string | undefined {
        return this._accountId;
    }

    async trackEvent(eventName: string, properties?: AnalysisProperties): Promise<void> {
        this._umeng?.trackEvent?.(eventName, properties ?? {});
        this.log('trackEvent', eventName, properties);
    }

    setChannel(channel: string): void {
        this._channel = channel;
        this.log('setChannel', channel);
    }

    getChannel(): string | undefined {
        return this._channel;
    }

    //#region ========== 微信小游戏专有接口 ==========

    /** 设置微信 OpenID（useOpenid: true 时必须上传） */
    setOpenid(openid: string): void {
        this._umeng?.setOpenid?.(openid);
        this.log('setOpenid', openid);
    }

    /** 设置微信 UnionID */
    setUnionid(unionid: string): void {
        this._umeng?.setUnionid?.(unionid);
        this.log('setUnionid', unionid);
    }

    /** 追踪分享事件，返回带分享追踪参数的分享数据 */
    trackShare(shareData?: any): any {
        const result = this._umeng?.trackShare?.(shareData);
        this.log('trackShare', shareData, result);
        return result ?? shareData;
    }

    //#endregion

    private log(method: string, ...args: any[]): void {
        if (this._debug) {
            console.log(`[友盟] ${method}`, ...args);
        }
    }
}
