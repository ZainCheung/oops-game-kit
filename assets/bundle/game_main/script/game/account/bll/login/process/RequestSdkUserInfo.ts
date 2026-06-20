import { Node } from 'cc';
import { oops } from 'db://oops-framework/core/Oops';
import { gsm } from '../../../../common/GameSingletonModule';
import type { ISdk } from '../../../../../base/sdk/bll/ISdk';
import type { IUserInfo, IUserInfoResult } from '../../../../../base/sdk/model/IM_Sdk_Data';
import { LoginProcessBase } from '../LoginProcessBase';
import { LoginProcessType } from '../LoginEnum';

/**
 * 获取用户头像/昵称
 * 1. 打开登录界面
 * 2. 微信平台：先请求用户隐私授权，再创建全屏透明原生按钮，用户点击触发授权
 *    注意：需在 mp.weixin.qq.com 后台《用户隐私保护指引》声明「昵称、头像」信息类型
 * 3. 非微信平台监听 Cocos 按钮触摸事件，点击后填充测试数据
 */
export class RequestSdkUserInfo extends LoginProcessBase {
    constructor() {
        super(LoginProcessType.SdkUserInfo);
    }

    protected async execute() {
        const label = '【登录流程】获取用户头像';
        console.time(label);
        try {
            // 1. 打开登录界面
            const uiNode = await gsm.account.B_Account_ViewUI.openLogin();
            if (!uiNode) {
                console.timeEnd(label);
                this.fail();
                return;
            }

            // 2. 等待用户点击按钮获取用户信息（阻塞直到点击完成）
            const sdk = gsm.base.sdk.B_Sdk_Main.sdk;
            await this.requestUserInfo(sdk, uiNode);

            console.timeEnd(label);
            this.success();
        }
        catch (err) {
            console.timeEnd(label);
            console.error('【登录流程】获取用户头像失败', err);
            this.fail();
        }
    }

    /**
     * 获取用户头像/昵称
     *
     * 微信平台：创建全屏透明原生按钮，用户点击触发授权回调
     * 非微信平台：监听 Cocos 节点触摸事件，点击后填充测试数据
     */
    private async requestUserInfo(sdk: ISdk, uiNode: Node): Promise<void> {
        // 微信平台：先完成用户隐私授权，否则 createUserInfoButton 会返回 errno 1026
        // （前提：已在 mp.weixin.qq.com 后台《用户隐私保护指引》声明「昵称、头像」信息类型）
        try {
            sdk.onNeedPrivacyAuthorization((res) => {
                // 用户需要同意隐私协议：这里直接同意（基础库要求用户有点击行为，
                // 实际项目建议弹出自定义隐私弹窗，用户点击同意后再 resolve 'agree'）
                oops.log.trace(`【登录流程】需要隐私授权: ${res.contractName}`);
                (sdk as any).requirePrivacyAuthorize?.({}).catch(() => { });
            });
            await sdk.requirePrivacyAuthorize({ demandList: ['userInfo'] });
            oops.log.trace('【登录流程】用户隐私授权已通过');
        }
        catch {
            // 拒绝或后台未配置：不阻断流程，后续 createUserInfoButton 会回退默认数据
            oops.log.trace('【登录流程】隐私授权未通过，使用默认用户信息');
        }

        return new Promise<void>((resolve) => {
            // 微信平台：创建全屏透明原生按钮
            const btn = sdk.createUserInfoButton({
                type: 'text',
                text: '',
                style: {
                    left: 0,
                    top: 0,
                    width: 9999,
                    height: 9999,
                },
            });

            console.log('【登录流程】原生按钮创建结果:', btn ? '成功' : '失败(null)');

            // 原生按钮创建成功（微信平台），用户点击触发授权
            if (btn) {
                btn.show();
                btn.onTap((res: IUserInfoResult) => {
                    console.log('【登录流程】onTap 回调原始数据:', JSON.stringify(res));

                    // userInfo 为空（用户拒绝授权或新版基础库行为变化）
                    if (!res?.userInfo) {
                        oops.log.trace('【登录流程】用户未授权用户信息，使用默认数据');
                        gsm.base.sdk.M_Sdk_Main.userInfo = {
                            nickName: 'Player',
                            avatarUrl: '',
                            gender: 0,
                        };
                    }
                    else {
                        gsm.base.sdk.M_Sdk_Main.userInfo = res.userInfo;
                        oops.log.trace(`【登录流程】获取用户信息成功，昵称: ${res.userInfo.nickName}，头像: ${res.userInfo.avatarUrl}`);
                    }

                    btn.destroy();
                    // 关闭登录界面
                    gsm.account.B_Account_ViewUI.removeLogin();
                    resolve();
                });
                return;
            }

            // 非微信平台：监听 Cocos 节点触摸事件，点击后填充测试数据
            const handler = () => {
                const testUserInfo: IUserInfo = {
                    nickName: 'TestUser',
                    avatarUrl: '',
                    gender: 0,
                };
                gsm.base.sdk.M_Sdk_Main.userInfo = testUserInfo;
                oops.log.trace(`【登录流程】获取用户信息成功（测试），昵称: ${testUserInfo.nickName}`);
                uiNode.off(Node.EventType.TOUCH_END, handler, this);
                // 关闭登录界面
                gsm.account.B_Account_ViewUI.removeLogin();
                resolve();
            };
            uiNode.on(Node.EventType.TOUCH_END, handler, this);
        });
    }
}
