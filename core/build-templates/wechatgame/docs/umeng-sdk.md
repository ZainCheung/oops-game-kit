# 友盟+ 微信小游戏统计分析 SDK

## 文件位置

将 `uma.min.js` 放到以下路径才能生效：

```
build-templates/wechatgame/utils/umtrack-wxgame/uma.min.js
```

## 初始化配置

`build-templates/wechatgame/game.ejs` 中已有初始化代码：

```js
var uma = require('./utils/umtrack-wxgame/uma.min.js');
uma.init({
    appKey: '你的AppKey',
    useOpenid: false,
    autoGetOpenid: false,
    debug: true  // 上线前改为 false
});
```

## 友盟后台配置

1. 登录 [友盟+](https://www.umeng.com/) 后台
2. 添加微信小游戏应用，获取 AppKey
3. 将 AppKey 填入上方 `uma.init` 的 `appKey` 字段
4. 开启统计功能

## 自定义事件（核心用法）

游戏各模块中调用，例如：

```js
// 关卡开始
uma.trackEvent('level_start', { level_id: 1 });
// 关卡通关
uma.trackEvent('level_complete', { level_id: 1, score: 1000 });
// 道具使用
uma.trackEvent('item_use', { item_name: 'sword', count: 1 });
// 广告观看
uma.trackEvent('ad_watch', { ad_type: 'reward', result: 'completed' });
```

在友盟后台「事件」页面新建对应事件 ID 即可查看数据。
