import {
    AnalysisProperties,
    AnalysisUserProperties,
    IAnalysisInitOption,
    ITrackOption,
} from './AnalysisSdkTypes';
import { IAnalysisSdk } from './IAnalysisSdk';

/**
 * 数据分析 SDK 管理器
 *
 * 职责：
 * 1. 管理当前使用的 {@link IAnalysisSdk} 实现实例。
 * 2. 提供统一的访问入口 {@link getSdk} / {@link setSdk}。
 * 3. 默认未设置任何实现时，自动回退到 {@link EmptyAnalysisSdk}（空操作，不崩溃）。
 *
 * 使用方式：
 * ```typescript
 * const mgr = new AnalysisSdkManager();
 * mgr.init({ appId: 'xxx', serverUrl: 'https://xxx' });
 *
 * // 之后通过 mgr.xxx 直接调用接口
 * mgr.trackEvent('LevelUp', { level: 10 });
 * ```
 */
export class AnalysisSdkManager implements IAnalysisSdk {
    /** 当前数据分析 SDK 实现 */
    private _sdk: IAnalysisSdk = null!;
    /** 是否已经初始化过 */
    private _initialized: boolean = false;

    /**
     * 注入自定义的数据分析 SDK 实现。
     * 通常在接入具体平台（如数数）时调用。
     * @param sdk 实现了 {@link IAnalysisSdk} 的实例
     */
    setSdk(sdk: IAnalysisSdk): void {
        this._sdk = sdk;
    }

    /**
     * 获取当前数据分析 SDK 实现。
     * 若未设置，自动创建 {@link EmptyAnalysisSdk} 空实现并返回。
     */
    getSdk(): IAnalysisSdk {
        if (!this._sdk) {
            // 懒加载空实现，避免未接入时外部调用报错
            const { EmptyAnalysisSdk } = require('./EmptyAnalysisSdk');
            this._sdk = new EmptyAnalysisSdk();
        }
        return this._sdk;
    }

    /**
     * 初始化当前数据分析 SDK。
     * 如果已注入具体实现，则初始化该实现；否则初始化空实现。
     * @param option 初始化配置
     */
    async init(option: IAnalysisInitOption): Promise<void> {
        await this.getSdk().init(option);
        this._initialized = true;
    }

    isInitialized(): boolean {
        return this._initialized && this.getSdk().isInitialized();
    }

    destroy(): void {
        this.getSdk().destroy();
        this._sdk = null!;
        this._initialized = false;
    }

    //#region ========== 用户标识 ==========

    async login(accountId: string): Promise<void> {
        return this.getSdk().login(accountId);
    }

    async logout(): Promise<void> {
        return this.getSdk().logout();
    }

    getAccountId(): string | undefined {
        return this.getSdk().getAccountId();
    }

    getDistinctId(): string | undefined {
        return this.getSdk().getDistinctId();
    }

    //#endregion

    //#region ========== 事件上报 ==========

    async track(option: ITrackOption): Promise<void> {
        return this.getSdk().track(option);
    }

    async trackEvent(eventName: string, properties?: AnalysisProperties): Promise<void> {
        return this.getSdk().trackEvent(eventName, properties);
    }

    async setSuperProperties(properties: AnalysisProperties): Promise<void> {
        return this.getSdk().setSuperProperties(properties);
    }

    async unsetSuperProperty(propertyName: string): Promise<void> {
        return this.getSdk().unsetSuperProperty(propertyName);
    }

    async clearSuperProperties(): Promise<void> {
        return this.getSdk().clearSuperProperties();
    }

    getSuperProperties(): AnalysisProperties {
        return this.getSdk().getSuperProperties();
    }

    //#endregion

    //#region ========== 用户属性 ==========

    async userSet(properties: AnalysisUserProperties): Promise<void> {
        return this.getSdk().userSet(properties);
    }

    async userSetOnce(properties: AnalysisUserProperties): Promise<void> {
        return this.getSdk().userSetOnce(properties);
    }

    async userAdd(properties: Record<string, number>): Promise<void> {
        return this.getSdk().userAdd(properties);
    }

    async userUnset(propertyNames: string[]): Promise<void> {
        return this.getSdk().userUnset(propertyNames);
    }

    async userAppend(properties: Record<string, string | string[]>): Promise<void> {
        return this.getSdk().userAppend(properties);
    }

    //#endregion

    //#region ========== 上报控制 ==========

    pause(): void {
        this.getSdk().pause();
    }

    resume(): void {
        this.getSdk().resume();
    }

    async flush(): Promise<void> {
        return this.getSdk().flush();
    }

    stop(): void {
        this.getSdk().stop();
    }

    isPaused(): boolean {
        return this.getSdk().isPaused();
    }

    //#endregion

    //#region ========== 高级功能 ==========

    setTimeZoneOffset(offsetMs: number): void {
        this.getSdk().setTimeZoneOffset(offsetMs);
    }

    getTimeZoneOffset(): number {
        return this.getSdk().getTimeZoneOffset();
    }

    setChannel(channel: string): void {
        this.getSdk().setChannel(channel);
    }

    getChannel(): string | undefined {
        return this.getSdk().getChannel();
    }

    //#endregion
}
