import { oops } from 'db://oops-framework/core/Oops';
import { gsm } from '../../../../common/GameSingletonModule';
import { LoginProcessBase } from '../LoginProcessBase';
import { LoginProcessType } from '../LoginEnum';
import { AccountEventName } from '../../../AccountEvent';

/**
 * 平台 SDK 账号登录
 * 1. 如果成功进入下个流程
 * 2. 如果失败，提示用户 SDK 登录失败
 *
 * 所有平台统一走 SDK 模块：
 * - 微信小游戏调用 wx.login 获取真实 code
 * - H5/编辑器等非小游戏平台由 DefaultSdk 提供测试用登录凭证
 */
export class LoginSdk extends LoginProcessBase {
    constructor() {
        super(LoginProcessType.LoginSdk);
    }

    protected async execute() {
        const label = '【登录流程】平台 SDK 登录';
        console.time(label);
        try {
            const bll = gsm.base.sdk.B_Sdk_Main;
            const sdk = bll.sdk;

            // SDK 未就绪，提示并中止登录流程
            if (!sdk.isReady()) {
                console.timeEnd(label);
                oops.gui.toast('SDK 未就绪，请稍后重试');
                this.fail();
                return;
            }

            const platform = sdk.getPlatform();
            const result = await sdk.login();

            // 保存 SDK 登录凭证到 SDK 模块
            gsm.base.sdk.M_Sdk_Main.token = result.code;

            oops.log.trace(`【登录流程】平台 SDK 登录成功，平台: ${platform}，code: ${result.code}`);
            oops.message.dispatchEvent(AccountEventName.LoginSuccessSdk, {
                platform,
                token: result.code
            });

            console.timeEnd(label);
            this.success();
        }
        catch (err) {
            console.timeEnd(label);
            const e = err as any;
            let errMsg = '';
            try { errMsg = e?.errMsg ?? ''; } catch {}
            if (!errMsg) { try { errMsg = e?.message ?? ''; } catch {}
            }
            if (!errMsg) { try { errMsg = typeof err === 'string' ? err : ''; } catch {}
            }
            if (!errMsg) {
                try { errMsg = JSON.stringify(err); } catch { errMsg = String(err); }
            }
            console.error('【登录流程】平台 SDK 登录失败:', errMsg, err);
            oops.gui.toast(`SDK 登录失败: ${errMsg}`);
            this.fail();
        }
    }
}
