import * as __WEBPACK_EXTERNAL_MODULE_cc__ from "cc";
/******/ var __webpack_modules__ = ({

/***/ "./src/sdk/Sdk.ts"
/*!************************!*\
  !*** ./src/sdk/Sdk.ts ***!
  \************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Sdk: () => (/* binding */ Sdk)
/* harmony export */ });
/* harmony import */ var _SdkManager__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./SdkManager */ "./src/sdk/SdkManager.ts");

/**
 * 平台 SDK 单例模块
 *
 * 不再依赖 ECS，改为普通单例类。通过 {@link Sdk.instance} 获取全局唯一实例。
 *
 * 外部访问方式：
 * - `gsm.base.sdk.platformSdk`    当前平台 SDK 实现接口
 * - `gsm.base.sdk.token`          SDK 登录凭证
 * - `gsm.base.sdk.userInfo`       用户信息
 *
 * 事件回调注册：
 * - `gsm.base.sdk.onShow(cb)`      注册切到前台回调
 * - `gsm.base.sdk.onHide(cb)`     注册切到后台回调
 * - `gsm.base.sdk.onError(cb)`     注册全局错误回调
 * - `gsm.base.sdk.onNetworkChange(cb)` 注册网络状态变化回调
 */
class Sdk {
    constructor() {
        // ==================== 平台 SDK 实现 ====================
        /** SDK 管理器 */
        this.manager = new _SdkManager__WEBPACK_IMPORTED_MODULE_0__.SdkManager();
        /** 当前平台的 SDK 实现接口 */
        this.platform = this.manager.init();
        // ==================== 数据模型（扁平） ====================
        /** SDK 登录凭证 */
        this.token = null;
        /** 用户信息（昵称、头像等，登录授权后填充） */
        this.userInfo = null;
        /** 是否从抖音侧边栏进入游戏 */
        this.isFromBytedanceSideBar = false;
        /** 是否已领取过抖音侧边栏进入奖励 */
        this.isByteDanceGetSideReward = false;
        /** 注册的切到前台回调列表 */
        this.showCallbacks = [];
        /** 注册的切到后台回调列表 */
        this.hideCallbacks = [];
        /** 注册的全局错误回调列表 */
        this.errorCallbacks = [];
        /** 注册的网络状态变化回调列表 */
        this.networkChangeCallbacks = [];
        this.initEvents();
    }
    initEvents() {
        console.log(`[SDK] 平台 = ${this.manager.platform}, 准备就绪 = ${this.platform.isReady()}`);
        // 转发原生事件到注册的回调
        this.onShowCb = (res) => {
            // 抖音侧边栏进入检测：launch_from == 'homepage' && location == 'sidebar_card'
            if (res && res.launch_from === 'homepage' && res.location === 'sidebar_card') {
                this.isFromBytedanceSideBar = true;
            }
            this.showCallbacks.forEach(cb => cb(res));
        };
        this.platform.onShow(this.onShowCb);
        this.onHideCb = () => this.hideCallbacks.forEach(cb => cb());
        this.platform.onHide(this.onHideCb);
        this.onErrorCb = (err) => this.errorCallbacks.forEach(cb => cb(err));
        this.platform.onError(this.onErrorCb);
        this.onNetworkChangeCb = (res) => this.networkChangeCallbacks.forEach(cb => cb(res));
        this.platform.onNetworkStatusChange(this.onNetworkChangeCb);
    }
    /** 重置模型数据 */
    reset() {
        this.token = null;
        this.userInfo = null;
        this.isFromBytedanceSideBar = false;
        this.isByteDanceGetSideReward = false;
    }
    //#region ========== 事件回调注册/注销 ==========
    /**
     * 批量注册事件回调
     * @param callbacks 回调集合
     */
    on(callbacks) {
        if (callbacks.onShow)
            this.showCallbacks.push(callbacks.onShow);
        if (callbacks.onHide)
            this.hideCallbacks.push(callbacks.onHide);
        if (callbacks.onError)
            this.errorCallbacks.push(callbacks.onError);
        if (callbacks.onNetworkChange)
            this.networkChangeCallbacks.push(callbacks.onNetworkChange);
    }
    /**
     * 批量注销事件回调
     * @param callbacks 回调集合
     */
    off(callbacks) {
        if (callbacks.onShow)
            this.offShow(callbacks.onShow);
        if (callbacks.onHide)
            this.offHide(callbacks.onHide);
        if (callbacks.onError)
            this.offError(callbacks.onError);
        if (callbacks.onNetworkChange)
            this.offNetworkChange(callbacks.onNetworkChange);
    }
    /** 注册切到前台回调 */
    onShow(callback) {
        this.showCallbacks.push(callback);
    }
    /** 注销切到前台回调 */
    offShow(callback) {
        if (callback) {
            const idx = this.showCallbacks.indexOf(callback);
            if (idx !== -1)
                this.showCallbacks.splice(idx, 1);
        }
        else {
            this.showCallbacks.length = 0;
        }
    }
    /** 注册切到后台回调 */
    onHide(callback) {
        this.hideCallbacks.push(callback);
    }
    /** 注销切到后台回调 */
    offHide(callback) {
        if (callback) {
            const idx = this.hideCallbacks.indexOf(callback);
            if (idx !== -1)
                this.hideCallbacks.splice(idx, 1);
        }
        else {
            this.hideCallbacks.length = 0;
        }
    }
    /** 注册全局错误回调 */
    onError(callback) {
        this.errorCallbacks.push(callback);
    }
    /** 注销全局错误回调 */
    offError(callback) {
        if (callback) {
            const idx = this.errorCallbacks.indexOf(callback);
            if (idx !== -1)
                this.errorCallbacks.splice(idx, 1);
        }
        else {
            this.errorCallbacks.length = 0;
        }
    }
    /** 注册网络状态变化回调 */
    onNetworkChange(callback) {
        this.networkChangeCallbacks.push(callback);
    }
    /** 注销网络状态变化回调 */
    offNetworkChange(callback) {
        if (callback) {
            const idx = this.networkChangeCallbacks.indexOf(callback);
            if (idx !== -1)
                this.networkChangeCallbacks.splice(idx, 1);
        }
        else {
            this.networkChangeCallbacks.length = 0;
        }
    }
    //#endregion
    /** 销毁，解绑原生事件并释放广告资源 */
    destroy() {
        if (this.onShowCb)
            this.platform.offShow(this.onShowCb);
        if (this.onHideCb)
            this.platform.offHide(this.onHideCb);
        if (this.onErrorCb)
            this.platform.offError(this.onErrorCb);
        if (this.onNetworkChangeCb)
            this.platform.offNetworkStatusChange(this.onNetworkChangeCb);
        this.onShowCb = this.onHideCb = this.onErrorCb = this.onNetworkChangeCb = undefined;
        this.showCallbacks.length = 0;
        this.hideCallbacks.length = 0;
        this.errorCallbacks.length = 0;
        this.networkChangeCallbacks.length = 0;
        this.manager.destroy();
    }
}


/***/ },

/***/ "./src/sdk/SdkManager.ts"
/*!*******************************!*\
  !*** ./src/sdk/SdkManager.ts ***!
  \*******************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   SdkManager: () => (/* binding */ SdkManager)
/* harmony export */ });
/* harmony import */ var cc__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! cc */ "cc");
/* harmony import */ var _minigame__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./minigame */ "./src/sdk/minigame/index.ts");


/**
 * SDK 管理器
 *
 * 职责：
 * 1. 自动识别当前运行平台，并创建对应的 {@link ISdk} 实现。
 * 2. 提供统一的访问入口 {@link getSdk} / {@link platform}。
 *
 * 平台识别策略：
 * - 通过 Cocos 的 `sys.platform`（`sys.Platform` 枚举）判断当前运行平台，
 *   覆盖编辑器/浏览器/各小游戏/原生全场景。
 * - 未匹配到支持的平台时回退到 {@link DefaultSdk}（空实现，方法会 reject）。
 */
