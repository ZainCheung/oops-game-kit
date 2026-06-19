import { oops } from 'db://oops-framework/core/Oops';

/** HTTP请求返回值 */
export class HttpReturn<T> {
    /** 是否请求成功 */
    isSucc = false;
    /** 请求返回数据 */
    res?: T;
    /** 请求错误数据 */
    err?: HttpEvent;
}

/** 请求事件 */
export enum HttpEvent {
    /** 断网 */
    ERROR_NO_NETWORK = 'ERROR_NO_NETWORK',
    /** 未知错误 */
    ERROR_UNKNOWN = 'ERROR_UNKNOWN',
    /** 请求超时 */
    ERROR_TIMEOUT = 'ERROR_TIMEOUT'
}

/** 请求后相应返回数据类型 */
enum HttpResponseType {
    Text,
    Json,
    ArrayBuffer,
    Blob,
    FormData
}

/** 请求方法 */
enum HttpMethod {
    GET = 'GET',
    POST = 'POST'
}

const HeaderName = 'Content-Type';
const HeaderValueText = 'application/text';
const HeaderValueJson = 'application/json';
const HeaderValueForm = 'application/x-www-form-urlencoded';

interface HttpRequestData {
    /** 请求对象 */
    xhr: XMLHttpRequest;
    /** 请求参数字符串 */
    pss: string;
    /** 网络过慢定时器编号 */
    timerId: number;
}

/** 当前请求地址集合 */
const urls: Map<string, HttpRequestData> = new Map();

/**
 * HTTP请求
 * 1. 支持GET、POST请求
 * 2. 支持文本、Json格式数据
 * 3. 支持超时设置
 * 4. 支持授权码
 * 5. 支持取消请求
 * 6. 支持同一协议点连重复请求
 */
export class HttpManager {
    private static _instance: HttpManager;
    static get instance(): HttpManager {
        if (!this._instance) {
            this._instance = new HttpManager();
            this._instance.server = oops.config.game.httpServer;
            this._instance.timeout = oops.config.game.httpTimeout;
        }
        return this._instance;
    }

    /** 服务器地址 */
    server = 'http://127.0.0.1/';
    /** 请求超时(毫秒) */
    timeout = 10000;
    /** 请求时间超过指定值自动提示(毫秒) */
    latency = 1000;

    private authorizationHeaderName = '';
    private authorizationheaderValueText = '';

    /** 获取授权码 */
    getToken(): string {
        return this.authorizationheaderValueText;
    }

    /** 设置授权信息 */
    setAuthorization(headerName: string, headerValueText: string): void {
        this.authorizationHeaderName = headerName;
        this.authorizationheaderValueText = headerValueText;
    }

    /**
     * GET请求获取文本格式数据
     * @param name      协议名
     * @param params    请求参数据
     * @returns HTTP请求返回值
     */
    getText(name: string, params: Record<string, unknown> | null = null): Promise<HttpReturn<string>> {
        const headers: Map<string, string> = new Map();
        headers.set(HeaderName, HeaderValueText);
        return this.request(name, params, HttpMethod.GET, HttpResponseType.Text, headers);
    }

    /**
     * GET请求获取Json格式数据
     * @param name      协议名
     * @param params    请求参数据
     * @returns HTTP请求返回值
     */
    getJson<T>(name: string, params: Record<string, unknown> | null = null): Promise<HttpReturn<T>> {
        const headers: Map<string, string> = new Map();
        headers.set(HeaderName, HeaderValueJson);
        return this.request<T>(name, params, HttpMethod.GET, HttpResponseType.Json, headers);
    }

    /**
     * POST请求获取Json格式数据
     * @param name      协议名
     * @param params    请求参数据
     * @returns HTTP请求返回值
     */
    postJson<T>(name: string, params: Record<string, unknown> | null = null): Promise<HttpReturn<T>> {
        const headers: Map<string, string> = new Map();
        if (this.authorizationheaderValueText) {
            headers.set(this.authorizationHeaderName, this.authorizationheaderValueText);
        }
        headers.set(HeaderName, HeaderValueJson);
        return this.request<T>(name, params, HttpMethod.POST, HttpResponseType.Json, headers);
    }


    /**
     * 表单方式POST请求获取Json格式数据
     * @param name      协议名
     * @param params    请求参数据
     * @returns HTTP请求返回值
     */
    postJsonForm<T>(name: string, params: Record<string, unknown> | null = null): Promise<HttpReturn<T>> {
        const headers: Map<string, string> = new Map();
        headers.set(HeaderName, HeaderValueForm);
        if (this.authorizationheaderValueText) {
            headers.set(this.authorizationHeaderName, this.authorizationheaderValueText);
        }
        return this.request<T>(name, params, HttpMethod.POST, HttpResponseType.FormData, headers);
    }

    /**
     * 取消请求中的请求
     * @param name      请求命令
     * @param params    请求参数
     */
    abort(name: string, params: Record<string, unknown> | null): void {
        const r = this.getRequestStr(name, params);
        const key: string = r[1];
        const data = urls.get(key);
        if (data) {
            data.xhr.abort();
            // 清理资源
            this.requestComplete(key, data.timerId);
        }
    }

