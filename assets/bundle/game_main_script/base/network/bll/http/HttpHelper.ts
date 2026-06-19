import { DEBUG, EDITOR } from 'cc/env';
import { oops } from 'db://oops-framework/core/Oops';
import { PromptEventName } from '../../../prompt/PromptEvent';
import { ResponseStatusEnum } from '../../model/enum/EM_Network';
import { HttpManager } from './HttpManager';

/** 缓存项接口定义 */
interface CacheItem<T> {
    /** 缓存数据 */
    data: T;
    /** 过期时间戳（毫秒） */
    expire: number;
    /** 最后访问时间戳（毫秒） */
    lastAccess: number;
}

/** HTTP请求额外参数接口 */
export interface HttpExtraOptions {
    /** 缓存过期时间（秒） */
    expire?: number;
    /** 是否使用缓存 */
    cache?: boolean;
}

/** 日志参数接口 */
interface LogArgs {
    /** 协议名 */
    name: string;
    /** 请求参数 */
    params: Record<string, unknown> | null;
    /** 返回结果 */
    res: unknown;
    /** 是否使用缓存 */
    useCache: boolean;
}

/** 可触发重试的HTTP请求 */
export class HttpHelper {
    /** 设置一个map 缓存请求结果，在过期时间内，直接返回缓存结果 */
    private static _cache: Map<string, CacheItem<unknown>> = new Map();
    /** 最大缓存数量 */
    private static readonly MAX_CACHE_SIZE = 100;
    /** 定期清理缓存的时间间隔（毫秒） */
    private static readonly CLEANUP_INTERVAL = 60 * 1000;
    /** 定期清理定时器ID */
    private static _cleanupTimer: number | null = null;

    /** 静态初始化块 */
    static {
        // 启动定期清理过期缓存的定时器
        this.startCleanupTimer();
    }

    /**
     * 生成缓存key
     * @param name      协议名
     * @param params    请求参数
     * @returns 缓存key
     */
    private static generateCacheKey(name: string, params: Record<string, unknown> | null): string {
        if (!params) {
            return name;
        }

        // 对参数进行排序后再序列化，确保相同参数不同顺序时生成相同的key
        const sortedParams = Object.keys(params)
            .sort()
            .reduce<Record<string, unknown>>((obj, key) => {
                obj[key] = params[key];
                return obj;
            }, {});

        return `${name}_${JSON.stringify(sortedParams)}`;
    }

    /**
     * POST请求获取Json格式数据
     * @param name      协议名
     * @param params    请求参数据
     * @param extra     额外参数 {expire:过期时间(秒),cache:是否使用缓存}
     * @returns HTTP请求返回值
     */
    static async post<T>(
        name: string,
        params: Record<string, unknown> | null = null,
        extra: HttpExtraOptions | null = null
    ): Promise<T | null> {
        if (extra?.cache) {
            const key = this.generateCacheKey(name, params);
            const cache = this.getCacheData<T>(key);
            if (cache !== null) {
                this.log({ name, params, res: cache, useCache: true });
                return cache;
            }
        }

        interface ResponseData {
            code: number;
            data: T;
        }

        const res = await this.postJson<ResponseData>(name, params);
        this.log({ name, params, res, useCache: false });
        if (res.code === ResponseStatusEnum.SUCCESS) {
            if (extra?.cache && extra.expire) {
                const key = this.generateCacheKey(name, params);
                this.setCacheData<T>(key, res.data, extra.expire);
            }
            return res.data;
        }
        else {
            oops.message.emit(PromptEventName.Alert, {
                content: `错误码: ${res.code}`
            });
            return null;
        }
    }

