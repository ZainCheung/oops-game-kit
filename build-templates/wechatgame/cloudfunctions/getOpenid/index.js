// 云函数：获取微信用户 OpenID
// 采用 cloud.getWXContext() 直接获取，零外部网络请求，性能极致
const cloud = require('wx-server-sdk');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();

  return {
    code: 0,
    message: 'ok',
    data: {
      openid: wxContext.OPENID,
      appid: wxContext.APPID,
      unionid: wxContext.UNIONID || null,
    },
  };
};