class SdkManager {
    constructor() {
        /** 当前平台实现 */
        this._sdk = null;
        /** 当前平台类型 */
        this._platform = cc__WEBPACK_IMPORTED_MODULE_0__.sys.Platform.EDITOR;
    }
    /**
     * 初始化 SDK 管理器（探测平台并创建实例）
     * 通常在游戏启动时调用一次。
     */
    init() {
        if (this._sdk)
            return this._sdk;
        this._platform = cc__WEBPACK_IMPORTED_MODULE_0__.sys.platform;
        this._sdk = this.createSdk(this._platform);
        return this._sdk;
    }
    /**
     * 根据平台类型创建对应的 SDK 实例
     *
     * 未知平台回退到 {@link DefaultSdk}（EDITOR）。
     */
    createSdk(platform) {
        switch (platform) {
            case cc__WEBPACK_IMPORTED_MODULE_0__.sys.Platform.WECHAT_GAME:
                return new _minigame__WEBPACK_IMPORTED_MODULE_1__.WeChatMiniGameSdk();
            case cc__WEBPACK_IMPORTED_MODULE_0__.sys.Platform.BYTEDANCE_MINI_GAME:
                return new _minigame__WEBPACK_IMPORTED_MODULE_1__.DouYinMiniGameSdk();
            case cc__WEBPACK_IMPORTED_MODULE_0__.sys.Platform.MOBILE_BROWSER:
            case cc__WEBPACK_IMPORTED_MODULE_0__.sys.Platform.DESKTOP_BROWSER:
            case cc__WEBPACK_IMPORTED_MODULE_0__.sys.Platform.EDITOR:
                return new _minigame__WEBPACK_IMPORTED_MODULE_1__.DefaultSdk(platform);
            default:
                return new _minigame__WEBPACK_IMPORTED_MODULE_1__.DefaultSdk(cc__WEBPACK_IMPORTED_MODULE_0__.sys.Platform.EDITOR);
        }
    }
    /**
     * 获取当前平台的 SDK 实现接口
     * （若未调用 init，会自动调用一次）
     */
    getSdk() {
        if (!this._sdk)
            this.init();
        return this._sdk;
    }
    /** 当前平台枚举 */
    get platform() {
        if (!this._sdk)
            this.init();
        return this._platform;
    }
    /** 当前 SDK 是否已就绪 */
    isReady() {
        return this.getSdk().isReady();
    }
    /**
     * 释放 SDK 管理器资源
     *
     * 清空当前平台引用，便于重新初始化或模块卸载时调用。
     */
    destroy() {
        this._sdk = null;
        this._platform = cc__WEBPACK_IMPORTED_MODULE_0__.sys.Platform.EDITOR;
    }
}


/***/ },

/***/ "./src/sdk/minigame/DefaultSdk.ts"
/*!****************************************!*\
  !*** ./src/sdk/minigame/DefaultSdk.ts ***!
  \****************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   DefaultSdk: () => (/* binding */ DefaultSdk)
/* harmony export */ });
/**
 * 默认 SDK 实现（空实现）
 *
 * 用于非小游戏平台（H5/编辑器/PC 预览）兜底。
 * 所有异步方法返回 reject（提示该能力在当前平台不支持），
 * 同步方法返回空值，事件监听为空操作。
 *
 * 接入新平台时不需要修改本类，只需新增一个实现 {@link ISdk} 的类即可。
 */
class DefaultSdk {
    constructor(platform = 'Unknown') {
        this._platform = 'Unknown';
        this._ready = true;
        this._platform = platform;
    }
    /** 输出不支持日志 */
    notSupported(api) {
        console.warn(`[SDK] 当前平台(${this._platform})不支持接口: ${api}`);
    }
    /** 生成 reject promise */
    reject(api) {
        this.notSupported(api);
        return Promise.reject(new Error(`[SDK] 当前平台(${this._platform})不支持接口: ${api}`));
    }
    //#region ========== 平台与生命周期 ==========
    getSystemInfo() {
        return Promise.resolve({
            brand: 'devtools',
            model: 'Simulator',
            platform: this._platform,
            system: 'iOS 16.0',
            version: '8.0.0',
            screenWidth: 750,
            screenHeight: 1334,
            pixelRatio: 2,
            language: 'zh_CN',
            SDKVersion: '2.30.0',
        });
    }
    getLaunchOptions() {
        return { scene: 1001, query: { debug: '1' } };
    }
    onShow(_callback) { }
    offShow(_callback) { }
    onHide(_callback) { }
    offHide(_callback) { }
    onError(_callback) { }
    offError(_callback) { }
    exitMiniProgram() {
        console.log('[SDK] 开发模式: exitMiniProgram');
        return Promise.resolve();
    }
    //#endregion
    //#region ========== 登录与用户 ==========
    login() {
        // 默认平台用于测试环境（H5/编辑器），返回测试登录凭证
        return Promise.resolve({ code: 'test_login_code' });
    }
    checkSession() {
        return Promise.resolve(false);
    }
    getUserInfo() {
        // 默认平台（H5/编辑器/PC 预览）返回模拟用户信息，避免调用方报错
        return Promise.resolve({
            userInfo: {
                nickName: '测试用户',
                avatarUrl: '',
                gender: 0,
                language: 'zh_CN',
                country: '中国',
            },
            rawData: '',
            signature: '',
        });
    }
    createUserInfoButton(_option) {
        this.notSupported('createUserInfoButton');
        return null;
    }
    //#endregion
    //#region ========== 分享 ==========
    /**
     * 默认平台（H5 / 编辑器 / 未知）下不响应分享接口，只输出一次性警告。
     *
     * 注：上一版直接 `notSupported` 会打 ERROR 级别日志（高频调用时刷屏）；
     * 当前实际场景中分享按钮只在微信/抖音小游戏里点，H5 等平台调用属于正常兜底，
     * 改为 warn 级别即可。
     */
    shareAppMessage(_option) {
        console.warn(`[SDK] 当前平台(${this._platform})不支持 shareAppMessage，仅在微信/抖音小游戏有效`);
    }
    shareWithScreenshot(_option) {
        console.warn(`[SDK] 当前平台(${this._platform})不支持 shareWithScreenshot`);
        return Promise.resolve();
    }
    onShareAppMessage(_callback) {
        console.warn(`[SDK] 当前平台(${this._platform})不支持 onShareAppMessage`);
    }
    shareToTimeline(_option) {
        console.warn('[SDK] 开发模式: shareToTimeline 模拟成功');
    }
    showShareMenu(_option) {
        console.log('[SDK] 开发模式: showShareMenu');
    }
    hideShareMenu(_option) {
        console.log('[SDK] 开发模式: hideShareMenu');
    }
    canShareToTimeline() {
        return false;
    }
    //#endregion
    //#region ========== 广告 ==========
    createBannerAd(_option) {
        this.notSupported('createBannerAd');
        return null;
    }
    createRewardedVideoAd(_option) {
        this.notSupported('createRewardedVideoAd');
        return null;
    }
    createInterstitialAd(_option) {
        this.notSupported('createInterstitialAd');
        return null;
    }
    createGridAd(_option) {
        this.notSupported('createGridAd');
        return null;
    }
    createCustomAd(_option) {
        this.notSupported('createCustomAd');
        return null;
    }
    //#endregion
    //#region ========== 虚拟支付 ==========
    pay(option) {
        console.log('[SDK] 开发模式: pay', option);
        return Promise.resolve({ errMsg: 'ok', raw: { transactionId: 'test_tx_' + Date.now() } });
    }
    //#endregion
    //#region ========== 设备能力 ==========
    vibrateShort(_type) {
        return Promise.resolve();
    }
    vibrateLong() {
        return Promise.resolve();
    }
    setClipboardData(data) {
        console.log(`[SDK] 开发模式: setClipboardData(${data})`);
        return Promise.resolve();
    }
    getClipboardData() {
        return Promise.resolve('test_clipboard_data');
    }
    getNetworkType() {
        return Promise.resolve({ networkType: 'wifi', isConnected: true });
    }
    onNetworkStatusChange(_callback) { }
    offNetworkStatusChange(_callback) { }
    setKeepScreenOn(_keepScreenOn) {
        return Promise.resolve();
    }
    //#endregion
    //#region ========== 开放数据域托管数据 ==========
    setUserCloudStorage(kvDataList) {
        console.log('[SDK] 开发模式: setUserCloudStorage', kvDataList);
        return Promise.resolve();
    }
    removeUserCloudStorage(keys) {
        console.log('[SDK] 开发模式: removeUserCloudStorage', keys);
        return Promise.resolve();
    }
    getUserCloudStorage(keys) {
        return Promise.resolve({
            kvDataList: keys.map((k) => ({ key: k, value: JSON.stringify({ score: 100, level: 1 }) })),
            raw: {},
        });
    }
    //#endregion
    //#region ========== 客服与反馈 ==========
    openCustomerServiceConversation(_option) {
        console.log('[SDK] 开发模式: openCustomerServiceConversation');
        return Promise.resolve();
    }
    openCustomerServiceChat(_option) {
        console.log('[SDK] 开发模式: openCustomerServiceChat');
        return Promise.resolve();
    }
    //#endregion
    //#region ========== 隐私合规 ==========
    getPrivacySetting() {
        return Promise.resolve({ needAuthorization: false });
    }
    requirePrivacyAuthorize(_option) {
        return Promise.resolve();
    }
    onNeedPrivacyAuthorization(_callback) { }
    requestPrivacyAuthorize(_option) {
        return Promise.resolve();
    }
    resetPrivacyAuthorization() { }
    //#endregion
    //#region ========== 更新、子包、录屏 ==========
    getUpdateManager() {
        this.notSupported('getUpdateManager');
        return null;
    }
    loadSubpackage(_name) {
        return Promise.resolve();
    }
    getGameRecorderManager() {
        this.notSupported('getGameRecorderManager');
        return null;
    }
    //#endregion
    //#region ========== 抖音侧边栏场景 ==========
    checkScene(option) {
        console.log('[SDK] 开发模式: checkScene', option);
        return Promise.resolve({ success: true, raw: {} });
    }
    navigateToScene(option) {
        console.log('[SDK] 开发模式: navigateToScene', option);
        return Promise.resolve({ success: true, raw: {} });
    }
    //#endregion
    //#region ========== 能力检测 ==========
    canIUse(_apiName) {
        return false;
    }
    isReady() {
        return this._ready;
    }
}


