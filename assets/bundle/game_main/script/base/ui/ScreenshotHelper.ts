/**
 * 通用截图工具类
 *
 * 支持：
 *  1. Web / 编辑器：canvas.toDataURL() 直接获取 base64
 *  2. 微信 / 抖音小游戏：canvas.toTempFilePathSync() + SDK readFileAsBase64()
 *  3. 原生平台：RenderTexture + readPixels() + png 编码
 *
 * 返回：base64 字符串（不带 dataURL 前缀），失败返回空串
 */

import { Camera, director, gfx, RenderTexture, view } from 'cc';

export interface ICaptureOption {
    /** 缩放比例，默认 0.5 */
    scale?: number;
    /** 导出图片格式，默认 png */
    fileType?: string;
    /** 导出图片质量，默认 1 */
    quality?: number;
}

/** 读取本地文件为 base64 的 SDK 能力（微信 / 抖音小游戏） */
export type ReadFileAsBase64Fn = (option: { path: string }) => Promise<string>;

export class ScreenshotHelper {
    /**
     * 截取当前画面并返回 base64 字符串。
     * @param readFileAsBase64 小游戏平台读取文件的 SDK 方法
     */
    static async capture(
        readFileAsBase64?: ReadFileAsBase64Fn,
        option?: ICaptureOption
    ): Promise<string> {
        // 1. Web / 编辑器：toDataURL 直接出 base64
        const canvas = (globalThis as any).canvas || (GameGlobal as any)?.canvas;
        if (canvas?.toDataURL) {
            try {
                const fileType = option?.fileType ?? 'png';
                const quality = option?.quality ?? 1;
                const dataURL = canvas.toDataURL(`image/${fileType}`, quality);
                const base64 = dataURL.replace(/^data:image\/\w+;base64,/, '');
                console.log('[ScreenshotHelper] 截图完成 (toDataURL)');
                return base64;
            }
            catch (err) {
                console.error('[ScreenshotHelper] toDataURL 截图失败', err);
            }
        }

        // 2. 微信 / 抖音小游戏：toTempFilePathSync + readFileAsBase64
        if (canvas?.toTempFilePathSync && readFileAsBase64) {
            return this.captureByTempFile(canvas, readFileAsBase64, option);
        }

        // 3. 原生平台：RenderTexture + readPixels
        try {
            return this.captureByRenderTexture(option);
        }
        catch (err) {
            console.error('[ScreenshotHelper] RenderTexture 截图失败', err);
        }

        console.warn('[ScreenshotHelper] 当前平台不支持截图');
        return '';
    }

    /** 小游戏截图：toTempFilePathSync + readFileAsBase64 */
    private static async captureByTempFile(
        canvas: any,
        readFileAsBase64: ReadFileAsBase64Fn,
        option?: ICaptureOption
    ): Promise<string> {
        const scale = option?.scale ?? 0.5;
        const fileType = option?.fileType ?? 'png';
        const quality = option?.quality ?? 1;

        const { width: srcW, height: srcH } = this.getCanvasSize(canvas);
        if (!srcW || !srcH) {
            console.warn('[ScreenshotHelper] canvas 尺寸异常:', srcW, srcH);
            return '';
        }

        const destW = Math.max(1, Math.round(srcW * scale));
        const destH = Math.max(1, Math.round(srcH * scale));

        try {
            const tempPath = canvas.toTempFilePathSync({
                x: 0,
                y: 0,
                width: srcW,
                height: srcH,
                destWidth: destW,
                destHeight: destH,
                fileType,
                quality,
            });

            if (!tempPath) {
                console.warn('[ScreenshotHelper] 截图失败');
                return '';
            }

            console.log(`[ScreenshotHelper] 截图完成: ${srcW}x${srcH} -> ${destW}x${destH}`);
            return readFileAsBase64({ path: tempPath });
        }
        catch (err) {
            console.error('[ScreenshotHelper] toTempFilePathSync 异常', err);
            return '';
        }
    }

