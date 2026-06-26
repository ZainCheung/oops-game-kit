const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');

/**
 * Webpack 打包配置
 *
 * 将 SDK 源码（src/sdk/）打包为单一 JS 文件，
 * 输出到 assets/bundle/game_main/script/libs/sdk.js。
 *
 * 关键点：
 * 1. `cc` 模块作为 external，由 Cocos Creator 运行时提供。
 * 2. `wx` / `tt` 为平台全局变量，运行时注入，无需打包。
 * 3. 入口 src/index.ts 导出对外公开的类、接口与枚举。
 * 4. 输出格式为 ES Module，与 Cocos Creator 3.x 脚本系统兼容。
 * 5. Production 模式下启用代码混淆和压缩。
 */
module.exports = (env, argv) => {
    const isProduction = argv.mode === 'production';

    return {
        // 禁用 eval 相关的 source map（WeChat 小游戏不支持 eval）
        // 开发模式使用 source-map 替代 eval，生产模式不生成 source map
        devtool: isProduction ? false : 'source-map',
        experiments: {
            outputModule: true
        },
        entry: path.resolve(__dirname, 'src/index.ts'),
        output: {
            path: path.resolve(__dirname, '../../assets/bundle/game_main/script/libs'),
            filename: 'sdk.js',
            module: true,
            library: {
                type: 'module'
            },
            clean: false
        },
        resolve: {
            extensions: ['.ts', '.js'],
            alias: {
                // 让源码里的 `import { sys } from 'cc'` 在打包时能命中本项目的类型桩
                cc: path.resolve(__dirname, 'src/types/cc.d.ts')
            }
        },
        module: {
            rules: [
                {
                    test: /\.ts$/,
                    exclude: /node_modules/,
                    use: [
                        {
                            loader: 'ts-loader',
                            options: {
                                configFile: path.resolve(__dirname, 'tsconfig.json'),
                                // 仅做类型转译，不做类型检查（类型检查交给 IDE/CI）
                                transpileOnly: true
                            }
                        }
                    ]
                }
            ]
        },
        externals: {
            // Cocos Creator 引擎模块，运行时由引擎提供（ES Module 格式）
            cc: 'module cc'
        },
        optimization: {
            minimize: isProduction,
            minimizer: isProduction ? [
                new TerserPlugin({
                    terserOptions: {
                        compress: {
                            drop_console: true, // 移除所有 console 语句
                            drop_debugger: true, // 移除 debugger 语句
                            passes: 2, // 压缩次数，多次压缩可以获得更小的体积
                        },
                        mangle: {
                            toplevel: true, // 混淆顶层作用域的变量名和函数名
                            // 注意：如果代码中有使用字符串访问属性（如 obj['methodName']），
                            // 开启 properties 混淆会导致运行时错误
                            // properties: true, // 混淆属性名（谨慎使用）
                        },
                        format: {
                            comments: false, // 移除所有注释
                            beautify: false, // 不美化输出（压缩成一行）
                        },
                    }
                })
            ] : undefined
        },
        // wx / tt 是平台全局变量，不需要 webpack 解析
        // WechatMinigame 命名空间来自 typings，仅类型层面使用，运行时不引用
        stats: {
            warnings: false
        }
    };
};