/***/ },

/***/ "./src/sdk/minigame/DouYinMiniGameSdk.ts"
/*!***********************************************!*\
  !*** ./src/sdk/minigame/DouYinMiniGameSdk.ts ***!
  \***********************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   DouYinMiniGameSdk: () => (/* binding */ DouYinMiniGameSdk)
/* harmony export */ });
/* harmony import */ var _DefaultSdk__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./DefaultSdk */ "./src/sdk/minigame/DefaultSdk.ts");

/**
 * 抖音小游戏（ByteDance）SDK 实现
 *
 * 基于 `tt` 全局 API，实现 {@link ISdk} 接口。
 * 抖音 API 与微信小游戏高度相似，但有以下差异：
 * 1. 全局对象为 `tt`（而非 `wx`）。
 * 2. 不支持 `createBannerAd`（抖音 banner 没有兜底广告，审核无法通过）。
 * 3. 不支持 `createCustomAd` / `createGridAd`（抖音平台 bug，一般不加自定义广告）。
 * 4. 额外支持抖音侧边栏场景相关 API（{@link checkScene} / {@link navigateToScene}）。
 * 5. 分享使用 `tt.shareAppMessage`。
 *
 * 调用方式：通过 {@link SdkManager} 自动识别平台后获取。
 */
class DouYinMiniGameSdk extends _DefaultSdk__WEBPACK_IMPORTED_MODULE_0__.DefaultSdk {
    constructor() {
        super('DouYinMiniGame');
    }
    /** 抖音小游戏全局对象 */
    get tt() {
        return (typeof globalThis !== 'undefined' ? globalThis : window)['tt'];
    }
    /** 是否在抖音小游戏环境 */
    static isAvailable() {
        const g = typeof globalThis !== 'undefined' ? globalThis : window;
        return typeof g['tt'] !== 'undefined';
    }
    //#region ========== 内部辅助 ==========
    /**
     * 将 tt 回调式 API 包装成 Promise
     */
    promisify(fn, option = {}) {
        return new Promise((resolve, reject) => {
            fn({
                ...option,
                success: (res) => resolve(res),
                fail: (err) => reject(err),
            });
        });
    }
    //#endregion
    //#region ========== 平台与生命周期 ==========
    getSystemInfo() {
        try {
            // 优先使用新 API（基础库 2.20.1+）
            try {
                const deviceInfo = this.tt.getDeviceInfo();
                const windowInfo = this.tt.getWindowInfo();
                const appBaseInfo = this.tt.getAppBaseInfo();
                return Promise.resolve({
                    brand: deviceInfo.brand,
                    model: deviceInfo.model,
                    platform: 'DouYinMiniGame',
                    system: deviceInfo.system,
                    version: appBaseInfo.version,
                    screenWidth: windowInfo.screenWidth,
                    screenHeight: windowInfo.screenHeight,
                    pixelRatio: windowInfo.pixelRatio,
                    language: 'zh',
                    SDKVersion: appBaseInfo.SDKVersion,
                    raw: { deviceInfo, windowInfo, appBaseInfo },
                });
            }
            catch {
                // 新 API 不存在，回退到旧 API
                const info = this.tt.getSystemInfoSync();
                return Promise.resolve({
                    brand: info.brand,
                    model: info.model,
                    platform: 'DouYinMiniGame',
                    system: info.system,
                    version: info.version,
                    screenWidth: info.screenWidth,
                    screenHeight: info.screenHeight,
                    pixelRatio: info.pixelRatio,
                    language: info.language || 'zh',
                    SDKVersion: info.SDKVersion,
                    raw: info,
                });
            }
        }
        catch (e) {
            return Promise.reject(e);
        }
    }
    getLaunchOptions() {
        const opt = this.tt.getLaunchOptionsSync();
        return {
            scene: opt.scene,
            query: opt.query || {},
            referrerInfo: opt.referrerInfo
                ? { appId: opt.referrerInfo.appId, extraData: opt.referrerInfo.extraData }
                : undefined,
            raw: opt,
        };
    }
    onShow(callback) {
        this.tt.onShow(callback);
    }
    offShow(callback) {
        if (callback)
            this.tt.offShow(callback);
    }
    onHide(callback) {
        this.tt.onHide(callback);
    }
    offHide(callback) {
        if (callback)
            this.tt.offHide(callback);
    }
    onError(callback) {
        this.tt.onError((error) => callback(error?.message ?? String(error)));
    }
    offError(callback) {
        if (callback)
            this.tt.offError(callback);
    }
    exitMiniProgram() {
        return this.promisify(this.tt.exitMiniProgram.bind(this.tt)).then(() => undefined);
    }
    //#endregion
    //#region ========== 登录与用户 ==========
    login() {
        return this.promisify(this.tt.login.bind(this.tt)).then((res) => ({
            code: res.code,
            anonymousCode: res.anonymousCode,
            raw: res,
        }));
    }
    checkSession() {
        return this.promisify(this.tt.checkSession.bind(this.tt))
            .then(() => true)
            .catch(() => false);
    }
    getUserInfo(option) {
        return this.promisify(this.tt.getUserInfo.bind(this.tt), {
            lang: option?.lang ?? 'zh_CN',
            withCredentials: option?.withCredentials ?? false,
        }).then((res) => ({
            userInfo: {
                nickName: res.userInfo?.nickName,
                avatarUrl: res.userInfo?.avatarUrl,
                gender: res.userInfo?.gender,
                language: res.userInfo?.language,
                country: res.userInfo?.country,
                province: res.userInfo?.province,
                city: res.userInfo?.city,
                raw: res.userInfo,
            },
            rawData: res.rawData,
            signature: res.signature,
            encryptedData: res.encryptedData,
            iv: res.iv,
        }));
    }
    createUserInfoButton(option) {
        try {
            const btn = this.tt.createUserInfoButton({
                type: option.type ?? 'text',
                text: option.text,
                image: option.image,
                style: option.style,
                lang: option.lang ?? 'zh_CN',
                withCredentials: option.withCredentials ?? false,
            });
            const listeners = new Map();
            return {
                show: () => btn.show(),
                hide: () => btn.hide(),
                destroy: () => {
                    listeners.clear();
                    btn.destroy();
                },
                onTap: (callback) => {
                    const wrapped = (res) => {
                        const info = res?.userInfo;
                        if (!info) {
                            callback({ userInfo: undefined });
                            return;
                        }
                        callback({
                            userInfo: {
                                nickName: info.nickName,
                                avatarUrl: info.avatarUrl,
                                gender: info.gender,
                                language: info.language,
                                raw: info,
                            },
                            rawData: res.rawData,
                            signature: res.signature,
                            encryptedData: res.encryptedData,
                            iv: res.iv,
                        });
                    };
                    listeners.set(callback, wrapped);
                    btn.onTap(wrapped);
                },
                offTap: (callback) => {
                    if (!callback)
                        return;
                    const wrapped = listeners.get(callback);
                    if (wrapped) {
                        btn.offTap(wrapped);
                        listeners.delete(callback);
                    }
                },
            };
        }
        catch (e) {
            console.error('[DouYinSdk] createUserInfoButton 失败', e);
            return null;
        }
    }
    //#endregion
    //#region ========== 分享 ==========
    shareAppMessage(option) {
        this.tt.shareAppMessage({
            title: option?.title,
            desc: option?.desc,
            imageUrl: option?.imageUrl,
            query: option?.path,
        });
    }
    async shareWithScreenshot(option) {
        // 抖音暂不支持截图分享，降级到普通分享
        console.warn('[DouYinSdk] shareWithScreenshot: 抖音暂不支持，降级到普通分享');
        this.shareAppMessage({ title: option.title, query: option.query });
        return Promise.resolve();
    }
    onShareAppMessage(callback) {
        this.tt.onShareAppMessage(() => {
            const result = callback() || {};
            return {
                title: result.title,
                imageUrl: result.imageUrl,
                query: result.path,
            };
        });
    }
    showShareMenu(_option) {
        // 抖音默认展示分享菜单，无对应 API
    }
    hideShareMenu(_option) {
        this.notSupported('hideShareMenu');
    }
    canShareToTimeline() {
        return false;
    }
    shareToTimeline(_option) {
        this.notSupported('shareToTimeline');
    }
    //#endregion
    //#region ========== 广告 ==========
    /**
     * 抖音 banner 广告没有兜底广告，审核无法通过，一般不加。
     * 如确需使用，可在此实现 `tt.createBannerAd`。
     */
    createBannerAd(_option) {
        try {
            const fn = this.tt.createBannerAd;
            if (typeof fn !== 'function') {
                this.notSupported('createBannerAd');
                return null;
            }
            const ad = fn({
                adUnitId: _option.adUnitId,
                style: {
                    left: _option.left ?? 0,
                    top: _option.top ?? 0,
                    width: _option.width ?? 300,
                },
            });
            return this.wrapBannerAd(ad);
        }
        catch (e) {
            console.error('[DouYinSdk] createBannerAd 失败', e);
            return null;
        }
    }
    wrapBannerAd(ad) {
        return {
            style: {
                get top() {
                    return ad.style.top;
                },
                set top(v) {
                    ad.style.top = v;
                },
                get left() {
                    return ad.style.left;
                },
                set left(v) {
                    ad.style.left = v;
                },
                get width() {
                    return ad.style.width;
                },
                set width(v) {
                    ad.style.width = v;
                },
                get height() {
                    return ad.style.height;
                },
            },
            show: () => ad.show(),
            hide: () => ad.hide(),
            destroy: () => ad.destroy(),
            onError: (cb) => ad.onError((err) => cb(this.mapAdError(err))),
            offError: (cb) => {
                if (cb)
                    ad.offError(cb);
            },
            onLoad: (cb) => ad.onLoad?.(cb),
            offLoad: (cb) => {
                if (cb)
                    ad.offLoad?.(cb);
            },
            onResize: (cb) => ad.onResize?.(cb),
            offResize: (cb) => {
                if (cb)
                    ad.offResize?.(cb);
            },
        };
    }
    createRewardedVideoAd(option) {
        try {
            const ad = this.tt.createRewardedVideoAd({ adUnitId: option.adUnitId });
            if (option.muted !== undefined && ad.setMuted) {
                ad.setMuted(option.muted);
            }
            return {
                load: () => ad.load(),
                show: () => ad.show(),
                onClose: (cb) => ad.onClose((res) => cb({ isEnded: !!(res && res.isEnded) })),
                offClose: (cb) => {
                    if (cb)
                        ad.offClose(cb);
                },
                onError: (cb) => ad.onError((err) => cb(this.mapAdError(err))),
                offError: (cb) => {
                    if (cb)
                        ad.offError(cb);
                },
                onLoad: (cb) => ad.onLoad?.(cb),
                offLoad: (cb) => {
                    if (cb)
                        ad.offLoad?.(cb);
                },
            };
        }
        catch (e) {
            console.error('[DouYinSdk] createRewardedVideoAd 失败', e);
            return null;
        }
    }
    createInterstitialAd(option) {
        try {
            const ad = this.tt.createInterstitialAd({ adUnitId: option.adUnitId });
            return {
                load: () => ad.load(),
                show: () => ad.show(),
                destroy: () => ad.destroy(),
                onError: (cb) => ad.onError((err) => cb(this.mapAdError(err))),
                offError: (cb) => {
                    if (cb)
                        ad.offError(cb);
                },
                onLoad: (cb) => ad.onLoad?.(cb),
                offLoad: (cb) => {
                    if (cb)
                        ad.offLoad?.(cb);
                },
                onClose: (cb) => ad.onClose?.(cb),
                offClose: (cb) => {
                    if (cb)
                        ad.offClose?.(cb);
                },
            };
        }
        catch (e) {
            console.error('[DouYinSdk] createInterstitialAd 失败', e);
            return null;
        }
    }
    /**
     * 抖音无格子广告 API，返回 null。
     */
    createGridAd(_option) {
        this.notSupported('createGridAd');
        return null;
    }
    /**
     * 抖音无自定义原生广告 API，返回 null。
     */
    createCustomAd(_option) {
        this.notSupported('createCustomAd');
        return null;
    }
    mapAdError(err) {
        return {
            errCode: err?.errCode ?? -1,
            errMsg: err?.errMsg ?? String(err),
        };
    }
    //#endregion
    //#region ========== 虚拟支付 ==========
    pay(option) {
        const fn = this.tt.requestGamePayment;
        if (typeof fn !== 'function') {
            return this.reject('pay');
        }
        return this.promisify(fn.bind(this.tt), {
            mode: option.mode,
            offerId: option.offerId,
            buyQuantity: option.quantity,
            currencyType: option.currencyType ?? 'CNY',
            env: option.env,
            outTradeNo: option.extraInfo || '',
            ...(option.itemId ? { itemId: option.itemId } : {}),
        }).then((res) => ({ errMsg: res?.errMsg ?? 'ok', raw: res }));
    }
    //#endregion
    //#region ========== 设备能力 ==========
    vibrateShort(type) {
        return this.promisify(this.tt.vibrateShort.bind(this.tt), {
            type: type ?? 'medium',
        }).then(() => undefined);
    }
    vibrateLong() {
        return this.promisify(this.tt.vibrateLong.bind(this.tt)).then(() => undefined);
    }
    setClipboardData(data) {
        return this.promisify(this.tt.setClipboardData.bind(this.tt), { data }).then(() => undefined);
    }
    getClipboardData() {
        return this.promisify(this.tt.getClipboardData.bind(this.tt)).then((res) => res.data);
    }
    getNetworkType() {
        return this.promisify(this.tt.getNetworkType.bind(this.tt)).then((res) => ({
            networkType: res.networkType,
            isConnected: res.isConnected,
        }));
    }
    onNetworkStatusChange(callback) {
        this.tt.onNetworkStatusChange((res) => callback({
            networkType: res.networkType,
            isConnected: res.isConnected,
        }));
    }
    offNetworkStatusChange(callback) {
        if (callback)
            this.tt.offNetworkStatusChange(callback);
    }
    setKeepScreenOn(keepScreenOn) {
        return this.promisify(this.tt.setKeepScreenOn.bind(this.tt), {
            keepScreenOn,
        }).then(() => undefined);
    }
    //#endregion
    //#region ========== 开放数据域托管数据 ==========
    setUserCloudStorage(kvDataList) {
        return this.promisify(this.tt.setUserCloudStorage.bind(this.tt), {
            KVDataList: kvDataList,
        }).then(() => undefined);
    }
    removeUserCloudStorage(keys) {
        return this.promisify(this.tt.removeUserCloudStorage.bind(this.tt), {
            keyList: keys,
        }).then(() => undefined);
    }
    getUserCloudStorage(keys) {
        return this.promisify(this.tt.getUserCloudStorage.bind(this.tt), { keyList: keys }).then((res) => ({ kvDataList: res.KVDataList || [], raw: res }));
    }
    //#endregion
    //#region ========== 客服与反馈 ==========
    openCustomerServiceConversation(option) {
        const fn = this.tt.openCustomerServiceConversation;
        if (typeof fn !== 'function') {
            return this.reject('openCustomerServiceConversation');
        }
        return this.promisify(fn.bind(this.tt), {
            extInfo: option.extInfo,
            source: option.source,
            enterFrom: option.enterFrom,
        }).then(() => undefined);
    }
    openCustomerServiceChat(option) {
        const fn = this.tt.openCustomerServiceChat;
        if (typeof fn !== 'function') {
            return this.reject('openCustomerServiceChat');
        }
        return this.promisify(fn.bind(this.tt), {
            extInfo: option.extInfo,
            source: option.source,
        }).then(() => undefined);
    }
    //#endregion
    //#region ========== 隐私合规 ==========
    getPrivacySetting() {
        return new Promise((resolve) => {
            try {
                this.tt.getPrivacySetting({
                    success: (res) => resolve({
                        needAuthorization: res.needAuthorization,
                        privacyContractName: res.privacyContractName,
                        raw: res,
                    }),
                    fail: () => resolve({ needAuthorization: false }),
                });
            }
            catch {
                resolve({ needAuthorization: false });
            }
        });
    }
    requirePrivacyAuthorize(option) {
        const fn = this.tt.requirePrivacyAuthorize;
        if (typeof fn !== 'function')
            return Promise.resolve();
        return this.promisify(fn.bind(this.tt), option ?? {}).then(() => undefined);
    }
    onNeedPrivacyAuthorization(callback) {
        const fn = this.tt.onNeedPrivacyAuthorization;
        if (typeof fn === 'function')
            fn(callback);
    }
    //#endregion
    //#region ========== 更新、子包、录屏 ==========
    getUpdateManager() {
        const fn = this.tt.getUpdateManager;
        if (typeof fn !== 'function') {
            this.notSupported('getUpdateManager');
            return null;
        }
        try {
            const m = fn();
            return {
                onCheckForUpdate: (cb) => m.onCheckForUpdate?.(cb),
                onUpdateReady: (cb) => m.onUpdateReady?.(cb),
                onUpdateFailed: (cb) => m.onUpdateFailed?.(cb),
                applyUpdate: () => m.applyUpdate?.(),
            };
        }
        catch (e) {
            console.error('[DouYinSdk] getUpdateManager 失败', e);
            return null;
        }
    }
    loadSubpackage(name) {
        return new Promise((resolve, reject) => {
            this.tt.loadSubpackage({
                name,
                success: () => resolve(),
                fail: (err) => reject(err),
                complete: () => { },
            });
        });
    }
    getGameRecorderManager() {
        const fn = this.tt.getGameRecorderManager;
        if (typeof fn !== 'function') {
            this.notSupported('getGameRecorderManager');
            return null;
        }
        try {
            const m = fn();
            return {
                start: (opt) => m.start(opt ?? {}),
                stop: () => m.stop(),
                pause: () => m.pause(),
                resume: () => m.resume(),
                onStart: (cb) => m.onStart?.(cb),
                onStop: (cb) => m.onStop?.(cb),
                onError: (cb) => m.onError?.((err) => cb(this.mapAdError(err))),
            };
        }
        catch (e) {
            console.error('[DouYinSdk] getGameRecorderManager 失败', e);
            return null;
        }
    }
    //#endregion
    //#region ========== 抖音侧边栏场景 ==========
    /**
     * 检测是否支持指定场景（如抖音侧边栏）。
     *
     * 对应 `tt.checkScene`，判断用户是否支持侧边栏进入功能，
     * 旧版抖音没有侧边栏时可通过此接口隐藏"入口有礼"按钮。
     */
    checkScene(option) {
        const fn = this.tt.checkScene;
        if (typeof fn !== 'function') {
            return this.reject('checkScene');
        }
        return new Promise((resolve) => {
            fn({
                scene: option.scene,
                success: (res) => resolve({ success: true, raw: res }),
                fail: (res) => resolve({ success: false, raw: res }),
            });
        });
    }
    /**
     * 跳转到指定场景（如抖音侧边栏）。
     *
     * 对应 `tt.navigateToScene`，用于引导用户去侧边栏。
     */
    navigateToScene(option) {
        const fn = this.tt.navigateToScene;
        if (typeof fn !== 'function') {
            return this.reject('navigateToScene');
        }
        return new Promise((resolve) => {
            fn({
                scene: option.scene,
                success: (res) => resolve({ success: true, raw: res }),
                fail: (res) => resolve({ success: false, raw: res }),
            });
        });
    }
    //#endregion
    //#region ========== 能力检测 ==========
    canIUse(apiName) {
        try {
            return this.tt.canIUse(apiName);
        }
        catch {
            return false;
        }
    }
    isReady() {
        return DouYinMiniGameSdk.isAvailable();
    }
}


