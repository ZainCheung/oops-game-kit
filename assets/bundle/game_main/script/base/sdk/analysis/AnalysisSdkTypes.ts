/**
 * 事件属性值类型
 */
export type AnalysisPropertyValue = string | number | boolean;

/**
 * 事件属性集合（平台无关）
 */
export type AnalysisProperties = Record<string, AnalysisPropertyValue>;

/**
 * 初始化配置参数
 */
export interface IAnalysisInitOption {
    /** 应用唯一标识（由数据统计平台分配） */
    appId: string;
    /** 渠道标识（如 'wechat', 'douyin', 'web'） */
    channel?: string;
    /** 是否开启调试模式 */
    debug?: boolean;
    /** 额外透传参数（各平台实现自行扩展） */
    [key: string]: any;
}
