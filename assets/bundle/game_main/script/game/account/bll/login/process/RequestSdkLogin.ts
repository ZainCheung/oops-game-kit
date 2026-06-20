import { oops } from 'db://oops-framework/core/Oops';
import { gsm } from '../../../../common/GameSingletonModule';
import { LoginProcessBase } from '../LoginProcessBase';
import { LoginProcessType } from '../LoginEnum';

/**
 * 平台 SDK 账号登录
 * 1. 如果成功进入下个流程
 * 2. 如果失败，提示用户 SDK 登录失败
 */
export class RequestSdkLogin extends LoginProcessBase {
    constructor() {
        super(LoginProcessType.SdkLogin);
    }

    protected async execute() {
        const label = '【登录流程】平台 SDK 登录';
        console.time(label);
        try {
            const sdk = gsm.base.sdk.B_Sdk_Main.sdk;

            // SDK 未就绪，提示并中止登录流程
            if (!sdk.isReady()) {
                console.timeEnd(label);
                oops.gui.toast('SDK 未就绪，请稍后重试');
                this.fail();
                return;
            }

            const result = await sdk.login();

            // 保存 SDK 登录凭证到 SDK 模块
            gsm.base.sdk.M_Sdk_Main.token = result.code;

            oops.log.trace(`【登录流程】平台 SDK 登录成功，code: ${result.code}`);

            console.timeEnd(label);
            this.success();
        }
        catch (err) {
            console.timeEnd(label);
            console.error('【登录流程】平台 SDK 登录失败', err);
            this.fail();
        }
    }
}
