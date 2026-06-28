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
        const label = '【登录流程】平台 SDK 登录耗时';
        console.time(label);
        const sdk = gsm.base.sdk.platform;

        const result = await sdk.login();

        // 保存 SDK 登录凭证到 SDK 模块
        gsm.base.sdk.token = result.token;

        // 设置用户唯一编号
        gsm.account.M_Account_Model.base.userId = result.openid!;

        oops.log.trace('【登录流程】平台 SDK 登录成功');
        oops.log.trace(`【登录流程】openid: ${result.openid}`);

        // 统计登录成功
        if (gsm.base.sdk.analysis) {
            await gsm.base.sdk.analysis.login(result.openid!);
            oops.log.trace('【登录流程】友盟登录上报成功');
        }

        console.timeEnd(label);
        this.success();
    }
}
