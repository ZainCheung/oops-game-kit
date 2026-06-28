import { gsm } from '../../game/common/GameSingletonModule';
import type { AnalysisProperties } from './analysis/AnalysisSdkTypes';

/**
 * SDK 全局门面
 *
 * 将友盟事件上报挂载到 globalThis，业务代码无需 import 即可调用。
 *
 * 用法：
 * ```ts
 * // 上报事件（无需导入）
 * AUTE('LoginSuccess', { channel: 'wechat' });
 * ```
 */
/**
 * 安全赋值给 window，如果出现重复的 key 值，一定需要提示出来
 * @param obj
 */
export function assignWindowSafe<T extends object>(obj: T): void {
    if (!obj) {
        return;
    }

    for (let key in obj) {
        if (key in window) {
            console.assert(false, `当前 key：${key},不能重复赋值给 window 对象！`);
        }
    }

    Object.assign(window, obj);
}


/** 友盟上报自定义事件（失败不卡主流程） */
function AUTE(eventName: string, properties?: AnalysisProperties): void {
    gsm.base.sdk.analysis?.trackEvent(eventName, properties);
}

// 挂载到全局
assignWindowSafe({ AUTE });

// 类型声明，让 TS 识别全局函数
declare global {
    /** 友盟上报自定义事件（失败不卡主流程） */
    function AUTE(eventName: string, properties?: AnalysisProperties): void;
}
