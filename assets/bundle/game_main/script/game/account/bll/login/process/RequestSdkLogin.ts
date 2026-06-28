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

        // 尝试从本地缓存读取 openid，命中则跳过 SDK 登录
        const cachedOpenid = oops.storage.get('GameCacheOpenId');
        if (cachedOpenid) {
            gsm.account.M_Account_Model.base.userId = cachedOpenid;
            oops.log.trace('【登录流程】命中本地 openid 缓存，跳过 SDK 登录');
            oops.log.trace(`【登录流程】openid: ${cachedOpenid}`);
            console.timeEnd(label);
            this.success();
            return;
        }

        const sdk = gsm.base.sdk.platform;

        const result = await sdk.login();
        const openid = result.openid!;

        // 保存 SDK 登录凭证到 SDK 模块
        gsm.base.sdk.token = result.token;

        // 设置用户唯一编号
        gsm.account.M_Account_Model.base.userId = openid;

        // 缓存 openid 到本地，下次启动跳过 SDK 登录
        oops.storage.set('GameCacheOpenId', openid);

        oops.log.trace('【登录流程】平台 SDK 登录成功');
        oops.log.trace(`【登录流程】openid: ${openid}`);

        // 统计登录成功
        if (gsm.base.sdk.analysis) {
            await gsm.base.sdk.analysis.login(openid);
            oops.log.trace('【登录流程】友盟登录上报成功');
        }

        console.timeEnd(label);
        this.success();
    }
}
