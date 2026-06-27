import { BuglyMonitoringSdk } from './BuglyMonitoringSdk';
export { BuglyMonitoringSdk };

/** 全局单例，直接 import 使用 */
export const monitoring = new BuglyMonitoringSdk();