    /** 原生平台截图：RenderTexture + readPixels + png 编码 */
    private static async captureByRenderTexture(option?: ICaptureOption): Promise<string> {
        const scale = option?.scale ?? 0.5;
        const fileType = option?.fileType ?? 'png';

        if (fileType !== 'png') {
            console.warn('[ScreenshotHelper] 原生平台目前仅支持 png 输出');
        }

        const visibleSize = view.getVisibleSize();
        const srcW = visibleSize.width;
        const srcH = visibleSize.height;
        if (!srcW || !srcH) {
            console.warn('[ScreenshotHelper] 游戏画面尺寸异常:', srcW, srcH);
            return '';
        }

        const width = Math.max(1, Math.round(srcW * scale));
        const height = Math.max(1, Math.round(srcH * scale));

        const renderTexture = new RenderTexture();
        const colorAttachment = new gfx.ColorAttachment();
        const depthStencilAttachment = new gfx.DepthStencilAttachment();
        const passInfo = new gfx.RenderPassInfo([colorAttachment], depthStencilAttachment);
        renderTexture.reset({
            width,
            height,
            passInfo,
        });

        const camera = this.findMainCamera();
        if (!camera) {
            console.warn('[ScreenshotHelper] 找不到主相机');
            return '';
        }

        const oldTargetTexture = camera.targetTexture;
        camera.targetTexture = renderTexture;

        // 等一帧让相机渲染到 RenderTexture
        await this.nextFrame();

        camera.targetTexture = oldTargetTexture;

        // readPixels() 返回 Uint8Array（RGBA 原始像素数据）
        const pixels = renderTexture.readPixels();
        if (!pixels || pixels.length === 0) {
            console.warn('[ScreenshotHelper] readPixels 失败');
            return '';
        }

        const pngBytes = this.encodePng(width, height, pixels);
        if (pngBytes.length === 0) {
            return '';
        }

        const base64 = this.uint8ArrayToBase64(pngBytes);
        console.log(`[ScreenshotHelper] 截图完成 (RenderTexture): ${width}x${height}`);
        return base64;
    }

