import { EventMessage } from 'db://oops-framework/core/common/event/EventMessage';
import { CCBusiness } from 'db://oops-framework/module/common/CCBusiness';
import { classname } from 'db://oops-framework/module/decorator/ClassNameDecorator';
import type { Account } from '../Account';
import { AccountEventName, type IAccountEventDataMap } from '../AccountEvent';
import { InitializeEventName, type IInitializeEventDataMap } from '../../initialize/InitializeEvent';

/** 账号全局事件业务逻辑 */
@classname('B_Account_Event')
export class B_Account_Event extends CCBusiness<Account> {
    protected init() {
        this.event.setEvent(
            EventMessage.GAME_SHOW,
            EventMessage.GAME_HIDE,
            InitializeEventName.LoadComplete,
            AccountEventName.Reconnect
        );
    }

    //#region 全局事件处理
    /** 游戏后台切回来验证网络状态，判断是否需要重新登录 */
    private onGameShow<K extends typeof EventMessage.GAME_SHOW>(event: K): void {
        // if (!smc.net.game.connected) this.ent.B_Account_Login.login();
    }

    /** 游戏切到后台时 */
    private onGameHide<K extends typeof EventMessage.GAME_HIDE>(event: K): void {}

    /** 初始化资源加载完成 */
    private onInitializeLoadComplete<K extends InitializeEventName.LoadComplete>(
        event: K,
        data: IInitializeEventDataMap[K]
    ): void {
        this.ent.B_Account_Login.login();
    }

    /** 网络重连接 */
    private onReconnect<K extends AccountEventName.Reconnect>(event: K, data: IAccountEventDataMap[K]): void {
        this.ent.B_Account_Login.reconnect();
    }
    //#endregion
}
