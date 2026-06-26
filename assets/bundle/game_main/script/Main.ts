import { _decorator, Node } from 'cc';
import { LogType } from 'db://oops-framework/core/common/log/Logger';
import { oops } from 'db://oops-framework/core/Oops';
import { Root } from 'db://oops-framework/core/Root';
import { ecs } from 'db://oops-framework/libs/ecs/ECS';
import { Base } from './base/Base';
import { registerAll as registerShareAssets } from './base/share/ShareAssets';
import { Account } from './game/account/Account';
import { gsm } from './game/common/GameSingletonModule';
import { Initialize } from './game/initialize/Initialize';
import { RequestSdkUserInfo } from './game/account/bll/login/process/RequestSdkUserInfo';

declare const wx: any;

const { ccclass, property } = _decorator;

@ccclass('Main')
export class Main extends Root {
    @property({
        type: Node,
        tooltip: '游戏初始画面',
    })
    initial: Node = null!;

    protected iniStart() {
        oops.log.setTags(
            // LogType.Net |
            LogType.Model | LogType.Business | LogType.View | LogType.Config | LogType.Trace
        );
    }

    protected run() {
        gsm.base = new Base();
        gsm.account = ecs.getEntity(Account);
        gsm.initialize = ecs.getEntity(Initialize);

        // 业务层：注册游戏专属的分享素材（按 Readme.md 原则，通用层零硬编码）
        registerShareAssets();

        // 微信小游戏：进游戏第一时间覆盖 SDK 默认的 wx.onNeedPrivacyAuthorization 监听器
        // SDK 默认用 showModal 半原生框，必须用我们自己的 handler 覆盖
        // 覆盖式注册：最后一次生效，所以必须在 SDK 之后调
        if (typeof wx !== 'undefined') {
            const registerPrivacy = () => {
                if (typeof wx.onNeedPrivacyAuthorization === 'function') {
                    wx.onNeedPrivacyAuthorization((resolveFn: any, eventInfo: any) => {
                        const contractName = eventInfo?.contractName || '用户隐私协议';
                        console.log(`【Main】SDK 触发隐私授权，协议名: ${contractName}`);
                        // 弹我们的自定义弹窗 VC_Account_Login
                        RequestSdkUserInfo.showPrivacyDialog(contractName, resolveFn, eventInfo);
                    });
                    console.log('【Main】已覆盖 wx.onNeedPrivacyAuthorization（自定义弹窗版）');
                }
            };

            // 等 SDK 初始化完成后再覆盖（必须在 SDK 之后）
            // 用 scheduleOnce 延迟到下一帧，确保 SDK 注册完
            this.scheduleOnce(registerPrivacy, 0);

            // 主动拉一次 wx.requirePrivacyAuthorize，触发隐私监听器
            // （新用户：弹自定义弹窗；老用户：直接 success）
            this.scheduleOnce(() => {
                if (typeof wx.requirePrivacyAuthorize === 'function') {
                    wx.requirePrivacyAuthorize({
                        success: () => console.log('【Main】wx.requirePrivacyAuthorize: 用户已同意隐私'),
                        fail: () => console.log('【Main】wx.requirePrivacyAuthorize: 用户拒绝隐私'),
                        complete: () => { /* ignore */ },
                    });
                }
            }, 0.3);
        }

        gsm.initialize.load(this.initial);
    }
}