/***/ },

/***/ "./src/sdk/minigame/WeChatMiniGameSdk.ts"
/*!***********************************************!*\
  !*** ./src/sdk/minigame/WeChatMiniGameSdk.ts ***!
  \***********************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   WeChatMiniGameSdk: () => (/* binding */ WeChatMiniGameSdk)
/* harmony export */ });
/* harmony import */ var _DefaultSdk__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./DefaultSdk */ "./src/sdk/minigame/DefaultSdk.ts");

/**
 * 微信小游戏 SDK 实现
 *
 * 基于 `wx` 全局 API（基础库 v3.8.x），实现 {@link ISdk} 接口。
 * 类型定义来自 `libs/wechat-minigame-typings`。
 *
 * 调用方式：
 * ```ts
 * // 通过 SDK 单例模块获取（推荐）
 * const sdk = gsm.base.sdk.platformSdk;
 * const result = await sdk.login();
 * ```
 *
 * 注意事项：
 * - 所有异步方法返回 Promise，原生回调已被包装。
 * - 广告/按钮对象返回平台无关接口（{@link IBannerAd} 等），
 *   内部仍持有原生 wx 对象。
 * - 部分接口（如分享到朋友圈、视频号、虚拟支付）仅微信支持，
 *   其它平台会回退到 {@link DefaultSdk}。
 */
