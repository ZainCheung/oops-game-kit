/**
 * SDK 模块类型声明（精简版）
 *
 * 仅包含项目中实际使用的定义：
 * - Sdk 类（平台 SDK 单例模块，通过 gsm.base.sdk 访问）
 * - ISdk 接口（仅暴露项目实际调用的方法）
 * - 相关类型（IShareOption / IShareToTimelineOption / IUserInfo / IUserInfoResult / ILoginResult）
 */

// ==================== 类型定义 ====================

/**
 * 分享参数
 */
export interface IShareOption {
    /** 标题 */
    title?: string;
    /** 转发路径（小游戏通常为查询字符串） */
    path?: string;
    /**
     * 分享封面图（运行期生成的临时文件 URL）。
     * 注意：当前 SDK 默认行为不使用此字段，默认分享流程见 presetImageUrl。
     */
    imageUrl?: string;
    /**
     * 预设分享封面图 URL（远端 CDN 图片或小游戏本地资源）。
     * 业务调用 sdk.shareAppMessage({ presetImageUrl }) 时，微信/抖音会用这张图作为
     * 转发卡片的封面，不会触发 canvas.toTempFilePath。
     * 如果同时传了 imageUrl，以 presetImageUrl 为准。
     */
    presetImageUrl?: string;
    /** 是否带 shareTicket */
    withShareTicket?: boolean;
    /** 额外参数 */
    [key: string]: any;
}

/**
 * 朋友圈分享参数（仅微信支持）
 */
export interface IShareToTimelineOption {
    /** 标题 */
    title?: string;
    /** 封面图 URL */
    imageUrl?: string;
    /** 查询字符串 */
    query?: string;
    [key: string]: any;
}

/**
 * 用户信息
 */
export interface IUserInfo {
    /** 昵称 */
    nickName: string;
    /** 头像 URL */
    avatarUrl: string;
    /** 性别 0-未知 1-男 2-女 */
    gender: 0 | 1 | 2;
    /** 语言 */
    language?: string;
    /** 国家 */
    country?: string;
    /** 省份 */
    province?: string;
    /** 城市 */
    city?: string;
    /** 原始数据 */
    raw?: any;
}

/**
 * 获取用户信息返回结果
 */
export interface IUserInfoResult {
    /** 用户信息（用户拒绝授权或基础库行为变化时可能为空） */
    userInfo?: IUserInfo;
    /** 不包含敏感信息的原始数据字符串（用于签名校验） */
    rawData?: string;
    /** 签名 */
    signature?: string;
    /** 加密数据 */
    encryptedData?: string;
    /** 加密算法初始向量 */
    iv?: string;
    /** 云 ID */
    cloudID?: string;
}

/**
 * 登录返回结果
 */
export interface ILoginResult {
    /** 登录凭证（用于换取 openid/session_key） */
    code: string;
    /** 原始数据 */
    raw?: any;
}

// ==================== 接口定义 ====================

/**
 * 平台无关 SDK 接口（精简版，仅暴露项目实际调用的方法）
 *
 * 通过 gsm.base.sdk.platform 获取实例。
 */
export interface ISdk {
    /** 判断当前 SDK 是否已就绪 */
    isReady(): boolean;

    /** 登录，返回 code 用于换取 openid/session_key */
    login(): Promise<ILoginResult>;

    /** 获取用户信息 */
    getUserInfo(option?: {
        lang?: 'en' | 'zh_CN' | 'zh_TW';
        withCredentials?: boolean;
    }): Promise<IUserInfoResult>;

    /** 主动拉起转发（分享给好友） */
    shareAppMessage(option?: IShareOption): void;

    /**
     * 使用截图分享（自动处理截图保存和分享）
     * @param option 包含 title、query、screenshotData（base64）
     */
    shareWithScreenshot(option: {
        title?: string;
        query?: string;
        withShareTicket?: boolean;
        screenshotData: string;
    }): Promise<void>;

    /** 被动监听用户点击右上角转发 */
    onShareAppMessage(callback: (option?: IShareOption) => IShareOption | void): void;

    /** 分享到朋友圈（仅微信支持） */
    shareToTimeline(option?: IShareToTimelineOption): void;

    /** 显示右上角转发菜单 */
    showShareMenu(option?: { withShareTicket?: boolean; menus?: string[] }): void;

    /** 隐藏右上角转发菜单 */
    hideShareMenu(option?: { menus?: string[] }): void;

    /** 验证是否支持转发到朋友圈 */
    canShareToTimeline(): boolean;
}

// ==================== 类定义 ====================

/**
 * 平台 SDK 单例模块
 *
 * 通过 `gsm.base.sdk` 获取实例。
 *
 * 外部访问方式：
 * - `gsm.base.sdk.platform`    当前平台 SDK 实现接口
 * - `gsm.base.sdk.token`       SDK 登录凭证
 * - `gsm.base.sdk.userInfo`    用户信息
 */
export declare class Sdk {
    /** 当前平台的 SDK 实现接口 */
    readonly platform: ISdk;

    /** SDK 登录凭证 */
    token: string;

    /** 用户信息（昵称、头像等，登录授权后填充） */
    userInfo: IUserInfo | null;

    /** 是否从抖音侧边栏进入游戏 */
    isFromBytedanceSideBar: boolean;

    /** 是否已领取过抖音侧边栏进入奖励 */
    isByteDanceGetSideReward: boolean;

    constructor();
}
