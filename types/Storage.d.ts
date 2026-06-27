declare global {
    type GameStorageKey =
        /** 框架内置 */
        'OopsFrameworkLanguage' |
        'OopsFrameworkAudio' |
        'OopsFrameworkPromptSkip' |
        /** 业务层 */
        'GameRedDot' |
        'GameUserInfoCache';
}

export { };
