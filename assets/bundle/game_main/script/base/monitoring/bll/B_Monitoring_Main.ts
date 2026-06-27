import { director } from 'cc';
import { CCBusiness } from 'db://oops-framework/module/common/CCBusiness';
import { classname } from 'db://oops-framework/module/decorator/ClassNameDecorator';
import { Monitoring } from '../Monitoring';

/** 错误监控主业务逻辑 */
@classname('B_Monitoring_Main')
export class B_Monitoring_Main extends CCBusiness<Monitoring> {
    private tested = false;

    protected init() {
        this.initRuntimeError();
        this.initUnhandledRejection();
        this.initConsoleError();
        this.initResourceLoadError();
        this.initEngineError();
        this.test();
    }

    /** 获取上报上下文信息 */
    private getContext(): Record<string, unknown> {
        return {
            time: Date.now(),
            // 后续可补充: userId, scene, platform, version 等
        };
    }

    /**
     * 模拟上报第三方平台
     * 后续接入 SDK 后替换此方法中的 console.warn 为 SDK API 调用
     */
    private report(type: string, data: Record<string, unknown>): void {
        const payload = {
            type,
            ...this.getContext(),
            ...data,
        };
        console.warn('[Monitoring]', JSON.stringify(payload, null, 2));
    }

    /** 1. 监听未捕获的 JS 运行时错误 */
    private initRuntimeError(): void {
        window.addEventListener('error', (event: ErrorEvent) => {
            if (!(event instanceof ErrorEvent)) return;

            const detail = {
                message: event.message,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                stack: event.error?.stack || '',
            };
            console.error(`[Monitoring] 运行时错误: ${event.message}\n  at ${event.filename}:${event.lineno}:${event.colno}\n  stack: ${event.error?.stack || 'N/A'}`);
            this.report('runtime_error', detail);
        });
    }

    /** 2. 监听未处理的 Promise 异常 */
    private initUnhandledRejection(): void {
        window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
            const reason = event.reason;
            const detail: Record<string, unknown> = {};
            if (reason instanceof Error) {
                detail.message = reason.message;
                detail.stack = reason.stack;
                console.error(`[Monitoring] 未处理的 Promise 异常: ${reason.message}\n  stack: ${reason.stack}`);
            }
            else {
                detail.message = String(reason);
                detail.raw = reason;
                console.error('[Monitoring] 未处理的 Promise 异常:', reason);
            }
            this.report('unhandled_rejection', detail);
        });
    }

    /** 3. 重写 console.error，捕获主动调用的错误日志 */
    private initConsoleError(): void {
        const origError = console.error;
        console.error = (...args: unknown[]) => {
            this.report('console_error', { args: args.map(a => String(a)) });
            origError.apply(console, args);
        };
    }

    /** 4. 监听资源加载失败（捕获阶段） */
    private initResourceLoadError(): void {
        window.addEventListener('error', (event: Event) => {
            const target = event.target;
            if (target instanceof HTMLScriptElement || target instanceof HTMLLinkElement ||
                target instanceof HTMLImageElement) {
                const tag = (target as HTMLElement).tagName;
                const src = (target as any).src || (target as any).href || 'unknown';
                console.error(`[Monitoring] 资源加载失败: <${tag}> ${src}`);
                this.report('resource_load', { tag, src });
            }
        }, true);
    }

    /** 5. 监听 Cocos Creator 引擎错误 */
    private initEngineError(): void {
        (director as unknown as { on: Function }).on('error', (error: unknown) => {
            console.error('[Monitoring] Cocos 引擎错误:', error);
            this.report('engine_error', { message: String(error) });
        });
    }

    /** 测试全局错误监控（仅触发一次） */
    test(): void {
        if (this.tested) {
            console.warn('[Monitoring] 测试已执行过，请刷新页面重新测试');
            return;
        }
        this.tested = true;

        console.log('[Monitoring] === 开始测试全局错误监控 ===');

        setTimeout(() => {
            console.log('[Monitoring] 测试 1/5: JS 运行时错误...');
            throw new Error('模拟的运行时错误！');
        }, 100);

        setTimeout(() => {
            console.log('[Monitoring] 测试 2/5: Promise 异常...');
            Promise.reject(new Error('模拟的 Promise 异常！'));
        }, 500);

        setTimeout(() => {
            console.log('[Monitoring] 测试 3/5: console.error 主动上报...');
            console.error('模拟的主动错误日志');
        }, 900);

        setTimeout(() => {
            console.log('[Monitoring] 测试 4/5: Cocos 引擎错误...');
            director.emit('error', '模拟的 Cocos 资源加载失败！');
        }, 1300);

        setTimeout(() => {
            console.log('[Monitoring] 测试 5/5: 资源加载错误...');
            const img = new Image();
            img.src = 'https://invalid.example.com/nonexistent.png';
        }, 1700);
    }
}
