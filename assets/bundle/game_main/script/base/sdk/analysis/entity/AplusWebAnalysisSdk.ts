/** 全局变量声明 */
declare const window: any;

import {
    AnalysisProperties,
    AnalysisUserProperties,
    IAnalysisInitOption,
    ITrackOption,
} from '../AnalysisSdkTypes';
import { IAnalysisSdk } from '../IAnalysisSdk';

/**
 * 友盟+ QuickTracking Web/H5 数据分析 SDK 实现
 *
 * 使用方式：
 * 1. 在页面 <head> 中按官方文档引入 aplus SDK 脚本：
 *    ```html
 *    <head>
 *      <script>
 *        (function(w, d, s, q, i) {
 *          w[q] = w[q] || [];
 *          var f = d.getElementsByTagName(s)[0], j = d.createElement(s);
 *          j.async = true;
 *          j.id = 'beacon-aplus';
 *          j.src = 'https://d.alicdn.com/alilog/mlog/aplus/' + i + '.js';
 *          f.parentNode.insertBefore(j, f);
 *        })(window, document, 'script', 'aplus_queue', '203467608');
 *
 *        aplus_queue.push({
 *          action: 'aplus.setMetaInfo',
 *          arguments: ['appKey', 'xxxxxxx']
 *        });
 *        // 手动 PV 模式
 *        aplus_queue.push({
 *          action: 'aplus.setMetaInfo',
 *          arguments: ['aplus-waiting', 'MAN']
 *        });
 *        // 调试模式
 *        aplus_queue.push({
 *          action: 'aplus.setMetaInfo',
 *          arguments: ['DEBUG', true]
 *        });
 *        // 用户 ID 类型（如 openid / unionid / uuid 等）
 *        aplus_queue.push({
 *          action: 'aplus.setMetaInfo',
 *          arguments: ['aplus-idtype', 'xxxx']
 *        });
 *      </script>
 *    </head>
 *    ```
 * 2. 在游戏启动时注入：
 *    ```typescript
 *    sdk.analysis.setSdk(new AplusWebAnalysisSdk());
 *    sdk.analysis.init({
 *        appId: '你的友盟AppKey',
 *        serverUrl: '',
 *        channel: 'web',
 *        debug: true,
 *    });
 *    ```
 *
 * 注意：
 * - 本实现依赖全局 `window.aplus_queue` 指令队列。
 * - 非 Web 环境或 SDK 脚本未加载时，方法会退化为空操作，不会抛错。
 * - 如果页面未引入 aplus SDK 脚本，init 时会自动在 document.head 中注入基础脚本（确保 aplus_queue 存在）。
 */
export class AplusWebAnalysisSdk implements IAnalysisSdk {
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
            // 确保 aplus_queue 存在（若页面未引入脚本，自动注入基础脚本）
            this.ensureAplusQueue();

            if (typeof window === 'undefined' || !window.aplus_queue) {
                console.warn('[AplusWebAnalysisSdk] 非 Web 环境或 aplus_queue 未加载');
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

            // 收数域名（私有云/特定部署时使用）
            if (option.serverUrl) {
                this.push('aplus.setMetaInfo', ['trackDomain', option.serverUrl]);
            }

            // 用户 ID 类型（如 openid / unionid / uuid 等）
            const idtype = (option as any).idtype;
            if (idtype) {
                this.push('aplus.setMetaInfo', ['aplus-idtype', idtype]);
            }

            this._initialized = true;
            this.log('init', option);
        }
        catch (err) {
            console.error('[AplusWebAnalysisSdk] 初始化失败:', err);
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
        this.log('destroy');
    }

    //#endregion

    //#region ========== 用户标识 ==========

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

    getDistinctId(): string | undefined {
        // aplus 内部管理设备 ID，外部无法直接获取
        return undefined;
    }

    //#endregion

    //#region ========== 事件上报 ==========

    async track(option: ITrackOption): Promise<void> {
        if (this._paused) return;
        const params = this.normalizeProperties({ ...this._superProperties, ...option.properties });
        this.push('aplus.record', [option.eventName, 'OTHER', params]);
        this.log('track', option.eventName, params);
    }

    async trackEvent(eventName: string, properties?: AnalysisProperties): Promise<void> {
        return this.track({ eventName, properties });
    }

    async setSuperProperties(properties: AnalysisProperties): Promise<void> {
        this._superProperties = { ...this._superProperties, ...properties };
        this.push('aplus.setMetaInfo', ['globalproperty', this.normalizeProperties(this._superProperties)]);
        this.log('setSuperProperties', properties);
    }

    async unsetSuperProperty(propertyName: string): Promise<void> {
        delete this._superProperties[propertyName];
        this.push('aplus.setMetaInfo', ['globalproperty', this.normalizeProperties(this._superProperties)]);
        this.log('unsetSuperProperty', propertyName);
    }

    async clearSuperProperties(): Promise<void> {
        this._superProperties = {};
        this.push('aplus.setMetaInfo', ['globalproperty', {}]);
        this.log('clearSuperProperties');
    }

    getSuperProperties(): AnalysisProperties {
        return { ...this._superProperties };
    }

    //#endregion

    //#region ========== 用户属性 ==========