class WeChatMiniGameSdk extends _DefaultSdk__WEBPACK_IMPORTED_MODULE_0__.DefaultSdk {
    constructor() {
        super('WeChatMiniGame');
        // 延迟注册隐私监听器，确保在游戏层之后执行
        this._initPrivacyListener();
    }
    //#region ========== 内部辅助 ==========
    /**
     * 将 wx 回调式 API 包装成 Promise
     * @param fn  形如 (option) => void 的 wx 接口
     * @param option 入参
     */
    promisify(fn, option = {}) {
        return new Promise((resolve, reject) => {
            fn({
                ...option,
                success: (res) => resolve(res),
                fail: (err) => reject(err),
            });
        });
    }
    //#endregion
    //#region ========== 平台与生命周期 ==========
    async getSystemInfo() {
        const deviceInfo = wx.getDeviceInfo();
        const windowInfo = wx.getWindowInfo();
        const appBaseInfo = wx.getAppBaseInfo();
        return {
            brand: deviceInfo.brand,
            model: deviceInfo.model,
            platform: 'WeChatMiniGame',
            system: deviceInfo.system,
            version: appBaseInfo.version,
            screenWidth: windowInfo.screenWidth,
            screenHeight: windowInfo.screenHeight,
            pixelRatio: windowInfo.pixelRatio,
            language: 'zh', // 新 API 不包含 language 字段，使用默认值
            SDKVersion: appBaseInfo.SDKVersion,
            raw: { deviceInfo, windowInfo, appBaseInfo },
        };
    }
    getLaunchOptions() {
        const opt = wx.getLaunchOptionsSync();
        return {
            scene: opt.scene,
            query: opt.query || {},
            referrerInfo: opt.referrerInfo
                ? { appId: opt.referrerInfo.appId, extraData: opt.referrerInfo.extraData }
                : undefined,
            raw: opt,
        };
    }
    onShow(callback) {
        wx.onShow(callback);
    }
    offShow(callback) {
        if (callback)
            wx.offShow(callback);
    }
    onHide(callback) {
        wx.onHide(callback);
    }
    offHide(callback) {
        if (callback)
            wx.offHide(callback);
    }
    onError(callback) {
        wx.onError((error) => callback(error.message));
    }
    offError(callback) {
        if (callback)
            wx.offError(callback);
    }
    exitMiniProgram() {
        return this.promisify(wx.exitMiniProgram.bind(wx)).then(() => undefined);
    }
    //#endregion
    //#region ========== 登录与用户 ==========
    login() {
        return this.promisify(wx.login.bind(wx)).then((res) => ({ code: res.code, raw: res }));
    }
    checkSession() {
        return this.promisify(wx.checkSession.bind(wx))
            .then(() => true)
            .catch(() => false);
    }
    getUserInfo(option) {
        const lang = option?.lang ?? 'zh_CN';
        const wxAny = wx;
        // 依次尝试 wx.getUserProfile → wx.getUserInfo → 兜底
        const apis = [
            {
                name: 'getUserProfile',
                fn: wxAny.getUserProfile,
                option: { lang, desc: '用于在游戏中展示你的身份信息' },
            },
            {
                name: 'getUserInfo',
                fn: wxAny.getUserInfo,
                option: { lang, withCredentials: option?.withCredentials ?? false },
            },
        ];
        return new Promise((resolve) => {
            const tryCall = (index) => {
                if (index >= apis.length) {
                    console.warn('[WeChatSdk] getUserProfile 和 getUserInfo 都不可用');
                    resolve({ userInfo: undefined });
                    return;
                }
                const api = apis[index];
                if (typeof api.fn !== 'function') {
                    tryCall(index + 1);
                    return;
                }
                api.fn({
                    ...api.option,
                    success: (res) => {
                        const info = res?.userInfo;
                        if (info?.nickName) {
                            resolve({
                                userInfo: {
                                    nickName: info.nickName,
                                    avatarUrl: info.avatarUrl,
                                    gender: info.gender,
                                    language: info.language,
                                    country: info.country,
                                    province: info.province,
                                    city: info.city,
                                    raw: info,
                                },
                                rawData: res.rawData,
                                signature: res.signature,
                                encryptedData: res.encryptedData,
                                iv: res.iv,
                                cloudID: res.cloudID,
                            });
                        }
                        else {
                            console.warn(`[WeChatSdk] ${api.name} 返回但 userInfo 为空`);
                            tryCall(index + 1);
                        }
                    },
                    fail: (err) => {
                        console.warn(`[WeChatSdk] ${api.name} 失败:`, err);
                        tryCall(index + 1);
                    },
                });
            };
            tryCall(0);
        });
    }
    createUserInfoButton(option) {
        try {
            const btn = wx.createUserInfoButton({
                type: option.type ?? 'text',
                text: option.text,
                image: option.image,
                style: option.style,
                lang: option.lang ?? 'zh_CN',
                withCredentials: option.withCredentials ?? false,
            });
            // 维护外部 callback 到 wx 内部包装监听的映射，保证 offTap 能正确移除
            const listeners = new Map();
            return {
                show: () => btn.show(),
                hide: () => btn.hide(),
                destroy: () => {
                    listeners.clear();
                    btn.destroy();
                },
                onTap: (callback) => {
                    const wrapped = (res) => {
                        // 新版基础库可能返回空 userInfo（用户拒绝或未授权）
                        const info = res?.userInfo;
                        if (!info) {
                            console.warn('[WeChatSdk] createUserInfoButton onTap: userInfo 为空', res);
                            callback({ userInfo: undefined });
                            return;
                        }
                        callback({
                            userInfo: {
                                nickName: info.nickName,
                                avatarUrl: info.avatarUrl,
                                gender: info.gender,
                                language: info.language,
                                raw: info,
                            },
                            rawData: res.rawData,
                            signature: res.signature,
                            encryptedData: res.encryptedData,
                            iv: res.iv,
                            cloudID: res.cloudID,
                        });
                    };
                    listeners.set(callback, wrapped);
                    btn.onTap(wrapped);
                },
                offTap: (callback) => {
                    if (!callback)
                        return;
                    const wrapped = listeners.get(callback);
                    if (wrapped) {
                        btn.offTap(wrapped);
                        listeners.delete(callback);
                    }
                },
            };
        }
        catch (e) {
            console.error('[WeChatSdk] createUserInfoButton 失败', e);
            return null;
        }
    }
    //#endregion
    //#region ========== 分享 ==========
    /**
     * 主动拉起转发（分享给好友）
     *
     * 设计：
     * - 如果传入了 screenshotData（截图数据），会自动保存为临时文件并分享
     * - 如果传入了 presetImageUrl（预制图片 URL），直接使用
     * - 否则使用默认分享
     *
     * 调用示例：
     * ```ts
     * // 使用预制图片分享
     * sdk.shareAppMessage({
     *     title: '一起来玩',
     *     presetImageUrl: 'https://example.com/share.png',
     * });
     *
     * // 使用截图分享（Cocos 层截取画面后传入 base64 数据）
     * sdk.shareWithScreenshot({
     *     title: '一起来玩',
     *     screenshotData: base64String, // Cocos 截图的 base64 数据
     * });
     * ```
     */
    shareAppMessage(option) {
        const imageUrl = option?.presetImageUrl ?? option?.imageUrl;
        wx.shareAppMessage({
            title: option?.title,
            imageUrl,
            query: option?.path,
            ...(option?.withShareTicket ? { withShareTicket: true } : {}),
        });
    }
    /**
     * 使用截图分享（自动处理截图保存和分享）
     *
     * @param option 分享选项，包含 title、screenshotData 等
     * @returns Promise，resolve 表示分享成功，reject 表示失败
     */
    async shareWithScreenshot(option) {
        return new Promise((resolve, reject) => {
            // 获取临时文件保存路径
            const fs = wx.getFileSystemManager?.();
            if (!fs) {
                console.warn('[WeChatSdk] shareWithScreenshot: getFileSystemManager 不可用');
                // 降级：直接分享无图
                this.shareAppMessage({ title: option.title, query: option.query });
                resolve();
                return;
            }
            const envPath = wx.env?.USER_DATA_PATH;
            if (!envPath) {
                console.warn('[WeChatSdk] shareWithScreenshot: USER_DATA_PATH 不可用');
                this.shareAppMessage({ title: option.title, query: option.query });
                resolve();
                return;
            }
            const filePath = `${envPath}/share_${Date.now()}.png`;
            // 保存 base64 数据为临时文件
            fs.writeFile({
                filePath,
                data: option.screenshotData,
                encoding: 'base64',
                success: () => {
                    console.log('[WeChatSdk] shareWithScreenshot: 截图保存成功', filePath);
                    // 分享
                    wx.shareAppMessage({
                        title: option.title,
                        imageUrl: filePath,
                        query: option.query,
                        ...(option.withShareTicket ? { withShareTicket: true } : {}),
                    });
                    resolve();
                },
                fail: (err) => {
                    console.warn('[WeChatSdk] shareWithScreenshot: 截图保存失败', err);
                    // 降级：直接分享无图
                    this.shareAppMessage({ title: option.title, query: option.query });
                    resolve();
                },
            });
        });
    }
    /**
     * 监听用户点击右上角转发
     *
     * 回调返回 {@link IShareOption} 时，使用 `presetImageUrl` 作为转发卡片封面。
     * 不返回 / 返回空对象时，微信会展示通用转发卡片（不含自定义封面）。
     */
    onShareAppMessage(callback) {
        wx.onShareAppMessage(() => {
            const result = callback() || {};
            const imageUrl = result.presetImageUrl ?? result.imageUrl;
            return {
                title: result.title,
                imageUrl,
                query: result.path,
                ...(result.withShareTicket ? { withShareTicket: true } : {}),
            };
        });
    }
    shareToTimeline(option) {
        if (typeof wx.shareToTimeline === 'function') {
            wx.shareToTimeline({
                title: option?.title,
                imageUrl: option?.imageUrl,
                query: option?.query,
            });
        }
        else {
            this.notSupported('shareToTimeline');
        }
    }
    showShareMenu(option) {
        wx.showShareMenu({
            withShareTicket: option?.withShareTicket,
            menus: option?.menus,
        });
    }
    hideShareMenu(option) {
        wx.hideShareMenu({ menus: option?.menus });
    }
    canShareToTimeline() {
        return typeof wx.shareToTimeline === 'function';
    }
    //#endregion
    //#region ========== 广告 ==========
    createBannerAd(option) {
        try {
            const ad = wx.createBannerAd({
                adUnitId: option.adUnitId,
                style: {
                    left: option.left ?? 0,
                    top: option.top ?? 0,
                    width: option.width ?? 300,
                },
            });
            return this.wrapBannerAd(ad, option);
        }
        catch (e) {
            console.error('[WeChatSdk] createBannerAd 失败', e);
            return null;
        }
    }
    wrapBannerAd(ad, option) {
        return {
            style: {
                get top() {
                    return ad.style.top;
                },
                set top(v) {
                    ad.style.top = v;
                },
                get left() {
                    return ad.style.left;
                },
                set left(v) {
                    ad.style.left = v;
                },
                get width() {
                    return ad.style.width;
                },
                set width(v) {
                    ad.style.width = v;
                },
                get height() {
                    return ad.style.height;
                },
            },
            show: () => ad.show(),
            hide: () => ad.hide(),
            destroy: () => ad.destroy(),
            onError: (cb) => ad.onError((err) => cb(this.mapAdError(err))),
            offError: (cb) => {
                if (cb)
                    ad.offError(cb);
            },
            onLoad: (cb) => ad.onLoad(cb),
            offLoad: (cb) => {
                if (cb)
                    ad.offLoad(cb);
            },
            onResize: (cb) => ad.onResize(cb),
            offResize: (cb) => {
                if (cb)
                    ad.offResize(cb);
            },
        };
    }
    createRewardedVideoAd(option) {
        try {
            const ad = wx.createRewardedVideoAd({ adUnitId: option.adUnitId });
            if (option.muted !== undefined && ad.setMuted) {
                ad.setMuted(option.muted);
            }
            return {
                load: () => ad.load(),
                show: () => ad.show(),
                onClose: (cb) => ad.onClose((res) => cb({ isEnded: !!(res && res.isEnded) })),
                offClose: (cb) => {
                    if (cb)
                        ad.offClose(cb);
                },
                onError: (cb) => ad.onError((err) => cb(this.mapAdError(err))),
                offError: (cb) => {
                    if (cb)
                        ad.offError(cb);
                },
                onLoad: (cb) => ad.onLoad(cb),
                offLoad: (cb) => {
                    if (cb)
                        ad.offLoad(cb);
                },
            };
        }
        catch (e) {
            console.error('[WeChatSdk] createRewardedVideoAd 失败', e);
            return null;
        }
    }
    createInterstitialAd(option) {
        try {
            const ad = wx.createInterstitialAd({ adUnitId: option.adUnitId });
            return {
                load: () => ad.load(),
                show: () => ad.show(),
                destroy: () => ad.destroy(),
                onError: (cb) => ad.onError((err) => cb(this.mapAdError(err))),
                offError: (cb) => {
                    if (cb)
                        ad.offError(cb);
                },
                onLoad: (cb) => ad.onLoad(cb),
                offLoad: (cb) => {
                    if (cb)
                        ad.offLoad(cb);
                },
                onClose: (cb) => ad.onClose(cb),
                offClose: (cb) => {
                    if (cb)
                        ad.offClose(cb);
                },
            };
        }
        catch (e) {
            console.error('[WeChatSdk] createInterstitialAd 失败', e);
            return null;
        }
    }
    createGridAd(option) {
        try {
            const ad = wx.createGridAd({
                adUnitId: option.adUnitId,
                style: {
                    left: option.left ?? 0,
                    top: option.top ?? 0,
                    width: option.width ?? 300,
                },
                gridCount: option.gridCount,
            });
            if (!ad)
                return null;
            return {
                show: () => ad.show(),
                hide: () => ad.hide(),
                destroy: () => ad.destroy(),
                onError: (cb) => ad.onError((err) => cb(this.mapAdError(err))),
                offError: (cb) => {
                    if (cb)
                        ad.offError(cb);
                },
                onLoad: (cb) => ad.onLoad(cb),
                offLoad: (cb) => {
                    if (cb)
                        ad.offLoad(cb);
                },
                onResize: (cb) => ad.onResize(cb),
                offResize: (cb) => {
                    if (cb)
                        ad.offResize(cb);
                },
            };
        }
        catch (e) {
            console.error('[WeChatSdk] createGridAd 失败', e);
            return null;
        }
    }
    createCustomAd(option) {
        try {
            const ad = wx.createCustomAd({
                adUnitId: option.adUnitId,
                style: {
                    left: option.left ?? 0,
                    top: option.top ?? 0,
                    width: option.width,
                    height: option.height,
                },
            });
            if (!ad)
                return null;
            return {
                show: () => ad.show(),
                hide: () => ad.hide(),
                destroy: () => ad.destroy(),
                onError: (cb) => ad.onError((err) => cb(this.mapAdError(err))),
                offError: (cb) => {
                    if (cb)
                        ad.offError(cb);
                },
                onLoad: (cb) => ad.onLoad(cb),
                offLoad: (cb) => {
                    if (cb)
                        ad.offLoad(cb);
                },
            };
        }
        catch (e) {
            console.error('[WeChatSdk] createCustomAd 失败', e);
            return null;
        }
    }
    mapAdError(err) {
        return {
            errCode: err?.errCode ?? -1,
            errMsg: err?.errMsg ?? String(err),
        };
    }
    //#endregion
    //#region ========== 虚拟支付 ==========
    pay(option) {
        // 道具直购
        if (option.mode === 'item') {
            const fn = wx.requestMidasPaymentGameItem;
            if (typeof fn !== 'function') {
                return Promise.reject(new Error('[WeChatSdk] 不支持道具直购'));
            }
            return this.promisify(fn.bind(wx), {
                offerId: option.offerId,
                buyQuantity: option.quantity,
                outTradeNo: option.extraInfo || '',
                env: option.env,
            }).then((res) => ({ errMsg: res?.errMsg ?? 'ok', raw: res }));
        }
        // 游戏币
        return this.promisify(wx.requestMidasPayment.bind(wx), {
            mode: 'game',
            offerId: option.offerId,
            buyQuantity: option.quantity,
            outTradeNo: option.extraInfo || '',
            currencyType: option.currencyType ?? 'CNY',
            env: option.env,
            zoneId: option.zoneId,
        }).then((res) => ({ errMsg: res?.errMsg ?? 'ok', raw: res }));
    }
    //#endregion
    //#region ========== 设备能力 ==========
    vibrateShort(type) {
        return this.promisify(wx.vibrateShort.bind(wx), { type: type ?? 'medium' }).then(() => undefined);
    }
    vibrateLong() {
        return this.promisify(wx.vibrateLong.bind(wx)).then(() => undefined);
    }
    setClipboardData(data) {
        return this.promisify(wx.setClipboardData.bind(wx), { data }).then(() => undefined);
    }
    getClipboardData() {
        return this.promisify(wx.getClipboardData.bind(wx)).then((res) => res.data);
    }
    getNetworkType() {
        return this.promisify(wx.getNetworkType.bind(wx)).then((res) => ({
            networkType: res.networkType,
            isConnected: res.isConnected,
        }));
    }
    onNetworkStatusChange(callback) {
        wx.onNetworkStatusChange((res) => callback({
            networkType: res.networkType,
            isConnected: res.isConnected,
        }));
    }
    offNetworkStatusChange(callback) {
        if (callback)
            wx.offNetworkStatusChange(callback);
    }
    setKeepScreenOn(keepScreenOn) {
        return this.promisify(wx.setKeepScreenOn.bind(wx), { keepScreenOn }).then(() => undefined);
    }
    //#endregion
    //#region ========== 开放数据域托管数据 ==========
    setUserCloudStorage(kvDataList) {
        return this.promisify(wx.setUserCloudStorage.bind(wx), { KVDataList: kvDataList }).then(() => undefined);
    }
    removeUserCloudStorage(keys) {
        return this.promisify(wx.removeUserCloudStorage.bind(wx), { keyList: keys }).then(() => undefined);
    }
    getUserCloudStorage(keys) {
        return this.promisify(wx.getUserCloudStorage.bind(wx), {
            keyList: keys,
        }).then((res) => ({ kvDataList: res.KVDataList || [], raw: res }));
    }
    //#endregion
    //#region ========== 客服与反馈 ==========
    openCustomerServiceConversation(option) {
        return this.promisify(wx.openCustomerServiceConversation.bind(wx), {
            extInfo: option.extInfo,
            source: option.source,
            enterFrom: option.enterFrom,
        }).then(() => undefined);
    }
    openCustomerServiceChat(option) {
        const fn = wx.openCustomerServiceChat;
        if (typeof fn !== 'function') {
            return this.reject('openCustomerServiceChat');
        }
        return this.promisify(fn.bind(wx), {
            extInfo: option.extInfo,
            source: option.source,
        }).then(() => undefined);
    }
    //#endregion
    //#region ========== 隐私合规 ==========
    getPrivacySetting() {
        const fn = wx.getPrivacySetting;
        if (typeof fn !== 'function') {
            return Promise.resolve({ needAuthorization: false });
        }
        return new Promise((resolve) => {
            fn({
                success: (res) => resolve({
                    needAuthorization: res.needAuthorization,
                    privacyContractName: res.privacyContractName,
                    raw: res,
                }),
                fail: () => resolve({ needAuthorization: false }),
            });
        });
    }
    requirePrivacyAuthorize(option) {
        const fn = wx.requirePrivacyAuthorize;
        if (typeof fn !== 'function')
            return Promise.resolve();
        // 先注册正确签名的监听器（覆盖游戏层）
        this._registerCorrectPrivacyListener();
        return this.promisify(fn.bind(wx), option ?? {}).then(() => undefined);
    }
    onNeedPrivacyAuthorization(callback) {
        const fn = wx.onNeedPrivacyAuthorization;
        if (typeof fn === 'function')
            fn(callback);
    }
    /**
     * 注册正确签名的隐私授权监听器（覆盖游戏层的错误监听器）
     *
     * 关键点：resolve 必须在用户交互事件中调用，不能直接异步调用。
     * 微信 errno:104 "click action before resolve is needed" 就是因为
     * 直接 resolve({event:'agree'}) 没有用户交互上下文。
     *
     * 解决方案：用 wx.showModal 显示原生确认框，用户点"同意"/"拒绝"时
     * 在 showModal 的 success 回调里调用 resolve（showModal 回调算用户交互事件）。
     */
    _registerCorrectPrivacyListener() {
        const fn = wx.onNeedPrivacyAuthorization;
        if (typeof fn !== 'function')
            return;
        fn((resolveFn, eventInfo) => {
            console.log('[WeChatSdk] 隐私授权回调触发:', eventInfo);
            const wxAny = wx;
            if (typeof wxAny.showModal === 'function') {
                // 用 wx.showModal 显示原生确认框，让用户主动点击同意/拒绝
                wxAny.showModal({
                    title: '隐私保护提示',
                    content: '为了向您提供游戏服务，我们需要获取您的昵称和头像信息。是否同意？',
                    confirmText: '同意',
                    cancelText: '拒绝',
                    success: (modalRes) => {
                        if (modalRes.confirm) {
                            console.log('[WeChatSdk] 用户同意隐私协议');
                            resolveFn({ event: 'agree' });
                        }
                        else {
                            console.log('[WeChatSdk] 用户拒绝隐私协议');
                            resolveFn({ event: 'disagree' });
                        }
                    },
                    fail: () => {
                        console.warn('[WeChatSdk] showModal 失败，默认同意');
                        resolveFn({ event: 'agree' });
                    },
                });
            }
            else {
                // 兜底：showModal 不可用，直接同意
                console.log('[WeChatSdk] showModal 不可用，直接同意');
                resolveFn({ event: 'agree' });
            }
        });
        console.log('[WeChatSdk] 隐私授权监听器已注册（覆盖式 showModal 版）');
    }
    /**
     * 初始化隐私授权监听器（在 SDK 创建时调用）
     */
    _initPrivacyListener() {
        this._registerCorrectPrivacyListener();
        console.log('[WeChatSdk] 隐私授权监听器初始化完成');
    }
    //#endregion
    //#region ========== 更新、子包、录屏 ==========
    getUpdateManager() {
        const fn = wx.getUpdateManager;
        if (typeof fn !== 'function')
            return null;
        const m = fn();
        return {
            onCheckForUpdate: (cb) => m.onCheckForUpdate(cb),
            onUpdateReady: (cb) => m.onUpdateReady(cb),
            onUpdateFailed: (cb) => m.onUpdateFailed(cb),
            applyUpdate: () => m.applyUpdate(),
        };
    }
    loadSubpackage(name) {
        return new Promise((resolve, reject) => {
            wx.loadSubpackage({
                name,
                success: () => resolve(),
                fail: (err) => reject(err),
                complete: () => { },
            });
        });
    }
    getGameRecorderManager() {
        const fn = wx.getGameRecorderManager;
        if (typeof fn !== 'function') {
            this.notSupported('getGameRecorderManager');
            return null;
        }
        const m = fn();
        return {
            start: (opt) => m.start(opt ?? {}),
            stop: () => m.stop(),
            pause: () => m.pause(),
            resume: () => m.resume(),
            onStart: (cb) => (m.onStart ? m.onStart(cb) : undefined),
            onStop: (cb) => (m.onStop ? m.onStop(cb) : undefined),
            onError: (cb) => (m.onError ? m.onError((err) => cb(this.mapAdError(err))) : undefined),
        };
    }
    //#endregion
    //#region ========== 能力检测 ==========
    canIUse(apiName) {
        const fn = wx.canIUse;
        return typeof fn === 'function' ? fn(apiName) : false;
    }
    isReady() {
        return typeof wx !== 'undefined';
    }
}


