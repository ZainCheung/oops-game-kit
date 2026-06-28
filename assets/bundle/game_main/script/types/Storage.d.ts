declare global {
    type GameStorageKey =
        /** 框架内置 */
        'OopsFrameworkAudio' |
        'OopsFrameworkLanguage' |
        'OopsFrameworkPromptSkip' |
        /** 业务层 */
        'GameRedDot' |
        'GameCacheUserInfo' |
        'GameCacheOpenId';
}

export { };
