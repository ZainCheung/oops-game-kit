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
 * 5. Production 模式下只压缩（去空格、注释、换行），不混淆。
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
                            drop_console: true,
                            drop_debugger: true,
                            // 安全压缩：只启用不影响运行时行为的基本优化
                            sequences: true,      // 合并连续语句
                            dead_code: true,      // 移除死代码
                            conditionals: true,   // 优化 if 条件
                            booleans: true,       // 优化布尔表达式
                            unused: true,         // 移除未使用变量
                            if_return: true,      // 优化 if-return 模式
                            join_vars: true,      // 合并变量声明
                        },
                        mangle: {
                            // 保留类名和函数名，方便生产环境报错调试
                            toplevel: false,
                            keep_classnames: true,
                            keep_fnames: true,
                        },
                        format: {
                            comments: false,
                            beautify: false,
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
