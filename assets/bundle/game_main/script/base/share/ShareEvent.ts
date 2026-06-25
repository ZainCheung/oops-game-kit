import type { IShareOption } from '../sdk/SdkTypes';

/** Share模块事件枚举 */
export enum ShareEventName {
    /**
     * 主动分享给好友
     * 通过 sdk.shareAppMessage 拉起转发界面
     */
    Share = 'onShareShare',
    /**
     * 使用自定义图片分享给好友
     * 通过 sdk.shareAppMessage + presetImageUrl 分享指定封面图
     */
    ShareWithImage = 'onShareWithImage',
    /**
     * 截图分享
     * 通过 sdk.shareWithScreenshot 截取当前画面并分享
     */
    ShareScreenshot = 'onShareScreenshot',
    /**
     * 分享到朋友圈（仅微信支持）
     */
    ShareTimeline = 'onShareTimeline',
    /**
     * 注册右上角转发回调
     * 设置用户点击右上角"转发"按钮时的默认分享内容
     */
    RegisterShareMenu = 'onShareRegisterMenu',
    /**
     * 开启分享菜单
     */
    ShowShareMenu = 'onShareShowMenu',
    /**
     * 隐藏分享菜单
     */
    HideShareMenu = 'onShareHideMenu',
    /**
     * 查询是否支持朋友圈转发
     */
    CanShareTimeline = 'onShareCanShareTimeline',
}

/** 分享参数数据 */
export interface IShareData {
    /** 标题 */
    title?: string;
    /** 转发路径 */
    path?: string;
    /** 分享封面图 URL（预设图片） */
    presetImageUrl?: string;
    /** 是否带 shareTicket */
    withShareTicket?: boolean;
}

/** 自定义图片分享参数数据 */
export interface IShareWithImageData {
    /** 标题 */
    title?: string;
    /** 转发路径 */
    path?: string;
    /** 分享封面图 URL（必须） */
    presetImageUrl: string;
    /** 是否带 shareTicket */
    withShareTicket?: boolean;
}

/** 截图分享参数数据 */
export interface IShareScreenshotData {
    /** 标题 */
    title?: string;
    /** 转发路径 */
    path?: string;
    /** 查询字符串 */
    query?: string;
    /** 是否带 shareTicket */
    withShareTicket?: boolean;
    /** 截图数据（base64） */
    screenshotData: string;
}

/** 朋友圈分享参数数据 */
export interface IShareTimelineData {
    /** 标题 */
    title?: string;
    /** 封面图 URL */
    imageUrl?: string;
    /** 查询字符串 */
    query?: string;
}

/** 注册转发菜单回调数据 */
export interface IRegisterShareMenuData {
    /** 分享内容回调 */
    callback: (option?: IShareOption) => IShareOption | void;
}

/** Share模块事件数据映射 */
export interface IShareEventDataMap {
    [ShareEventName.Share]: IShareData;
    [ShareEventName.ShareWithImage]: IShareWithImageData;
    [ShareEventName.ShareScreenshot]: IShareScreenshotData;
    [ShareEventName.ShareTimeline]: IShareTimelineData;
    [ShareEventName.RegisterShareMenu]: IRegisterShareMenuData;
    [ShareEventName.ShowShareMenu]: { withShareTicket?: boolean; menus?: string[] };
    [ShareEventName.HideShareMenu]: { menus?: string[] };
    [ShareEventName.CanShareTimeline]: never;
}

// 扩展全局事件类型
declare global {
    namespace OopsFramework {
        interface TypedEventMap extends IShareEventDataMap {}
    }
}