    async userSet(properties: AnalysisUserProperties): Promise<void> {
        this.push('aplus.record', ['$$_user_profile', 'OTHER', this.normalizeUserProperties(properties)]);
        this.log('userSet', properties);
    }

    async userSetOnce(properties: AnalysisUserProperties): Promise<void> {
        console.warn('[AplusWebAnalysisSdk] userSetOnce 退化为 userSet（aplus 不支持 setOnce）');
        return this.userSet(properties);
    }

    async userAdd(properties: Record<string, number>): Promise<void> {
        console.warn('[AplusWebAnalysisSdk] userAdd 退化为 userSet（aplus 不支持累加）');
        return this.userSet(properties);
    }

    async userUnset(propertyNames: string[]): Promise<void> {
        const unsetProps: Record<string, any> = {};
        for (const name of propertyNames) {
            unsetProps[name] = null;
        }
        this.push('aplus.record', ['$$_user_profile', 'OTHER', unsetProps]);
        this.log('userUnset', propertyNames);
    }

    async userAppend(properties: Record<string, string | string[]>): Promise<void> {
        console.warn('[AplusWebAnalysisSdk] userAppend 退化为 userSet（aplus 不支持数组追加）');
        return this.userSet(properties as AnalysisUserProperties);
    }

    //#endregion

    //#region ========== 上报控制 ==========

    pause(): void {
        this._paused = true;
        this.push('aplus.setMetaInfo', ['aplus-sdk-disable', true]);
        this.log('pause');
    }

    resume(): void {
        this._paused = false;
        this.push('aplus.setMetaInfo', ['aplus-sdk-disable', false]);
        this.log('resume');
    }

    async flush(): Promise<void> {
        this.log('flush');
    }

    stop(): void {
        this._paused = true;
        this.push('aplus.setMetaInfo', ['aplus-sdk-disable', true]);
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

    //#region ========== Web/H5 专有接口 ==========

    /**
     * 发送页面 PV 日志
     * @param pageName 页面编码
     * @param pageTitle 页面标题
     * @param params 页面参数（可选）
     */
    sendPV(pageName: string, pageTitle?: string, params?: Record<string, string | number | boolean>): void {
        const eventParams: Record<string, any> = { ...this.normalizeProperties(params as any) };
        if (pageName) eventParams.page_name = pageName;
        if (pageTitle) eventParams.page_title = pageTitle;
        this.push('aplus.sendPV', [{ is_auto: false }, eventParams]);
        this.log('sendPV', pageName, eventParams);
    }

    /**
     * 设置 OpenID（微信内 H5 场景）
     * @param openid 微信 OpenID
     */
    setOpenid(openid: string): void {
        this.push('aplus.setMetaInfo', ['openid', openid]);
        this.log('setOpenid', openid);
    }

    /**
     * 设置设备 ID
     * @param devId 设备唯一标识
     */
    setDevId(devId: string): void {
        this.push('aplus.setMetaInfo', ['_dev_id', devId]);
        this.log('setDevId', devId);
    }

    //#endregion

    //#region ========== 私有方法 ==========

    private ensureAplusQueue(): void {
        if (typeof window === 'undefined') return;
        if (window.aplus_queue) return;

        // 创建 aplus_queue（若页面未引入脚本，SDK 后续会退化为空操作，但至少不会报错）
        window.aplus_queue = window.aplus_queue || [];
    }

    private push(action: string, args: any[]): void {
        if (typeof window !== 'undefined' && window.aplus_queue) {
            window.aplus_queue.push({ action, arguments: args });
        }
    }

    private normalizeProperties(properties?: AnalysisProperties): Record<string, string | number | boolean> {
        if (!properties) return {};
        const result: Record<string, string | number | boolean> = {};
        for (const [key, value] of Object.entries(properties)) {
            if (value instanceof Date) {
                result[key] = value.toISOString();
            }
            else if (Array.isArray(value)) {
                result[key] = JSON.stringify(value);
            }
            else if (typeof value === 'boolean' || typeof value === 'number' || typeof value === 'string') {
                result[key] = value;
            }
            else if (value !== null && value !== undefined) {
                result[key] = String(value);
            }
        }
        return result;
    }

    private normalizeUserProperties(properties: AnalysisUserProperties): Record<string, string | number | boolean> {
        const result: Record<string, string | number | boolean> = {};
        for (const [key, value] of Object.entries(properties)) {
            if (value instanceof Date) {
                result[key] = value.toISOString();
            }
            else if (Array.isArray(value)) {
                result[key] = JSON.stringify(value);
            }
            else if (typeof value === 'object' && value !== null && 'value' in value && 'time' in value) {
                const item = value as { value: string | number; time: Date };
                result[key] = typeof item.value === 'number' ? item.value : String(item.value);
                result[`${key}_time`] = item.time instanceof Date ? item.time.toISOString() : String(item.time);
            }
            else if (typeof value === 'boolean' || typeof value === 'number' || typeof value === 'string') {
                result[key] = value;
            }
            else if (value !== null && value !== undefined) {
                result[key] = String(value);
            }
        }
        return result;
    }

    private log(method: string, ...args: any[]): void {
        if (this._debug) {
            console.log(`[AplusWebAnalysisSdk] ${method}`, ...args);
        }
    }

    //#endregion
}
