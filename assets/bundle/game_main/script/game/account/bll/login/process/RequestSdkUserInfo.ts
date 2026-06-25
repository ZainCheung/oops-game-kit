import { Button, Color, Graphics, Node, UITransform, Vec3, find, screen, view } from 'cc';
import type { ISdk } from '../../../../../base/sdk/ISdk';
import type { IUserInfoResult } from '../../../../../base/sdk/SdkTypes';
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
        console.log('========== RequestSdkUserInfo 2026-06-25 版本: 全屏原生按钮 + 禁用 Cocos Button 组件 ==========');
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

            // 2. 创建全屏原生按钮并等用户点击（内部会调 this.success() / this.fail()）
            const sdk = gsm.base.sdk.platform;
            this.requestUserInfo(sdk, uiNode);
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
     * 微信平台：禁用 Cocos 按钮的 Button 组件（让它不消费触摸事件），
     * 然后在屏幕中央创建一个**全屏透明**微信原生按钮接管整个屏幕的触摸。
     * 用户首次点击（点按钮或屏幕任意位置）→ 命中已 show 的原生按钮 →
     * 微信弹授权弹窗 → 点「允许」→ onTap 拿到 userInfo。
     *
     * 为什么用全屏按钮：之前试过精确换算 Cocos 按钮位置算到原生按钮，
     * 但 `wx.createUserInfoButton` 的坐标和 Cocos 设计分辨率在 FitWidth/FitHeight
     * 适配模式下经常算偏（top 出现负数、按钮被推出屏幕外），用户根本点不到。
     * 全屏按钮在微信里是稳定 work 的（用户之前测试时再点一次屏幕也能弹，就是这个原因）。
     *
     * （前提：已在 mp.weixin.qq.com 后台《用户隐私保护指引》声明「昵称、头像」信息类型）
     * 非微信平台：直接用默认数据
     */
    private requestUserInfo(sdk: ISdk, uiNode: Node): void {
        const btnNode = find('btnRequestSdkUserInfo', uiNode);

        // 1. 禁用 Cocos 按钮的 Button 组件（必须）—— 不禁用的话，
        //    Button 组件会在 TOUCH_END 消费触摸事件，事件传不到原生按钮层。
        if (btnNode) {
            const ccBtn = btnNode.getComponent(Button);
            if (ccBtn) {
                ccBtn.enabled = false;
                console.log('【登录流程】已禁用 Cocos 按钮的 Button 组件');
            }
        }

        // 2. 获取屏幕逻辑像素尺寸（H5/微信/原生行为统一）
        const { width: screenW, height: screenH } = this.getScreenLogicalSize();

        // 3. 创建全屏透明原生按钮
        const nativeBtn = sdk.createUserInfoButton({
            type: 'text',
            text: '',
            style: {
                left: 0,
                top: 0,
                width: screenW,
                height: screenH,
                backgroundColor: 'rgba(255, 255, 255, 0)',
                borderColor: 'rgba(255, 255, 255, 0)',
                color: 'rgba(255, 255, 255, 0)',
                textAlign: 'center',
                fontSize: 16,
                borderRadius: 0,
            },
        });

        console.log('【登录流程】原生按钮（全屏）创建结果:', nativeBtn ? '成功' : '失败(null)');
        console.log('【登录流程】原生按钮 style:', JSON.stringify({ left: 0, top: 0, width: screenW, height: screenH }));

        if (!nativeBtn) {
            // 原生按钮创建失败（基础库太老）→ 兜底用默认数据
            console.log('【登录流程】原生按钮创建失败，使用默认用户信息');
            gsm.base.sdk.userInfo = {
                nickName: 'Player',
                avatarUrl: '',
                gender: 0,
            };
            gsm.account.B_Account_ViewUI.removeLogin();
            this.success();
            return;
        }

        nativeBtn.show();

        // 4. 等用户点击 → 弹授权弹窗 → 回调拿数据
        nativeBtn.onTap((res: IUserInfoResult) => {
            console.log('【登录流程】原生按钮 onTap 回调:', JSON.stringify(res));
            if (res?.userInfo) {
                gsm.base.sdk.userInfo = res.userInfo;
                console.log(
                    `【登录流程】获取用户信息成功（原生按钮），昵称: ${res.userInfo.nickName}`
                );
            }
            else {
                // 用户点了「拒绝」
                console.log('【登录流程】用户拒绝授权，使用默认用户信息');
                gsm.base.sdk.userInfo = {
                    nickName: 'Player',
                    avatarUrl: '',
                    gender: 0,
                };
            }
            nativeBtn.destroy();
            gsm.account.B_Account_ViewUI.removeLogin();
            this.success();
        });
    }

    /**
     * 获取跨平台的"屏幕逻辑像素"尺寸
     *
     * - 微信小游戏：screen.width/height 即逻辑像素，直接使用
     * - H5：screen.width/height 是物理像素（含 devicePixelRatio），需用 window.innerWidth/innerHeight
     * - 原生：screen.width/height 即逻辑像素
     *
     * 使用 screen.windowSize 获取 Cocos 画布的逻辑尺寸，跨平台行为一致。
     */
    private getScreenLogicalSize(): { width: number; height: number } {
        const size = screen.windowSize;
        if (size && size.width > 0 && size.height > 0) {
            return { width: size.width, height: size.height };
        }
        // 兜底：使用 visibleSize（设计分辨率），至少不会越界
        const v = view.getVisibleSize();
        return { width: v.width, height: v.height };
    }

    /**
     * 微信坐标转换
     *
     * Cocos 世界坐标（中心原点，Y 向上）→ 屏幕坐标（左上角原点，Y 向下）
     * 使用 view.getVisibleSize() 兼容 FitWidth/FitHeight 等适配模式，避免硬编码设计分辨率导致错位。
     *
     * @param width    按钮宽度（设计分辨率像素）
     * @param height   按钮高度（设计分辨率像素）
     * @param worldX   按钮中心点世界坐标 X
     * @param worldY   按钮中心点世界坐标 Y
     */
    private wxPositionConversion(
        width: number = 100,
        height: number = 100,
        worldX: number = 0,
        worldY: number = 0
    ): { left: number; top: number; width: number; height: number } {
        // 设计坐标系下的实际可见区域（考虑适配模式）
        const visibleSize = view.getVisibleSize();
        // 跨平台获取屏幕逻辑像素尺寸（H5 和小游戏行为统一）
        const { width: screenWidth, height: screenHeight } = this.getScreenLogicalSize();

        // 设计坐标 → 屏幕逻辑像素的缩放比
        const scaleX = screenWidth / visibleSize.width;
        const scaleY = screenHeight / visibleSize.height;

        // Cocos 世界坐标（中心原点，Y 向上）→ 屏幕坐标（左上角原点，Y 向下）
        const screenCenterX = screenWidth / 2 + worldX * scaleX;
        const screenCenterY = screenHeight / 2 - worldY * scaleY;

        // 按钮尺寸转换
        const scaledWidth = width * scaleX;
        const scaledHeight = height * scaleY;

        const result = {
            left: screenCenterX - scaledWidth / 2,
            top: screenCenterY - scaledHeight / 2,
            width: scaledWidth,
            height: scaledHeight,
        };

        console.log('【登录流程】坐标转换:', {
            visibleSize: { w: visibleSize.width, h: visibleSize.height },
            canvas: { w: screenWidth, h: screenHeight },
            worldPos: { x: worldX, y: worldY },
            buttonSize: { w: width, h: height },
            result,
        });

        return result;
    }

    /**
     * 调试可视化：在 btnNode.parent 上绘制两个矩形对比
     * - 红色矩形：Cocos 按钮的真实世界位置（btnNode.worldPosition + UITransform）
     * - 绿色矩形：把 wxPositionConversion 的结果反推回 Cocos 世界坐标
     *
     * 两者重合 → 坐标转换正确；不重合 → 坐标转换有误，绿色矩形即原生按钮实际覆盖区域
     */
    private drawDebugRects(
        btnNode: Node,
        wxStyle: { left: number; top: number; width: number; height: number }
    ): Node | null {
        try {
            // 直接挂在 btnNode 的父节点上，和按钮同一渲染层、同一坐标系
            const parent = btnNode.parent;
            if (!parent) return null;
            const parentUit = parent.getComponent(UITransform);
            if (!parentUit) return null;

            const debugNode = new Node('__DebugRects__');
            parent.addChild(debugNode);
            debugNode.setSiblingIndex(-1); // 放到最上层，避免被其他节点遮挡
            debugNode.layer = parent.layer; // 继承父节点 layer，确保 UI 相机能渲染

            const debugUit = debugNode.addComponent(UITransform);
            debugUit.setContentSize(parentUit.contentSize);

            const g = debugNode.addComponent(Graphics);
            g.lineWidth = 6;

            // 红色矩形：Cocos 按钮实际位置（用世界坐标统一转换，避免本地缩放干扰）
            const btnUit = btnNode.getComponent(UITransform)!;
            const btnWorld = btnNode.worldPosition;
            const btnLocal = parentUit.convertToNodeSpaceAR(new Vec3(btnWorld.x, btnWorld.y, 0));
            const btnSize = btnUit.contentSize;
            g.strokeColor = new Color(255, 0, 0, 255);
            g.fillColor = new Color(255, 0, 0, 80);
            g.rect(
                btnLocal.x - btnSize.width / 2,
                btnLocal.y - btnSize.height / 2,
                btnSize.width,
                btnSize.height
            );
            g.fill();
            g.stroke();

            // 绿色矩形：原生按钮反推位置（把 wx 屏幕坐标反推回 Cocos 世界坐标）
            // 与 wxPositionConversion 使用相同的屏幕逻辑像素基准，确保 H5/微信一致
            const visibleSize = view.getVisibleSize();
            const { width: sw, height: sh } = this.getScreenLogicalSize();
            const scaleX = sw / visibleSize.width;
            const scaleY = sh / visibleSize.height;
            const wxCenterX = wxStyle.left + wxStyle.width / 2;
            const wxCenterY = wxStyle.top + wxStyle.height / 2;
            const worldX = (wxCenterX - sw / 2) / scaleX;
            const worldY = (sh / 2 - wxCenterY) / scaleY;
            const wxWorld = new Vec3(worldX, worldY, 0);
            const wxLocal = parentUit.convertToNodeSpaceAR(wxWorld);
            const wxW = wxStyle.width / scaleX;
            const wxH = wxStyle.height / scaleY;
            g.strokeColor = new Color(0, 255, 0, 255);
            g.fillColor = new Color(0, 255, 0, 80);
            g.rect(wxLocal.x - wxW / 2, wxLocal.y - wxH / 2, wxW, wxH);
            g.fill();
            g.stroke();

            console.log('【登录流程】调试矩形已绘制:', {
                parent: parent.name,
                red: { local: { x: btnLocal.x, y: btnLocal.y }, size: { w: btnSize.width, h: btnSize.height } },
                green: { local: { x: wxLocal.x, y: wxLocal.y }, size: { w: wxW, h: wxH } },
                重合: Math.abs(btnLocal.x - wxLocal.x) < 1 && Math.abs(btnLocal.y - wxLocal.y) < 1,
            });

            return debugNode;
        }
        catch (e) {
            console.error('【登录流程】绘制调试矩形失败', e);
            return null;
        }
    }
}
