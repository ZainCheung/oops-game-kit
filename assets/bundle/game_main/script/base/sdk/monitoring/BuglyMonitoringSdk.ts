/** 全局变量声明 */
declare const wx: any;
declare const tt: any;

/**
 * Bugly 报错监控 SDK（基于 bugly-mp-sdk@1.0.5-beta.4）
 *
 * 支持：微信小游戏、抖音小游戏
 */
export class BuglyMonitoringSdk {
    private _bugly: any = null;
    private _debug: boolean = false;

    /**
     * 初始化 Bugly
     * @param appId  Bugly 产品 ID
     * @param version  游戏版本号
     * @param debug  是否开启调试日志
     */
    init(appId: string, version?: string, debug?: boolean): void {
        this._debug = debug ?? false;

        try {
            let sdkModule: any;
            let adaptor: any;

            if (typeof wx !== 'undefined') {
                sdkModule = require('../../../../libs/bugly/wechat/bugly-wxgame-sdk');
                adaptor = sdkModule.wxAdaptor;
            }
            else if (typeof tt !== 'undefined') {
                sdkModule = require('../../../../libs/bugly/douyin/bugly-ttgame-sdk');
                adaptor = sdkModule.ttAdaptor;
            }
            else {
                console.warn('[BuglyMonitoringSdk] 非微信/抖音环境，Bugly SDK 未加载');
                return;
            }

            const Bugly = sdkModule.Bugly || sdkModule.default || sdkModule;
            this._bugly = new Bugly({
                id: appId,
                adaptor: adaptor,
                env: this._debug ? 'debug' : 'production',
                version: version,
            });

            this._log('init', { appId, version, debug: this._debug });
        }
        catch (err) {
            console.error('[BuglyMonitoringSdk] 初始化失败:', err);
        }
    }

    /** 设置用户 ID（崩溃时关联用户） */
    setUserId(userId: string): void {
        this._bugly?.setUserId?.(userId);
        this._log('setUserId', userId);
    }

    /** 上报异常 */
    reportError(error: Error): void {
        this._bugly?.reportException?.({
            name: error.name,
            msg: error.message,
            stack: error.stack,
            level: 'error',
        });
        this._log('reportError', error.message);
    }

    /** 上报自定义异常 */
    reportException(name: string, reason: string, extra?: Record<string, any>): void {
        this._bugly?.reportException?.({
            name: name,
            msg: reason,
            level: 'error',
            ext: extra,
        });
        this._log('reportException', name, reason);
    }

    /** 信息日志 */
    logInfo(message: string): void {
        this._bugly?.info?.(message);
        this._log('logInfo', message);
    }

    /** 警告日志 */
    logWarn(message: string): void {
        this._bugly?.warn?.(message);
        this._log('logWarn', message);
    }

    /** 错误日志 */
    logError(message: string): void {
        this._bugly?.error?.(message);
        this._log('logError', message);
    }

    /** 设置自定义数据（崩溃时附带） */
    setData(key: string, value: string): void {
        this._bugly?.setData?.({ [key]: value });
        this._log('setData', key, value);
    }

    /** 批量设置自定义数据 */
    setDataBatch(data: Record<string, string>): void {
        this._bugly?.setData?.(data);
        this._log('setDataBatch', data);
    }

    /** 触发测试崩溃（调试用） */
    test(): void {
        this._bugly?.test?.();
        this._log('test');
    }

    private _log(method: string, ...args: any[]): void {
        if (this._debug) {
            console.log(`[BuglyMonitoringSdk] ${method}`, ...args);
        }
    }
}
