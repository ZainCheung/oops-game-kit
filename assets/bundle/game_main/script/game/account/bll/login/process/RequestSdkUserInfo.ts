import { Node, sys, view, screen } from 'cc';
import { oops } from 'db://oops-framework/core/Oops';
import { gsm } from '../../../../common/GameSingletonModule';
import type { ISdk } from '../../../../../base/sdk/bll/ISdk';
import type { IUserInfoResult } from '../../../../../base/sdk/model/IM_Sdk_Data';
import { LoginProcessBase } from '../LoginProcessBase';
import { LoginProcessType } from '../LoginEnum';

/**
 * 获取用户头像/昵称
 * 1. 微信小游戏在指定节点区域创建透明原生按钮，用户点击触发授权回调
 * 2. 非微信平台 createUserInfoButton 返回 null，直接跳过
 */
export class RequestSdkUserInfo extends LoginProcessBase {
    constructor() {
        super(LoginProcessType.SdkUserInfo);
    }

    protected async execute() {
        const label = '【登录流程】获取用户头像';
        console.time(label);
        try {
            const sdk = gsm.base.sdk.B_Sdk_Main.sdk;
            await this.requestUserInfo(sdk);
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
     * @param triggerNode 触发头像授权的节点（其屏幕区域会被透明按钮覆盖），
     *                    不传则覆盖整个屏幕
     */
    private requestUserInfo(sdk: ISdk, triggerNode?: Node): Promise<void> {
        return new Promise<void>((resolve) => {
            const rect = this.getNodeScreenRect(triggerNode);

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

            // 非微信平台不支持，直接跳过
            if (!btn) {
                resolve();
                return;
            }

            btn.show();
            btn.onTap((res: IUserInfoResult) => {
                gsm.base.sdk.M_Sdk_Main.userInfo = res.userInfo;
                oops.log.trace(`【登录流程】获取用户信息成功，昵称: ${res.userInfo.nickName}`);
                btn.destroy();
                resolve();
            });
        });
    }

    /**
     * 将 Cocos 节点的世界包围盒转换为微信原生按钮的屏幕坐标
     *
     * Cocos 坐标系：左下角原点，Y 轴向上
     * 微信原生按钮坐标系：左上角原点，Y 轴向下
     */
    private getNodeScreenRect(node?: Node): { left: number; top: number; width: number; height: number } {
        if (!node) {
            const safe = sys.getSafeAreaRect();
            return { left: safe.x, top: safe.y, width: safe.width, height: safe.height };
        }

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
