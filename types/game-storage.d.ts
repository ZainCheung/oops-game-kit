export { };

/** 游戏本地存储 Key 聚合类型
 *  框架内置 Key 在 extensions/oops-plugin-framework/assets/types/Storage.d.ts 中定义，
 *  业务模块 Key 在此通过 declare global 扩展 OopsFramework.TypedStorageKey。
 *  聚合为联合类型，供 StorageManager 泛型使用。
 */

declare global {
    namespace OopsFramework {
        interface TypedStorageKey {
            // ---------- 红点模块 ----------
            /** 红点本地状态数据 */
            RedDot: 'RedDot';

            // ---------- 账号/登录模块 ----------
            /** 用户信息缓存（RequestSdkUserInfo） */
            UserInfoCache: 'RequestSdkUserInfo_Cache';
        }
    }

    /** 所有合法的本地存储 Key 联合类型 */
    type GameStorageKey = OopsFramework.TypedStorageKey[keyof OopsFramework.TypedStorageKey];
}
