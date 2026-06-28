/**
 * SDK 配置中心
 *
 * 集中管理所有平台的硬编码配置（友盟 AppKey、云函数名、默认回退值等），
 * 各 SDK 文件通过引用此文件读取配置，一处修改全局生效。
 *
 * ── 使用方法 ──
 *   import { WeChatAnalysisCfg } from '../SdkConfig';
 *   await this.init(WeChatAnalysisCfg);
 */

import type { IAnalysisInitOption } from './analysis/AnalysisSdkTypes';

//#region ========== 数据分析（友盟）配置 ==========

/** 微信小游戏 → 友盟+ 初始化参数 */
export const WeChatAnalysisCfg: IAnalysisInitOption = {
    /** 友盟 AppKey（由友盟平台分配） */
    appId: '6a3fce7f6f259537c7bf87e2',
    /** 渠道标识 */
    channel: 'wechat',
    /** 调试模式（上线改为 false） */
    debug: false,
    /** 是否使用 openid 作为友盟用户标识 */
    useOpenid: false,
    /** 是否自动调用 wx.login() 获取 openid（仅友盟使用） */
    autoGetOpenid: false,
};

/** 抖音小游戏 → 友盟+ 初始化参数 */
export const DouYinAnalysisCfg: IAnalysisInitOption = {
    /** 友盟 AppKey（TODO: 请填写抖音小游戏的友盟 AppKey） */
    appId: '',
    /** 渠道标识 */
    channel: 'douyin',
    /** 调试模式（上线改为 false） */
    debug: true,
    /** 是否使用 openid 作为友盟用户标识 */
    useOpenid: false,
    /** 是否自动调用 tt.login() 获取 openid（仅友盟使用） */
    autoGetOpenid: false,
};

//#endregion

//#region ========== 微信小游戏 SDK 配置 ==========

export const WeChatSdkCfg = {
    /** 微信云开发配置 */
    cloud: {
        /** 获取 openid 的云函数名 */
        getOpenidFunctionName: 'getOpenid',
    },

    /** 用户信息获取失败时的默认回退值 */
    defaultUserInfo: {
        nickName: 'Player',
        avatarUrl: '',
        gender: 0,
    } as const,

    /** getUserProfile 默认语言 */
    defaultLang: 'zh_CN' as 'en' | 'zh_CN' | 'zh_TW',

    /** 设备信息默认语言（新 API 不提供 language 时的回退） */
    defaultSystemLanguage: 'zh',

    /** 截图分享参数 */
    capture: {
        /** 默认缩放比例 */
        scale: 0.5,
        /** 导出图片格式（不含点号，如 'png'/'jpg'） */
        fileType: 'png' as const,
        /** 导出图片质量 */
        quality: 1,
        /** 分享截图文件名前缀 */
        shareFilePrefix: 'share_',
        /** 分享截图文件扩展名（含点号） */
        shareFileExt: '.png',
        /** 文件写入编码 */
        encoding: 'base64' as const,
    },

    /** 广告默认尺寸 */
    ad: {
        /** Banner/Grid 广告默认宽度 */
        defaultWidth: 300,
    },

    /** 振动默认类型 */
    defaultVibrateType: 'medium' as const,
};

//#endregion

//#region ========== 抖音小游戏 SDK 配置 ==========

export const DouYinSdkCfg = {
    /** 抖音侧边栏进入检测 */
    sideBar: {
        /** 进入来源标识（homepage = 首页） */
        launchFrom: 'homepage',
        /** 入口位置标识（sidebar_card = 侧边栏卡片） */
        location: 'sidebar_card',
    },
};

//#endregion

//#region ========== 通用 SDK 配置 ==========

export const CommonSdkCfg = {
    /** 数据分析开关（默认关闭，关闭时不会创建 AnalysisSdkManager 对象） */
    analysisEnabled: false
};

//#endregion
