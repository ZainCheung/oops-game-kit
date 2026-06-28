import { AnalysisProperties, IAnalysisInitOption } from '../AnalysisSdkTypes';
import { IAnalysisSdk } from '../IAnalysisSdk';

/**
 * 默认数据分析 SDK 实现（平台不支持时的回退）
 *
 * 当前平台未接入数据分析 SDK 时使用，所有方法均为空操作，不会崩溃。
 */
export class DefaultAnalysisSdk implements IAnalysisSdk {
    private _initialized: boolean = false;
    private _accountId?: string;
    private _debug: boolean = false;
    private _channel?: string;

    private log(method: string, ...args: any[]): void {
        if (this._debug) {
            console.log(`[友盟] ${method}`, ...args);
        }
    }

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
        this.log('destroy');
    }

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

    async trackEvent(eventName: string, properties?: AnalysisProperties): Promise<void> {
        this.log('trackEvent', eventName, properties);
    }

    setChannel(channel: string): void {
        this._channel = channel;
        this.log('setChannel', channel);
    }

    getChannel(): string | undefined {
        return this._channel;
    }
}
