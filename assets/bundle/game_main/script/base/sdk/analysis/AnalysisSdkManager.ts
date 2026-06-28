import { sys } from 'cc';
import { AnalysisProperties, IAnalysisInitOption } from './AnalysisSdkTypes';
import { DefaultAnalysisSdk } from './platform/DefaultAnalysisSdk';
import { DouyinAnalysisSdk, DouYinAnalysisCfg } from './platform/DouyinAnalysisSdk';
import { WechatAnalysisSdk, WeChatAnalysisCfg } from './platform/WechatAnalysisSdk';
import { IAnalysisSdk } from './IAnalysisSdk';

/**
 * 数据分析 SDK 管理器
 *
 * 职责：
 * 1. 管理当前使用的 {@link IAnalysisSdk} 实现实例。
 * 2. 支持按平台自动初始化对应的数据分析 SDK。
 * 3. 平台初始化失败或未接入时回退到 {@link DefaultAnalysisSdk}（空操作，不崩溃）。
 */
export class AnalysisSdkManager implements IAnalysisSdk {
    /** SDK 实现实例，由 initByPlatform() 按平台创建 */
    private _sdk: IAnalysisSdk = null!;
    private _initialized: boolean = false;

    /** 使用传入参数初始化当前 SDK */
    async init(option: IAnalysisInitOption): Promise<void> {
        await this._sdk.init(option);
        this._initialized = true;
    }

    /**
     * 按平台自动创建并初始化对应的数据分析 SDK。
     * - 微信小游戏 → WechatAnalysisSdk（友盟）
     * - 抖音小游戏 → DouyinAnalysisSdk（友盟）
     * - 其他平台 → DefaultAnalysisSdk（空操作兜底）
     */
    async initByPlatform(): Promise<void> {
        switch (sys.platform) {
            case sys.Platform.WECHAT_GAME:
                this._sdk = new WechatAnalysisSdk();
                await this._sdk.init(WeChatAnalysisCfg);
                console.log('[友盟] 微信小游戏数据分析 SDK 初始化成功');
                break;

            case sys.Platform.BYTEDANCE_MINI_GAME:
                this._sdk = new DouyinAnalysisSdk();
                await this._sdk.init(DouYinAnalysisCfg);
                console.log('[友盟] 抖音小游戏数据分析 SDK 初始化成功');
                break;

            default:
                this._sdk = new DefaultAnalysisSdk();
                console.log('[友盟] 当前平台不支持数据分析 SDK，使用空实现');
                break;
        }
        this._initialized = true;
    }

    /** SDK 是否已初始化 */
    isInitialized(): boolean {
        return this._initialized;
    }

    /** 销毁当前 SDK，恢复为默认空实现 */
    destroy(): void {
        this._sdk.destroy();
        this._sdk = new DefaultAnalysisSdk();
        this._initialized = false;
    }

    /** 设置用户标识（accountId 传入 openid/uid） */
    async login(accountId: string): Promise<void> {
        return this._sdk.login(accountId);
    }

    /** 清除用户标识 */
    async logout(): Promise<void> {
        return this._sdk.logout();
    }

    /** 获取当前用户标识 */
    getAccountId(): string | undefined {
        return this._sdk.getAccountId();
    }

    /** 上报自定义事件 */
    async trackEvent(eventName: string, properties?: AnalysisProperties): Promise<void> {
        return this._sdk.trackEvent(eventName, properties);
    }

    /** 设置渠道标识（初始化后也可修改） */
    setChannel(channel: string): void {
        this._sdk.setChannel(channel);
    }

    /** 获取当前渠道标识 */
    getChannel(): string | undefined {
        return this._sdk.getChannel();
    }
}
