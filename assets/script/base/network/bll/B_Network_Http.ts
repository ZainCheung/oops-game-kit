import { ecs } from 'db://oops-framework/libs/ecs/ECS';
import { CCBusiness } from 'db://oops-framework/module/common/CCBusiness';
import type { HttpExtraOptions } from './http/HttpHelper';
import { HttpHelper } from './http/HttpHelper';
import type { Network } from '../Network';

/** HTTP 网络业务逻辑 */
@ecs.register('B_Network_Http')
export class B_Network_Http extends CCBusiness<Network> {
    /**
     * POST 请求获取业务数据
     * @param name   协议名
     * @param params 请求参数
     * @param extra  额外参数
     */
    post<T>(
        name: string,
        params: Record<string, unknown> | null = null,
        extra: HttpExtraOptions | null = null
    ): Promise<T | null> {
        return HttpHelper.post<T>(name, params, extra);
    }

    /**
     * POST 请求获取完整响应
     * @param name   协议名
     * @param params 请求参数
     * @param extra  额外参数
     */
    postWithFullRes<T>(
        name: string,
        params: Record<string, unknown> | null = null,
        extra: HttpExtraOptions | null = null
    ): Promise<T> {
        return HttpHelper.postWithFullRes<T>(name, params, extra);
    }

    /**
     * 表单 POST 请求
     * @param name   协议名
     * @param params 请求参数
     */
    postForm<T>(name: string, params: Record<string, unknown> | null = null): Promise<T | null> {
        return HttpHelper.postForm<T>(name, params);
    }

    /** 清除指定缓存 */
    clearCacheData(name: string): void {
        HttpHelper.clearCacheData(name);
    }

    /** 清除所有缓存 */
    clearAllCacheData(): void {
        HttpHelper.clearAllCacheData();
    }
}