    /**
     * POST请求获取Json格式数据,返回所有结果,包括错误码
     * @param name      协议名
     * @param params    请求参数据
     * @param extra     额外参数 {expire:过期时间(秒),cache:是否使用缓存}
     * @returns HTTP请求返回值
     */
    static async postWithFullRes<T>(
        name: string,
        params: Record<string, unknown> | null = null,
        extra: HttpExtraOptions | null = null
    ): Promise<T> {
        if (extra?.cache) {
            const key = this.generateCacheKey(name, params);
            const cache = this.getCacheData<T>(key);
            if (cache !== null) {
                this.log({ name, params, res: cache, useCache: true });
                return cache;
            }
        }

        interface ResponseData {
            code: number;
            data: unknown;
        }

        const res = await this.postJson<ResponseData>(name, params);
        this.log({ name, params, res, useCache: false });
        if (res.code === ResponseStatusEnum.SUCCESS) {
            if (extra?.cache && extra.expire) {
                const key = this.generateCacheKey(name, params);
                this.setCacheData<T>(key, res.data as T, extra.expire);
            }
        }
        else {
            oops.message.emit(PromptEventName.Alert, {
                content: `错误码: ${res.code}`
            });
        }
        return res as T;
    }

    /**
     * POST请求获取Json格式数据
     * @param name      协议名
     * @param params    请求参数据
     * @returns HTTP请求返回值
     */
    static async postForm<T>(name: string, params: Record<string, unknown> | null = null): Promise<T | null> {
        interface ResponseData {
            code: number;
            data: T;
            msg?: string;
        }

        const res = await this.postJsonForm<ResponseData>(name, params);
        if (res.code === ResponseStatusEnum.SUCCESS) {
            return res.data;
        }
        else {
            console.error(`${name}协议请求错误，错误码为【${res.code}】,错误原因为【${res.msg ?? '未知错误'}】`);
            return null;
        }
    }

    /**
     * POST请求获取Json格式数据
     * @param name      协议名
     * @param params    请求参数据
     * @returns HTTP请求返回值
     */
    private static async postJson<T>(name: string, params: Record<string, unknown> | null = null): Promise<T> {
        const ret = await HttpManager.instance.postJson<T>(name, params);
        if (ret.isSucc && ret.res) {
            return ret.res;
        }
        else {
            return new Promise<T>((resolve) => {
                oops.message.emit(PromptEventName.NetError, {
                    code: 0,
                    onOk: async () => {
                        resolve(await this.postJson<T>(name, params));
                    }
                });
            });
        }
    }

    /**
     * POST请求获取Json格式数据
     * @param name      协议名
     * @param params    请求参数据
     * @returns HTTP请求返回值
     */
    private static async postJsonForm<T>(name: string, params: Record<string, unknown> | null = null): Promise<T> {
        const ret = await HttpManager.instance.postJsonForm<T>(name, params);
        if (ret.isSucc && ret.res) {
            return ret.res;
        }
        else {
            return new Promise<T>((resolve) => {
                oops.message.emit(PromptEventName.Alert, {
                    content: 'common_net_error',
                    onOk: async () => {
                        resolve(await this.postJsonForm<T>(name, params));
                    }
                });
            });
        }
    }

    /**
     * GET请求获取文本格式数据
     * @param name      协议名
     * @param params    请求参数据
     * @returns HTTP请求返回值
     */
    private static async getText(name: string, params: Record<string, unknown> | null = null): Promise<string> {
        const ret = await HttpManager.instance.getText(name, params);
        if (ret.isSucc && ret.res) {
            return ret.res;
        }
        else {
            return new Promise<string>((resolve) => {
                oops.message.emit(PromptEventName.NetError, {
                    code: 0,
                    onOk: async () => {
                        resolve(await this.getText(name, params));
                    }
                });
            });
        }
    }

    /**
     * GET请求获取Json格式数据
     * @param name      协议名
     * @param params    请求参数据
     * @returns HTTP请求返回值
     */
    private static async getJson<T>(name: string, params: Record<string, unknown> | null = null): Promise<T> {
        const ret = await HttpManager.instance.getJson<T>(name, params);
        if (ret.isSucc && ret.res) {
            return ret.res;
        }
        else {
            return new Promise<T>((resolve) => {
                oops.message.emit(PromptEventName.NetError, {
                    code: 0,
                    onOk: async () => {
                        resolve(await this.getJson<T>(name, params));
                    }
                });
            });
        }
    }

