import { find, NodeEventType } from 'cc';
import { gsm } from '../../../../common/GameSingletonModule';
import { LoginProcessType } from '../LoginEnum';
import { LoginProcessBase } from '../LoginProcessBase';
import { IUserInfo } from '../../../../../../../../bundle/game_main/script/base/sdk/SdkTypes';
import { oops } from 'db://oops-framework/core/Oops';

/**
 * 登录流程 —— 获取用户名
 *
 * **极简流程**：
 *  - 有缓存 → 直接 finish
 *  - 无缓存 → 弹 VC_Account_Login → 点 btnRequestSdkUserInfo → 调 sdk.getUserProfile → finish
 *
 * 默认用户信息由各 SDK 实现 guarantees 返回（失败时返回兜底 userInfo），
 * 业务层不写死任何默认值。
 */
const CACHE_KEY = 'RequestSdkUserInfo_Cache';

export class RequestSdkUserInfo extends LoginProcessBase {
    constructor() {
        super(LoginProcessType.SdkUserInfo);
    }

    /** 获取 SDK 接口（ISdk） */
    private get sdk() {
        return gsm.base.sdk.platform;
    }

    protected async execute() {
        // 0. 命中缓存直接 finish
        const cached = this.readCache();
        if (cached) {
            this.finish(cached);
            return;
        }

        // 1. 弹自定义登录界面
        const uiNode = await gsm.account.B_Account_ViewUI.openLogin();
        if (!uiNode) {
            console.error('【登录流程】打开登录界面失败');
            this.finish(await this.fetchUserInfo(), true);
            return;
        }

        // 2. 绑定按钮：点击即获取用户名
        const btn = find('btnRequestSdkUserInfo', uiNode);
        if (btn) {
            btn.on(NodeEventType.TOUCH_END, () => this.handleEnterClick());
        }
        else {
            console.warn('【登录流程】找不到 btnRequestSdkUserInfo 节点');
            this.finish(await this.fetchUserInfo(), true);
        }
    }

    /** 点击按钮：调 SDK 获取用户名 */
    private async handleEnterClick(): Promise<void> {
        gsm.account.B_Account_ViewUI.removeLogin();
        this.finish(await this.fetchUserInfo(), true);
    }

    /** 从 SDK 获取用户信息（SDK 保证总有返回，失败时由 SDK 返回兜底） */
    private async fetchUserInfo(): Promise<IUserInfo> {
        const res = await this.sdk.getUserProfile({
            desc: '用于在游戏中展示你的身份信息',
        });
        return res.userInfo!;
    }

    /** 读取本地缓存 */
    private readCache(): IUserInfo | null {
        const raw = oops.storage.getJson<IUserInfo | null>(CACHE_KEY, null);
        return raw?.nickName ? raw : null;
    }

    /** 结束流程 */
    private finish(userInfo: IUserInfo, writeCache = false): void {
        gsm.base.sdk.userInfo = userInfo;
        if (writeCache) {
            oops.storage.set(CACHE_KEY, userInfo);
        }
        console.log('【登录流程】用户信息:', userInfo);
        gsm.account.B_Account_ViewUI.removeLogin();
        this.success();
    }
}
