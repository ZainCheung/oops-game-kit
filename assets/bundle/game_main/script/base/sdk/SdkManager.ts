import { sys } from 'cc';
import { SdkPlatform } from './model/enum/EM_Sdk';
import { ISdk } from './ISdk';
import { DefaultSdk } from './platform/DefaultSdk';
import { WeChatMiniGameSdk } from './platform/WeChatMiniGameSdk';

/**
 * SDK 管理器
 *
 * 职责：
 * 1. 自动识别当前运行平台，并选择对应的 {@link ISdk} 实现。
 * 2. 支持手动注册/覆盖平台实现（便于扩展新平台或自定义实现）。
 * 3. 提供统一的访问入口 {@link getSdk} / {@link platform}。
 *
 * 平台识别策略：
 * - 通过 Cocos 的 `sys.platform`（`sys.Platform` 枚举）判断当前运行平台，
 *   覆盖编辑器/浏览器/各小游戏/原生全场景。
 * - 未匹配到支持的平台时回退到 {@link DefaultSdk}（空实现，方法会 reject）。
 *
 * 接入新平台：
 * ```ts
 * SdkManager.register(SdkPlatform.DouYinMiniGame, () => new DouYinMiniGameSdk());
 * ```
 */
export class SdkManager {
    /** 已注册的平台工厂表 */
    private static factories = new Map<SdkPlatform, () => ISdk>();
    /** 单例缓存 */
    private static instances = new Map<SdkPlatform, ISdk>();
    /** 当前平台实现 */
    private static _sdk: ISdk | null = null;
    /** 当前平台类型 */
    private static _platform: SdkPlatform = SdkPlatform.Unknown;

    static {
        // 注册默认平台实现
        SdkManager.register(SdkPlatform.WeChatMiniGame, () => new WeChatMiniGameSdk());
        // H5/未知平台使用 DefaultSdk
        SdkManager.register(SdkPlatform.H5, () => new DefaultSdk(SdkPlatform.H5));
        SdkManager.register(SdkPlatform.Unknown, () => new DefaultSdk(SdkPlatform.Unknown));
    }

    /**
     * 注册平台实现工厂
     * @param platform 平台类型
     * @param factory  工厂函数（返回该平台的 SDK 实例）
     */
    static register(platform: SdkPlatform, factory: () => ISdk): void {
        SdkManager.factories.set(platform, factory);
        // 清掉旧的缓存实例，下次获取时用新工厂
        SdkManager.instances.delete(platform);
        // 如果当前已选用的平台被覆盖，重置 _sdk
        if (SdkManager._platform === platform) {
            SdkManager._sdk = null;
        }
    }

    /**
     * 探测当前运行平台
     *
     * 使用 Cocos Creator 的 `sys.platform`（`sys.Platform` 枚举）进行判断，
     * 覆盖编辑器、浏览器、各小游戏平台、原生平台等全部场景。
     *
     * @returns 当前平台枚举
     */
    static detectPlatform(): SdkPlatform {
        const p = sys.platform;
        const P = sys.Platform;

        // 小游戏平台
        if (p === P.WECHAT_GAME) return SdkPlatform.WeChatMiniGame;
        if (p === P.BYTEDANCE_MINI_GAME) return SdkPlatform.DouYinMiniGame;
        if (p === P.OPPO_MINI_GAME) return SdkPlatform.OPPO;
        if (p === P.VIVO_MINI_GAME) return SdkPlatform.Vivo;
        if (p === P.XIAOMI_QUICK_GAME) return SdkPlatform.XiaoMi;
        if (p === P.HUAWEI_QUICK_GAME) return SdkPlatform.Huawei;
        if (p === P.ALIPAY_MINI_GAME) return SdkPlatform.Alipay;
        if (p === P.OPENHARMONY) return SdkPlatform.OpenHarmony;
        // 百度小游戏（部分版本支持）
        if ((P as any).BAIDU_MINI_GAME && p === (P as any).BAIDU_MINI_GAME) {
            return SdkPlatform.BaiDu;
        }

        // 浏览器（H5）
        if (p === P.MOBILE_BROWSER || p === P.DESKTOP_BROWSER) return SdkPlatform.H5;

        // 原生（WIN32/MACOS/ANDROID/IOS/OHOS）
        if (
            p === P.ANDROID ||
            p === P.IOS ||
            p === (P as any).WIN32 ||
            p === (P as any).MACOS ||
            p === (P as any).OHOS
        ) {
            return SdkPlatform.Native;
        }

        // 编辑器及其它未知环境（sys.Platform.EDIT 等）
        return SdkPlatform.Unknown;
    }

    /**
     * 初始化 SDK 管理器（探测平台并创建实例）
     * 通常在游戏启动时调用一次。
     */
    static init(): ISdk {
        if (SdkManager._sdk) return SdkManager._sdk;
        SdkManager._platform = SdkManager.detectPlatform();
        SdkManager._sdk = SdkManager.getOrCreate(SdkManager._platform);
        return SdkManager._sdk;
    }

    /**
     * 获取/创建指定平台的 SDK 实例（单例）
     */
    private static getOrCreate(platform: SdkPlatform): ISdk {
        let instance = SdkManager.instances.get(platform);
        if (instance) return instance;
        const factory =
            SdkManager.factories.get(platform) ?? SdkManager.factories.get(SdkPlatform.Unknown)!;
        instance = factory();
        SdkManager.instances.set(platform, instance);
        return instance;
    }

    /**
     * 获取当前平台的 SDK 实现接口
     * （若未调用 init，会自动调用一次）
     */
    static getSdk(): ISdk {
        if (!SdkManager._sdk) SdkManager.init();
        return SdkManager._sdk!;
    }

    /** 当前平台枚举 */
    static get platform(): SdkPlatform {
        if (!SdkManager._sdk) SdkManager.init();
        return SdkManager._platform;
    }

    /** 当前 SDK 是否已就绪 */
    static isReady(): boolean {
        return SdkManager.getSdk().isReady();
    }
}
