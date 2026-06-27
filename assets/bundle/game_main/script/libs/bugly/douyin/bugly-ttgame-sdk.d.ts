/**
 * Bugly 报错监控 SDK 类型声明（基于 bugly-mp-sdk@1.0.5-beta.4）
 *
 * 支持平台：微信小游戏、抖音小游戏、支付宝小程序、百度小程序
 * 实际构建产物：aegis.min.js (UMD)
 *
 * 使用方式：
 * 1. 本 SDK 已内置在 libs/bugly/douyin/bugly-ttgame-sdk.js 中
 * 2. require 后使用适配器初始化
 * 3. Bugly 实例提供 reportException、setConfig、onError、log 等接口
 */

declare namespace buglySdk {
    /** 日志级别 */
    type LogLevel = 'info' | 'warn' | 'error' | 'fatal';

    /** 日志类型 */
    type LogType = 'log' | 'error' | 'performance' | 'speed' | 'resource' | 'pagePerformance' | 'bridge' | 'session' | 'heatmap' | 'pv' | 'custom' | 'count' | 'counter' | 'avg' | 'percent' | 'msg' | 'unknown';

    /** 平台类型 */
    type PlatType = 'wechat' | 'qq' | 'ali' | 'baidu' | 'jd' | 'toutiao' | 'lianshang' | 'qqmusic' | 'kuaishou' | 'uc' | 'cocos' | 'unity' | 'cocosUnity' | 'unknown';

    /** 网络类型 */
    type NetworkType = 'unknown' | 'wifi' | '5g' | '4g' | '3g' | '2g' | 'offline';

    /** 适配器构造函数 */
    interface AdaptorConstructor {
        (): any;
        new (): any;
    }

    /** 初始化配置 */
    interface SdkConfig {
        /** 在 Bugly 平台注册的产品 ID（必填） */
        id: string;
        /** 用户唯一标识（可选） */
        uid?: string;
        /** 适配器，微信小游戏传 wxAdaptor，抖音传 ttAdaptor */
        adaptor?: AdaptorConstructor | any;
        /** 运行环境：debug / production（默认 production） */
        env?: 'debug' | 'production';
        /** 版本号 */
        version?: string;
        /** 渠道标识 */
        channel?: string;
        /** 是否开启 AID 插件 */
        aid?: boolean;
        /** 是否开启 API 测速 */
        apiSpeed?: boolean;
        /** 是否开启静态资源测速 */
        assetSpeed?: boolean;
        /** 是否开启页面性能监控 */
        pagePerformance?: boolean;
        /** 是否开启包下载耗时监控 */
        loadPackageSpeed?: boolean;
        /** 插件配置 */
        plugin?: PluginConfig;
        /** 额外透传参数 */
        [key: string]: any;
    }

    /** 插件配置 */
    interface PluginConfig {
        aid?: boolean;
        apiSpeed?: boolean;
        assetSpeed?: boolean;
        pagePerformance?: boolean;
        loadPackageSpeed?: boolean;
        api?: {
            apiDetail?: boolean;
            retCodeHandler?: (retCode: string, url: string, payload: any) => string | number;
        };
        [key: string]: any;
    }

    /** 上报异常选项 */
    interface ReportExceptionOption {
        /** 错误名称 */
        name?: string;
        /** 错误消息 */
        msg?: string;
        /** 错误堆栈 */
        stack?: string;
        /** 错误级别 */
        level?: LogLevel;
        /** 附加数据 */
        ext?: Record<string, string>;
    }

    /** 自定义日志选项 */
    interface LogOption {
        /** 日志级别 */
        level?: LogLevel;
        /** 日志类型 */
        type?: LogType;
        /** 日志内容 */
        msg?: string;
        /** 附加数据 */
        ext?: Record<string, string>;
    }

    /** 自定义日志对象 */
    interface NormalLog {
        level: LogLevel;
        msg: string;
        type?: LogType;
        [key: string]: any;
    }

    /** 速度日志 */
    interface SpeedLog {
        url: string;
        duration: number;
        method: string;
        [key: string]: any;
    }

    /** 用户信息 */
    interface UserInfo {
        uid?: string;
        [key: string]: any;
    }

    /** 设置数据配置 */
    interface SetDataConfig {
        [key: string]: string | number | boolean;
    }

    /** 平台适配器 */
    interface Adaptor {
        /** 发起网络请求 */
        request: (options: any) => void;
        /** 获取系统信息 */
        getSystemInfo: () => any;
        /** 获取网络类型 */
        getNetworkType: () => any;
        /** 监听网络变化 */
        onNetworkStatusChange: (callback: (res: any) => void) => void;
        /** 获取当前页面 */
        getCurrentPage: () => any;
        /** 存储 */
        storage: {
            getItem: (key: string) => any;
            setItem: (key: string, value: string) => any;
        };
        /** 上报 */
        report: (url: string, data: any) => any;
        /** 日志 */
        log: (...args: any[]) => void;
        /** 当前平台 */
        platform: string;
    }

    /** 核心类 */
    class Core {
        constructor(config: SdkConfig);
        /** 配置 */
        config: SdkConfig;
        /** 是否 ready */
        isReady: boolean;
        /** 设置用户 ID */
        setConfig(config: Partial<SdkConfig>): void;
        /** 设置用户 ID */
        setUserId(uid: string): void;
        /** 获取用户 ID */
        getUserId(): string | undefined;
        /** 上报自定义日志 */
        reportLog(log: NormalLog | NormalLog[]): void;
        /** 上报异常 */
        reportException(error: ReportExceptionOption): void;
        /** 上报自定义数据 */
        setData(data: SetDataConfig): void;
        /** 添加自定义日志 */
        log(msg: string, level?: LogLevel): void;
        /** 添加 info 日志 */
        info(msg: string): void;
        /** 添加 warn 日志 */
        warn(msg: string): void;
        /** 添加 error 日志 */
        error(msg: string): void;
        /** 设置场景标签（适配传统 Bugly API） */
        setSceneTag?(tagId: number): void;
        /** 设置场景额外数据 */
        setSceneExtraData?(key: string, value: string): void;
        /** 设置应用版本号 */
        setAppVersion?(version: string): void;
        /** 设置渠道 */
        setChannel?(channel: string): void;
        /** 测试上报 */
        test?(): void;
        /** 销毁实例 */
        destroy?(): void;
    }

    /** 微信适配器 */
    const wxAdaptor: AdaptorConstructor;
    /** 抖音适配器 */
    const ttAdaptor: AdaptorConstructor;
    /** 支付宝适配器 */
    const myAdaptor: AdaptorConstructor;
    /** 百度适配器 */
    const swanAdaptor: AdaptorConstructor;

    /** Bugly 别名（与 Aegis 相同） */
    const Bugly: typeof Core;
}

export = buglySdk;
export as namespace buglySdk;
