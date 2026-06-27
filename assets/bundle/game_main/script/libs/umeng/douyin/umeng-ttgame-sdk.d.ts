/**
 * 友盟+ 抖音小游戏 SDK 类型声明
 *
 * 接口参考友盟 U-MiniProgram SDK 字节跳动小程序/小游戏文档：
 * https://developer.umeng.com/docs/147615/detail/181348
 *
 * 使用方式：
 * 1. 从友盟开发者中心下载抖音小游戏 SDK（umeng-ttgame-sdk.js）
 * 2. 放入本目录（libs/umeng/douyin/）
 * 3. 在需要的地方 import 或 require 使用
 */

declare namespace umengDouyin {
    interface InitOptions {
        /** 友盟分配的 AppKey */
        appKey: string;
        /** 设备指纹标识（可选，不传则内部生成） */
        openid?: string;
        /** 服务端域名白名单（可选） */
        domain?: string;
        /** 是否开启调试日志 */
        debug?: boolean;
        /** 是否使用Openid进行统计 */
        useOpenid?: boolean;
        /** 自动获取openid */
        autoGetOpenid?: boolean;
    }

    interface TrackOptions {
        /** 事件名称（最多32个字符） */
        eventId: string;
        /** 自定义事件属性（最多100个，每个最多100个字符） */
        params?: Record<string, any>;
    }

    interface UserProfileOptions {
        /** 用户名 */
        name?: string;
        /** 性别（1-男，2-女，0-未知） */
        gender?: 0 | 1 | 2;
        /** 年龄 */
        age?: number;
        /** 是否会员 */
        isMember?: boolean;
        /** 会员等级 */
        memberLevel?: string;
        /** 其他自定义属性 */
        [key: string]: any;
    }

    /** 友盟抖音小游戏 SDK 实例 */
    class UmengSDK {
        /** 初始化 SDK */
        init(options: InitOptions): void;

        /** 发送自定义事件 */
        trackEvent(options: TrackOptions): void;

        /** 设置用户账号（登录后调用） */
        setUserAccount(accountId: string): void;

        /** 设置用户属性（用户画像） */
        setUserProfile(options: UserProfileOptions): void;

        /** 设置预置属性（所有事件自动携带） */
        setPresetProperty(props: Record<string, any>): void;

        /** 获取 SDK 版本号 */
        getVersion(): string;

        /** 是否已初始化 */
        isInit(): boolean;
    }
}

export = umengDouyin;
