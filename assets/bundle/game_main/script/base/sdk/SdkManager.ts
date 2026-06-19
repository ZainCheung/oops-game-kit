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
 * - 优先判断全局对象是否存在（`wx` 等），兼容编辑器/打包后两种场景。
 * - 其次通过 Cocos 的 `sys.platform` 判断 H5 / 其它小游戏。
 * - 都不匹配时回退到 {@link DefaultSdk}（空实现，方法会 reject）。
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
     * @returns 当前平台枚举
     */
    static detectPlatform(): SdkPlatform {
        // 微信小游戏（编辑器内 typeof wx 不可靠，这里同时校验 cc.sys）
        if (typeof (globalThis as any).wx !== 'undefined') {
            return SdkPlatform.WeChatMiniGame;
        }
        if (typeof (globalThis as any).tt !== 'undefined') {
            return SdkPlatform.DouYinMiniGame;
        }
        if (typeof (globalThis as any).qg !== 'undefined') {
            // OPPO / vivo 都用 qg，这里粗略区分
            const platformStr = (sys.platform as unknown as string) || '';
            if (platformStr.indexOf('oppo') >= 0) return SdkPlatform.OPPO;
            return SdkPlatform.Vivo;
        }
        // 浏览器
        if (
            sys.platform === (sys as any).MOBILE_BROWSER ||
            sys.platform === (sys as any).DESKTOP_BROWSER
        ) {
            return SdkPlatform.H5;
        }
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
