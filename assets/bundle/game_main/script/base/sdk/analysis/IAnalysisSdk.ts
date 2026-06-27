import { AnalysisProperties, IAnalysisInitOption } from './AnalysisSdkTypes';

/**
 * 数据分析 SDK 接口（平台无关）
 *
 * 仅保留小游戏埋点所需的核心能力：初始化、用户标识、事件上报、渠道。
 * 各平台实现负责对接原生 SDK，未接入时由 EmptyAnalysisSdk 空实现兜底。
 */
export interface IAnalysisSdk {
    /** 初始化 SDK，必须在其他接口前调用 */
    init(option: IAnalysisInitOption): Promise<void>;

    /** 当前 SDK 是否已初始化 */
    isInitialized(): boolean;

    /** 停止 SDK 并释放资源 */
    destroy(): void;

    /** 设置用户唯一标识（业务账号 ID），登录成功后调用 */
    login(accountId: string): Promise<void>;

    /** 注销当前用户 */
    logout(): Promise<void>;

    /** 获取当前用户唯一标识 */
    getAccountId(): string | undefined;

    /** 上报自定义事件 */
    trackEvent(eventName: string, properties?: AnalysisProperties): Promise<void>;

    /** 设置渠道标识 */
    setChannel(channel: string): void;

    /** 获取当前渠道标识 */
    getChannel(): string | undefined;
}