    /**
     * 请求处理
     * @param name      请求命令
     * @param params    请求参数
     * @param method    请求方式
     * @param type      响应数据类型
     * @param headers   请求头信息
     * @returns
     */
    request<T>(name: string, params: Record<string, unknown> | null, method: HttpMethod, type: HttpResponseType, headers: Map<string, string>): Promise<HttpReturn<T>> {
        return new Promise((resolve) => {
            const r = this.getRequestStr(name, params, type);
            const url: string = r[0];
            const key: string = r[1];
            const pss: string = r[2];

            const hrd = urls.get(key);
            if (hrd && hrd.pss === pss) {
                console.warn(`地址【${key}】已正在请求中，不能重复请求`);
                return;
            }

            const xhr = new XMLHttpRequest();

            // 防重复请求功能
            const timerId = window.setTimeout(this.onLatency, this.latency);
            urls.set(key, { xhr, pss, timerId });

            if (method === HttpMethod.POST) {
                xhr.open(HttpMethod.POST, url);
            }
            else {
                xhr.open(HttpMethod.GET, key);
            }

            // 添加自定义请求头信息
            for (const [headerKey, value] of headers) {
                xhr.setRequestHeader(headerKey, value);
            }

            // 响应结果
            const ret = new HttpReturn<T>();

            // 请求超时
            xhr.timeout = this.timeout;
            xhr.ontimeout = () => {
                this.requestComplete(key, timerId);

                ret.isSucc = false;
                ret.err = HttpEvent.ERROR_TIMEOUT; // 超时
                resolve(ret);
            };
            xhr.onloadend = () => {
                if (xhr.status === 500) {
                    this.requestComplete(key, timerId);

                    ret.isSucc = false;
                    ret.err = HttpEvent.ERROR_NO_NETWORK; // 断网
                    resolve(ret);
                }
            };
            xhr.onerror = () => {
                this.requestComplete(key, timerId);

                ret.isSucc = false;
                if (xhr.readyState === 0 || xhr.readyState === 1 || xhr.status === 0) {
                    ret.err = HttpEvent.ERROR_NO_NETWORK; // 断网
                }
                else {
                    ret.err = HttpEvent.ERROR_UNKNOWN; // 未知错误
                }
                resolve(ret);
            };
            xhr.onreadystatechange = () => {
                if (xhr.readyState !== 4) return;

                this.requestComplete(key, timerId);

                if (xhr.status === 200) {
                    switch (type) {
                        case HttpResponseType.Text:
                            ret.res = xhr.response as T;
                            break;
                        case HttpResponseType.Json:
                            ret.res = JSON.parse(xhr.response) as T;
                            break;
                        case HttpResponseType.ArrayBuffer:
                            ret.res = xhr.response as T;
                            break;
                        case HttpResponseType.Blob:
                            ret.res = xhr.response as T;
                            break;
                        case HttpResponseType.FormData:
                            ret.res = JSON.parse(xhr.response) as T;
                            break;
                    }

                    ret.isSucc = true;
                    resolve(ret);
                }
            };

            // 发送请求
            if (params === null) {
                xhr.send();
            }
            else {
                switch (type) {
                    case HttpResponseType.FormData:
                        xhr.send(pss);
                        break;
                    default:
                        const posParams = JSON.stringify(params);
                        xhr.send(posParams);
                        break;
                }
            }
        });
    }

    /** 请求超时提示 */
    private onLatency(): void {
        oops.gui.waitOpen();
    }

    /**
     * 请求完成
     * @param key       请求的key
     * @param timerId   超时定时器编号
     */
    private requestComplete(key: string, timerId: number): void {
        window.clearTimeout(timerId);
        urls.delete(key);
    }

    /**
     * 获取请求字符串
     * @param name      请求命令
     * @param params    请求参数
     * @returns
     */
    private getRequestStr(name: string, params: Record<string, unknown> | null, type?: HttpResponseType): [string, string, string] {
        let url = '';
        let key = '';
        let paramsStr = '';

        if (name.toLocaleLowerCase().indexOf('http') === 0) {
            url = name;
        }
        else {
            url = this.server + name;
        }

        if (params) {
            paramsStr = JSON.stringify(params);
            if (url.indexOf('?') > -1) {
                key = url + '&' + paramsStr;
            }
            else {
                key = url + '?' + paramsStr;
            }

            if (type === HttpResponseType.FormData) {
                const paramArray: string[] = [];
                // 遍历params 对象，拼接成字符串数组
                for (const k in params) {
                    if (Object.prototype.hasOwnProperty.call(params, k)) {
                        const element = params[k];
                        paramArray.push(`${k}=${String(element)}`);
                    }
                }
                paramsStr = paramArray.join('&');
                key = url + '?' + paramsStr;
            }
        }
        else {
            key = url;
        }
        return [url, key, paramsStr];
    }
}
