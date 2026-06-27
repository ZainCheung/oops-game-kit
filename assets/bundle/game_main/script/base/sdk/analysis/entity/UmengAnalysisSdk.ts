import {
    AnalysisProperties,
    AnalysisUserProperties,
    IAnalysisInitOption,
    ITrackOption,
} from '../AnalysisSdkTypes';
import { IAnalysisSdk } from '../IAnalysisSdk';

/**
 * 友盟+ 数据分析 SDK 实现（支持微信小游戏 / 抖音小游戏）
 *
 * 使用方式：
 * 1. 从友盟开发者中心下载对应平台的 SDK JS 文件
 *    - 微信：libs/umeng/wechat/umeng-wxgame-sdk.js
 *    - 抖音：libs/umeng/douyin/umeng-ttgame-sdk.js
 * 2. 在游戏启动时注入：
 *    ```typescript
 *    sdk.analysis.setSdk(new UmengAnalysisSdk());
 *    sdk.analysis.init({ appId: '你的友盟AppKey', serverUrl: 'xxx' });
 *    ```
 *
 * 注意：本实现自动检测当前运行平台（微信/抖音），加载对应的友盟 SDK。
 * 非小游戏环境或 SDK 文件缺失时，方法会退化为空操作。
 */
export class UmengAnalysisSdk implements IAnalysisSdk {
    private _umeng: any = null;
    private _initialized: boolean = false;
    private _accountId?: string;
    private _superProperties: AnalysisProperties = {};
    private _paused: boolean = false;
    private _debug: boolean = false;
    private _channel?: string;
    private _timeZoneOffset: number = 0;

    //#region ========== 初始化与生命周期 ==========

    async init(option: IAnalysisInitOption): Promise<void> {
        this._debug = option.debug ?? false;
        this._channel = option.channel;

        try {
            // 自动检测平台并加载对应的友盟 SDK
            if (typeof wx !== 'undefined') {
                this._umeng = require('../../../../libs/umeng/wechat/umeng-wxgame-sdk');
            }
            else if (typeof tt !== 'undefined') {
                this._umeng = require('../../../../libs/umeng/douyin/umeng-ttgame-sdk');
            }
            else {
                console.warn('[UmengAnalysisSdk] 非微信/抖音环境，友盟 SDK 未加载');
                return;
            }

            this._umeng.init({
                appKey: option.appId,
                debug: option.debug,
                ...option,
            });
            this._initialized = true;
            this.log('init', option);
        }
        catch (err) {
            console.error('[UmengAnalysisSdk] 初始化失败:', err);
            throw err;
        }
    }

    isInitialized(): boolean {
        return this._initialized;
    }

    destroy(): void {
        this._initialized = false;
        this._accountId = undefined;
        this._superProperties = {};
        this._paused = false;
        this._umeng = null;
        this.log('destroy');
    }

    //#endregion

    //#region ========== 用户标识 ==========

    async login(accountId: string): Promise<void> {
        this._accountId = accountId;
        this._umeng?.setUserAccount?.(accountId);
        this.log('login', accountId);
    }

    async logout(): Promise<void> {
        this._accountId = undefined;
        this.log('logout');
    }

    getAccountId(): string | undefined {
        return this._accountId;
    }

    getDistinctId(): string | undefined {
        // 友盟内部管理 distinctId，外部无法直接获取
        return undefined;
    }

    //#endregion

    //#region ========== 事件上报 ==========

    async track(option: ITrackOption): Promise<void> {
        if (this._paused) return;
        const params = { ...this._superProperties, ...option.properties };
        this._umeng?.trackEvent?.({ eventId: option.eventName, params });
        this.log('track', option.eventName, params);
    }

    async trackEvent(eventName: string, properties?: AnalysisProperties): Promise<void> {
        return this.track({ eventName, properties });
    }

    async setSuperProperties(properties: AnalysisProperties): Promise<void> {
        this._superProperties = { ...this._superProperties, ...properties };
        this._umeng?.setPresetProperty?.(this._superProperties);
        this.log('setSuperProperties', properties);
    }

    async unsetSuperProperty(propertyName: string): Promise<void> {
        delete this._superProperties[propertyName];
        this._umeng?.setPresetProperty?.(this._superProperties);
        this.log('unsetSuperProperty', propertyName);
    }

    async clearSuperProperties(): Promise<void> {
        this._superProperties = {};
        this._umeng?.setPresetProperty?.({});
        this.log('clearSuperProperties');
    }

    getSuperProperties(): AnalysisProperties {
        return { ...this._superProperties };
    }

    //#endregion

    //#region ========== 用户属性 ==========

    async userSet(properties: AnalysisUserProperties): Promise<void> {
        this._umeng?.setUserProfile?.(properties);
        this.log('userSet', properties);
    }

    async userSetOnce(properties: AnalysisUserProperties): Promise<void> {
        console.warn('[UmengAnalysisSdk] userSetOnce 退化为 userSet（友盟不支持 setOnce）');
        return this.userSet(properties);
    }

    async userAdd(properties: Record<string, number>): Promise<void> {
        console.warn('[UmengAnalysisSdk] userAdd 退化为 userSet（友盟不支持累加）');
        return this.userSet(properties);
    }

    async userUnset(propertyNames: string[]): Promise<void> {
        const unsetProps: Record<string, any> = {};
        for (const name of propertyNames) {
            unsetProps[name] = null;
        }
        this._umeng?.setUserProfile?.(unsetProps);
        this.log('userUnset', propertyNames);
    }

    async userAppend(properties: Record<string, string | string[]>): Promise<void> {
        console.warn('[UmengAnalysisSdk] userAppend 退化为 userSet（友盟不支持数组追加）');
        return this.userSet(properties);
    }

    //#endregion

    //#region ========== 上报控制 ==========

    pause(): void {
        this._paused = true;
        this.log('pause');
    }

    resume(): void {
        this._paused = false;
        this.log('resume');
    }

    async flush(): Promise<void> {
        this.log('flush');
    }

    stop(): void {
        this._paused = true;
        this.log('stop');
    }

    isPaused(): boolean {
        return this._paused;
    }

    //#endregion

    //#region ========== 高级功能 ==========

    setTimeZoneOffset(offsetMs: number): void {
        this._timeZoneOffset = offsetMs;
        this.log('setTimeZoneOffset', offsetMs);
    }

    getTimeZoneOffset(): number {
        return this._timeZoneOffset;
    }

    setChannel(channel: string): void {
        this._channel = channel;
        this.log('setChannel', channel);
    }

    getChannel(): string | undefined {
        return this._channel;
    }

    //#endregion

    private log(method: string, ...args: any[]): void {
        if (this._debug) {
            console.log(`[UmengAnalysisSdk] ${method}`, ...args);
        }
    }
}
