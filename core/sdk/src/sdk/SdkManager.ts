import { sys } from 'cc';
import { ISdk } from './ISdk';
import { DefaultSdk, DouYinMiniGameSdk, WeChatMiniGameSdk } from './minigame';

/**
 * SDK 管理器
 *
 * 职责：
 * 1. 自动识别当前运行平台，并创建对应的 {@link ISdk} 实现。
 * 2. 提供统一的访问入口 {@link getSdk} / {@link platform}。
 *
 * 平台识别策略：
 * - 通过 Cocos 的 `sys.platform`（`sys.Platform` 枚举）判断当前运行平台，
 *   覆盖编辑器/浏览器/各小游戏/原生全场景。
 * - 未匹配到支持的平台时回退到 {@link DefaultSdk}（空实现，方法会 reject）。
 */
export class SdkManager {
    /** 当前平台实现 */
    private _sdk: ISdk | null = null;
    /** 当前平台类型 */
    private _platform: sys.Platform = sys.Platform.EDITOR;

    /**
     * 初始化 SDK 管理器（探测平台并创建实例）
     * 通常在游戏启动时调用一次。
     */
    init(): ISdk {
        if (this._sdk) return this._sdk;
        this._platform = sys.platform;
        this._sdk = this.createSdk(this._platform);
        return this._sdk;
    }

    /**
     * 根据平台类型创建对应的 SDK 实例
     *
     * 未知平台回退到 {@link DefaultSdk}（EDITOR）。
     */
    private createSdk(platform: sys.Platform): ISdk {
        switch (platform) {
            case sys.Platform.WECHAT_GAME:
                return new WeChatMiniGameSdk();
            case sys.Platform.BYTEDANCE_MINI_GAME:
                return new DouYinMiniGameSdk();
            case sys.Platform.MOBILE_BROWSER:
            case sys.Platform.DESKTOP_BROWSER:
            case sys.Platform.EDITOR:
                return new DefaultSdk(platform);
            default:
                return new DefaultSdk(sys.Platform.EDITOR);
        }
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
     * 清空当前平台引用，便于重新初始化或模块卸载时调用。
     */
    destroy(): void {
        this._sdk = null;
        this._platform = sys.Platform.EDITOR;
    }
}
