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
        this.initConsoleError();
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

    /** 3. 重写 console.error 捕获主动调用的错误日志 */
    private initConsoleError(): void {
        const origError = console.error;
        console.error = (...args: unknown[]) => {
            const parseArg = (a: unknown): string => {
                if (a instanceof ErrorEvent) {
                    return `ErrorEvent: ${a.message} (${a.filename}:${a.lineno}:${a.colno})`;
                }
                if (a instanceof Error) {
                    return `${a.message}\n${a.stack}`;
                }
                if (typeof a === 'object' && a !== null) {
                    try {
                        return JSON.stringify(a);
                    }
                    catch {
                        return String(a);
                    }
                }
                return String(a);
            };
            const msg = args.map(parseArg).join(' ');
            const err = args.find(a => a instanceof Error) as Error | undefined;
            const errEvent = args.find(a => a instanceof ErrorEvent) as ErrorEvent | undefined;
            const stack = err?.stack || errEvent?.error?.stack || '';
            this.reportToThirdParty(this.buildReport('console_error', msg, stack, {
                args: args.map(a => (a instanceof ErrorEvent ? `ErrorEvent: ${a.message}` : String(a))),
            }));
            origError.apply(console, args);
        };
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

    // ==================== 测试 ====================

    /** 测试自动捕获 + 手动上报 */
    test(): void {
        if (this.tested) {
            console.warn('[Monitoring] 测试已执行过，请刷新页面重新测试');
            return;
        }
        this.tested = true;

        console.log('[Monitoring] === 开始测试 ===');

        // 1. 自动 - 未捕获异常
        setTimeout(() => {
            console.log('[Monitoring] 测试 1/4: 未捕获异常...');
            throw new Error('模拟未捕获异常！');
        }, 100);

        // 2. 自动 - Promise 异常
        setTimeout(() => {
            console.log('[Monitoring] 测试 2/4: Promise 异常...');
            Promise.reject(new Error('模拟 Promise 异常！'));
        }, 500);

        // 3. 自动 - console.error
        setTimeout(() => {
            console.log('[Monitoring] 测试 3/4: console.error...');
            console.error('模拟主动错误日志');
        }, 900);

        // 4. 手动 - reportError
        setTimeout(() => {
            console.log('[Monitoring] 测试 4/4: 手动上报...');
            // 模拟业务层 catch 中调用
            this.reportError(new Error('模拟手动上报的业务异常'), { action: 'test', module: 'login' });
        }, 1300);
    }
}
