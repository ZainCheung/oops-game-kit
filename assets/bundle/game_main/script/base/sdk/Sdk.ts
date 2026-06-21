import { SdkMain } from './SdkMain';
import { SdkModel } from './SdkModel';
import './SdkEvent';

/**
 * 平台 SDK 单例模块
 *
 * 不再依赖 ECS，改为普通单例类。通过 {@link Sdk.instance} 获取全局唯一实例。
 *
 * 外部访问方式：
 * - `gsm.base.sdk.main.sdk`        当前平台 SDK 实现接口
 * - `gsm.base.sdk.main.adsManager` 高级广告管理器
 * - `gsm.base.sdk.model.token`     SDK 登录凭证
 * - `gsm.base.sdk.model.userInfo`  用户信息
 */
export class Sdk {
    /** 数据模型 */
    readonly model: SdkModel;
    /** 主业务逻辑 */
    readonly main: SdkMain;

    /** 单例实例 */
    private static _instance: Sdk | null = null;

    /** 获取单例实例（懒加载） */
    static get instance(): Sdk {
        if (Sdk._instance === null) {
            Sdk._instance = new Sdk();
        }
        return Sdk._instance;
    }

    private constructor() {
        this.model = new SdkModel();
        this.main = new SdkMain(this);
    }

    /**
     * 销毁单例，释放平台事件监听与广告资源。
     * 通常仅在需要重新初始化 SDK 模块时调用。
     */
    static destroy(): void {
        if (Sdk._instance) {
            Sdk._instance.main.destroy();
            Sdk._instance = null;
        }
    }
}
