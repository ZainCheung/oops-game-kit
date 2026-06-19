/**
 * ECS Demo 控制台输出工具
 */
export namespace DemoEcsUtil {
    /** 打印 Demo 分节标题 */
    export function section(title: string): void {
        console.log(`\n▶ [ECS Demo] ${title}`);
    }

    /** 打印普通说明 */
    export function log(msg: string): void {
        console.log(`  ${msg}`);
    }

    /** 打印带数据的结果 */
    export function logData(label: string, data: unknown): void {
        console.log(`  ${label}:`, data);
    }

    /** 打印成功结果 */
    export function ok(msg: string): void {
        console.log(`  ✓ ${msg}`);
    }

    /** 打印失败结果 */
    export function fail(msg: string): void {
        console.error(`  ✗ [FAIL] ${msg}`);
    }

    /** 断言：成立打印 ✓，否则打印 ✗ [FAIL]（用于回归校验） */
    export function assert(cond: boolean, msg: string): void {
        if (cond) ok(msg);
        else fail(msg);
    }
}
