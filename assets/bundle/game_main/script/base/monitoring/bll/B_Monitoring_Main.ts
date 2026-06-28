import { CCBusiness } from 'db://oops-framework/module/common/CCBusiness';
import { classname } from 'db://oops-framework/module/decorator/ClassNameDecorator';
import { Monitoring } from '../Monitoring';

/** 上报数据结构 */
interface ReportData {
    type: string;
    time: string;
    timestamp: number;
    message: string;
    stack: string;
    [key: string]: unknown;
}

/** 错误监控主业务逻辑 */
@classname('B_Monitoring_Main')
export class B_Monitoring_Main extends CCBusiness<Monitoring> {
    private tested = false;

    protected init() {
        this.initRuntimeError();
        this.initUnhandledRejection();
    }

    /** 通用上报入口，接入第三方 SDK 后替换 console.log 为 SDK API */
    private reportToThirdParty(data: ReportData): void {
        console.log(
            '%c[ThirdParty] %c上报异常',
            'color:#f60;font-weight:bold',
            'color:#f60',
            `\n${JSON.stringify(data, null, 2)}`
        );
    }

    private buildReport(
        type: string,
        message: string,
        stack?: string,
        extra?: Record<string, unknown>,
    ): ReportData {
        return {
            type,
            time: new Date().toISOString(),
            timestamp: Date.now(),
            message,
            stack: stack || '',
            ...extra,
        };
    }

    // ==================== 自动捕获 ====================

    /** 1. 监听未捕获的 JS 运行时错误 */
    private initRuntimeError(): void {
        window.addEventListener('error', (event: ErrorEvent) => {
            if (!(event instanceof ErrorEvent)) return;
            event.preventDefault();
            this.reportToThirdParty(this.buildReport('runtime_error', event.message, event.error?.stack, {
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
            }));
        });
    }

    /** 2. 监听未处理的 Promise 异常 */
    private initUnhandledRejection(): void {
        window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
            event.preventDefault();
            const reason = event.reason;
            if (reason instanceof Error) {
                this.reportToThirdParty(this.buildReport('unhandled_rejection', reason.message, reason.stack));
            }
            else {
                this.reportToThirdParty(this.buildReport('unhandled_rejection', String(reason), '', { raw: reason }));
            }
        });
    }

    // ==================== 手动上报接口 ====================

    /**
     * 手动上报业务异常
     * 在 try-catch 中调用，替代那些自动捕获不到的场景
     *
     * @example
     * ```ts
     * try {
     *     // ...
     * } catch (e) {
     *     this.reportError(e, { action: 'login' });
     * }
     * ```
     */
    reportError(error: unknown, extra?: Record<string, unknown>): void {
        if (error instanceof Error) {
            this.reportToThirdParty(this.buildReport('manual', error.message, error.stack, extra));
        }
        else {
            this.reportToThirdParty(this.buildReport('manual', String(error), '', extra));
        }
    }
}