/***/ },

/***/ "./src/sdk/minigame/index.ts"
/*!***********************************!*\
  !*** ./src/sdk/minigame/index.ts ***!
  \***********************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   DefaultSdk: () => (/* reexport safe */ _DefaultSdk__WEBPACK_IMPORTED_MODULE_0__.DefaultSdk),
/* harmony export */   DouYinMiniGameSdk: () => (/* reexport safe */ _DouYinMiniGameSdk__WEBPACK_IMPORTED_MODULE_2__.DouYinMiniGameSdk),
/* harmony export */   WeChatMiniGameSdk: () => (/* reexport safe */ _WeChatMiniGameSdk__WEBPACK_IMPORTED_MODULE_1__.WeChatMiniGameSdk)
/* harmony export */ });
/* harmony import */ var _DefaultSdk__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./DefaultSdk */ "./src/sdk/minigame/DefaultSdk.ts");
/* harmony import */ var _WeChatMiniGameSdk__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./WeChatMiniGameSdk */ "./src/sdk/minigame/WeChatMiniGameSdk.ts");
/* harmony import */ var _DouYinMiniGameSdk__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./DouYinMiniGameSdk */ "./src/sdk/minigame/DouYinMiniGameSdk.ts");
/**
 * 小游戏平台 SDK 实现导出
 */





