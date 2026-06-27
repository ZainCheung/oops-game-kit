// 云函数：获取微信用户 OpenID
// 主路径：cloud.getWXContext() 瞬时返回，零外部网络请求
// 备路径：传入 code 时通过 jscode2session 获取（可获得 session_key 用于解密）
// 所有边界均有降级处理，不抛未捕获异常

const cloud = require('wx-server-sdk');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

exports.main = async (event, context) => {
    const { code } = event;

    // ---------- 主路径：从 WX 上下文直接获取 ----------
    try {
        const wxContext = cloud.getWXContext();
        if (wxContext.OPENID) {
            return {
                code: 0,
                message: 'ok',
                data: {
                    openid: wxContext.OPENID,
                    appid: wxContext.APPID,
                    unionid: wxContext.UNIONID || null,
                    session_key: null,
                },
            };
        }
    }
    catch (e) {
        console.warn('[getOpenid] getWXContext 失败，尝试 code2Session 降级:', e.message);
    }

    // ---------- 备路径：通过 code 换取 ----------
    if (!code) {
        return {
            code: -1,
            message: '无法获取 openid：WX 上下文为空且未提供登录 code',
            data: null,
        };
    }

    try {
        const res = await cloud.openapi.auth.code2Session({ code });

        if (!res.openid) {
            return {
                code: -2,
                message: 'code2Session 返回的 openid 为空',
                data: null,
                raw: res,
            };
        }

        return {
            code: 0,
            message: 'ok',
            data: {
                openid: res.openid,
                appid: null,
                unionid: res.unionid || null,
                session_key: res.session_key || null,
            },
        };
    }
    catch (e) {
        return {
            code: -3,
            message: 'code2Session 调用失败: ' + e.message,
            data: null,
        };
    }
};
