#!/usr/bin/env node
/**
 * 微信云函数部署工具（oops-game-kit）
 *
 * 背景：
 *   Cocos Creator 构建微信小游戏时，build-templates 中的内容会被全量复制到产物根目录。
 *   若产物同时存在 cloudfunctions/ 目录与 project.config.json 的 cloudfunctionRoot 配置，
 *   微信开发者工具会报错：
 *     "文件 cloudfunctions/xxx/index.js 在 project.config.json 'cloudfunctionRoot' 指定的目录，
 *      如果不希望在小程序/小游戏的运行环境中执行该文件，请使用 project.config.json
 *      'miniprogramRoot' 组织项目目录结构"
 *
 *   原因：miniprogramRoot 为 "./"，整个产物根目录被视为小游戏运行环境，而 cloudfunctions/
 *   又落在该环境内，工具担心云函数代码被前端误执行。
 *
 * 解决思路：
 *   1. 云函数源码统一放在 core/build-templates/wechatgame/cloudfunctions（框架资产）。
 *   2. 默认构建产物不含云函数、不配置 cloudfunctionRoot —— 报错消失。
 *   3. 需要上传云函数时，运行本脚本把云函数同步到构建产物并写入 cloudfunctionRoot，
 *      随后在微信开发者工具中右键上传；上传完可用 --clean 还原产物。
 *
 * 用法：
 *   部署：  node core/build-templates/wechatgame/tools/deploy-cloudfunctions.cjs [构建产物目录]
 *   清理：  node core/build-templates/wechatgame/tools/deploy-cloudfunctions.cjs --clean [构建产物目录]
 *   帮助：  node core/build-templates/wechatgame/tools/deploy-cloudfunctions.cjs -h
 *
 *   构建产物目录默认为 build/wechatgame
 */

const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.resolve(__dirname, '..', '..', '..', '..');
const SOURCE_DIR = path.join(PROJECT_ROOT, 'core', 'build-templates', 'wechatgame', 'cloudfunctions');
const DEFAULT_BUILD_DIR = path.join(PROJECT_ROOT, 'build', 'wechatgame');

function printHelp() {
    console.log([
        '用法: node core/build-templates/wechatgame/tools/deploy-cloudfunctions.cjs [--clean] [构建产物目录]',
        '',
        '  部署  将 core 中的云函数同步到构建产物并写入 cloudfunctionRoot',
        '  清理  移除构建产物中的云函数目录与 cloudfunctionRoot 配置',
        '',
        '  构建产物目录默认为 build/wechatgame',
    ].join('\n'));
}

function parseArgs(argv) {
    const args = argv.slice(2);
    let clean = false;
    let buildDir = DEFAULT_BUILD_DIR;
    for (const a of args) {
        if (a === '--clean') {
            clean = true;
        } else if (a === '-h' || a === '--help') {
            printHelp();
            process.exit(0);
        } else {
            buildDir = path.resolve(PROJECT_ROOT, a);
        }
    }
    return { clean, buildDir };
}

function copyDir(src, dest) {
    fs.mkdirSync(dest, { recursive: true });
    for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
        const s = path.join(src, entry.name);
        const d = path.join(dest, entry.name);
        if (entry.isDirectory()) {
            copyDir(s, d);
        } else {
            fs.copyFileSync(s, d);
        }
    }
}

function rmrf(p) {
    if (fs.existsSync(p)) {
        fs.rmSync(p, { recursive: true, force: true });
    }
}

function setCloudfunctionRoot(configPath, value) {
    const raw = fs.readFileSync(configPath, 'utf8');
    let cfg;
    try {
        cfg = JSON.parse(raw);
    } catch (e) {
        throw new Error('无法解析 project.config.json: ' + e.message);
    }
    if (value === null) {
        delete cfg.cloudfunctionRoot;
    } else {
        cfg.cloudfunctionRoot = value;
    }
    fs.writeFileSync(configPath, JSON.stringify(cfg, null, 4) + '\n', 'utf8');
}

function deploy(buildDir) {
    if (!fs.existsSync(SOURCE_DIR)) {
        console.error('未找到云函数源目录: ' + SOURCE_DIR);
        process.exit(1);
    }
    if (!fs.existsSync(buildDir)) {
        console.error('未找到构建产物目录: ' + buildDir);
        console.error('请先在 Cocos Creator 中构建微信小游戏。');
        process.exit(1);
    }

    const destCloud = path.join(buildDir, 'cloudfunctions');
    const configPath = path.join(buildDir, 'project.config.json');

    copyDir(SOURCE_DIR, destCloud);
    console.log('已复制云函数到: ' + destCloud);

    if (fs.existsSync(configPath)) {
        setCloudfunctionRoot(configPath, 'cloudfunctions/');
        console.log('已在 project.config.json 设置 cloudfunctionRoot: "cloudfunctions/"');
    } else {
        console.warn('警告: 构建产物中未找到 project.config.json，请手动配置 cloudfunctionRoot。');
    }

    console.log('\n部署完成。请在微信开发者工具中右键云函数目录，选择"上传并部署：云端安装依赖"。');
    console.log('上传完成后可运行 --clean 还原产物。');
}

function clean(buildDir) {
    const destCloud = path.join(buildDir, 'cloudfunctions');
    const configPath = path.join(buildDir, 'project.config.json');

    rmrf(destCloud);
    console.log('已移除云函数目录: ' + destCloud);

    if (fs.existsSync(configPath)) {
        setCloudfunctionRoot(configPath, null);
        console.log('已从 project.config.json 移除 cloudfunctionRoot');
    }

    console.log('\n清理完成。');
}

const { clean: doClean, buildDir } = parseArgs(process.argv);
if (doClean) {
    clean(buildDir);
} else {
    deploy(buildDir);
}
