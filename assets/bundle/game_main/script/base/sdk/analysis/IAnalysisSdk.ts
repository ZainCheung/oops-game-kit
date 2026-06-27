import {
    AnalysisProperties,
    AnalysisUserProperties,
    IAnalysisInitOption,
    ITrackOption
} from './AnalysisSdkTypes';

/**
 * 数据分析 SDK 接口（平台无关）
 *
 * 设计原则：
 * 1. 所有异步方法返回 Promise，成功 resolve，失败 reject（debug 模式下可静默吞掉）。
 * 2. 数据结构使用 {@link AnalysisSdkTypes} 中定义的平台无关类型，
 *    各平台实现负责把原生返回值映射为这些统一类型。
 * 3. 每接入一个具体的数据统计平台（如数数、友盟、Firebase），继承此接口实现一个具体类，
 *    并在 {@link AnalysisSdkManager} 中注册。
 *
 * 默认实现见 {@link EmptyAnalysisSdk}，所有方法返回空操作或 resolve(false)，
 * 未接入具体平台时由 AnalysisSdkManager 自动回退到空实现。
 */
export interface IAnalysisSdk {
    //#region ========== 初始化与生命周期 ==========

    /**
     * 初始化数据分析 SDK。
     * 必须在调用任何其它接口前完成，通常在游戏启动时调用一次。
     * @param option 初始化配置
     */
    init(option: IAnalysisInitOption): Promise<void>;

    /** 当前 SDK 是否已初始化 */
    isInitialized(): boolean;

    /**
     * 停止 SDK 并释放资源。
     * 清空内部状态，便于切换账号或模块卸载时调用。
     */
    destroy(): void;

    //#endregion

    //#region ========== 用户标识 ==========

    /**
     * 设置用户唯一标识（业务账号 ID）。
     * 通常在登录成功后调用，用于关联访客标识与业务账号。
     * @param accountId 业务账号唯一标识
     */
    login(accountId: string): Promise<void>;

    /**
     * 注销当前用户。
     * 通常在退出登录或切换账号时调用，清空当前用户关联信息。
     */
    logout(): Promise<void>;

    /**
     * 获取当前用户唯一标识（业务账号 ID）。
     * 未设置时返回 undefined。
     */
    getAccountId(): string | undefined;

    /**
     * 获取当前访客标识（设备级匿名 ID）。
     * 未初始化时返回 undefined。
     */
    getDistinctId(): string | undefined;

    //#endregion

    //#region ========== 事件上报 ==========

    /**
     * 上报自定义事件。
     * 最常用的事件上报接口，支持传入事件名和属性。
     * @param option 事件选项（含 eventName、properties、time）
     */
    track(option: ITrackOption): Promise<void>;

    /**
     * 上报自定义事件（简写版）。
     * @param eventName 事件名称
     * @param properties 事件属性（可选）
     */
    trackEvent(eventName: string, properties?: AnalysisProperties): Promise<void>;

    /**
     * 设置公共事件属性（Super Properties）。
     * 设置后，每次 track 会自动携带这些属性，无需重复传入。
     * @param properties 公共属性集合
     */
    setSuperProperties(properties: AnalysisProperties): Promise<void>;

    /**
     * 移除单个公共事件属性。
     * @param propertyName 属性名
     */
    unsetSuperProperty(propertyName: string): Promise<void>;

    /**
     * 清空所有公共事件属性。
     */
    clearSuperProperties(): Promise<void>;

    /**
     * 获取当前公共事件属性。
     * 返回副本，避免外部直接修改内部状态。
     */
    getSuperProperties(): AnalysisProperties;

    //#endregion

    //#region ========== 用户属性 ==========

    /**
     * 设置用户属性（覆盖）。
     * 如果属性已存在，新值会覆盖旧值。
     * @param properties 用户属性集合
     */
    userSet(properties: AnalysisUserProperties): Promise<void>;

    /**
     * 设置用户属性（仅首次有效）。
     * 如果属性已存在，则不会覆盖。
     * @param properties 用户属性集合
     */
    userSetOnce(properties: AnalysisUserProperties): Promise<void>;

    /**
     * 对数值型用户属性进行累加。
     * @param properties 属性名与累加值的映射
     */
    userAdd(properties: Record<string, number>): Promise<void>;

    /**
     * 删除用户属性。
     * @param propertyNames 要删除的属性名列表
     */
    userUnset(propertyNames: string[]): Promise<void>;

    /**
     * 追加用户属性到数组（如果属性不是数组则自动创建）。
     * @param properties 属性名与追加值的映射
     */
    userAppend(properties: Record<string, string | string[]>): Promise<void>;

    //#endregion

    //#region ========== 上报控制 ==========

    /**
     * 暂停事件上报（缓存到本地，恢复后继续上报）。
     */
    pause(): void;

    /**
     * 恢复事件上报。
     */
    resume(): void;

    /**
     * 立即将所有缓存事件上报到服务器。
     * 通常在切后台或关键节点调用，确保事件不丢失。
     */
    flush(): Promise<void>;

    /**
     * 彻底停止事件上报（清空缓存，不再接收新事件）。
     */
    stop(): void;

    /**
     * 是否已暂停上报。
     */
    isPaused(): boolean;

    //#endregion

    //#region ========== 高级功能 ==========

    /**
     * 设置时区偏移（毫秒）。
     * 用于客户端时间与服务器时间不一致时进行校准。
     * @param offsetMs 偏移毫秒数（正数表示客户端时间比服务器快）
     */
    setTimeZoneOffset(offsetMs: number): void;

    /**
     * 获取当前时区偏移（毫秒）。
     */
    getTimeZoneOffset(): number;

    /**
     * 设置渠道标识。
     * 会作为公共属性自动附加到所有事件。
     * @param channel 渠道标识，如 'wechat', 'douyin', 'appstore'
     */
    setChannel(channel: string): void;

    /**
     * 获取当前渠道标识。
     */
    getChannel(): string | undefined;

    //#endregion
}
