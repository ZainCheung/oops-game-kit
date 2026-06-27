import {
    AnalysisProperties,
    AnalysisUserProperties,
    IAnalysisInitOption,
    ITrackOption,
} from './AnalysisSdkTypes';
import { IAnalysisSdk } from './IAnalysisSdk';

/**
 * 空数据分析 SDK 实现（默认回退）
 *
 * 当未接入任何具体的数据统计平台（如数数、友盟等）时使用。
 * 所有方法均为空操作：
 * - 同步方法无实际操作
 * - 异步方法直接 resolve（debug 模式下打印日志）
 *
 * 行为：
 * - 事件上报不会崩溃，但数据不会被真正发送到任何服务器。
 * - 用户属性、公共属性等仅保存在内存中，不做持久化。
 */
export class EmptyAnalysisSdk implements IAnalysisSdk {
    private _initialized: boolean = false;
    private _accountId?: string;
    private _distinctId: string = 'empty-distinct-id';
    private _superProperties: AnalysisProperties = {};
    private _paused: boolean = false;
    private _debug: boolean = false;
    private _channel?: string;
    private _timeZoneOffset: number = 0;

    private log(method: string, ...args: any[]): void {
        if (this._debug) {
            console.log(`[EmptyAnalysisSdk] ${method}`, ...args);
        }
    }

    //#region ========== 初始化与生命周期 ==========

    async init(option: IAnalysisInitOption): Promise<void> {
        this._initialized = true;
        this._debug = option.debug ?? false;
        this._channel = option.channel;
        this.log('init', option);
    }

    isInitialized(): boolean {
        return this._initialized;
    }

    destroy(): void {
        this._initialized = false;
        this._accountId = undefined;
        this._superProperties = {};
        this._paused = false;
        this.log('destroy');
    }

    //#endregion

    //#region ========== 用户标识 ==========

    async login(accountId: string): Promise<void> {
        this._accountId = accountId;
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
        return this._distinctId;
    }

    //#endregion

    //#region ========== 事件上报 ==========

    async track(option: ITrackOption): Promise<void> {
        this.log('track', option.eventName, option.properties);
    }

    async trackEvent(eventName: string, properties?: AnalysisProperties): Promise<void> {
        this.log('trackEvent', eventName, properties);
    }

    async setSuperProperties(properties: AnalysisProperties): Promise<void> {
        this._superProperties = { ...this._superProperties, ...properties };
        this.log('setSuperProperties', properties);
    }

    async unsetSuperProperty(propertyName: string): Promise<void> {
        delete this._superProperties[propertyName];
        this.log('unsetSuperProperty', propertyName);
    }

    async clearSuperProperties(): Promise<void> {
        this._superProperties = {};
        this.log('clearSuperProperties');
    }

    getSuperProperties(): AnalysisProperties {
        return { ...this._superProperties };
    }

    //#endregion

    //#region ========== 用户属性 ==========

    async userSet(properties: AnalysisUserProperties): Promise<void> {
        this.log('userSet', properties);
    }

    async userSetOnce(properties: AnalysisUserProperties): Promise<void> {
        this.log('userSetOnce', properties);
    }

    async userAdd(properties: Record<string, number>): Promise<void> {
        this.log('userAdd', properties);
    }

    async userUnset(propertyNames: string[]): Promise<void> {
        this.log('userUnset', propertyNames);
    }

    async userAppend(properties: Record<string, string | string[]>): Promise<void> {
        this.log('userAppend', properties);
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
}