/***/ },

/***/ "cc"
/*!*********************!*\
  !*** external "cc" ***!
  \*********************/
(module) {

module.exports = __WEBPACK_EXTERNAL_MODULE_cc__;

/***/ }

/******/ });
/************************************************************************/
/******/ // The module cache
/******/ const __webpack_module_cache__ = {};
/******/ 
/******/ // The require function
/******/ function __webpack_require__(moduleId) {
/******/ 	// Check if module is in cache
/******/ 	const cachedModule = __webpack_module_cache__[moduleId];
/******/ 	if (cachedModule !== undefined) {
/******/ 		return cachedModule.exports;
/******/ 	}
/******/ 	// Create a new module (and put it into the cache)
/******/ 	const module = __webpack_module_cache__[moduleId] = {
/******/ 		// no module.id needed
/******/ 		// no module.loaded needed
/******/ 		exports: {}
/******/ 	};
/******/ 
/******/ 	// Execute the module function
/******/ 	if (!(moduleId in __webpack_modules__)) {
/******/ 		delete __webpack_module_cache__[moduleId];
/******/ 		const e = new Error("Cannot find module '" + moduleId + "'");
/******/ 		e.code = 'MODULE_NOT_FOUND';
/******/ 		throw e;
/******/ 	}
/******/ 	__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 
/******/ 	// Return the exports of the module
/******/ 	return module.exports;
/******/ }
/******/ 
/************************************************************************/
/******/ /* webpack/runtime/define property getters */
/******/ (() => {
/******/ 	// define getter/value functions for harmony exports
/******/ 	__webpack_require__.d = (exports, definition) => {
/******/ 		if(Array.isArray(definition)) {
/******/ 			var i = 0;
/******/ 			while(i < definition.length) {
/******/ 				var key = definition[i++];
/******/ 				var binding = definition[i++];
/******/ 				if(!__webpack_require__.o(exports, key)) {
/******/ 					if(binding === 0) {
/******/ 						Object.defineProperty(exports, key, { enumerable: true, value: definition[i++] });
/******/ 					} else {
/******/ 						Object.defineProperty(exports, key, { enumerable: true, get: binding });
/******/ 					}
/******/ 				} else if(binding === 0) { i++; }
/******/ 			}
/******/ 		} else {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		}
/******/ 	};
/******/ })();
/******/ 
/******/ /* webpack/runtime/hasOwnProperty shorthand */
/******/ (() => {
/******/ 	__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ })();
/******/ 
/******/ /* webpack/runtime/make namespace object */
/******/ (() => {
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = (exports) => {
/******/ 		if(Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/ })();
/******/ 
/************************************************************************/
let __webpack_exports__ = {};
// This entry needs to be wrapped in an IIFE because it needs to be isolated against other modules in the chunk.
(() => {
/*!**********************!*\
  !*** ./src/index.ts ***!
  \**********************/
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Sdk: () => (/* reexport safe */ _sdk_Sdk__WEBPACK_IMPORTED_MODULE_0__.Sdk)
/* harmony export */ });
/* harmony import */ var _sdk_Sdk__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./sdk/Sdk */ "./src/sdk/Sdk.ts");
/// <reference path="./types/global.d.ts" />
/**
 * SDK 模块打包入口
 *
 * 对外公开内容：
 * - Sdk 类（平台 SDK 单例模块）
 * - ISdk 接口（平台无关 SDK 接口定义，仅暴露实际使用的方法）
 * - 相关类型定义
 *
 * 打包产物：assets/bundle/game_main/script/libs/sdk.js
 * 类型声明：assets/bundle/game_main/script/libs/sdk.d.ts
 */
// ===== 对外公开（仅实际使用的定义）=====
// Sdk 内部通过 SdkManager 自动导入所有平台实现（DefaultSdk / WeChatMiniGameSdk / DouYinMiniGameSdk）


})();

const __webpack_exports__Sdk = __webpack_exports__.Sdk;
export { __webpack_exports__Sdk as Sdk };

//# sourceMappingURL=sdk.js.map