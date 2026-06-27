import { sys } from 'cc';
import './BuglyShim';
import * as sdk from 'bugly-mp-sdk';

/** Bugly 初始化选项 */
export interface IBuglyOptions {
    /** Bugly 产品 ID（小游戏必填） */
    appId?: string;
    /** Bugly App Key（Android 原生必填） */
    appKey?: string;
    /** 游戏版本号 */
    version?: string;
    /** 是否开启调试日志 */
    debug?: boolean;
}

/**
 * Bugly 报错监控 SDK（基于 bugly-mp-sdk@1.0.5-beta.4）
 *
 * 支持：微信小游戏、抖音小游戏、Android 原生
 */
export class BuglyMonitoringSdk {
    private _bugly: any = null;
    private _debug: boolean = false;

    /**
     * 初始化 Bugly
     * @param options 初始化选项（推荐）
     */
    init(options: IBuglyOptions): void;
    /**
     * 初始化 Bugly（旧版兼容）
     * @param appId  Bugly 产品 ID
     * @param version  游戏版本号
     * @param debug  是否开启调试日志
     */
    init(appId: string, version?: string, debug?: boolean): void;
    init(arg0: string | IBuglyOptions, version?: string, debug?: boolean): void {
        let options: IBuglyOptions;
        if (typeof arg0 === 'string') {
            options = { appId: arg0, version, debug };
        }
        else {
            options = arg0 ?? {};
        }
        this._init(options);
    }

    private _init(options: IBuglyOptions): void {
        const { appId, appKey, version, debug } = options;
        this._debug = debug ?? false;

        try {
            if (sys.platform === sys.Platform.WECHAT_GAME || sys.platform === sys.Platform.BYTEDANCE_MINI_GAME) {
                this._initMiniGame(appId, version);
            }
            else if (sys.platform === sys.Platform.ANDROID) {
                this._initAndroid(appId, appKey, version);
            }
            else {
                console.warn('[BuglyMonitoringSdk] 非支持平台，Bugly SDK 未加载');
                return;
            }
        }
        catch (err) {
            console.error('[BuglyMonitoringSdk] 初始化失败:', err);
        }
    }

    private _initMiniGame(appId?: string, version?: string): void {
        if (!appId) {
            console.warn('[BuglyMonitoringSdk] 小游戏平台缺少 appId，跳过初始化');
            return;
        }

        const adaptor = sys.platform === sys.Platform.WECHAT_GAME ? sdk.wxAdaptor : sdk.ttAdaptor;
        const Bugly = sdk.Bugly;
        this._bugly = new Bugly({
            id: appId,
            adaptor: adaptor,
            env: this._debug ? 'debug' : 'production',
            version: version,
        });

        this._log('init', { platform: sys.platform, appId, version, debug: this._debug });
    }

    private _initAndroid(appId?: string, appKey?: string, version?: string): void {
        if (!appId || !appKey) {
            console.warn('[BuglyMonitoringSdk] Android 平台缺少 appId 或 appKey，跳过初始化');
            return;
        }

        try {
            const native = (window as any).native || (window as any).jsb;
            if (!native?.reflection?.callStaticMethod) {
                console.warn('[BuglyMonitoringSdk] Android 平台未找到 native.reflection，请确保原生层已接入 Bugly');
                return;
            }

            // 调用 Android 原生层初始化方法
            // 需在原生工程 AppActivity 中新增：
            // public static void initBugly(String appId, String appKey, String version) { ... }
            native.reflection.callStaticMethod(
                'com/cocos/game/AppActivity',
                'initBugly',
                '(Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;)V',
                appId,
                appKey,
                version ?? '1.0.0'
            );

            this._log('init', { platform: 'android', appId, version, debug: this._debug });
        }
        catch (err) {
            console.error('[BuglyMonitoringSdk] Android 初始化失败:', err);
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

