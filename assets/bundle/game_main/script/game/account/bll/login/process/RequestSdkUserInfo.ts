import { Color, Graphics, Node, UITransform, Vec3, find, screen, view } from 'cc';
import { oops } from 'db://oops-framework/core/Oops';
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
            const sdk = gsm.base.sdk.main.sdk;
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
                gsm.base.sdk.model.userInfo = {
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

            // 调试：在 uiNode 上绘制矩形对比 Cocos 按钮位置 vs 原生按钮位置
            // 红色 = Cocos 按钮实际位置；绿色 = 原生按钮反推位置；两者重合说明坐标转换正确
            const debugNode = this.drawDebugRects(btnNode, style);

            // 创建微信原生透明按钮（作为可选尝试，真机上可能拦截触摸触发 onTap）
            const nativeBtn = sdk.createUserInfoButton({
                type: 'text',
                text: '',
                style: {
                    left: style.left,
                    top: style.top,
                    width: style.width,
                    height: style.height,
                    backgroundColor: 'rgba(255, 255, 255, 0)',
                    borderColor: 'rgba(255, 255, 255, 0)',
                    color: 'rgba(255, 255, 255, 0)',
                    textAlign: 'center',
                    fontSize: 16,
                    borderRadius: 0,
                },
            });

            console.log('【登录流程】原生按钮创建结果:', nativeBtn ? '成功' : '失败(null)');
            console.log('【登录流程】原生按钮 style:', JSON.stringify(style));

            if (nativeBtn) {
                nativeBtn.show();
            }

            let resolved = false;

            const doCleanup = () => {
                if (resolved) return;
                resolved = true;
                if (nativeBtn) nativeBtn.destroy();
                btnNode.off(Node.EventType.TOUCH_END, onCocosBtnTap, this);
                if (debugNode) debugNode.destroy();
                gsm.account.B_Account_ViewUI.removeLogin();
                resolve();
            };

            // 路径 A：原生按钮拦截了触摸（真机正常时走这里）
            if (nativeBtn) {
                nativeBtn.onTap((res: IUserInfoResult) => {
                    console.log('【登录流程】原生按钮 onTap 回调:', JSON.stringify(res));
                    if (res?.userInfo) {
                        gsm.base.sdk.model.userInfo = res.userInfo;
                        oops.log.trace(
                            `【登录流程】获取用户信息成功（原生按钮），昵称: ${res.userInfo.nickName}`
                        );
                    } else {
                        gsm.base.sdk.model.userInfo = {
                            nickName: 'Player',
                            avatarUrl: '',
                            gender: 0,
                        };
                    }
                    doCleanup();
                });
            }

            // 路径 B：Cocos 按钮点击（模拟器或原生按钮未拦截时走这里）模拟器和真机都走这。。。。。。
            // 主动调用 sdk.getUserInfo() 获取用户信息，不依赖原生按钮
            const onCocosBtnTap = async () => {
                console.log('【登录流程】Cocos 按钮被点击，主动调用 getUserInfo');
                try {
                    const res = await sdk.getUserInfo();
                    console.log('【登录流程】getUserInfo 返回:', JSON.stringify(res));
                    if (res?.userInfo) {
                        gsm.base.sdk.model.userInfo = res.userInfo;
                        oops.log.trace(
                            `【登录流程】获取用户信息成功（getUserInfo），昵称: ${res.userInfo.nickName}`
                        );
                    } else {
                        throw new Error('userInfo 为空');
                    }
                } catch (e) {
                    console.warn('【登录流程】getUserInfo 失败，使用默认数据', e);
                    gsm.base.sdk.model.userInfo = {
                        nickName: 'Player',
                        avatarUrl: '',
                        gender: 0,
                    };
                }
                doCleanup();
            };
            btnNode.on(Node.EventType.TOUCH_END, onCocosBtnTap, this);
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
        try {
            const size = screen.windowSize;
            if (size && size.width > 0 && size.height > 0) {
                return { width: size.width, height: size.height };
            }
        } catch {}
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
        } catch (e) {
            console.error('【登录流程】绘制调试矩形失败', e);
            return null;
        }
    }
}
