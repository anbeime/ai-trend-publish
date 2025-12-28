export default async function handler(req, res) {
  // CORS 处理
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // 微信配置
  let wechatConfig = {
    appid: 'wx8410119dfbb7f756',
    secret: '3c93e33e087e57b906f5c341aa5223b9',
    authkey: ''
  };

  const url = new URL(req.url, `http://${req.headers.host}`);
  const path = url.pathname;

  try {
    if (path === '/api/health') {
      res.status(200).json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        service: 'TrendPublish API',
        version: '1.0.0'
      });
      return;
    }

    if (path === '/api/wechat/config') {
      if (req.method === 'GET') {
        res.status(200).json({
          appid: wechatConfig.appid ? '***' + wechatConfig.appid.slice(-4) : '',
          configured: !!wechatConfig.appid && !!wechatConfig.secret
        });
        return;
      }

      if (req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk.toString());
        req.on('end', async () => {
          try {
            const { appid, secret, authkey } = JSON.parse(body);
            
            if (!appid || !secret) {
              res.status(400).json({ 
                success: false, 
                error: 'AppID和AppSecret不能为空' 
              });
              return;
            }

            wechatConfig.appid = appid;
            wechatConfig.secret = secret;
            if (authkey) wechatConfig.authkey = authkey;

            res.status(200).json({
              success: true,
              message: '微信配置保存成功',
              appid: '***' + appid.slice(-4),
              hasAdvancedFeatures: !!authkey
            });
          } catch (error) {
            res.status(500).json({
              success: false,
              error: '配置保存失败: ' + error.message
            });
          }
        });
        return;
      }
    }

    if (path === '/api/ip') {
      const clientIP = req.headers['x-forwarded-for']?.split(',')[0] || 
                     req.headers['x-real-ip'] || 
                     '未知';
      
      res.status(200).json({
        client_ip: clientIP,
        server_info: {
          platform: 'Vercel',
          timestamp: new Date().toISOString()
        }
      });
      return;
    }

    // Note to MP 高级功能 - 获取 Token
    if (path === '/api/wechat/token') {
      if (req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk.toString());
        req.on('end', async () => {
          try {
            const { authkey } = JSON.parse(body);
            
            if (!wechatConfig.authkey && !authkey) {
              // 使用直接微信 API
              if (!wechatConfig.appid || !wechatConfig.secret) {
                res.status(400).json({
                  success: false,
                  error: '微信配置未设置'
                });
                return;
              }

              const tokenUrl = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${wechatConfig.appid}&secret=${wechatConfig.secret}`;
              
              const response = await fetch(tokenUrl);
              const data = await response.json();

              if (data.access_token) {
                res.status(200).json({
                  success: true,
                  access_token: data.access_token,
                  expires_in: data.expires_in,
                  source: 'direct'
                });
              } else {
                res.status(400).json({
                  success: false,
                  error: data.errmsg || '获取访问令牌失败',
                  errcode: data.errcode
                });
              }
            } else {
              // 使用 Note to MP 代理服务
              const result = await noteIntegration.wxGetToken(authkey, wechatConfig.appid, wechatConfig.secret);
              res.status(200).json({
                ...result,
                source: 'note-to-mp-proxy'
              });
            }
          } catch (error) {
            res.status(500).json({
              success: false,
              error: '网络请求失败: ' + error.message
            });
          }
        });
        return;
      }
    }

    // Note to MP 高级功能 - 加密数据
    if (path === '/api/wechat/encrypt') {
      if (req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk.toString());
        req.on('end', async () => {
          try {
            const { authkey, wechat } = JSON.parse(body);
            
            if (!authkey || !wechat) {
              res.status(400).json({
                success: false,
                error: 'AuthKey 和数据不能为空'
              });
              return;
            }

            const result = await noteIntegration.wxEncrypt(authkey, wechat);
            res.status(200).json(result);
          } catch (error) {
            res.status(500).json({
              success: false,
              error: '加密失败: ' + error.message
            });
          }
        });
        return;
      }
    }

    // Note to MP 高级功能 - 数学公式
    if (path === '/api/wechat/math') {
      if (req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk.toString());
        req.on('end', async () => {
          try {
            const { authkey, params } = JSON.parse(body);
            
            if (!authkey || !params) {
              res.status(400).json({
                success: false,
                error: 'AuthKey 和参数不能为空'
              });
              return;
            }

            const result = await noteIntegration.wxWidget(authkey, params);
            res.status(200).json({
              success: true,
              result: result
            });
          } catch (error) {
            res.status(500).json({
              success: false,
              error: '计算失败: ' + error.message
            });
          }
        });
        return;
      }
    }

    // 其他路由返回主页
    res.status(404).json({ error: 'Not found' });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: '服务器错误: ' + error.message
    });
  }
}