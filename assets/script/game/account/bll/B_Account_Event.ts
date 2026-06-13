import { ecs } from 'db://oops-framework/libs/ecs/ECS';
import { EventMessage } from 'db://oops-framework/core/common/event/EventMessage';
import { CCBusiness } from 'db://oops-framework/module/common/CCBusiness';
import type { Account } from '../Account';
import { AccountEvent } from '../AccountEvent';

/** 账号全局事件业务逻辑 */
@ecs.register('B_Account_Event')
export class B_Account_Event extends CCBusiness<Account> {
    protected init() {
        this.event.setEvent(
            EventMessage.GAME_SHOW,
            EventMessage.GAME_HIDE,
            AccountEvent.Reconnect);
    }

    /** 游戏后台切回来验证网络状态，判断是否需要重新登录 */
    private onGameShow() {
        // if (!smc.net.game.connected) this.ent.B_Account_Login.login();
    }

    /** 游戏切到后台时 */
    private onGameHide() {

    }

    /** 网络重连接 */
    private onReconnect() {
        this.ent.B_Account_Login.reconnect();
    }
}
