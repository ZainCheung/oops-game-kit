import { sys } from 'cc';
import { ISdk } from './ISdk';
import { DefaultSdk, DouYinMiniGameSdk, WeChatMiniGameSdk } from './minigame';

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
 * const manager = new SdkManager();
 * manager.register(sys.Platform.BYTEDANCE_MINI_GAME, () => new DouYinMiniGameSdk());
 * ```
 */
export class SdkManager {
    /** 已注册的平台工厂表 */
    private factories = new Map<sys.Platform, () => ISdk>();
    /** 单例缓存 */
    private instances = new Map<sys.Platform, ISdk>();
    /** 当前平台实现 */
    private _sdk: ISdk | null = null;
    /** 当前平台类型 */
    private _platform: sys.Platform = sys.Platform.EDITOR;

    constructor() {
        // 注册默认平台实现
        this.register(sys.Platform.WECHAT_GAME, () => new WeChatMiniGameSdk());
        this.register(sys.Platform.BYTEDANCE_MINI_GAME, () => new DouYinMiniGameSdk());
        // H5/未知平台使用 DefaultSdk
        this.register(sys.Platform.MOBILE_BROWSER, () => new DefaultSdk(sys.Platform.MOBILE_BROWSER));
        this.register(sys.Platform.DESKTOP_BROWSER, () => new DefaultSdk(sys.Platform.DESKTOP_BROWSER));
        this.register(sys.Platform.EDITOR, () => new DefaultSdk(sys.Platform.EDITOR));
    }

    /**
     * 注册平台实现工厂
     * @param platform 平台类型
     * @param factory  工厂函数（返回该平台的 SDK 实例）
     */
    register(platform: sys.Platform, factory: () => ISdk): void {
        this.factories.set(platform, factory);
        // 清掉旧的缓存实例，下次获取时用新工厂
        this.instances.delete(platform);
        // 如果当前已选用的平台被覆盖，重置 _sdk
        if (this._platform === platform) {
            this._sdk = null;
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
    detectPlatform(): sys.Platform {
        return sys.platform;
    }

    /**
     * 初始化 SDK 管理器（探测平台并创建实例）
     * 通常在游戏启动时调用一次。
     */
    init(): ISdk {
        if (this._sdk) return this._sdk;
        this._platform = this.detectPlatform();
        this._sdk = this.getOrCreate(this._platform);
        return this._sdk;
    }

    /**
     * 获取/创建指定平台的 SDK 实例（单例）
     */
    private getOrCreate(platform: sys.Platform): ISdk {
        let instance = this.instances.get(platform);
        if (instance) return instance;
        const factory =
            this.factories.get(platform) ?? this.factories.get(sys.Platform.EDITOR)!;
        instance = factory();
        this.instances.set(platform, instance);
        return instance;
    }

    /**
     * 获取当前平台的 SDK 实现接口
     * （若未调用 init，会自动调用一次）
     */
    getSdk(): ISdk {
        if (!this._sdk) this.init();
        return this._sdk!;
    }

    /** 当前平台枚举 */
    get platform(): sys.Platform {
        if (!this._sdk) this.init();
        return this._platform;
    }

    /** 当前 SDK 是否已就绪 */
    isReady(): boolean {
        return this.getSdk().isReady();
    }

    /**
     * 释放 SDK 管理器资源
     *
     * 清空工厂表、实例缓存与当前平台引用，便于重新初始化或模块卸载时调用。
     */
    destroy(): void {
        this.factories.clear();
        this.instances.clear();
        this._sdk = null;
        this._platform = sys.Platform.EDITOR;
    }
}
