import { Base } from '../../base/Base';
import type { Account } from '../account/Account';
import type { Initialize } from '../initialize/Initialize';

/** 游戏单例模块管理 */
class GameSingletonModule {
    /** 基础模块 - 永不释放 */
    static base: Base;
    /** 游戏初始化模块 */
    static initialize: Initialize;
    /** 账号模块 */
    static account: Account;
}

/** 游戏单例模块 */
export const gsm = GameSingletonModule;
