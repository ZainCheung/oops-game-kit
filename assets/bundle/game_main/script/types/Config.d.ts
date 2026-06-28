/**
 * 游戏自定义环境配置 - 扩展 config.json 的 dev/test/prod 字段
 * 通过 IConfigEnvironment 模块增强，使 oops.config.game.data.zipTable 具有强类型
 * 需在 Main.ts 首行 import 以确保持续生效
 */
import type { } from 'db://oops-framework/module/config/GameConfig';

declare module 'db://oops-framework/module/config/GameConfig' {
    interface IConfigEnvironment {
        /** 是否开启收集与分析功能 */
        sdkAnalysis: boolean;
        /** 是否开启获取平台隐私信息开关 */
        sdkPrivacy: boolean
        /** 是否开启获取平台 openid 开关 */
        sdkOpenid: boolean;
    }
}
