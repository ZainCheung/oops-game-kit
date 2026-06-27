import { sys } from 'cc';
import { AnalysisProperties, IAnalysisInitOption } from './AnalysisSdkTypes';
import { EmptyAnalysisSdk } from './EmptyAnalysisSdk';
import { AplusWebAnalysisSdk } from './platform/AplusWebAnalysisSdk';
import { DouyinAnalysisSdk } from './platform/DouyinAnalysisSdk';
import { WechatAnalysisSdk } from './platform/WechatAnalysisSdk';
import { IAnalysisSdk } from './IAnalysisSdk';

/**
 * 数据分析 SDK 管理器
 *
 * 职责：
 * 1. 管理当前使用的 {@link IAnalysisSdk} 实现实例。
 * 2. 提供统一的访问入口 {@link getSdk} / {@link setSdk}。
 * 3. 默认未设置任何实现时，自动回退到 {@link EmptyAnalysisSdk}（空操作，不崩溃）。
 * 4. 支持按平台自动初始化对应的数据分析 SDK。
 */
export class AnalysisSdkManager implements IAnalysisSdk {
    private _sdk: IAnalysisSdk = null!;
    private _initialized: boolean = false;

    /** 注入自定义的数据分析 SDK 实现 */
    setSdk(sdk: IAnalysisSdk): void {
        this._sdk = sdk;
    }

    /** 获取当前 SDK 实现，未设置时回退到空实现 */
    getSdk(): IAnalysisSdk {
        if (!this._sdk) {
            this._sdk = new EmptyAnalysisSdk();
        }
        return this._sdk;
    }

    /** 初始化当前 SDK */
    async init(option: IAnalysisInitOption): Promise<void> {
        await this.getSdk().init(option);
        this._initialized = true;
    }

    /**
     * 按平台自动创建并初始化对应的数据分析 SDK。
     * - 微信小游戏 → WechatAnalysisSdk
     * - 抖音小游戏 → DouyinAnalysisSdk
     * - 其他平台 → AplusWebAnalysisSdk
     */
    async initByPlatform(): Promise<void> {
        switch (sys.platform) {
            case sys.Platform.WECHAT_GAME:
                this.setSdk(new WechatAnalysisSdk());
                await this.init({
                    appId: '6a3fce7f6f259537c7bf87e2',
                    channel: 'wechat',
                    debug: true,
                    useOpenid: false,
                    autoGetOpenid: false,
                });
                console.log('[友盟] 微信小游戏数据分析 SDK 初始化成功');
                break;

            case sys.Platform.BYTEDANCE_MINI_GAME:
                this.setSdk(new DouyinAnalysisSdk());
                await this.init({
                    appId: '', // TODO: 请填写抖音小游戏的友盟 AppKey
                    channel: 'douyin',
                    debug: true,
                    useOpenid: false,
                    autoGetOpenid: false,
                });
                console.log('[友盟] 抖音小游戏数据分析 SDK 初始化成功');
                break;

            default:
                this.setSdk(new AplusWebAnalysisSdk());
                await this.init({
                    appId: '6a3f8971cbfa69595166cb3c',
                    channel: 'web',
                    debug: true,
                });
                console.log('[友盟] Web/H5 数据分析 SDK 初始化成功');
                break;
        }
    }

    isInitialized(): boolean {
        return this._initialized && this.getSdk().isInitialized();
    }

    destroy(): void {
        this.getSdk().destroy();
        this._sdk = null!;
        this._initialized = false;
    }

    async login(accountId: string): Promise<void> {
        return this.getSdk().login(accountId);
    }

    async logout(): Promise<void> {
        return this.getSdk().logout();
    }

    getAccountId(): string | undefined {
        return this.getSdk().getAccountId();
    }

    async trackEvent(eventName: string, properties?: AnalysisProperties): Promise<void> {
        return this.getSdk().trackEvent(eventName, properties);
    }

    setChannel(channel: string): void {
        this.getSdk().setChannel(channel);
    }

    getChannel(): string | undefined {
        return this.getSdk().getChannel();
    }
}