    /** 获取缓存数据 */
    private static getCacheData<T>(name: string): T | null {
        const now = oops.timer.getServerTime();
        const cacheItem = this._cache.get(name);

        if (cacheItem) {
            if (cacheItem.expire > now) {
                // 更新最后访问时间，用于LRU策略
                cacheItem.lastAccess = now;
                return cacheItem.data as T;
            }
            else {
                // 缓存已过期，删除
                this._cache.delete(name);
            }
        }
        return null;
    }

    /** 设置缓存数据 */
    private static setCacheData<T>(name: string, data: T, expire: number): void {
        const now = oops.timer.getServerTime();

        // 检查是否需要移除旧缓存（LRU策略）
        if (this._cache.size >= this.MAX_CACHE_SIZE) {
            this.removeLeastRecentlyUsed();
        }

        this._cache.set(name, {
            data,
            expire: expire * 1000 + now,
            lastAccess: now,
        });
    }

    /**
     * 清除缓存数据
     * @param name 缓存key或部分key
     */
    static clearCacheData(name: string): void {
        // 有name直接清除
        if (this._cache.has(name)) {
            this._cache.delete(name);
            return;
        }
        // 没有则清除所有key中包含name的缓存数据
        const keysToDelete: string[] = [];
        for (const key of this._cache.keys()) {
            if (key.includes(name)) {
                keysToDelete.push(key);
            }
        }
        // 批量删除，避免在迭代过程中修改Map
        for (const key of keysToDelete) {
            this._cache.delete(key);
        }
    }

    /** 清除所有缓存数据 */
    static clearAllCacheData(): void {
        this._cache.clear();
    }

    /**
     * 停止定期清理定时器（用于销毁时清理资源）
     */
    static stopCleanupTimer(): void {
        if (this._cleanupTimer !== null) {
            window.clearInterval(this._cleanupTimer);
            this._cleanupTimer = null;
        }
    }

    /**
     * 移除最久未使用的缓存项（LRU策略）
     */
    private static removeLeastRecentlyUsed(): void {
        let oldestKey: string | null = null;
        let oldestTime: number = Number.MAX_SAFE_INTEGER;

        // 查找最久未使用的缓存项
        for (const [key, cacheItem] of this._cache) {
            if (cacheItem.lastAccess < oldestTime) {
                oldestTime = cacheItem.lastAccess;
                oldestKey = key;
            }
        }

        // 移除最久未使用的缓存项
        if (oldestKey) {
            this._cache.delete(oldestKey);
        }
    }

    /**
     * 启动定期清理缓存的定时器
     */
    private static startCleanupTimer(): void {
        if (EDITOR) return;

        if (this._cleanupTimer === null) {
            this._cleanupTimer = window.setInterval(() => {
                this.cleanupExpiredCache();
            }, this.CLEANUP_INTERVAL);
        }
    }

    /**
     * 清理过期的缓存项
     */
    private static cleanupExpiredCache(): void {
        const now = oops.timer.getServerTime();
        let deletedCount = 0;

        for (const [key, cacheItem] of this._cache) {
            if (cacheItem.expire <= now) {
                this._cache.delete(key);
                deletedCount++;
            }
        }

        if (deletedCount > 0 && DEBUG) {
            console.log(`清理了 ${deletedCount} 个过期缓存项`);
        }
    }

    /**
     * 打印日志
     * @param args 日志参数
     */
    static log(args: LogArgs): void {
        if (!DEBUG) return;

        let msg = '';
        if (args.useCache) {
            msg = '【使用缓存】:\n';
        }
        msg +=
            `【请求地址】:${HttpManager.instance.server + args.name}\n` +
            `【Token】:${HttpManager.instance.getToken()}\n` +
            `【请求参数】:${JSON.stringify(args.params)}\n` +
            `【返回结果】:${JSON.stringify(args.res)}`;
        console.log(msg);
    }
}
