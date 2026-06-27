#!/usr/bin/env node
/**
 * 微信云函数部署工具（oops-game-kit）
 *
 * 背景：
 *   云函数源码统一放在 core/build-templates/wechatgame/cloudfunctions（框架资产）。
 *   默认 build-templates/wechatgame 不含 cloudfunctions 目录，project.config.json 也不含
 *   cloudfunctionRoot 配置 —— 因此 Cocos 构建产物中不含云函数，微信开发者工具无报错。
 *
 * 解决思路：
 *   1. deploy：将 core 中的云函数拷贝到 build-templates/wechatgame，并写入 cloudfunctionRoot
 *   2. 在 Cocos Creator 中构建微信小游戏 → 云函数自动随 build-templates 进入产物
 *   3. 在微信开发者工具中右键上传云函数
 *   4. clean：删除 build-templates/wechatgame/cloudfunctions，移除 cloudfunctionRoot
 *
 * 用法：
 *   部署：  npm run wechatgame_deploy:cloudfunctions
 *   清理：  npm run wechatgame_clean:cloudfunctions
 */

const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.resolve(__dirname, '..', '..', '..', '..');
const SOURCE_DIR = path.join(PROJECT_ROOT, 'core', 'build-templates', 'wechatgame', 'cloudfunctions');
const TARGET_DIR = path.join(PROJECT_ROOT, 'build-templates', 'wechatgame');

function printHelp() {
    console.log([
        '用法:',
        '  npm run wechatgame_deploy:cloudfunctions  部署云函数到 build-templates',
        '  npm run wechatgame_clean:cloudfunctions    清理 build-templates 中的云函数',
        '',
        '流程:',
        '  1. deploy → 将云函数拷贝到 build-templates/wechatgame/cloudfunctions',
        '  2. 在 Cocos Creator 中构建微信小游戏',
        '  3. 在微信开发者工具中右键 cloudfunctions → 上传并部署',
        '  4. clean → 移除云函数目录与 cloudfunctionRoot',
    ].join('\n'));
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

function deploy() {
    if (!fs.existsSync(SOURCE_DIR)) {
        console.error('未找到云函数源目录: ' + SOURCE_DIR);
        process.exit(1);
    }

    const destCloud = path.join(TARGET_DIR, 'cloudfunctions');
    const configPath = path.join(TARGET_DIR, 'project.config.json');

    copyDir(SOURCE_DIR, destCloud);
    console.log('已复制云函数到: ' + destCloud);

    if (fs.existsSync(configPath)) {
        setCloudfunctionRoot(configPath, 'cloudfunctions/');
        console.log('已在 build-templates 的 project.config.json 设置 cloudfunctionRoot: "cloudfunctions/"');
    } else {
        console.warn('警告: 未找到 project.config.json，请手动配置 cloudfunctionRoot。');
    }

    console.log('\n请在 Cocos Creator 中构建微信小游戏，云函数将自动随 build-templates 进入产物。');
    console.log('然后在微信开发者工具中右键 cloudfunctions 目录，选择"上传并部署：云端安装依赖"。');
    console.log('上传完成后运行 npm run wechatgame_clean:cloudfunctions 还原。');
}

function clean() {
    const destCloud = path.join(TARGET_DIR, 'cloudfunctions');
    const configPath = path.join(TARGET_DIR, 'project.config.json');

    rmrf(destCloud);
    console.log('已移除云函数目录: ' + destCloud);

    if (fs.existsSync(configPath)) {
        setCloudfunctionRoot(configPath, null);
        console.log('已从 project.config.json 移除 cloudfunctionRoot');
    }

    console.log('\n清理完成，下次构建产物将不再包含云函数。');
}

const args = process.argv.slice(2);
if (args.includes('--clean') || args.includes('clean')) {
    clean();
} else if (args.includes('-h') || args.includes('--help')) {
    printHelp();
} else {
    deploy();
}
