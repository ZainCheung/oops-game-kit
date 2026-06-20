import { Node, view, screen } from 'cc';
import { oops } from 'db://oops-framework/core/Oops';
import { gsm } from '../../../../common/GameSingletonModule';
import type { ISdk } from '../../../../../base/sdk/bll/ISdk';
import type { IUserInfo, IUserInfoResult } from '../../../../../base/sdk/model/IM_Sdk_Data';
import { LoginProcessBase } from '../LoginProcessBase';
import { LoginProcessType } from '../LoginEnum';

/** 登录界面上的头像授权按钮节点名 */
const BTN_NAME = 'btnRequestSdkUserInfo';

/**
 * 获取用户头像/昵称
 * 1. 打开登录界面，在 btnRequestSdkUserInfo 按钮区域创建透明原生按钮
 * 2. 用户点击按钮触发授权，获取头像/昵称后继续登录流程
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

            // 2. 递归查找头像授权按钮节点
            const btnNode = this.findNode(uiNode, BTN_NAME);

            // 3. 等待用户点击按钮获取用户信息（阻塞直到点击完成）
            const sdk = gsm.base.sdk.B_Sdk_Main.sdk;
            await this.requestUserInfo(sdk, btnNode);

            // 4. 关闭登录界面
            gsm.account.B_Account_ViewUI.removeLogin();

            console.timeEnd(label);
            this.success();
        }
        catch (err) {
            console.timeEnd(label);
            console.error('【登录流程】获取用户头像失败', err);
            this.fail();
        }
    }

    /** 递归查找子节点 */
    private findNode(root: Node, name: string): Node | null {
        if (root.name === name) return root;
        for (const child of root.children) {
            const found = this.findNode(child, name);
            if (found) return found;
        }
        return null;
    }

    /**
     * 获取用户头像/昵称
     *
     * 微信平台：在按钮节点区域创建透明原生按钮，用户点击触发授权回调
     * 非微信平台：监听 Cocos 按钮节点的触摸事件，点击后填充测试数据
     *
     * 两种平台都阻塞直到用户点击完成
     */
    private requestUserInfo(sdk: ISdk, btnNode: Node | null): Promise<void> {
        return new Promise<void>((resolve) => {
            // 微信平台：创建透明原生按钮
            if (btnNode) {
                const rect = this.getNodeScreenRect(btnNode);
                const btn = sdk.createUserInfoButton({
                    type: 'text',
                    text: '',
                    style: {
                        left: rect.left,
                        top: rect.top,
                        width: rect.width,
                        height: rect.height,
                    },
                });

                // 原生按钮创建成功（微信平台），用户点击触发授权
                if (btn) {
                    btn.show();
                    btn.onTap((res: IUserInfoResult) => {
                        gsm.base.sdk.M_Sdk_Main.userInfo = res.userInfo;
                        oops.log.trace(`【登录流程】获取用户信息成功，昵称: ${res.userInfo.nickName}`);
                        btn.destroy();
                        resolve();
                    });
                    return;
                }
            }

            // 非微信平台：监听 Cocos 按钮触摸事件，点击后填充测试数据
            const touchNode = btnNode ?? gsm.account.B_Account_ViewUI;
            const handler = () => {
                const testUserInfo: IUserInfo = {
                    nickName: 'TestUser',
                    avatarUrl: '',
                    gender: 0,
                };
                gsm.base.sdk.M_Sdk_Main.userInfo = testUserInfo;
                oops.log.trace(`【登录流程】获取用户信息成功（测试），昵称: ${testUserInfo.nickName}`);
                touchNode.off(Node.EventType.TOUCH_END, handler, this);
                resolve();
            };
            touchNode.on(Node.EventType.TOUCH_END, handler, this);
        });
    }

    /**
     * 将 Cocos 节点的世界包围盒转换为微信原生按钮的屏幕坐标
     *
     * Cocos 坐标系：左下角原点，Y 轴向上
     * 微信原生按钮坐标系：左上角原点，Y 轴向下
     */
    private getNodeScreenRect(node: Node): { left: number; top: number; width: number; height: number } {
        const uiTransform = node.getComponent('cc.UITransform') as any;
        const box = uiTransform.getBoundingBoxToWorld();

        const designSize = view.getVisibleSize();
        const screenSize = screen.windowSize;

        const scaleX = screenSize.width / designSize.width;
        const scaleY = screenSize.height / designSize.height;

        const left = box.x * scaleX;
        const width = box.width * scaleX;
        const height = box.height * scaleY;
        const top = (designSize.height - box.y - box.height) * scaleY;

        return { left, top, width, height };
    }
}
