/** 全局变量声明 */
declare const window: any;

import { AnalysisProperties, IAnalysisInitOption } from '../AnalysisSdkTypes';
import { IAnalysisSdk } from '../IAnalysisSdk';

/**
 * 友盟+ QuickTracking Web/H5 数据分析 SDK 实现
 *
 * 前置条件：在页面 <head> 中按官方文档引入 aplus SDK 脚本，确保 window.aplus_queue 存在。
 */
export class AplusWebAnalysisSdk implements IAnalysisSdk {
    private _initialized: boolean = false;
    private _accountId?: string;
    private _debug: boolean = false;
    private _channel?: string;

    async init(option: IAnalysisInitOption): Promise<void> {
        this._debug = option.debug ?? false;
        this._channel = option.channel;

        if (typeof window === 'undefined' || !window.aplus_queue) {
            console.warn('[友盟] 非 Web 环境或 aplus_queue 未加载');
            return;
        }

        // 应用 AppKey
        this.push('aplus.setMetaInfo', ['appKey', option.appId]);
        // 手动 PV 模式
        this.push('aplus.setMetaInfo', ['aplus-waiting', 'MAN']);
        // 调试模式
        if (this._debug) {
            this.push('aplus.setMetaInfo', ['DEBUG', true]);
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
        this.log('destroy');
    }

    async login(accountId: string): Promise<void> {
        this._accountId = accountId;
        this.push('aplus.setMetaInfo', ['_user_id', accountId]);
        this.log('login', accountId);
    }

    async logout(): Promise<void> {
        this._accountId = undefined;
        this.push('aplus.setMetaInfo', ['_user_id', null]);
        this.log('logout');
    }

    getAccountId(): string | undefined {
        return this._accountId;
    }

    async trackEvent(eventName: string, properties?: AnalysisProperties): Promise<void> {
        this.push('aplus.record', [eventName, 'OTHER', this.normalizeProperties(properties)]);
        this.log('trackEvent', eventName, properties);
    }

    setChannel(channel: string): void {
        this._channel = channel;
        this.log('setChannel', channel);
    }

    getChannel(): string | undefined {
        return this._channel;
    }

    //#region ========== Web/H5 专有接口 ==========

    /** 发送页面 PV 日志 */
    sendPV(pageName: string, pageTitle?: string, params?: Record<string, string | number | boolean>): void {
        const eventParams: Record<string, any> = { ...this.normalizeProperties(params as any) };
        if (pageName) eventParams.page_name = pageName;
        if (pageTitle) eventParams.page_title = pageTitle;
        this.push('aplus.sendPV', [{ is_auto: false }, eventParams]);
        this.log('sendPV', pageName, eventParams);
    }

    /** 设置 OpenID（微信内 H5 场景） */
    setOpenid(openid: string): void {
        this.push('aplus.setMetaInfo', ['openid', openid]);
        this.log('setOpenid', openid);
    }

    //#endregion

    private push(action: string, args: any[]): void {
        if (typeof window !== 'undefined' && window.aplus_queue) {
            window.aplus_queue.push({ action, arguments: args });
        }
    }

    private normalizeProperties(properties?: AnalysisProperties): Record<string, string | number | boolean> {
        if (!properties) return {};
        const result: Record<string, string | number | boolean> = {};
        for (const [key, value] of Object.entries(properties)) {
            if (typeof value === 'boolean' || typeof value === 'number' || typeof value === 'string') {
                result[key] = value;
            }
        }
        return result;
    }

    private log(method: string, ...args: any[]): void {
        if (this._debug) {
            console.log(`[友盟] ${method}`, ...args);
        }
    }
}
