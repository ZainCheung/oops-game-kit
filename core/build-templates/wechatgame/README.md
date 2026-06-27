# wechatgame 微信小游戏云函数工具获取openid

## 目录结构

```
cloudfunctions/        ← 云函数源码（默认不进入构建产物）
  └── getOpenid/
tools/                 ← 部署工具
  └── deploy-cloudfunctions.cjs
```

## 部署云函数

```bash
# 1. 部署到构建模板
npm run wechatgame_deploy:cloudfunctions
# 2. 在 Cocos Creator 中构建微信小游戏
# 3. 在微信开发者工具中右键 cloudfunctions → 上传并部署
# 4. 清理（必须，否则下次构建产物含云函数目录，
#    开发者工具会报错：文件在 cloudfunctionRoot 指定目录内）
npm run wechatgame_clean:cloudfunctions
```
