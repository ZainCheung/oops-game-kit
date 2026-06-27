/** Bugly SDK 全局变量兼容垫片
 *
 * bugly-mp-sdk 在模块加载时会引用微信小游戏全局 API（Page、Component），
 * 在 Cocos Creator 编辑器/浏览器等非小游戏环境会导致 ReferenceError。
 * 此文件需在 bugly-mp-sdk 之前导入，以提供安全的空实现。
 */

const globalScope: any = (typeof globalThis !== 'undefined' ? globalThis
    : typeof window !== 'undefined' ? window
        : typeof self !== 'undefined' ? self
            : this);

if (globalScope && typeof globalScope.Page === 'undefined') {
    globalScope.Page = function () { };
}
if (globalScope && typeof globalScope.Component === 'undefined') {
    globalScope.Component = function () { };
}