    /** 查找场景中的主相机 */
    private static findMainCamera(): Camera | null {
        const scene = director.getScene();
        if (!scene) return null;

        const cameras: Camera[] = [];
        this.walkNode(scene, (node) => {
            const comp = node.getComponent(Camera);
            if (comp) cameras.push(comp);
        });

        // 优先返回优先级高的相机
        return cameras.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0))[0] ?? null;
    }

    private static walkNode(node: any, callback: (node: any) => void): void {
        callback(node);
        const children = node.children ?? [];
        for (const child of children) {
            this.walkNode(child, callback);
        }
    }

    /** 获取 canvas 尺寸 */
    private static getCanvasSize(canvas: any): { width: number; height: number } {
        return { width: canvas?.width || 0, height: canvas?.height || 0 };
    }

    /** Uint8Array 转 base64 */
    private static uint8ArrayToBase64(uint8Array: Uint8Array): string {
        let binary = '';
        for (let i = 0; i < uint8Array.byteLength; i++) {
            binary += String.fromCharCode(uint8Array[i]);
        }
        return this.btoa(binary);
    }

    private static btoa(binary: string): string {
        if (typeof window !== 'undefined' && window.btoa) {
            return window.btoa(binary);
        }
        return this.btoaPolyfill(binary);
    }

    private static btoaPolyfill(binary: string): string {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
        let output = '';
        let i = 0;
        while (i < binary.length) {
            const byte1 = binary.charCodeAt(i++);
            const byte2 = binary.charCodeAt(i++);
            const byte3 = binary.charCodeAt(i++);
            const enc1 = byte1 >> 2;
            const enc2 = ((byte1 & 3) << 4) | (byte2 >> 4);
            let enc3 = ((byte2 & 15) << 2) | (byte3 >> 6);
            let enc4 = byte3 & 63;
            if (isNaN(byte2)) {
                enc3 = enc4 = 64;
            }
            else if (isNaN(byte3)) {
                enc4 = 64;
            }
            output += chars.charAt(enc1) + chars.charAt(enc2) + chars.charAt(enc3) + chars.charAt(enc4);
        }
        return output;
    }

    /** 将 RGBA 像素数据编码为 PNG 格式（纯 JS 实现，全平台通用） */
    private static encodePng(width: number, height: number, rgba: Uint8Array): Uint8Array {
        // PNG 签名
        const signature = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);

        // IHDR chunk
        const ihdrData = new Uint8Array(13);
        const dv = new DataView(ihdrData.buffer);
        dv.setUint32(0, width);
        dv.setUint32(4, height);
        ihdrData[8] = 8; // bit depth
        ihdrData[9] = 6; // color type: RGBA
        ihdrData[10] = 0; // compression
        ihdrData[11] = 0; // filter
        ihdrData[12] = 0; // interlace
        const ihdr = this.makePngChunk(0x49484452, ihdrData);

        // IDAT chunk: 每行加 filter byte 0，然后 deflate 压缩
        const rawData = new Uint8Array(height * (1 + width * 4));
        for (let y = 0; y < height; y++) {
            rawData[y * (1 + width * 4)] = 0; // filter: None
            const srcOffset = y * width * 4;
            const dstOffset = y * (1 + width * 4) + 1;
            for (let i = 0; i < width * 4; i++) {
                rawData[dstOffset + i] = rgba[srcOffset + i];
            }
        }

        const compressed = this.deflateRaw(rawData);
        const idat = this.makePngChunk(0x49444154, compressed);

        // IEND chunk
        const iend = this.makePngChunk(0x49454E44, new Uint8Array(0));

        // 拼接
        const totalLen = signature.length + ihdr.length + idat.length + iend.length;
        const result = new Uint8Array(totalLen);
        let offset = 0;
        result.set(signature, offset); offset += signature.length;
        result.set(ihdr, offset); offset += ihdr.length;
        result.set(idat, offset); offset += idat.length;
        result.set(iend, offset);

        return result;
    }

    /** 构建 PNG chunk: length(4) + type(4) + data + crc(4) */
    private static makePngChunk(type: number, data: Uint8Array): Uint8Array {
        const len = data.length;
        const chunk = new Uint8Array(12 + len);
        const dv = new DataView(chunk.buffer);

        dv.setUint32(0, len);
        dv.setUint32(4, type);
        chunk.set(data, 8);

        // CRC 覆盖 type + data
        const crcInput = new Uint8Array(4 + len);
        const typeBytes = new Uint8Array(4);
        new DataView(typeBytes.buffer).setUint32(0, type);
        crcInput.set(typeBytes, 0);
        crcInput.set(data, 4);
        const crcVal = this.crc32(crcInput);
        dv.setUint32(8 + len, crcVal);

        return chunk;
    }

    /** CRC32 计算 */
    private static crc32(data: Uint8Array): number {
        let crc = 0xFFFFFFFF;
        for (let i = 0; i < data.length; i++) {
            crc ^= data[i];
            for (let j = 0; j < 8; j++) {
                crc = (crc >>> 1) ^ (crc & 1 ? 0xEDB88320 : 0);
            }
        }
        return (crc ^ 0xFFFFFFFF) >>> 0;
    }

    /** 简易 deflate 压缩（stored block，无压缩，PNG 合法） */
    private static deflateRaw(data: Uint8Array): Uint8Array {
        const maxBlock = 65535;
        const numBlocks = Math.ceil(data.length / maxBlock) || 1;
        // 每个存储块: header(5) + data
        let totalSize = 0;
        for (let i = 0; i < numBlocks; i++) {
            const start = i * maxBlock;
            const end = Math.min(start + maxBlock, data.length);
            totalSize += 5 + (end - start);
        }

        const result = new Uint8Array(totalSize);
        let offset = 0;

        for (let i = 0; i < numBlocks; i++) {
            const start = i * maxBlock;
            const end = Math.min(start + maxBlock, data.length);
            const blockLen = end - start;
            const isLast = i === numBlocks - 1;

            const dv = new DataView(result.buffer, offset, 5);
            dv.setUint8(0, isLast ? 1 : 0); // BFINAL + BTYPE=00 (stored)
            dv.setUint16(1, blockLen, true); // LEN
            dv.setUint16(3, blockLen ^ 0xFFFF, true); // NLEN

            result.set(data.slice(start, end), offset + 5);
            offset += 5 + blockLen;
        }

        return result;
    }

    /** 等待下一帧渲染完成 */
    private static nextFrame(): Promise<void> {
        return new Promise<void>(resolve => {
            director.once('director_after_draw', resolve);
        });
    }
}
