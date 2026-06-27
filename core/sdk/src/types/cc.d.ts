/**
 * Cocos Creator 引擎模块的打包桩
 *
 * 仅在 webpack 打包时使用，提供 `cc` 模块的最小类型声明，
 * 运行时由 Cocos Creator 引擎注入。
 */

// declare module 'cc' {
//     /** sys 命名空间 - 仅声明 SDK 用到的 platform / Platform */
//     export namespace sys {
//         /** Cocos 平台枚举 */
//         export enum Platform {
//             WECHAT_GAME = 'wechat-miniGame',
//             BYTEDANCE_MINI_GAME = 'bytedance-miniGame',
//             OPPO_MINI_GAME = 'oppo-miniGame',
//             VIVO_MINI_GAME = 'vivo-miniGame',
//             XIAOMI_QUICK_GAME = 'xiaomi-quick-game',
//             HUAWEI_QUICK_GAME = 'huawei-quick-game',
//             ALIPAY_MINI_GAME = 'alipay-mini-game',
//             OPENHARMONY = 'openharmony',
//             BAIDU_MINI_GAME = 'baidu-mini-game',
//             MOBILE_BROWSER = 'mobile-browser',
//             DESKTOP_BROWSER = 'desktop-browser',
//             EDITOR = 'editor',
//             ANDROID = 'android',
//             IOS = 'ios',
//             WIN32 = 'win32',
//             MACOS = 'macos',
//             OHOS = 'ohos'
//         }

//         /** 当前运行平台枚举值 */
//         export const platform: Platform;
//     }
// }
