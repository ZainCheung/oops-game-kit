import { _decorator, Component, Button, screen } from 'cc';
import { Sdk } from './Sdk';

const { ccclass, property } = _decorator;

/**
 * 分享按钮组件
 *
 * 使用：
 * 1. 把这个脚本挂到带 Button 组件的节点上。
 * 2. 填一个字段：shareTitle。
 * 3. 点击按钮即触发分享，分享卡片图片 = 当前游戏画面截图。
 */
@ccclass('ShareButton')
export class ShareButton extends Component {
    @property({ displayName: '分享标题' })
    shareTitle: string = '一起来玩';

    /** 调试计数 */
    private _debugCount: number = 0;

    onLoad() {
        const btn = this.getComponent(Button) ?? this.addComponent(Button);
        btn.node.on(Button.EventType.CLICK, this.onClick, this);
    }

    onDestroy() {
        const btn = this.getComponent(Button);
        if (btn) btn.node.off(Button.EventType.CLICK, this.onClick, this);
    }

    private onClick = () => {
        this._debugCount += 1;
        const sdk: any = Sdk.instance.main.sdk;
        const size = screen.windowSize;

        console.log(`zw ${this._debugCount} nst 平台=${sdk.constructor?.name ?? ''}, screen=${size.width}x${size.height}`);

        this.captureScreen(size.width, size.height).then((localPath) => {
            console.log(`zw ${this._debugCount} nst 截图成功: ${localPath}`);
            sdk.shareAppMessage({
                title: this.shareTitle,
                presetImageUrl: localPath,
            });
        }).catch((err) => {
            console.warn(`zw ${this._debugCount} nst 截图失败，使用无图分享：`, err && err.message ? err.message : err);
            sdk.shareAppMessage({ title: this.shareTitle });
        });
    };

    /**
     * 探测 wx/tt：抖音/微信老版本 key 是 createOffScreenCanvas（大写 S），
     * 微信新版本 key 是 createOffscreenCanvas（小写 s），这里两个都兼容。
     */
    private probePlatform(): { api: any; envPath: string | undefined } {
        let api: any = null;
        try { api = (window as any)?.wx || (globalThis as any)?.wx || (window as any)?.tt || (globalThis as any)?.tt; } catch (e) {}

        let envPath: string | undefined = api?.env?.USER_DATA_PATH;
        if (!envPath) {
            try {
                const fsUtils = (window as any)?.fsUtils || (window as any)?.__globalAdapter;
                if (fsUtils && typeof fsUtils.getUserDataPath === 'function') {
                    envPath = fsUtils.getUserDataPath();
                }
            } catch (e) {}
        }
        return { api, envPath };
    }

    /**
     * 截图：先用 Cocos 引擎截 RT → OffscreenCanvas 编码 → 写本地临时文件。
     */
    private async captureScreen(width: number, height: number): Promise<string> {
        const probe = this.probePlatform();
        if (!probe.api) throw new Error('找不到 wx/tt');
        if (!probe.envPath) throw new Error('找不到 USER_DATA_PATH');

        const base64 = await this.captureByCocos(width, height);
        const filePath = `${probe.envPath}/share_${Date.now()}.png`;
        return await this.writeBase64(filePath, base64, probe.api);
    }

    /**
     * Cocos 引擎截图：Camera 渲染到 RenderTexture → 读像素
     */
    private async captureByCocos(width: number, height: number): Promise<string> {
        const cocos: any = await import('cc');
        const { RenderTexture, Camera, Color } = cocos;

        const rt = new RenderTexture();
        rt.reset({ width, height });

        const scene = cocos.director.getScene();
        if (!scene) throw new Error('找不到当前场景');
        const camera: any = scene.getComponentInChildren(Camera);
        if (!camera) throw new Error('找不到场景中的 Camera');

        const oldTarget = camera.targetTexture;
        camera.targetTexture = rt;
        camera.clearFlags = 2;
        camera.backgroundColor = new Color(0, 0, 0, 0);

        try { camera.render?.(); } catch (e) {
            cocos.director.root?.frameMove?.(0);
        }
        await new Promise(r => setTimeout(r, 100));

        const pixels = new Uint8Array(width * height * 4);
        rt.readPixels(pixels, width, height);

        camera.targetTexture = oldTarget;
        return await this.encodePNG(pixels, width, height);
    }

    /**
     * RGBA → PNG base64
     */
    private async encodePNG(rgba: Uint8Array, width: number, height: number): Promise<string> {
        const probe = this.probePlatform();
        const api = probe.api;

        let canvas: any;
        if (api?.createOffScreenCanvas) {
            canvas = api.createOffScreenCanvas({ width, height });
        } else if (api?.createOffscreenCanvas) {
            canvas = api.createOffscreenCanvas({ width, height });
        } else if (typeof document !== 'undefined') {
            canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
        } else {
            throw new Error('找不到可用 canvas');
        }

        const ctx = canvas.getContext('2d');
        if (!ctx || typeof ctx.createImageData !== 'function') {
            throw new Error('canvas 2d context 不可用');
        }

        const imageData = ctx.createImageData(width, height);
        imageData.data.set(rgba);
        ctx.putImageData(imageData, 0, 0);

        const dataUrl: string = canvas.toDataURL('image/png');
        return dataUrl.replace(/^data:image\/png;base64,/, '');
    }

    private writeBase64(filePath: string, base64: string, api: any): Promise<string> {
        return new Promise((resolve, reject) => {
            const fs = api?.getFileSystemManager?.();
            if (!fs) return reject(new Error('没有 getFileSystemManager'));
            fs.writeFile({
                filePath,
                data: base64,
                encoding: 'base64',
                success: () => resolve(filePath),
                fail: (err: any) => reject(err),
            });
        });
    }
}