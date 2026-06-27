/**
 * 事件属性值类型
 */
export type AnalysisPropertyValue = string | number | boolean | Date | string[] | number[];

/**
 * 事件属性集合（平台无关）
 */
export type AnalysisProperties = Record<string, AnalysisPropertyValue>;

/**
 * 用户属性值类型
 */
export type AnalysisUserPropertyValue = string | number | boolean | Date | string[] | number[] | { value: string | number; time: Date };

/**
 * 用户属性集合
 */
export type AnalysisUserProperties = Record<string, AnalysisUserPropertyValue>;

/**
 * 初始化配置参数
 */
export interface IAnalysisInitOption {
    /** 应用唯一标识（由数据统计平台分配） */
    appId: string;
    /** 数据上报服务器地址 */
    serverUrl: string;
    /** 渠道标识（如 'wechat', 'douyin', 'appstore'） */
    channel?: string;
    /** 是否开启调试模式（打印日志、不实际上报） */
    debug?: boolean;
    /** 是否自动采集启动事件 */
    autoTrackStart?: boolean;
    /** 时区偏移（毫秒，可选，用于时间校准） */
    timeZoneOffset?: number;
    /** 额外透传参数（各平台实现自行扩展） */
    [key: string]: any;
}

/**
 * 事件上报选项
 */
export interface ITrackOption {
    /** 事件名称 */
    eventName: string;
    /** 事件属性 */
    properties?: AnalysisProperties;
    /** 事件发生时间（不传则使用当前时间） */
    time?: Date;
}

/**
 * 用户属性操作类型
 */
export type AnalysisUserPropertyOp =
    /** 设置属性（覆盖） */
    | 'set'
    /** 设置属性（仅首次有效） */
    | 'setOnce'
    /** 数值累加 */
    | 'add'
    /** 追加到数组 */
    | 'append'
    /** 删除属性 */
    | 'unset';

/**
 * 用户属性操作项
 */
export interface IUserPropertyItem {
    /** 操作类型 */
    op: AnalysisUserPropertyOp;
    /** 属性集合 */
    properties: AnalysisUserProperties;
}

/**
 * 数据分析 SDK 初始化状态
 */
export interface IAnalysisSdkState {
    /** 是否已初始化 */
    initialized: boolean;
    /** 当前用户唯一标识 */
    accountId?: string;
    /** 当前访客标识（设备级） */
    distinctId?: string;
    /** 公共事件属性 */
    superProperties?: AnalysisProperties;
    /** 是否已暂停上报 */
    paused: boolean;
}
