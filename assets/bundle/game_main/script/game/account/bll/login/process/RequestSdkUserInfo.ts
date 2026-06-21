import { Node, UITransform, find } from 'cc';
import { oops } from 'db://oops-framework/core/Oops';
import type { ISdk } from '../../../../../base/sdk/bll/ISdk';
import type { IUserInfo, IUserInfoResult } from '../../../../../base/sdk/model/IM_Sdk_Data';
import { gsm } from '../../../../common/GameSingletonModule';
import { LoginProcessType } from '../LoginEnum';
import { LoginProcessBase } from '../LoginProcessBase';

/**
 * 获取微信用户信息还有问题等待调试
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
        } catch (err) {
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
            sdk.onNeedPrivacyAuthorization(res => {
                // 用户需要同意隐私协议：这里直接同意（基础库要求用户有点击行为，
                // 实际项目建议弹出自定义隐私弹窗，用户点击同意后再 resolve 'agree'）
                oops.log.trace(`【登录流程】需要隐私授权: ${res.contractName}`);
                (sdk as any).requirePrivacyAuthorize?.({}).catch(() => {});
            });
            await sdk.requirePrivacyAuthorize({ demandList: ['userInfo'] });
            oops.log.trace('【登录流程】用户隐私授权已通过');
        } catch {
            // 拒绝或后台未配置：不阻断流程，后续 createUserInfoButton 会回退默认数据
            oops.log.trace('【登录流程】隐私授权未通过，使用默认用户信息');
        }

        return new Promise<void>(resolve => {
            // 微信平台：根据界面上 btnRequestSdkUserInfo 按钮的矩形，创建同位置的透明原生按钮
            const btnNode = find('btnRequestSdkUserInfo', uiNode);
            if (!btnNode) {
                oops.log.trace('【登录流程】未找到 btnRequestSdkUserInfo 节点，使用默认测试用户信息');
                gsm.base.sdk.M_Sdk_Main.userInfo = {
                    nickName: 'Player',
                    avatarUrl: '',
                    gender: 0,
                };
                gsm.account.B_Account_ViewUI.removeLogin();
                resolve();
                return;
            }

            const uit = btnNode.getComponent(UITransform)!;
            const worldPos = btnNode.worldPosition;
            const style = this.wxPositionConversion(
                uit.contentSize.width,
                uit.contentSize.height,
                worldPos.x,
                worldPos.y
            );

            // 参考 marsdk 微信实现：使用 type:'image' + 透明背景色，确保按钮完全透明覆盖在 Cocos 按钮区域上
            const btn = sdk.createUserInfoButton({
                type: 'image',
                style: {
                    left: style.left,
                    top: style.top,
                    width: style.width,
                    height: style.height,
                    backgroundColor: 'rgba(255, 255, 255, 0)', // 透明
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
                    } else {
                        gsm.base.sdk.M_Sdk_Main.userInfo = res.userInfo;
                        oops.log.trace(
                            `【登录流程】获取用户信息成功，昵称: ${res.userInfo.nickName}，头像: ${res.userInfo.avatarUrl}`
                        );
                    }

                    btn.destroy();
                    // 关闭登录界面
                    gsm.account.B_Account_ViewUI.removeLogin();
                    resolve();
                });
                return;
            }

            // 非微信平台：监听 btnRequestSdkUserInfo 按钮触摸事件，点击后填充测试数据
            // 与微信平台行为统一：只有点击按钮区域才触发获取用户信息
            const handler = () => {
                const testUserInfo: IUserInfo = {
                    nickName: 'TestUser',
                    avatarUrl: '',
                    gender: 0,
                };
                gsm.base.sdk.M_Sdk_Main.userInfo = testUserInfo;
                oops.log.trace(`【登录流程】获取用户信息成功（测试），昵称: ${testUserInfo.nickName}`);
                btnNode.off(Node.EventType.TOUCH_END, handler, this);
                // 关闭登录界面，继续后续登录流程
                gsm.account.B_Account_ViewUI.removeLogin();
                resolve();
            };
            btnNode.on(Node.EventType.TOUCH_END, handler, this);
        });
    }

    /**
     * 微信坐标转换（基于左上角（0，0）计算，并且Y向下为正数）
     * @param width 宽度
     * @param height 高度
     * @param xOffset x偏移量(填按钮锚点为中心点的x坐标)
     * @param yOffset y偏移量(填按钮锚点为中心点的y坐标)
     * @returns
     */
    private wxPositionConversion(
        width: number = 100,
        height: number = 100,
        xOffset: number = 0,
        yOffset: number = 0
    ): any {
        const designSize = { width: 720, height: 1280 };
        width = width * (screen.width / designSize.width);
        height = height * (screen.height / designSize.height);
        const left = screen.width / 2 - width / 2 + xOffset * (screen.width / designSize.width);
        const top = screen.height / 2 - height / 2 + -yOffset * (screen.height / designSize.height);
        return { left: left, top: top, width: width, height: height };
    }
}
