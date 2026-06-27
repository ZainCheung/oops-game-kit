/** 全局变量声明 */
declare const tt: any;

import {
    AnalysisProperties,
    AnalysisUserProperties,
    IAnalysisInitOption,
    ITrackOption,
} from '../AnalysisSdkTypes';
import { IAnalysisSdk } from '../IAnalysisSdk';

/**
 * 友盟+ 数据分析 SDK 实现（抖音小游戏平台）
 *
 * 使用方式：
 * 1. 从友盟开发者中心下载抖音小游戏 SDK JS 文件，放在项目根目录的 utils/umtrack-ttgame/uma.min.js
 * 2. 在 game.js 顶部完成初始化，初始化后可通过 tt.uma 引用
 * 3. 在游戏启动时注入：
 *    ```typescript
 *    sdk.analysis.setSdk(new DouyinAnalysisSdk());
 *    sdk.analysis.init({
 *        appId: '你的友盟AppKey',
 *        serverUrl: '',
 *        channel: 'douyin',
 *        debug: true,
 *        useOpenid: false,
 *        autoGetOpenid: false,
 *    });
 *    ```
 *
 * 注意：
 * - 本实现优先使用外部已初始化的 tt.uma（即按官方文档在 game.js 中初始化）。
 * - 若外部未初始化，会尝试按常见路径 require SDK 文件并自行初始化。
 * - 非抖音环境或 SDK 文件缺失时，方法会退化为空操作，不会抛错。
 */
export class DouyinAnalysisSdk implements IAnalysisSdk {
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
            this._umeng = this.resolveSdkInstance(option);

            if (!this._umeng) {
                console.warn('[DouyinAnalysisSdk] 非抖音环境或 SDK 未加载，将使用空操作');
                return;
            }

            this._initialized = true;
            this.log('init', option);
        }
        catch (err) {
            console.error('[DouyinAnalysisSdk] 初始化失败:', err);
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
        // 友盟抖音小游戏 SDK 使用 setUserid 设置业务账号 ID
        this._umeng?.setUserid?.(accountId);
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
        // 友盟抖音小游戏 SDK：uma.trackEvent(eventId, params)
        this._umeng?.trackEvent?.(option.eventName, params);
        this.log('track', option.eventName, params);
    }

    async trackEvent(eventName: string, properties?: AnalysisProperties): Promise<void> {
        return this.track({ eventName, properties });
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
        this._umeng?.setUserProfile?.(properties);
        this.log('userSet', properties);
    }

    async userSetOnce(properties: AnalysisUserProperties): Promise<void> {
        console.warn('[DouyinAnalysisSdk] userSetOnce 退化为 userSet（友盟不支持 setOnce）');
        return this.userSet(properties);
    }

    async userAdd(properties: Record<string, number>): Promise<void> {
        console.warn('[DouyinAnalysisSdk] userAdd 退化为 userSet（友盟不支持累加）');
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
        console.warn('[DouyinAnalysisSdk] userAppend 退化为 userSet（友盟不支持数组追加）');
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

    //#region ========== 抖音小游戏专有接口 ==========

    /**
     * 设置用户 OpenID（若 useOpenid 为 true 时必须上传）
     * @param openid 用户 OpenID
     */
    setOpenid(openid: string): void {
        this._umeng?.setOpenid?.(openid);
        this.log('setOpenid', openid);
    }

    /**
     * 设置用户 UnionID
     * @param unionid 用户 UnionID
     */
    setUnionid(unionid: string): void {
        this._umeng?.setUnionid?.(unionid);
        this.log('setUnionid', unionid);
    }

    /**
     * 注册分享回调（替代 tt.onShareAppMessage）
     */
    onShareAppMessage(): void {
        this._umeng?.onShareAppMessage?.();
        this.log('onShareAppMessage');
    }

    /**
     * 调用分享（替代 tt.shareAppMessage）
     * @param options 分享参数
     */
    shareAppMessage(options?: any): void {
        this._umeng?.shareAppMessage?.(options);
        this.log('shareAppMessage', options);
    }

    /**
     * 追踪分享事件，返回带分享追踪参数的分享数据
     * @param shareData 原始分享参数
     * @returns 带追踪 query 的分享数据
     */
    trackShare(shareData?: any): any {
        const result = this._umeng?.trackShare?.(shareData);
        this.log('trackShare', shareData, result);
        return result ?? shareData;
    }

    //#endregion

    private resolveSdkInstance(option: IAnalysisInitOption): any {
        // 1. 优先使用外部已初始化的全局 uma（官方推荐在 game.js 中初始化）
        if (typeof tt !== 'undefined' && tt.uma) {
            return tt.uma;
        }

        // 2. 否则尝试按常见路径加载 SDK 文件并初始化
        if (typeof tt !== 'undefined') {
            const sdkModule = this.tryRequire([
                '../../../../utils/umtrack-ttgame/uma.min.js',
                '../../../../libs/umeng/douyin/umeng-ttgame-sdk',
                '../../../../libs/umeng/douyin/uma.min.js',
                './umtrack-ttgame/uma.min.js',
            ]);
            if (sdkModule) {
                sdkModule.init({
                    appKey: option.appId,
                    useOpenid: option.useOpenid ?? false,
                    autoGetOpenid: option.autoGetOpenid ?? false,
                    debug: option.debug ?? false,
                });
                return tt.uma ?? sdkModule;
            }
        }

        return null;
    }

    private tryRequire(paths: string[]): any {
        if (typeof require === 'undefined') return null;
        for (const p of paths) {
            try {
                return require(p);
            }
            catch (e) {
                // 路径不存在则继续尝试下一个
            }
        }
        return null;
    }

    private log(method: string, ...args: any[]): void {
        if (this._debug) {
            console.log(`[DouyinAnalysisSdk] ${method}`, ...args);
        }
    }
}
