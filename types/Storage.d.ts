declare global {
    type GameStorageKey =
        /** 框架内置 */
        'Language' |
        'Audio' |
        'PromptSkip' |
        /** 业务层 */
        'RedDot' |
        'UserInfoCache';
}

export {};
